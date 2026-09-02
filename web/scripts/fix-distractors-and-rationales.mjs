#!/usr/bin/env node

/**
 * Fix Distractors and Rationales Script
 * 
 * This script fixes weak distractors and generic rationales for questions in a specific domain.
 * 
 * Usage: node fix-distractors-and-rationales.mjs <domain>
 * Example: node fix-distractors-and-rationales.mjs 1
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const bankPath = join(process.cwd(), 'src/lib/server/data/question-bank.json');
const bank = JSON.parse(readFileSync(bankPath, 'utf-8'));

const domain = parseInt(process.argv[2]);

if (!domain || domain < 1 || domain > 5) {
  console.error('Usage: node fix-distractors-and-rationales.mjs <domain> (1-5)');
  process.exit(1);
}

console.log(`Fixing distractors and rationales for Domain ${domain}\n`);

let fixCount = 0;

// Helper function to generate better distractors for a question
function generateBetterDistractors(question, allQuestions) {
  if (question.kind !== 'single-choice' && question.kind !== 'multiple-choice') return;
  
  const correctOptions = question.options.filter(o => question.correctOptionIds.includes(o.id));
  const incorrectOptions = question.options.filter(o => !question.correctOptionIds.includes(o.id));
  
  // Check if distractors are weak (from unrelated domains)
  const correctTexts = correctOptions.map(o => o.text.toLowerCase());
  const correctWords = new Set(correctTexts.join(' ').split(/\s+/).filter(w => w.length > 3));
  
  const weakDistractors = incorrectOptions.filter(o => {
    const words = o.text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const sharedWords = words.filter(w => correctWords.has(w));
    return sharedWords.length === 0;
  });
  
  if (weakDistractors.length < 2) return; // Not enough weak distractors to fix
  
  // Find related questions in the same objective
  const relatedQuestions = allQuestions.filter(q => 
    q.id !== question.id && 
    q.objective === question.objective &&
    (q.kind === 'single-choice' || q.kind === 'multiple-choice')
  );
  
  // Collect plausible distractors from related questions
  const plausibleDistractors = [];
  for (const related of relatedQuestions) {
    const relatedIncorrect = related.options.filter(o => !related.correctOptionIds.includes(o.id));
    for (const opt of relatedIncorrect) {
      if (!plausibleDistractors.some(d => d.text === opt.text)) {
        plausibleDistractors.push(opt);
      }
    }
  }
  
  // Replace weak distractors with plausible ones
  if (plausibleDistractors.length >= weakDistractors.length) {
    for (let i = 0; i < weakDistractors.length; i++) {
      const weak = weakDistractors[i];
      const replacement = plausibleDistractors[i];
      
      // Find and replace the weak distractor
      const index = question.options.findIndex(o => o.id === weak.id);
      if (index !== -1) {
        question.options[index] = {
          ...replacement,
          id: weak.id, // Keep the same ID
          rationale: `This is not the correct answer because ${replacement.text.toLowerCase()} does not address the specific requirement in the scenario.`
        };
        fixCount++;
      }
    }
  }
}

// Helper function to fix generic rationales
function fixGenericRationales(question) {
  if (question.kind !== 'single-choice' && question.kind !== 'multiple-choice') return;
  
  for (const option of question.options) {
    if (option.rationale && /does not match the definition/i.test(option.rationale)) {
      // Generate a better rationale based on the option text and question context
      const optionText = option.text.toLowerCase();
      const promptLower = question.prompt.toLowerCase();
      
      // Create a more informative rationale
      let newRationale = '';
      
      if (promptLower.includes('which') && promptLower.includes('best')) {
        newRationale = `While ${optionText} is a valid security concept, it does not best address the specific requirement described in the scenario.`;
      } else if (promptLower.includes('define') || promptLower.includes('definition')) {
        newRationale = `${optionText.charAt(0).toUpperCase() + optionText.slice(1)} is a different security concept that does not match the definition provided.`;
      } else {
        newRationale = `${optionText.charAt(0).toUpperCase() + optionText.slice(1)} is not the correct answer because it does not align with the requirements specified in the question.`;
      }
      
      option.rationale = newRationale;
      fixCount++;
    }
  }
}

// Process questions in the specified domain
const domainMcqs = bank.mcqs.filter(q => q.domain === domain);

for (const q of domainMcqs) {
  fixGenericRationales(q);
  generateBetterDistractors(q, bank.mcqs);
}

console.log(`Fixed ${fixCount} issues in Domain ${domain}`);

// Save the updated bank
writeFileSync(bankPath, JSON.stringify(bank, null, 2));
console.log('Bank saved successfully');

// Verify the bank still validates
console.log('\nRun "npx vitest run question-bank" to verify validation passes');