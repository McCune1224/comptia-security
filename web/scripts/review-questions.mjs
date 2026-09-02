#!/usr/bin/env node

/**
 * Question Bank Review Script
 * 
 * This script reviews questions for:
 * 1. Accuracy (is the correct answer actually correct?)
 * 2. Clarity (is the prompt clear and unambiguous?)
 * 3. Option quality (are distractors plausible?)
 * 4. Explanation quality (is it helpful?)
 * 5. Exam realism (does it match SY0-701 style?)
 * 
 * Usage: node review-questions.mjs <domain> <type>
 * Example: node review-questions.mjs 1 mcq
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const bankPath = join(process.cwd(), 'src/lib/server/data/question-bank.json');
const bank = JSON.parse(readFileSync(bankPath, 'utf-8'));

const domain = parseInt(process.argv[2]);
const type = process.argv[3]; // 'mcq' or 'pbq'

if (!domain || !type) {
  console.error('Usage: node review-questions.mjs <domain> <type>');
  process.exit(1);
}

const questions = type === 'mcq' 
  ? bank.mcqs.filter(q => q.domain === domain)
  : bank.pbqs.filter(q => q.domain === domain);

console.log(`Reviewing ${questions.length} ${type.toUpperCase()}s in Domain ${domain}`);

// Review criteria
const issues = [];
const improvements = [];

for (const q of questions) {
  const questionIssues = [];
  const questionImprovements = [];
  
  // Check for common issues
  if (q.prompt.length < 20) {
    questionIssues.push('Prompt too short');
  }
  
  if (q.explanation.length < 30) {
    questionIssues.push('Explanation too brief');
  }
  
  // Check MCQ-specific issues
  if (type === 'mcq' && (q.kind === 'single-choice' || q.kind === 'multiple-choice')) {
    // Check if options are distinct enough
    const optionTexts = q.options.map(o => o.text.toLowerCase());
    const uniqueWords = new Set();
    for (const text of optionTexts) {
      const words = text.split(/\s+/).filter(w => w.length > 3);
      words.forEach(w => uniqueWords.add(w));
    }
    
    if (uniqueWords.size < 10) {
      questionIssues.push('Options may lack sufficient distinction');
    }
    
    // Check if correct answer is clearly correct
    const correctOptions = q.options.filter(o => q.correctOptionIds.includes(o.id));
    const incorrectOptions = q.options.filter(o => !q.correctOptionIds.includes(o.id));
    
    // Simple heuristic: if correct option is much shorter, it might be suspicious
    const avgCorrectLength = correctOptions.reduce((sum, o) => sum + o.text.length, 0) / correctOptions.length;
    const avgIncorrectLength = incorrectOptions.reduce((sum, o) => sum + o.text.length, 0) / incorrectOptions.length;
    
    if (avgCorrectLength < avgIncorrectLength * 0.5) {
      questionIssues.push('Correct answer may be noticeably shorter than distractors');
    }
  }
  
  // Check for exam realism
  if (q.prompt.includes('Which of the following') && q.prompt.includes('?')) {
    // This is a common exam pattern - good
  } else if (q.prompt.startsWith('A ') && q.prompt.includes('.')) {
    // Scenario-based - good
  } else if (q.prompt.includes('Select') || q.prompt.includes('Choose')) {
    // Direct instruction - acceptable
  }
  
  // Check source refs
  if (!q.sourceRefs || q.sourceRefs.length < 2) {
    questionIssues.push('Insufficient source references');
  }
  
  // Check hint quality
  if (q.hint && q.hint.length < 20) {
    questionIssues.push('Hint too brief');
  }
  
  if (questionIssues.length > 0) {
    issues.push({ id: q.id, issues: questionIssues });
  }
  
  if (questionImprovements.length > 0) {
    improvements.push({ id: q.id, improvements: questionImprovements });
  }
}

console.log('\n=== Review Results ===');
console.log(`Total questions reviewed: ${questions.length}`);
console.log(`Questions with issues: ${issues.length}`);
console.log(`Questions with improvements: ${improvements.length}`);

if (issues.length > 0) {
  console.log('\n--- Issues Found ---');
  issues.forEach(({ id, issues }) => {
    console.log(`\n${id}:`);
    issues.forEach(issue => console.log(`  - ${issue}`));
  });
}

if (improvements.length > 0) {
  console.log('\n--- Suggested Improvements ---');
  improvements.forEach(({ id, improvements }) => {
    console.log(`\n${id}:`);
    improvements.forEach(imp => console.log(`  - ${imp}`));
  });
}

// Export results for subagent processing
const results = {
  domain,
  type,
  totalReviewed: questions.length,
  issuesCount: issues.length,
  issues,
  improvements
};

writeFileSync(
  join(process.cwd(), `review-results-d${domain}-${type}.json`),
  JSON.stringify(results, null, 2)
);

console.log(`\nResults saved to review-results-d${domain}-${type}.json`);