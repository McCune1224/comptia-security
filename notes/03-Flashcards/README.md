# How to Create Flashcards

## Format
Use the Acronym or Flashcard template for consistency.

## Categories
Organize flashcards into subfolders:

- **Acronyms/** - Security abbreviations and what they stand for
- **Definitions/** - Key terms and concepts
- **Port-Numbers/** - Network ports and protocols
- **Protocols/** - Communication protocols and their functions
- **Risk-Formulas/** - SLE, ALE, ARO, RTO, RPO calculations
- **Attack-Types/** - Different types of attacks and mitigations

## Tagging Convention
Always tag with:
- `#flashcard` - Required for all flashcards
- `#domain-0X` - Domain number (01-05)
- Category tag (e.g., `#acronym`, `#port`, `#formula`)

## Anki Export Tips
1. Use Obsidian's Spaced Repetition plugin, OR
2. Format for easy CSV export to Anki:
   - Front of card: Q: line
   - Back of card: A: line
   - Tags: comma-separated

## Example
```markdown
---
tags: [flashcard, acronym]
deck: Security+ SY0-701
---

**CIA** = Confidentiality, Integrity, Availability

Definition: The three core principles of information security
- Confidentiality: Prevent unauthorized access
- Integrity: Prevent unauthorized modification
- Availability: Ensure systems are accessible when needed

Example: Encryption provides confidentiality, hashing provides integrity, redundancy provides availability

Tags: #flashcard #acronym #domain-01
```

---

*Start creating flashcards in the appropriate subfolders*
