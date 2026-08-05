#!/usr/bin/env python3
"""Expand Domain 5 MCQs (+16: 5.1-5.4 +2 each, 5.5-5.6 +4 each)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import importlib
banklib = importlib.import_module("bank-lib")
load_bank = banklib.load_bank
merge = banklib.merge
opt = banklib.opt


def q(id_, obj, kind, sel, prompt, context, options, correct, explanation, refs):
    return {
        "id": id_, "domain": 5, "objective": obj, "format": "scenario",
        "prompt": prompt, "context": context, "kind": kind, "options": options,
        "correctOptionIds": correct, "selectCount": sel,
        "explanation": explanation, "sourceRefs": refs,
    }


R = lambda obj, src="study-guide", sec=None: [
    {"source": "exam-objectives", "section": f"Objective {obj}"},
    {"source": src, "section": sec or "Domain 5 - Security Program Management and Oversight"},
]

NEW = []

# ---- 5.1 Governance (+2) ----
NEW.append(q("mcq-5-041", "5.1", "single-choice", 1,
    "A security manager needs to document the mandatory, board-approved rule that all remote access must use the corporate VPN and MFA. Which type of document should be created?",
    "A mandatory, board-approved rule that remote access must use VPN and MFA.",
    [opt("a", "Policy", "A policy is a high-level, mandatory directive approved by leadership — the right vehicle for this requirement."),
     opt("b", "Guideline", "Guidelines are recommended, not mandatory."),
     opt("c", "Procedure", "Procedures are step-by-step instructions for performing a task."),
     opt("d", "Baseline", "A baseline is a configuration standard, not a governance rule.")],
    ["a"],
    "Policies are mandatory, high-level directives set by management/board. Standards make policies specific, procedures give steps, and guidelines are optional recommendations.",
    R("5.1")))

NEW.append(q("mcq-5-042", "5.1", "single-choice", 1,
    "A privacy officer is accountable for deciding the legal basis and purpose for processing customer personal data. Under GDPR-style data roles, which role does this person hold?",
    "A privacy officer decides the legal basis and purpose for processing personal data.",
    [opt("a", "Data controller", "The controller determines the purposes and means of processing personal data — the accountable decision-maker."),
     opt("b", "Data processor", "The processor handles data on behalf of the controller under its instructions."),
     opt("c", "Data custodian", "The custodian implements technical safeguards for data."),
     opt("d", "Data subject", "The data subject is the person the data is about.")],
    ["a"],
    "The data controller decides why and how personal data is processed (legal basis, purpose, means). Processors act on the controller's behalf; custodians handle technical protection.",
    R("5.1")))

# ---- 5.2 Risk management (+2) ----
NEW.append(q("mcq-5-043", "5.2", "single-choice", 1,
    "A server is valued at $100,000. A risk assessment determines that if a specific failure occurs, 25% of the server's value would be lost, and this failure is expected to occur once every 4 years. What is the annualized loss expectancy (ALE)?",
    "AV=$100,000, EF=25%, ARO=0.25 (once every 4 years).",
    [opt("a", "$6,250", "This would be SLE=$25,000 × ARO 0.25 = $6,250. Correct: SLE = AV×EF = 100,000×0.25 = $25,000; ALE = SLE×ARO = 25,000×0.25 = $6,250."),
     opt("b", "$25,000", "$25,000 is the SLE (single loss expectancy), not the annualized value."),
     opt("c", "$100,000", "This is the asset value, not the loss expectancy."),
     opt("d", "$400,000", "This incorrectly multiplies rather than applying the ARO.")],
    ["a"],
    "Quantitative risk formulas: SLE = AV × EF = $100,000 × 0.25 = $25,000. ARO = 1/4 = 0.25. ALE = SLE × ARO = $25,000 × 0.25 = $6,250 per year.",
    R("5.2")))

NEW.append(q("mcq-5-044", "5.2", "single-choice", 1,
    "A company determines that a legacy system has a vulnerability it cannot afford to fix this year. Leadership formally documents the risk, assigns an owner, and decides to continue operating the system with the current controls and monitoring. Which risk response is this?",
    "Leadership documents an unfixable risk, assigns an owner, and continues operating with current controls.",
    [opt("a", "Accept", "Formally acknowledging and documenting residual risk with an assigned owner is risk acceptance."),
     opt("b", "Mitigate", "Mitigation reduces risk with additional controls; none are added here."),
     opt("c", "Transfer", "Transfer shifts risk to a third party (insurance/outsourcing)."),
     opt("d", "Avoid", "Avoidance eliminates the risk by discontinuing the activity.")],
    ["a"],
    "Risk acceptance is the documented decision to tolerate residual risk when mitigation is not feasible or cost-effective — typically registered in the risk register with an owner and review date.",
    R("5.2")))

# ---- 5.3 Third-party risk (+2) ----
NEW.append(q("mcq-5-045", "5.3", "single-choice", 1,
    "Before signing a contract with a cloud provider, a company requires the provider to agree to an independent audit of its security controls and to grant the company access to the audit results. Which contract provision is the company exercising?",
    "Requiring a cloud provider to allow independent audits and share results before contract signing.",
    [opt("a", "Right to audit", "A right-to-audit clause lets the customer (or its designee) audit the vendor's controls and receive audit reports — due diligence for third-party risk."),
     opt("b", "Service-level agreement (SLA)", "An SLA defines performance levels like uptime, not audit access."),
     opt("c", "Non-disclosure agreement (NDA)", "An NDA protects confidentiality of shared information."),
     opt("d", "Statement of work (SOW)", "An SOW defines the work scope and deliverables.")],
    ["a"],
    "Right-to-audit provisions (and review of SOC 2 / ISO 27001 attestations) are core third-party risk controls: they verify the vendor's security posture and support continuous monitoring of the relationship.",
    R("5.3")))

NEW.append(q("mcq-5-046", "5.3", "single-choice", 1,
    "A software company wants to assess the risk posed by the open-source libraries used in its products, including which versions contain known vulnerabilities and which are no longer maintained. Which practice provides this visibility?",
    "Assessing risk from open-source libraries: versions with known vulnerabilities and unmaintained components.",
    [opt("a", "Maintaining a software bill of materials (SBOM)", "An SBOM inventories all components and versions in a product, enabling vulnerability and maintenance tracking across the supply chain."),
     opt("b", "Right-to-audit clause", "Right-to-audit applies to vendor contracts, not internal dependency analysis."),
     opt("c", "Business impact analysis", "A BIA assesses impact of disruptions to business functions."),
     opt("d", "Data processing agreement", "A DPA governs personal data processing, not software dependencies.")],
    ["a"],
    "A software bill of materials (SBOM) lists every component and version in a product, letting teams map CVEs, detect unmaintained libraries, and respond to newly disclosed vulnerabilities — foundational supply chain security.",
    R("5.3", "nist", "NIST SP 800-161 Supply Chain Risk Management")))

# ---- 5.4 Compliance & assessments (+2) ----
NEW.append(q("mcq-5-047", "5.4", "single-choice", 1,
    "A U.S. healthcare organization stores electronic protected health information (ePHI). Which regulation sets the security and privacy requirements the organization must meet, including administrative, physical, and technical safeguards?",
    "U.S. healthcare organization storing ePHI — which regulation governs safeguards?",
    [opt("a", "HIPAA", "HIPAA (with the HITECH Act) establishes privacy and security rules for ePHI, including administrative, physical, and technical safeguards."),
     opt("b", "PCI DSS", "PCI DSS governs payment card data, not health records."),
     opt("c", "SOX", "SOX covers financial reporting controls for public companies."),
     opt("d", "GDPR", "GDPR is the EU privacy regulation; the organization is U.S.-based and the data is ePHI, which falls under HIPAA.")],
    ["a"],
    "HIPAA's Security Rule mandates administrative, physical, and technical safeguards for ePHI; the Privacy Rule governs uses and disclosures. HITECH strengthened enforcement and breach notification.",
    R("5.4")))

NEW.append(q("mcq-5-048", "5.4", "single-choice", 1,
    "A security assessment is performed by a team that is given full knowledge of the target environment, including architecture diagrams, credentials, and source code, to identify as many vulnerabilities as possible in a limited time. Which test type is this?",
    "Assessment with full knowledge: architecture diagrams, credentials, and source code provided.",
    [opt("a", "White-box test", "White-box (clear-box) testing provides full internal knowledge — source code, credentials, architecture — maximizing coverage."),
     opt("b", "Black-box test", "Black-box testing simulates an external attacker with no prior knowledge."),
     opt("c", "Gray-box test", "Gray-box testing provides partial knowledge (e.g., credentials but not source)."),
     opt("d", "Red team exercise", "Red teaming emulates adversary objectives with realistic constraints, not full source access for maximal coverage.")],
    ["a"],
    "White-box tests give testers full visibility (source code, credentials, architecture) to find the broadest set of issues. Black-box simulates outsiders; gray-box sits between; red teams pursue adversarial objectives.",
    R("5.4")))

# ---- 5.5 Awareness (+4) ----
NEW.append(q("mcq-5-049", "5.5", "single-choice", 1,
    "A company runs a simulated phishing campaign and finds that 18% of employees clicked the test link. Leadership wants a metric to measure whether the program improves over time. Which metric should be tracked?",
    "Phishing simulation click rate as a program improvement metric.",
    [opt("a", "Phishing click/fall rate over successive campaigns", "Tracking the percentage of users who click simulated phishing links across campaigns measures training effectiveness over time."),
     opt("b", "Number of antivirus alerts", "AV alerts measure malware detections, not awareness program outcomes."),
     opt("c", "Server uptime percentage", "Uptime is an availability metric, unrelated to awareness."),
     opt("d", "Number of firewall rules", "Firewall rule counts are configuration metrics, not awareness outcomes.")],
    ["a"],
    "Phishing simulation click-through (fall) rate is the standard awareness-program metric: baseline it, then measure the trend after training. Improvement = declining click rates and rising report rates.",
    R("5.5")))

NEW.append(q("mcq-5-050", "5.5", "single-choice", 1,
    "A security awareness program wants to encourage employees to report suspicious emails without fear of punishment for falling for one. Which approach supports this goal?",
    "Encouraging employees to report suspicious emails without fear of punishment.",
    [opt("a", "No-blame culture with easy reporting channels", "A no-blame (just) culture, anonymous reporting channels, and a 'report, don't punish' policy increase reporting of incidents and attempts."),
     opt("b", "Publicly reprimanding employees who click phishing links", "Punishment suppresses reporting and drives incidents underground."),
     opt("c", "Eliminating the reporting channel to reduce noise", "Removing the channel destroys the desired behavior."),
     opt("d", "Rewarding only perfect behavior", "Requiring perfection discourages engagement; recognizing reporting is more effective.")],
    ["a"],
    "A no-blame culture encourages early reporting — the fastest way to contain phishing. Public reprimand and punishment lead to concealment. Reporting channels (email button, help desk) must be easy and safe to use.",
    R("5.5")))

NEW.append(q("mcq-5-051", "5.5", "single-choice", 1,
    "A security team is designing an awareness campaign and wants to target each audience with relevant content: executives get business-risk briefings, developers get secure-coding sessions, and general staff get phishing and password hygiene. Which practice is this?",
    "Awareness content tailored per audience: executives, developers, general staff.",
    [opt("a", "Role-based training", "Delivering different security training content by job function (executives, developers, general staff) is role-based training."),
     opt("b", "Gamification", "Gamification uses game elements like badges and competitions."),
     opt("c", "Phishing simulation", "Phishing simulations test click behavior; they are one component, not the tailoring itself."),
     opt("d", "Onboarding training", "Onboarding is initial hire training; role-based delivery extends beyond it.")],
    ["a"],
    "Role-based training tailors awareness to each audience's risk profile: executives (risk/legal), developers (secure coding), IT (operations), general staff (social engineering). It is more effective than one-size-fits-all content.",
    R("5.5")))

NEW.append(q("mcq-5-052", "5.5", "single-choice", 1,
    "A company wants to test whether employees follow the clean-desk policy and badge procedures. The security team stages a simulated social engineering scenario using a staff member posing as a contractor to tailgate through a secure door. Which exercise does this describe?",
    "A staged tailgating scenario to test badge/clean-desk policy adherence.",
    [opt("a", "Social engineering exercise", "Simulating social engineering (tailgating) to assess employee adherence to physical security policy is a social engineering exercise."),
     opt("b", "Tabletop exercise", "A tabletop is a discussion-based walkthrough of a scenario, not a live simulation."),
     opt("c", "Penetration test", "Pen testing targets technical systems; this scenario targets human behavior."),
     opt("d", "Business continuity drill", "BC drills test recovery procedures, not physical access behavior.")],
    ["a"],
    "Social engineering exercises test human controls — tailgating, phone pretexting, or phishing — to measure policy adherence and identify where awareness training is needed.",
    R("5.5")))

# ---- 5.6 Oversight/BC/DR (+4) ----
NEW.append(q("mcq-5-053", "5.6", "single-choice", 1,
    "An organization wants to ensure its incident response plan works before an incident occurs. The team gathers stakeholders in a room and walks through a simulated ransomware scenario, discussing roles, decisions, and actions without executing anything. Which exercise is this?",
    "Stakeholders walk through a simulated ransomware scenario discussing roles and decisions without execution.",
    [opt("a", "Tabletop exercise", "A tabletop exercise is a discussion-based simulation of an incident scenario to validate plans, roles, and decisions — no live execution."),
     opt("b", "Full-scale drill", "A full-scale drill executes live systems and processes."),
     opt("c", "Red team exercise", "Red teaming is a live adversarial engagement."),
     opt("d", "Phishing simulation", "Phishing simulation tests user click behavior, not the IR plan.")],
    ["a"],
    "Tabletop exercises validate incident response and continuity plans through guided discussion of a scenario, surfacing gaps in roles, communication, and decision-making without disrupting operations.",
    R("5.6", "nist", "NIST SP 800-84 Tabletop Exercises")))

NEW.append(q("mcq-5-054", "5.6", "single-choice", 1,
    "During a business impact analysis, an organization determines that its customer portal can be down for at most 8 hours and that the maximum tolerable data loss is 1 hour. Which requirement does the 1-hour figure represent?",
    "BIA: customer portal max downtime 8 hours; max tolerable data loss 1 hour.",
    [opt("a", "Recovery point objective (RPO)", "RPO is the maximum acceptable data loss measured in time — 1 hour of data loss tolerance."),
     opt("b", "Recovery time objective (RTO)", "RTO is the maximum acceptable downtime (8 hours here)."),
     opt("c", "Mean time to repair (MTTR)", "MTTR is a measured repair statistic, not a requirement."),
     opt("d", "Annualized loss expectancy (ALE)", "ALE is a monetary risk value, not a time requirement.")],
    ["a"],
    "RPO = maximum tolerable data loss (how far back recovery can go) — 1 hour here, which drives backup/replication frequency. RTO = maximum tolerable downtime — 8 hours here, which drives recovery staffing and site strategy.",
    R("5.6")))

NEW.append(q("mcq-5-055", "5.6", "single-choice", 1,
    "An organization's internal audit team reviews the security program and identifies findings requiring corrective action. Management assigns owners and target dates, and the team tracks closure. Which concept does the follow-up process represent?",
    "Internal audit findings assigned to owners with target dates and tracked to closure.",
    [opt("a", "Corrective action plan (CAP)", "A corrective action plan documents remediation steps, owners, and target dates for audit findings, tracked to closure."),
     opt("b", "Risk register", "A risk register catalogs risks; audit findings are tracked as CAPs."),
     opt("c", "Baseline", "A baseline is a configuration standard."),
     opt("d", "Service-level agreement", "An SLA is a vendor performance contract.")],
    ["a"],
    "Corrective action plans operationalize audit findings: each finding gets remediation steps, an accountable owner, a target date, and status tracking until closure — closing the audit loop.",
    R("5.6")))

NEW.append(q("mcq-5-056", "5.6", "single-choice", 1,
    "After a significant security incident, the organization schedules a facilitated meeting to review what happened, what worked, what failed, and what should change in processes and controls. Which practice is this?",
    "Facilitated post-incident review of what happened, worked, failed, and what to change.",
    [opt("a", "Lessons learned", "Lessons-learned reviews examine the incident lifecycle to capture improvements for people, process, and technology."),
     opt("b", "Tabletop exercise", "Tabletops simulate incidents before they occur."),
     opt("c", "Risk assessment", "Risk assessment identifies and evaluates risks prospectively."),
     opt("d", "Vulnerability scan", "Scanning identifies technical vulnerabilities, not process improvements.")],
    ["a"],
    "The lessons-learned (post-incident review) meeting is a core IR phase: it analyzes what happened, what was done well, what failed, and produces actionable improvements — closing the loop on incident response.",
    R("5.6", "nist", "NIST SP 800-61 Incident Handling Guide")))

merge(load_bank(), new_mcqs=NEW)
