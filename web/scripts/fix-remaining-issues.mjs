#!/usr/bin/env node

/**
 * Fix Remaining Issues Script
 * 
 * This script fixes all remaining issues from the peer review:
 * 1. Outdated EV certificate info (pbq-1-014)
 * 2. "All A" pattern in configuration PBQs
 * 3. Placeholder explanations in word-bank questions
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const bankPath = join(process.cwd(), 'src/lib/server/data/question-bank.json');
const bank = JSON.parse(readFileSync(bankPath, 'utf-8'));

let fixCount = 0;

// Helper function to find question by ID
function findQuestion(id) {
  return bank.mcqs.find(q => q.id === id) || bank.pbqs.find(q => q.id === id);
}

// Helper function to find PBQ by ID
function findPbq(id) {
  return bank.pbqs.find(q => q.id === id);
}

// ============================================
// FIX 1: Outdated EV Certificate Info
// ============================================

console.log('=== Fixing Outdated EV Certificate Info ===\n');

const pbq1014 = findPbq('pbq-1-014');
if (pbq1014 && pbq1014.kind === 'matching') {
  const p2 = pbq1014.premises?.find(p => p.id === 'p2');
  if (p2 && /address bar/i.test(p2.text)) {
    p2.text = 'Provide the highest level of assurance by verifying the legal entity through a rigorous vetting process';
    fixCount++;
    console.log('Fixed pbq-1-014: Updated EV certificate description');
  }
}

// ============================================
// FIX 2: "All A" Pattern in Configuration PBQs
// ============================================

console.log('\n=== Fixing "All A" Pattern ===\n');

// Function to shuffle options while tracking correct answer
function shuffleOptions(q) {
  if (q.kind !== 'configuration' || !q.fields) return;
  
  const allA = Object.values(q.correctValues).every(v => v === 'a');
  if (!allA || q.fields.length < 4) return;
  
  // For each field, rotate the correct answer to a different position
  for (let i = 0; i < q.fields.length; i++) {
    const field = q.fields[i];
    const correctOptionId = q.correctValues[field.id];
    const correctIndex = field.options.findIndex(o => o.id === correctOptionId);
    
    // Rotate: move correct answer to position (i % (options.length - 1)) + 1
    const targetIndex = (i % (field.options.length - 1)) + 1;
    
    if (targetIndex !== correctIndex && targetIndex < field.options.length) {
      // Swap the options
      const temp = field.options[correctIndex];
      field.options[correctIndex] = field.options[targetIndex];
      field.options[targetIndex] = temp;
      
      // Update the correct value
      q.correctValues[field.id] = field.options[targetIndex].id;
    }
  }
  
  fixCount++;
  console.log(`Fixed ${q.id}: Shuffled correct answer positions`);
}

// Apply to all configuration PBQs
for (const q of bank.pbqs) {
  shuffleOptions(q);
}

// ============================================
// FIX 3: Placeholder Explanations in Word-Bank Questions
// ============================================

console.log('\n=== Fixing Placeholder Explanations ===\n');

// Predefined explanations for common word-bank patterns
const explanationTemplates = [
  // CIA triad questions
  { pattern: /confidentiality.*integrity.*availability/i, explanation: 'Confidentiality protects data from unauthorized access, integrity ensures data is not altered, and availability ensures systems are accessible when needed.' },
  
  // Authentication questions
  { pattern: /authentication.*authorization.*accounting/i, explanation: 'Authentication verifies identity, authorization grants access rights, and accounting tracks resource usage.' },
  
  // Risk management
  { pattern: /risk.*threat.*vulnerability/i, explanation: 'Risk is the potential for loss, threat is a potential danger, and vulnerability is a weakness that can be exploited.' },
  
  // Cryptography
  { pattern: /encryption.*decryption.*hashing/i, explanation: 'Encryption converts plaintext to ciphertext, decryption reverses it, and hashing creates a fixed-size digest for integrity verification.' },
  
  // Network security
  { pattern: /firewall.*ids.*ips/i, explanation: 'Firewalls filter traffic, IDS detects malicious activity, and IPS blocks detected threats.' },
  
  // Compliance
  { pattern: /policy.*standard.*procedure/i, explanation: 'Policies define goals, standards specify requirements, and procedures provide step-by-step instructions.' },
  
  // Generic fallback
  { pattern: null, explanation: 'This question tests your understanding of key security concepts. Each term has a specific meaning in the context of the scenario.' }
];

for (const q of [...bank.mcqs, ...bank.pbqs]) {
  if (q.kind !== 'word-bank') continue;
  
  if (q.explanation && /fill each blank with the term that correctly completes the statement/i.test(q.explanation)) {
    // Try to match a template
    let explanation = explanationTemplates.find(t => t.pattern === null).explanation;
    
    for (const template of explanationTemplates) {
      if (template.pattern && template.pattern.test(q.prompt)) {
        explanation = template.explanation;
        break;
      }
    }
    
    // Create a more specific explanation based on the blanks and correct answers
    const blankExplanations = [];
    for (const blank of q.blanks) {
      const correctWordId = q.correctAssignments[blank.id];
      const correctWord = q.bank.find(w => w.id === correctWordId);
      if (correctWord) {
        blankExplanations.push(`${blank.label}: ${correctWord.word}`);
      }
    }
    
    if (blankExplanations.length > 0) {
      q.explanation = `Key terms: ${blankExplanations.join('; ')}.`;
    } else {
      q.explanation = explanation;
    }
    
    fixCount++;
    console.log(`Fixed ${q.id}: Updated placeholder explanation`);
  }
}

// ============================================
// Save the updated bank
// ============================================

console.log('\n=== Saving Updated Bank ===\n');
console.log(`Total fixes applied: ${fixCount}`);

writeFileSync(bankPath, JSON.stringify(bank, null, 2));
console.log('Bank saved successfully');

// Verify the bank still validates
console.log('\n=== Running Validation ===\n');
console.log('Run "npx vitest run question-bank" to verify validation passes');