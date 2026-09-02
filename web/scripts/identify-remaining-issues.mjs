#!/usr/bin/env node

/**
 * Identify Remaining Issues Script
 * 
 * This script identifies all remaining issues from the peer review that haven't been fixed yet.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const bankPath = join(process.cwd(), 'src/lib/server/data/question-bank.json');
const bank = JSON.parse(readFileSync(bankPath, 'utf-8'));

const issues = {
  weakDistractors: [],
  genericRationales: [],
  placeholderExplanations: [],
  allAPattern: [],
  staleFile: true,
  duplicatePrompts: [],
  outdatedInfo: []
};

// Check for weak/absurd distractors in recall questions
console.log('=== Checking for Weak Distractors ===\n');

const recallQuestions = bank.mcqs.filter(q => q.style === 'recall' && (q.kind === 'single-choice' || q.kind === 'multiple-choice'));

for (const q of recallQuestions) {
  const correctTexts = q.options.filter(o => q.correctOptionIds.includes(o.id)).map(o => o.text.toLowerCase());
  const incorrectTexts = q.options.filter(o => !q.correctOptionIds.includes(o.id)).map(o => o.text.toLowerCase());
  
  // Check if distractors are from completely unrelated domains
  // This is a heuristic - look for distractors that don't share any significant words with the correct answer
  const correctWords = new Set(correctTexts.join(' ').split(/\s+/).filter(w => w.length > 3));
  const unrelatedDistractors = incorrectTexts.filter(text => {
    const words = text.split(/\s+/).filter(w => w.length > 3);
    const sharedWords = words.filter(w => correctWords.has(w));
    return sharedWords.length === 0;
  });
  
  if (unrelatedDistractors.length >= 2) {
    issues.weakDistractors.push({
      id: q.id,
      domain: q.domain,
      objective: q.objective,
      prompt: q.prompt.substring(0, 100),
      unrelatedCount: unrelatedDistractors.length
    });
  }
}

console.log(`Found ${issues.weakDistractors.length} questions with weak/absurd distractors\n`);

// Check for generic "does not match" rationales
console.log('=== Checking for Generic Rationales ===\n');

for (const q of bank.mcqs) {
  if (q.kind !== 'single-choice' && q.kind !== 'multiple-choice') continue;
  
  const genericRationaleCount = q.options.filter(o => 
    o.rationale && /does not match the definition/i.test(o.rationale)
  ).length;
  
  if (genericRationaleCount >= 2) {
    issues.genericRationales.push({
      id: q.id,
      domain: q.domain,
      genericCount: genericRationaleCount,
      totalOptions: q.options.length
    });
  }
}

console.log(`Found ${issues.genericRationales.length} questions with generic rationales\n`);

// Check for placeholder explanations in word-bank questions
console.log('=== Checking for Placeholder Explanations ===\n');

for (const q of [...bank.mcqs, ...bank.pbqs]) {
  if (q.kind !== 'word-bank') continue;
  
  if (q.explanation && /fill each blank with the term that correctly completes the statement/i.test(q.explanation)) {
    issues.placeholderExplanations.push({
      id: q.id,
      domain: q.domain,
      objective: q.objective
    });
  }
}

console.log(`Found ${issues.placeholderExplanations.length} word-bank questions with placeholder explanations\n`);

// Check for "All A" pattern in configuration PBQs
console.log('=== Checking for "All A" Pattern ===\n');

for (const q of bank.pbqs) {
  if (q.kind !== 'configuration') continue;
  
  const allA = Object.values(q.correctValues).every(v => v === 'a');
  if (allA && q.fields.length >= 4) {
    issues.allAPattern.push({
      id: q.id,
      domain: q.domain,
      objective: q.objective,
      fieldCount: q.fields.length
    });
  }
}

console.log(`Found ${issues.allAPattern.length} configuration PBQs with "All A" pattern\n`);

// Check for duplicate prompt openings
console.log('=== Checking for Duplicate Prompt Openings ===\n');

for (const q of bank.mcqs) {
  if (!q.prompt) continue;
  
  const lines = q.prompt.split('\n\n');
  if (lines.length > 1) {
    const firstLine = lines[0].substring(0, 50).toLowerCase();
    const secondLine = lines[1].substring(0, 50).toLowerCase();
    
    if (firstLine === secondLine || firstLine.includes(secondLine) || secondLine.includes(firstLine)) {
      issues.duplicatePrompts.push({
        id: q.id,
        domain: q.domain,
        preview: lines[0].substring(0, 80)
      });
    }
  }
}

console.log(`Found ${issues.duplicatePrompts.length} questions with duplicate prompt openings\n`);

// Check for outdated EV certificate info
console.log('=== Checking for Outdated Info ===\n');

const pbq1014 = bank.pbqs.find(q => q.id === 'pbq-1-014');
if (pbq1014 && pbq1014.kind === 'matching') {
  const p2 = pbq1014.premises?.find(p => p.id === 'p2');
  if (p2 && /address bar/i.test(p2.text)) {
    issues.outdatedInfo.push({
      id: 'pbq-1-014',
      issue: 'EV certificate address-bar behavior is outdated (browsers removed this in 2019)',
      currentText: p2.text
    });
  }
}

console.log(`Found ${issues.outdatedInfo.length} questions with outdated info\n`);

// Summary
console.log('=== Summary ===\n');
console.log(`Weak distractors: ${issues.weakDistractors.length}`);
console.log(`Generic rationales: ${issues.genericRationales.length}`);
console.log(`Placeholder explanations: ${issues.placeholderExplanations.length}`);
console.log(`"All A" pattern: ${issues.allAPattern.length}`);
console.log(`Duplicate prompts: ${issues.duplicatePrompts.length}`);
console.log(`Outdated info: ${issues.outdatedInfo.length}`);

// Save issues to file
writeFileSync(
  join(process.cwd(), 'remaining-issues.json'),
  JSON.stringify(issues, null, 2)
);

console.log('\nIssues saved to remaining-issues.json');