Exam Format at a Glance
Table
Detail	Info
Max Questions	90
Time Limit	90 minutes
Question Types	Multiple-choice + Performance-Based Questions (PBQs)
PBQ Count	Typically 3–5 (but heavily weighted — can be 20–30% of your score)
Passing Score	750 / 900
1. Multiple-Choice Questions (MCQs)
These make up the majority of the exam. They come in several sub-flavors:
A. Single-Answer Multiple Choice
Only one correct answer out of 4 options.

    Example: "Which port does HTTPS use?"

        A) 80
        B) 443 ✓
        C) 22
        D) 3389

B. Multiple-Select Multiple Choice
More than one answer is correct. The question will explicitly state "Select TWO" or "Select THREE." You must choose all correct options to get full credit.

    Example: "Which of the following are types of social engineering? (Select TWO)"

        A) Phishing ✓
        B) SQL Injection
        C) Pretexting ✓
        D) Brute Force

C. Scenario-Based Multiple Choice
A short paragraph describes a real-world situation, then asks what you should do.

    Example: "A security analyst notices multiple failed login attempts from a single IP address within a 5-minute window. What type of attack is MOST likely occurring?"

        A) DDoS
        B) Brute force ✓
        C) Man-in-the-middle
        D) SQL injection

D. "BEST / MOST / FIRST" Questions
These are CompTIA's signature trick questions. Multiple answers are partially correct, but only one is the best fit for the specific scenario described.

    Example: "A company wants to secure its wireless network. Which of the following is the BEST solution?"

        A) WEP
        B) WPA
        C) WPA2 ✓
        D) MAC filtering

Key tip: Read the last sentence of the question first — it often contains the constraint that determines the answer.
2. Performance-Based Questions (PBQs)
PBQs test hands-on skills in simulated environments. They appear at the beginning of the exam and are worth significantly more than regular questions. You can skip them and return later (for simulation PBQs), but virtual PBQs must be completed when encountered — you cannot skip and return. 
A. Fill-in-the-Blank PBQs
The simplest PBQ type. You type a command, IP address, port number, or term into a text box.

    Example: "What command would you use to display the network configuration on a Windows machine?"

        Answer: ipconfig

    Example: "What is the default port for SSH?"

        Answer: 22

B. Drag-and-Drop / Matching PBQs
You drag items into the correct boxes, columns, or sequence.
Common formats:

    Matching: Drag attack types to their descriptions
    Sequencing: Order incident response steps correctly (Preparation → Identification → Containment → Eradication → Recovery → Lessons Learned)
    Categorizing: Drag security controls into "Preventive," "Detective," or "Corrective" columns

C. Simulation PBQs
Full interactive scenarios where you configure systems, analyze logs, or troubleshoot networks. These fill the entire screen.
Common simulation scenarios:
Table
Scenario	What You Do
Firewall / ACL Configuration	Create access control rules to allow/block specific traffic between network zones
Wireless Access Point Setup	Configure SSID, encryption (WPA2/WPA3), and security settings
Log Analysis	Read system logs, identify attack patterns (brute force = repeated failed logins; data exfiltration = large outbound transfers), and determine the attack type
Network Diagram Placement	Drag firewalls, IDS/IPS, or DMZ components into the correct positions on a network topology
Command Line / Terminal	Use commands like ipconfig, netstat, ping, or nslookup to diagnose network issues

    Example: "Configure ACL rules on this router to allow HTTPS traffic from the internal network to external servers while blocking all other outbound traffic. Ensure the web server in the DMZ can receive HTTPS requests but cannot initiate outbound connections." 

D. Virtual Environment PBQs
These are full virtual machines running real operating systems. Unlike simulations (which are approximations), virtual PBQs let you use actual system tools. Because they're real environments, all incorrect paths are possible — just like the real world. 
3. Question Styles by Keyword
CompTIA uses specific keywords that change what they're really asking:
Table
Keyword	What It Means	Example
BEST	Multiple options work; pick the most effective/secure one	"Which is the BEST encryption for wireless?" → WPA3
MOST	Similar to BEST; pick the most significant/impactful answer	"What is the MOST likely cause?"
FIRST	Sequencing matters; pick the immediate next step	"What should the analyst do FIRST?"
NEXT	What comes after the current step in a process	"What is the NEXT step in incident response?"
MOST LIKELY	Based on the clues given, identify the probable cause	"What type of attack is MOST LIKELY occurring?"
GREATEST	Risk, impact, or priority — pick the biggest one	"What presents the GREATEST risk?"
4. Content Categories by Domain
Questions are drawn from 5 domains. Here's how question types map to each:
Table
Domain	Weight	Question Focus
1. General Security Concepts	12%	Definitions, CIA triad, control types, authentication methods
2. Threats, Vulnerabilities, and Mitigations	22%	Attack types, malware, social engineering, vulnerability scanning
3. Security Architecture	18%	Network design, cloud security, secure protocols, cryptography
4. Security Operations	28%	Incident response, SIEM, logging, monitoring, forensics
5. Security Program Management & Oversight	20%	Governance, compliance (GDPR, HIPAA), risk management, policies
5. PBQ Topics You Should Practice
Based on what test-takers consistently report, here are the PBQ scenarios most likely to appear:

    Configuring firewall rules / ACLs on a router
    Setting up a wireless access point with proper encryption and security
    Analyzing log files to identify an attack and recommend remediation
    Placing security devices (firewall, IDS, IPS, proxy) on a network diagram
    Matching attacks to controls (drag-and-drop)
    Ordering incident response steps correctly
    Command-line troubleshooting (ipconfig, ping, netstat, nslookup)
    Configuring RAID or disk encryption settings

## Curriculum alignment (implemented)

These findings now drive the simulated exam in the course app:

- **Full exam structure** — 90 items, 90 minutes, domain quotas 11/20/16/25/18 across the five
  SY0-701 domains (≈12/22/18/28/20%).
- **PBQs open the exam** — the 5 PBQs (one distinct interaction per domain) are placed first and the
  MCQs are interleaved, matching the real exam's PBQ-first ordering.
- **PBQ score weight** — PBQs score at `ExamConfig.pbqPoints` (SY0-701 = 6), so 5 PBQs ≈ 26% of the
  total score, inside the real exam's 20–30% band. MCQs stay worth 1.
- **Question types** — the bank already mixes single-answer, multi-select ("Select TWO/THREE"),
  scenario, and BEST/MOST/FIRST/LEAST keyword framing; see `web/AGENTS.md` for the bank spec.
- **PBQ topics** — firewall/ACL, wireless AP, log analysis, device placement, attack↔control
  matching, IR ordering, command-line, and disk/RAID encryption are all represented in the PBQ bank.
