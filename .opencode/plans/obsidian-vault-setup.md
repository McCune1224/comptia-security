# Obsidian Vault Setup Plan for CompTIA Security+ SY0-701

## Goal
Set up a complete Obsidian vault structure optimized for studying CompTIA Security+ SY0-701 with note-taking, flashcard creation, and exam preparation workflows.

## Current State
- Vault exists with cram plan (`Objectives.md`)
- Exam overview exists (`SY0-701 Exam Overview.md`)
- Empty file (`Untitled.md`)
- PDF with exam objectives present
- Obsidian git plugin already installed

## Proposed Folder Structure

```
CompTIA-Security-Plus/
├── 📁 00-Inbox/              # Quick capture, temporary notes
├── 📁 01-Index/              # Dashboard notes & master indexes
│   ├── 📄 Security+ Dashboard.md
│   ├── 📄 Weak Topics Tracker.md
│   └── 📄 Exam Checklist.md
├── 📁 02-Domains/            # Main study content by domain
│   ├── 📁 Domain-01-General-Security-Concepts/
│   ├── 📁 Domain-02-Threats-Vulnerabilities-Mitigations/
│   ├── 📁 Domain-03-Security-Architecture/
│   ├── 📁 Domain-04-Security-Operations/
│   └── 📁 Domain-05-Security-Program-Management/
├── 📁 03-Flashcards/         # Anki export notes
│   ├── 📁 Acronyms/
│   ├── 📁 Definitions/
│   ├── 📁 Port-Numbers/
│   ├── 📁 Protocols/
│   ├── 📁 Risk-Formulas/
│   └── 📁 Attack-Types/
├── 📁 04-Resources/          # Study materials
│   ├── 📁 Videos/
│   ├── 📁 Practice-Tests/
│   └── 📁 Labs/
├── 📁 05-Exam-Prep/          # Final review materials
│   ├── 📁 PBQs/
│   └── 📁 Mock-Exams/
└── 📁 99-Archive/            # Old/completed notes
```

## Files to Create

### 1. Templates (in `.obsidian/templates/`)

**Domain-Note.md:**
```markdown
---
domain: Domain X
tags: [domain-0X]
created: {{date:YYYY-MM-DD}}
---

# {{title}}

## Key Concepts
- 

## Definitions
| Term | Definition |
|------|------------|
| | |

## Flashcards
Q: 
A: 

## Related
- [[ ]]

## Weak Points
- [ ] 
```

**Flashcard.md:**
```markdown
---
tags: [flashcard]
deck: Security+ SY0-701
---

Q: {{Question}}
A: {{Answer}}

Tags: #flashcard #domain-0X
```

**Acronym.md:**
```markdown
---
tags: [acronym]
deck: Security+ SY0-701
---

**{{Acronym}}** = {{Full Name}}

Definition: 

Example/Context: 

Related: #acronym #domain-0X
```

### 2. Dashboard Files (in `01-Index/`)

**Security+ Dashboard.md:**
Main navigation hub with progress tracker, quick links, and stats

**Weak Topics Tracker.md:**
Tracking sheet for missed questions and areas needing review

**Exam Checklist.md:**
Pre-exam checklist and exam day procedures

### 3. Domain Folders Structure

Each domain folder should contain:
- Overview note linking all subtopics
- Individual concept notes
- Summary/comparison tables
- Flashcard exports

## Recommended Tags

- `#flashcard` - For Anki export notes
- `#acronym` - For abbreviation definitions
- `#weak-topic` - For areas needing review
- `#domain-01` through `#domain-05` - Domain organization
- `#attack-type` - MITRE ATT&CK, malware types
- `#protocol` - Network protocols
- `#port` - Port numbers to memorize
- `#formula` - Risk/ROI calculations
- `#tool` - Security tools (SIEM, NAC, EDR, etc.)

## Suggested Plugins

From already installed plugins:
- Obsidian Git ✓ (already installed)

Recommended additions:
- **Dataview** - Query and organize notes dynamically
- **Templater** - Automated templates with variables (better than core templates)
- **Spaced Repetition** - Built-in flashcards (alternative to Anki)
- **Excalidraw** - Diagrams for network architecture
- **Advanced Tables** - Better table editing

## Workflow Recommendations

### Daily Study Workflow:
1. Open Dashboard → check today's domain focus
2. Review Weak Topics list before starting
3. Take notes using Domain-Note template
4. Create flashcards immediately for new terms
5. Update progress tracker
6. Add missed questions to Weak Topics

### Weekly Review Workflow:
1. Review all weak topics
2. Export flashcards to Anki
3. Update domain progress percentages
4. Take practice test
5. Analyze results and update weak topics

### Flashcard Workflow:
1. Create notes in `03-Flashcards/` with appropriate template
2. Tag with relevant domain and category
3. Use consistent format for easy Anki export
4. Review flagged cards weekly

## Implementation Steps

1. Create folder structure using bash mkdir commands
2. Create template files in `.obsidian/templates/`
3. Create dashboard files in `01-Index/`
4. Create placeholder README files in each domain folder
5. Set up Obsidian plugins
6. Configure Templater settings (if using)
7. Test workflow with sample notes

## Success Criteria

- [ ] All folders created and organized
- [ ] Templates working with hotkeys
- [ ] Dashboard links functional
- [ ] Tag system consistent across notes
- [ ] Flashcard export workflow tested
- [ ] Weak topics tracker actively used

## Verification

After setup, verify by:
1. Creating a test domain note from template
2. Creating a test flashcard
3. Testing dashboard links
4. Confirming folder structure is intuitive
