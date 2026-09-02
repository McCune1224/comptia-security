#!/usr/bin/env node

/**
 * Get Weak Distractor Questions Script
 * 
 * This script outputs the questions with weak distractors for a specific domain.
 * 
 * Usage: node get-weak-distractor-questions.mjs <domain>
 * Example: node get-weak-distractor-questions.mjs 1
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const bankPath = join(process.cwd(), 'src/lib/server/data/question-bank.json');
const bank = JSON.parse(readFileSync(bankPath, 'utf-8'));

const domain = parseInt(process.argv[2]);

if (!domain || domain < 1 || domain > 5) {
  console.error('Usage: node get-weak-distractor-questions.mjs <domain> (1-5)');
  process.exit(1);
}

// Find questions with weak distractors
const weakQuestions = [];

for (const q of bank.mcqs) {
  if (q.domain !== domain) continue;
  if (q.kind !== 'single-choice' && q.kind !== 'multiple-choice') continue;
  
  const correctTexts = q.options.filter(o => q.correctOptionIds.includes(o.id)).map(o => o.text.toLowerCase());
  const correctWords = new Set(correctTexts.join(' ').split(/\\s+/).filter(w => w.length > 3));
  
  const incorrectOptions = q.options.filter(o => !q.correctOptionIds.includes(o.id));
  const weakCount = incorrectOptions.filter(o => {
    const words = o.text.toLowerCase().split(/\\s+/).filter(w => w.length > 3);
    const sharedWords = words.filter(w => correctWords.has(w));
    return sharedWords.length === 0;
  }).length;
  
  if (weakCount >= 2) {
    weakQuestions.push({
      id: q.id,
      domain: q.domain,
      objective: q.objective,
      prompt: q.prompt,
      correctOption: q.options.find(o => q.correctOptionIds.includes(o.id))?.text,
      distractors: q.options.filter(o => !q.correctOptionIds.includes(o.id)).map(o => ({
        id: o.id,
        text: o.text,
        rationale: o.rationale
      }))
    });
  }
}

// Output as JSON
console.log(JSON.stringify(weakQuestions, null, 2));