#!/usr/bin/env node

/**
 * Fix Weak Distractors V2 Script
 * 
 * This script fixes weak distractors by grouping questions by concept
 * and using contextually appropriate distractors from the same concept group.
 * 
 * Usage: node fix-weak-distractors-v2.mjs <domain>
 * Example: node fix-weak-distractors-v2.mjs 1
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const bankPath = join(process.cwd(), 'src/lib/server/data/question-bank.json');
const bank = JSON.parse(readFileSync(bankPath, 'utf-8'));

const domain = parseInt(process.argv[2]);

if (!domain || domain < 1 || domain > 5) {
  console.error('Usage: node fix-weak-distractors-v2.mjs <domain> (1-5)');
  process.exit(1);
}

console.log(`Fixing weak distractors for Domain ${domain}\n`);

let fixCount = 0;

// Helper function to extract key terms from a question
function extractKeyTerms(question) {
  const text = `${question.prompt} ${question.options.map(o => o.text).join(' ')}`.toLowerCase();
  
  // Common security concepts and their related terms
  const conceptMap = {
    'authentication': ['password', 'credential', 'mfa', 'sso', 'kerberos', 'ldap', 'radius', 'tacacs', 'biometric', 'certificate', 'token', 'smart card'],
    'authorization': ['rbac', 'abac', 'acl', 'permission', 'privilege', 'access control', 'least privilege', 'separation of duties'],
    'encryption': ['aes', 'rsa', 'ecc', 'des', '3des', 'rc4', 'cipher', 'key', 'public key', 'private key', 'symmetric', 'asymmetric', 'hash', 'sha', 'md5'],
    'network': ['firewall', 'ids', 'ips', 'vpn', 'vlan', 'nat', 'proxy', 'load balancer', 'switch', 'router', 'wireless', 'dns', 'dhcp', 'tcp', 'udp'],
    'malware': ['virus', 'worm', 'trojan', 'ransomware', 'spyware', 'rootkit', 'keylogger', 'backdoor', 'botnet', 'adware'],
    'social engineering': ['phishing', 'vishing', 'smishing', 'pretexting', 'baiting', 'tailgating', 'impersonation', 'deception'],
    'cryptography': ['digital signature', 'certificate', 'pki', 'ca', 'crl', 'ocsp', 'key exchange', 'key management'],
    'risk': ['risk assessment', 'risk mitigation', 'risk transfer', 'risk acceptance', 'risk avoidance', 'sle', 'ale', 'aro'],
    'compliance': ['policy', 'standard', 'procedure', 'guideline', 'regulation', 'audit', 'assessment', 'compliance'],
    'incident response': ['detection', 'containment', 'eradication', 'recovery', 'lessons learned', 'forensics', 'evidence'],
    'disaster recovery': ['backup', 'restore', 'rto', 'rpo', 'mtd', 'bcp', 'drp', 'site', 'failover'],
    'physical security': ['mantrap', 'badge', 'biometric', 'camera', 'guard', 'fence', 'lighting', 'lock', 'cable lock'],
    'cloud': ['saas', 'paas', 'iaas', 'shared responsibility', 'casb', 'cspm', 'cwpp', 'container', 'virtualization'],
    'identity': ['identity', 'directory', 'ad', 'ldap', 'saml', 'oauth', 'oidc', 'federation', 'provisioning']
  };
  
  // Find which concept this question is about
  const matchedConcepts = [];
  for (const [concept, terms] of Object.entries(conceptMap)) {
    for (const term of terms) {
      if (text.includes(term)) {
        matchedConcepts.push(concept);
        break;
      }
    }
  }
  
  return matchedConcepts;
}

// Helper function to check if distractors are weak
function hasWeakDistractors(question) {
  if (question.kind !== 'single-choice' && question.kind !== 'multiple-choice') return false;
  
  const correctTexts = question.options.filter(o => question.correctOptionIds.includes(o.id)).map(o => o.text.toLowerCase());
  const correctWords = new Set(correctTexts.join(' ').split(/\s+/).filter(w => w.length > 3));
  
  const incorrectOptions = question.options.filter(o => !question.correctOptionIds.includes(o.id));
  const weakCount = incorrectOptions.filter(o => {
    const words = o.text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const sharedWords = words.filter(w => correctWords.has(w));
    return sharedWords.length === 0;
  }).length;
  
  return weakCount >= 2;
}

// Helper function to find better distractors
function findBetterDistractors(question, allQuestions) {
  const concepts = extractKeyTerms(question);
  if (concepts.length === 0) return null;
  
  // Find questions about the same concepts
  const sameConceptQuestions = allQuestions.filter(q => {
    if (q.id === question.id) return false;
    if (q.kind !== 'single-choice' && q.kind !== 'multiple-choice') return false;
    
    const qConcepts = extractKeyTerms(q);
    return qConcepts.some(c => concepts.includes(c));
  });
  
  if (sameConceptQuestions.length === 0) return null;
  
  // Collect incorrect options from same-concept questions
  const candidateDistractors = [];
  for (const q of sameConceptQuestions) {
    const incorrect = q.options.filter(o => !q.correctOptionIds.includes(o.id));
    for (const opt of incorrect) {
      if (!candidateDistractors.some(d => d.text === opt.text)) {
        candidateDistractors.push(opt);
      }
    }
  }
  
  // Also collect correct options from same-concept questions as potential distractors
  for (const q of sameConceptQuestions) {
    const correct = q.options.filter(o => q.correctOptionIds.includes(o.id));
    for (const opt of correct) {
      if (opt.text !== question.options.find(o => question.correctOptionIds.includes(o.id))?.text) {
        if (!candidateDistractors.some(d => d.text === opt.text)) {
          candidateDistractors.push(opt);
        }
      }
    }
  }
  
  return candidateDistractors.length > 0 ? candidateDistractors : null;
}

// Process questions in the specified domain
const domainMcqs = bank.mcqs.filter(q => q.domain === domain);

for (const q of domainMcqs) {
  if (!hasWeakDistractors(q)) continue;
  
  const betterDistractors = findBetterDistractors(q, bank.mcqs);
  if (!betterDistractors) continue;
  
  const incorrectOptions = q.options.filter(o => !q.correctOptionIds.includes(o.id));
  const weakOptions = incorrectOptions.filter(o => {
    const correctTexts = q.options.filter(opt => q.correctOptionIds.includes(opt.id)).map(opt => opt.text.toLowerCase());
    const correctWords = new Set(correctTexts.join(' ').split(/\s+/).filter(w => w.length > 3));
    const words = o.text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const sharedWords = words.filter(w => correctWords.has(w));
    return sharedWords.length === 0;
  });
  
  // Replace weak options with better distractors
  let replaced = 0;
  for (const weak of weakOptions) {
    if (replaced >= betterDistractors.length) break;
    
    const replacement = betterDistractors[replaced];
    const index = q.options.findIndex(o => o.id === weak.id);
    
    if (index !== -1) {
      q.options[index] = {
        ...replacement,
        id: weak.id,
        rationale: `This is not the correct answer because ${replacement.text.toLowerCase()} does not address the specific requirement in the scenario.`
      };
      replaced++;
      fixCount++;
    }
  }
  
  if (replaced > 0) {
    console.log(`Fixed ${q.id}: Replaced ${replaced} weak distractor(s)`);
  }
}

console.log(`\nTotal fixes applied: ${fixCount}`);

// Save the updated bank
writeFileSync(bankPath, JSON.stringify(bank, null, 2));
console.log('Bank saved successfully');

// Verify the bank still validates
console.log('\nRun "npx vitest run question-bank" to verify validation passes');