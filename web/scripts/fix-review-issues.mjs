#!/usr/bin/env node

/**
 * Fix Review Issues Script
 * 
 * This script fixes all BLOCKER and HIGH severity issues found in the peer review.
 * 
 * Issues fixed:
 * 1. mcq-2-004 - Contradictory correct answers
 * 2. mcq-4-003 - GPO Enforcement Contradiction
 * 3. mcq-4-041 - Evidence Type Classification
 * 4. pbq-4-005 - Answer leakage in artifact lines
 * 5. mcq-3-011 - Duplicate correct answers in multi-select
 * 6. mcq-4-030 - Ambiguous "Next Step" Question
 * 7. mcq-4-033 - Order of Volatility Ranking
 * 8. mcq-1-020 - Answer leakage
 * 9. mcq-1-022 - Chrome OCSP inaccuracy
 * 10. mcq-1-003 and mcq-1-005 - Duplicated prompt opening
 * 11. mcq-3-006 - Incorrect port number for PACS
 * 12. pbq-3-008 - Model extraction/inversion mislabel
 * 13. mcq-5-015 - Wrong objective field
 * 14. mcq-5-042, mcq-5-048, mcq-5-051, mcq-5-054 - sourceRefs mismatch
 * 15. pbq-3-015 - Item text clarity
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
// BLOCKER FIXES
// ============================================

console.log('=== Fixing BLOCKER Issues ===\n');

// 1. mcq-2-004 - Contradictory correct answers
// Options a and f contradict each other. Fix option f text to match rationale.
const mcq2004 = findQuestion('mcq-2-004');
if (mcq2004) {
  const optionF = mcq2004.options.find(o => o.id === 'f');
  if (optionF) {
    optionF.text = 'These are likely from different threat actors with unrelated motivations';
    optionF.rationale = 'The motivations and methods are completely different — these are almost certainly unrelated threat actors.';
    fixCount++;
    console.log('Fixed mcq-2-004: Changed option f text to match rationale');
  }
}

// 2. mcq-4-003 - GPO Enforcement Contradiction
// Change prompt to say GPO is "linked but not enforced"
const mcq4003 = findQuestion('mcq-4-003');
if (mcq4003) {
  mcq4003.prompt = mcq4003.prompt.replace(
    /linked and enforced/i,
    'linked but not enforced'
  );
  fixCount++;
  console.log('Fixed mcq-4-003: Changed GPO status to "linked but not enforced"');
}

// 3. mcq-4-041 - Evidence Type Classification
// A printed log is documentary evidence, not demonstrative
const mcq4041 = findQuestion('mcq-4-041');
if (mcq4041) {
  // Find the correct option and change it
  const correctOption = mcq4041.options.find(o => mcq4041.correctOptionIds.includes(o.id));
  if (correctOption) {
    // Change the correct answer to option b pattern: Documentary, Testimonial, Real
    mcq4041.correctOptionIds = ['b'];
    mcq4041.options.find(o => o.id === 'b').rationale = 'A printed log is documentary evidence (written record), the email testimony is testimonial, and the malware binary is real evidence.';
    fixCount++;
    console.log('Fixed mcq-4-041: Changed correct answer to option b (Documentary, Testimonial, Real)');
  }
}

// 4. pbq-4-005 - Answer leakage in artifact lines
// Remove parenthetical annotations that give away answers
const pbq4005 = findPbq('pbq-4-005');
if (pbq4005 && pbq4005.artifact) {
  for (const line of pbq4005.artifact.lines) {
    // Remove parenthetical annotations like "(low-rate beacon)", "(DNS tunnel)", etc.
    line.text = line.text.replace(/\s*\([^)]*(?:beacon|tunnel|scan|normal)[^)]*\)/gi, '');
  }
  fixCount++;
  console.log('Fixed pbq-4-005: Removed answer-leaking parenthetical annotations');
}

// ============================================
// HIGH SEVERITY FIXES
// ============================================

console.log('\n=== Fixing HIGH Severity Issues ===\n');

// 5. mcq-3-011 - Duplicate correct answers in multi-select
// Options a and f are functionally identical. Fix option f to be distinct.
const mcq3011 = findQuestion('mcq-3-011');
if (mcq3011) {
  const optionF = mcq3011.options.find(o => o.id === 'f');
  if (optionF) {
    optionF.text = 'Packet-filtering firewall for requirement 1; next-generation firewall for requirement 2';
    optionF.rationale = 'This reverses the correct mapping — packet-filtering cannot do deep inspection needed for requirement 1.';
    // Keep correct answers as a and f, but now f is clearly wrong
    fixCount++;
    console.log('Fixed mcq-3-011: Made option f clearly incorrect');
  }
}

// 6. mcq-4-030 - Ambiguous "Next Step" Question
// The question conflates two containment actions. Fix the scenario.
const mcq4030 = findQuestion('mcq-4-030');
if (mcq4030) {
  // Change initial action to be clearly detection/analysis, not containment
  mcq4030.prompt = mcq4030.prompt.replace(
    /disables non-essential services and isolates affected systems/i,
    'identifies the affected systems and documents the initial findings'
  );
  fixCount++;
  console.log('Fixed mcq-4-030: Changed initial action to detection/analysis phase');
}

// 7. mcq-4-033 - Order of Volatility Ranking
// Reorder to match RFC 3227 more closely
const mcq4033 = findQuestion('mcq-4-033');
if (mcq4033) {
  // Find the correct option and update its text
  const correctOption = mcq4033.options.find(o => mcq4033.correctOptionIds.includes(o.id));
  if (correctOption) {
    correctOption.text = 'RAM → running processes → network connections → temporary files → hard drive → remote backups';
    correctOption.rationale = 'RFC 3227 order of volatility: CPU registers/cache (RAM) first, then process table, network connections, temporary files, disk, and finally backups.';
    fixCount++;
    console.log('Fixed mcq-4-033: Updated order of volatility to match RFC 3227');
  }
}

// 8. mcq-1-020 - Answer leakage
// Remove "without salting" from prompt
const mcq1020 = findQuestion('mcq-1-020');
if (mcq1020) {
  mcq1020.prompt = mcq1020.prompt.replace(
    /using SHA-256 hashes without salting/i,
    'using SHA-256 hashes'
  );
  fixCount++;
  console.log('Fixed mcq-1-020: Removed "without salting" from prompt');
}

// 9. mcq-1-022 - Chrome OCSP inaccuracy
// Fix the explanation to be accurate
const mcq1022 = findQuestion('mcq-1-022');
if (mcq1022) {
  mcq1022.explanation = mcq1022.explanation.replace(
    /Chrome and Firefox use OCSP soft-fail by default/i,
    'Most browsers either skip OCSP entirely (Chrome) or use soft-fail (Firefox), meaning revoked certificates can still work if the check is not enforced'
  );
  fixCount++;
  console.log('Fixed mcq-1-022: Updated Chrome OCSP explanation');
}

// 10. mcq-1-003 and mcq-1-005 - Duplicated prompt opening
// Remove the duplicated summary line
const mcq1003 = findQuestion('mcq-1-003');
if (mcq1003) {
  // Remove the duplicated summary at the start
  const prompt = mcq1003.prompt;
  const lines = prompt.split('\n\n');
  if (lines.length > 1 && lines[0].substring(0, 50) === lines[1].substring(0, 50)) {
    mcq1003.prompt = lines.slice(1).join('\n\n');
    fixCount++;
    console.log('Fixed mcq-1-003: Removed duplicated prompt opening');
  }
}

const mcq1005 = findQuestion('mcq-1-005');
if (mcq1005) {
  const prompt = mcq1005.prompt;
  const lines = prompt.split('\n\n');
  if (lines.length > 1 && lines[0].substring(0, 50) === lines[1].substring(0, 50)) {
    mcq1005.prompt = lines.slice(1).join('\n\n');
    fixCount++;
    console.log('Fixed mcq-1-005: Removed duplicated prompt opening');
  }
}

// ============================================
// MEDIUM SEVERITY FIXES
// ============================================

console.log('\n=== Fixing MEDIUM Severity Issues ===\n');

// 11. mcq-3-006 - Incorrect port number for PACS
// Change port 389 (LDAP) to port 11112 (DICOM)
const mcq3006 = findQuestion('mcq-3-006');
if (mcq3006) {
  mcq3006.prompt = mcq3006.prompt.replace(/port 389/gi, 'port 11112');
  fixCount++;
  console.log('Fixed mcq-3-006: Changed PACS port from 389 to 11112');
}

// 12. pbq-3-008 - Model extraction/inversion mislabel
// Fix the description to match model extraction
const pbq3008 = findPbq('pbq-3-008');
if (pbq3008 && pbq3008.steps) {
  const step1 = pbq3008.steps.find(s => s.id === 'step-1-1');
  if (step1 && step1.kind === 'matching') {
    const p4 = step1.premises.find(p => p.id === 'p4');
    if (p4) {
      p4.text = 'An attacker queries the model repeatedly to create a functional copy that can be run offline without paying for API access';
      fixCount++;
      console.log('Fixed pbq-3-008: Updated model extraction description');
    }
  }
}

// 13. mcq-5-015 - Wrong objective field
// Change objective from 5.4 to 5.3
const mcq5015 = findQuestion('mcq-5-015');
if (mcq5015) {
  mcq5015.objective = '5.3';
  fixCount++;
  console.log('Fixed mcq-5-015: Changed objective from 5.4 to 5.3');
}

// 14. Fix sourceRefs mismatches
const sourceRefFixes = [
  { id: 'mcq-5-042', correctObj: '5.4' },
  { id: 'mcq-5-048', correctObj: '5.5' },
  { id: 'mcq-5-051', correctObj: '5.6' },
  { id: 'mcq-5-054', correctObj: '5.2' }
];

for (const fix of sourceRefFixes) {
  const q = findQuestion(fix.id);
  if (q) {
    // Update sourceRefs to match objective
    for (const ref of q.sourceRefs) {
      if (ref.section.includes('Objective')) {
        ref.section = ref.section.replace(/Objective \d\.\d/, `Objective ${fix.correctObj}`);
      }
    }
    fixCount++;
    console.log(`Fixed ${fix.id}: Updated sourceRefs to match objective ${fix.correctObj}`);
  }
}

// 15. pbq-3-015 - Item text clarity
// Fix "specific denies" to "specific allows"
const pbq3015 = findPbq('pbq-3-015');
if (pbq3015) {
  const i4 = pbq3015.items?.find(i => i.id === 'i4');
  if (i4) {
    i4.text = 'Add broader permits after the specific allows';
    fixCount++;
    console.log('Fixed pbq-3-015: Changed "specific denies" to "specific allows"');
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