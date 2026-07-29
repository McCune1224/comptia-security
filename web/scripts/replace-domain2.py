#!/usr/bin/env python3
"""Replace Domain 2 questions in the quiz bank with improved, realistic questions."""

import json
from pathlib import Path

BANK_PATH = Path(__file__).resolve().parent.parent / "src/lib/server/data/question-bank.json"


def opt(id_, text, rationale):
    return {"id": id_, "text": text, "rationale": rationale}


def q(id_, obj, fmt, kind, select_count, prompt, context, options, correct_ids, explanation):
    return {
        "id": id_,
        "domain": 2,
        "objective": obj,
        "format": fmt,
        "prompt": prompt,
        "context": context,
        "kind": kind,
        "options": options,
        "correctOptionIds": correct_ids,
        "selectCount": select_count,
        "explanation": explanation,
        "sourceRefs": [
            {"source": "exam-objectives", "section": f"Objective {obj}"},
            {"source": "study-guide", "section": "Domain 2 - Threats, Vulnerabilities, and Mitigations"}
        ]
    }


NEW = []

# ===================================================================
# OBJECTIVE 2.1 - Threat Actors (8 questions)
# ===================================================================

NEW.append(q(
    "mcq-2-001", "2.1", "scenario", "single-choice", 1,
    "A security team discovers malware on an industrial control system that communicated with external servers over 14 months, exfiltrating SCADA configuration files and process diagrams. The malware used stolen code-signing certificates, employed encrypted C2 channels, and had multiple geo-distributed fallback servers. No ransomware was deployed and no financial demand was made. Which type of threat actor is MOST consistent with this activity?",
    "A security team discovers malware on an industrial control system that communicated with external servers over 14 months, exfiltrating SCADA configuration files and process diagrams. The malware used stolen code-signing certificates, employed encrypted C2 channels, and had multiple geo-distributed fallback servers. No ransomware was deployed and no financial demand was made.",
    [
        opt("a", "Organized crime syndicate", "Organized crime is financially motivated. The absence of any financial demand or ransomware makes this attribution unlikely."),
        opt("b", "Nation-state APT", "Custom malware, stolen certificates, long-dwell exfiltration of ICS data, encrypted multi-region C2, and no financial motive all strongly indicate a nation-state APT conducting cyber espionage against industrial targets."),
        opt("c", "Hacktivist collective", "Hacktivists seek publicity and ideological impact. Covert 14-month exfiltration of ICS data with no public messaging is inconsistent with hacktivism."),
        opt("d", "Script kiddie", "Script kiddies use prebuilt tools and lack the resources for custom malware, stolen certificates, and multi-region C2 infrastructure.")
    ],
    ["b"],
    "Nation-state APTs have the resources for custom malware development, code-signing certificate theft, and multi-region C2 infrastructure. The 14-month dwell time with ICS-focused data exfiltration and no financial motive aligns with state-sponsored espionage targeting critical infrastructure."
))

NEW.append(q(
    "mcq-2-002", "2.1", "scenario", "multiple-choice", 2,
    'A group calling itself "Cyber Justice Front" defaces government websites with corruption allegations, leaks internal emails to journalists, and publishes a press release claiming their goal is "exposing government wrongdoing." No data was encrypted and no ransom was demanded. Which TWO attributes BEST describe this threat actor?',
    'A group calling itself "Cyber Justice Front" defaces government websites with corruption allegations, leaks internal emails to journalists, and publishes a press release claiming their goal is "exposing government wrongdoing." No data was encrypted and no ransom was demanded.',
    [
        opt("a", "Nation-state sponsored", "State-sponsored actors typically avoid attribution and do not publicly claim credit with ideological press releases."),
        opt("b", "Hacktivist", "Defacement, data leaks for public exposure, ideological messaging, and no financial motive are hallmarks of hacktivism."),
        opt("c", "Organized crime", "Organized crime is financially motivated. This group explicitly states a non-financial political goal."),
        opt("d", "Financially motivated", "No ransom, no data encryption, and no payment demand. This attack lacks any financial motive."),
        opt("e", "Ideologically motivated", "The group explicitly states an ideological goal: exposing government wrongdoing and corruption."),
        opt("f", "Insider threat", "The group appears to be external (gaining access to deface and leak), not an authorized insider abusing access.")
    ],
    ["b", "e"],
    "Hacktivists are ideologically motivated and seek to draw attention to a cause through defacement, data leaks, and disruptive but not destructive attacks. The public messaging and lack of financial motive distinguish them from organized crime and nation-states."
))

NEW.append(q(
    "mcq-2-003", "2.1", "scenario", "multiple-choice", 2,
    "A pharmaceutical company discovers that a research scientist copied proprietary drug formulas to a personal cloud storage account on their last day of employment. Three months later, a competitor released a near-identical product. Logs show the scientist accessed the research share drive at 2:00 AM on the day of departure. Which TWO threat actor categories BEST describe this scenario?",
    "A pharmaceutical company discovers that a research scientist copied proprietary drug formulas to a personal cloud storage account on their last day of employment. Three months later, a competitor released a near-identical product. Logs show the scientist accessed the research share drive at 2:00 AM on the day of departure.",
    [
        opt("a", "Insider threat", "The actor was an authorized employee who abused legitimate access to exfiltrate data. This is the textbook definition of an insider threat."),
        opt("b", "Organized crime", "Organized crime seeks direct financial gain. The competitor benefiting from the stolen IP does not make this organized crime."),
        opt("c", "Competitor", "The competitor that received and used the stolen formulas is the ultimate beneficiary and driving force behind the espionage."),
        opt("d", "Hacktivist", "Hacktivists are ideologically motivated and seek public attention. This was covert IP theft for competitive advantage."),
        opt("e", "Nation-state", "Nation-states target strategic sectors like defense or critical infrastructure. This scenario lacks state-level TTPs."),
        opt("f", "Script kiddie", "Script kiddies lack the access and opportunity. This required legitimate authenticated access to a research share.")
    ],
    ["a", "c"],
    "The scientist is an insider threat, a trusted employee who abused authorized access. The competitor is the beneficiary and likely orchestrator of the theft, representing competitor-driven espionage."
))

NEW.append(q(
    "mcq-2-004", "2.1", "scenario", "single-choice", 1,
    "A regional hospital's systems are encrypted with a ransomware variant that also exfiltrated patient records before encryption. The attackers posted samples of the data on a leak site and demand a Bitcoin payment. The ransomware-as-a-service affiliate program used an affiliate panel to track infections. Which threat actor profile BEST matches this attacker?",
    "A regional hospital's systems are encrypted with a ransomware variant that also exfiltrated patient records before encryption. The attackers posted samples of the data on a leak site and demand a Bitcoin payment. The ransomware-as-a-service affiliate program used an affiliate panel to track infections.",
    [
        opt("a", "Nation-state cyber espionage unit", "Nation-states targeting healthcare would typically seek intelligence, not financial extortion via RaaS."),
        opt("b", "Organized crime syndicate", "Double-extortion ransomware, RaaS affiliate model, and Bitcoin demand for financial gain are characteristic of financially motivated organized crime."),
        opt("c", "Insider threat", "No evidence of an authorized insider. The attack vector appears external via RaaS."),
        opt("d", "Hacktivist collective", "Hacktivists target for ideological reasons, not financial extortion via double-extortion ransomware.")
    ],
    ["b"],
    "Ransomware-as-a-service affiliate programs are run by organized crime groups who recruit affiliates to deploy ransomware in exchange for a cut of the ransom. The double-extortion model (encryption plus data leak) is a common organized crime tactic."
))

NEW.append(q(
    "mcq-2-005", "2.1", "scenario", "single-choice", 1,
    "A high school's public website is defaced with the message 'Hacked by CyberElite.' The attacker used a publicly available exploit for a known vulnerability and a widely available web shell script. No custom tools were used, no data was exfiltrated, and the attacker posted a tutorial on a gaming forum describing how they performed the attack. Which threat actor type is MOST consistent with this behavior?",
    "A high school's public website is defaced. The attacker used a publicly available exploit for a known vulnerability and a widely available web shell script. No custom tools were used, no data was exfiltrated, and the attacker posted a tutorial on a gaming forum describing how they performed the attack.",
    [
        opt("a", "Nation-state APT", "Nation-states do not seek public recognition by defacing high school websites or posting tutorials on gaming forums."),
        opt("b", "Organized crime", "No financial motive, no data theft, no ransomware. This attacker sought notoriety, not profit."),
        opt("c", "Script kiddie", "Using public exploits, prebuilt web shells, defacement for recognition, and posting tutorials are all classic script kiddie behaviors: low skill, high ego, public tools."),
        opt("d", "Insider threat", "The attacker was external, gaining unauthorized access via exploit, not an insider abusing legitimate access.")
    ],
    ["c"],
    "Script kiddies are unskilled attackers who use publicly available tools without understanding underlying mechanisms. They seek recognition and notoriety. Defacement and tutorial posting are characteristic behaviors."
))

NEW.append(q(
    "mcq-2-006", "2.1", "scenario", "single-choice", 1,
    "An IT audit reveals that the sales department has been using an unapproved cloud file-sharing application to store customer contracts and pricing data for the past six months. The sales director signed up with a corporate credit card and shared access with the entire team. The application has no SSO integration, no audit logging, and data is stored in an unknown jurisdiction. Which threat actor concept does this BEST illustrate?",
    "An IT audit reveals that the sales department has been using an unapproved cloud file-sharing application to store customer contracts and pricing data for the past six months. The application has no SSO integration, no audit logging, and data is stored in an unknown jurisdiction.",
    [
        opt("a", "Insider threat with malicious intent", "The sales director acted without malice. Shadow IT can be non-malicious."),
        opt("b", "Shadow IT", "Textbook definition of shadow IT: employees deploying technology without organizational approval or security oversight."),
        opt("c", "Supply chain compromise", "The application itself was not compromised via a supply chain attack. It is simply unapproved."),
        opt("d", "Advanced persistent threat", "No evidence of a sophisticated external adversary. The risk is from ungoverned internal technology adoption.")
    ],
    ["b"],
    "Shadow IT refers to information technology systems deployed by departments or individuals without organizational knowledge or approval. It creates security risks including data residency violations, lack of audit trails, and weak access controls."
))

NEW.append(q(
    "mcq-2-007", "2.1", "scenario", "single-choice", 1,
    "A manufacturing company discovers that a competitor launched an identical product six months after a key engineer resigned and joined that competitor. Forensic analysis shows that a design file was accessed via the engineer's VPN connection at 3:00 AM and transferred to a personal device one week before the resignation. The engineer had legitimate access to the file as part of their role. Which threat actor motivation is the PRIMARY driver in this scenario?",
    "A manufacturing company discovers that a competitor launched an identical product six months after a key engineer resigned and joined that competitor. A design file was accessed via the engineer's VPN at 3:00 AM and transferred to a personal device one week before the resignation.",
    [
        opt("a", "Ideological motivation", "The engineer's motivation was competitive advantage for a new employer, not advancing a political or social cause."),
        opt("b", "Financial gain for a third party", "The competitor gained the financial advantage. The engineer was likely incentivized by the new position or payment, making this corporate espionage driven by third-party financial gain."),
        opt("c", "Personal revenge", "No evidence of a grudge or retaliation. The engineer sought to benefit the new employer, not harm the old one."),
        opt("d", "Disruption and chaos", "The goal was a specific competitive outcome, not general disruption.")
    ],
    ["b"],
    "Corporate espionage is often motivated by financial gain for a third party (the competitor). The engineer served as an insider threat acting on behalf of the competitor, with the competitor receiving the primary financial benefit."
))

NEW.append(q(
    "mcq-2-008", "2.1", "scenario", "single-choice", 1,
    "An incident response team analyzes a breach at a defense contractor. The attackers used custom malware that communicated via HTTPS to domains resembling legitimate CDNs, maintained access for 11 months, and exfiltrated technical specifications for a weapons system. The attackers avoided all systems that would cause operational disruption and did not deploy ransomware. Which motivation BEST distinguishes this threat actor from a financially motivated cybercriminal group?",
    "An incident response team analyzes a breach at a defense contractor. The attackers used custom malware, maintained access for 11 months, exfiltrated weapons system specs, avoided operational disruption, and did not deploy ransomware.",
    [
        opt("a", "The attackers used custom malware", "Both APTs and sophisticated cybercriminal groups use custom malware. This does not distinguish them."),
        opt("b", "The attackers maintained access for 11 months", "Both APTs and organized crime can maintain long-term access when the target has high value."),
        opt("c", "The attackers avoided operational disruption and did not seek financial payment", "APTs prioritize stealth and intelligence collection, avoiding disruption to preserve long-term access. Cybercriminals seek financial disruption to force payment. The absence of both disruption and financial demand strongly indicates espionage, not crime."),
        opt("d", "The attackers targeted a defense contractor", "Cybercriminals also target defense contractors for ransomware. The target alone does not distinguish the actor type.")
    ],
    ["c"],
    "The key distinction between APT espionage and financially motivated cybercrime is intent. APTs avoid disruption and seek intelligence. Cybercriminals seek financial gain and will disrupt operations to force ransom payments. Custom malware and dwell time can be common to both sophisticated groups."
))

# ===================================================================
# OBJECTIVE 2.2 - Threat Vectors (9 questions)
# ===================================================================

NEW.append(q(
    "mcq-2-009", "2.2", "scenario", "single-choice", 1,
    "A finance manager receives an email that appears to be from the company's CFO with the subject line 'Urgent - Wire Transfer Request.' The email mentions a specific vendor the company uses, references a real project code, and asks for an immediate $47,000 wire transfer to an account at a different bank than usual. The sender's email address is cfo@cornpany.com (using 'rn' instead of 'm' in 'company'). What type of social engineering attack is this?",
    "A finance manager receives an email appearing to be from the CFO, referencing a specific vendor and real project code, requesting an urgent wire transfer. The sender address uses a lookalike domain (cornpany.com instead of company.com).",
    [
        opt("a", "Whaling", "Whaling targets senior executives as the victim. Here the CFO's identity is impersonated, but the finance manager is the target. This is spear phishing with a whale as the pretext."),
        opt("b", "Spear phishing", "The email is highly targeted using a specific vendor name, real project code, and executive impersonation. Personalized targeting with contextual detail is the hallmark of spear phishing."),
        opt("c", "Vishing", "Vishing uses voice communication (phone calls). This attack was conducted via email."),
        opt("d", "Pharming", "Pharming redirects users from legitimate websites to fake ones, typically via DNS poisoning or host file manipulation.")
    ],
    ["b"],
    "Spear phishing is a targeted phishing attack directed at a specific individual or organization. The use of a lookalike domain, personalization, and executive impersonation are common spear phishing techniques. Whaling is distinguished by targeting C-suite executives directly, not impersonating them."
))

NEW.append(q(
    "mcq-2-010", "2.2", "scenario", "multiple-choice", 2,
    "An attacker researches an organization's help desk procedures and learns that password resets require only an employee's name, department, and manager's name, all found on the company's LinkedIn page. The attacker calls the help desk, claims to be a sales director who is traveling, provides the correct manager name, and requests a password reset. The help desk complies and provides a temporary password. Which TWO social engineering techniques were used?",
    "An attacker researches help desk procedures, calls the help desk claiming to be a traveling sales director, provides correct manager name, and requests a password reset. The help desk provides a temporary password.",
    [
        opt("a", "Phishing", "Phishing involves fraudulent electronic communication (typically email). This attack used a phone call, not email."),
        opt("b", "Pretexting", "The attacker created a fabricated scenario (traveling sales director locked out) and assumed a false identity to manipulate the help desk."),
        opt("c", "Tailgating", "Tailgating requires physical proximity to follow an authorized person into a restricted area. This was conducted remotely via phone."),
        opt("d", "Vishing", "Voice phishing (vishing) uses phone calls to extract sensitive information or credentials. The attacker called the help desk and used verbal social engineering."),
        opt("e", "Baiting", "Baiting offers something enticing (free USB drive, download) to trick the victim. No bait was offered."),
        opt("f", "Whaling", "Whaling targets senior executives directly. The attacker impersonated a sales director but targeted the help desk agent.")
    ],
    ["b", "d"],
    "The attacker used pretexting (creating a fabricated scenario and false identity) delivered via vishing (voice phishing over phone). The initial reconnaissance on LinkedIn to gather pretext details is also characteristic of pretexting attacks."
))

NEW.append(q(
    "mcq-2-011", "2.2", "scenario", "single-choice", 1,
    "The CEO of a publicly traded company receives an email that appears to be a subpoena from a federal court, demanding appearance before a grand jury. The email includes a court seal, a case number, and an attachment labeled 'Summons.pdf.' The CEO opens the attachment, which installs a remote access trojan. What type of social engineering technique was used?",
    "The CEO of a publicly traded company receives an email appearing to be a federal subpoena with a malicious attachment labeled 'Summons.pdf' that installs a RAT when opened.",
    [
        opt("a", "Spear phishing", "While this is targeted, the key distinction is the victim, a C-suite executive targeted with high-stakes legal authority manipulation."),
        opt("b", "Whaling", "Whaling specifically targets senior executives. The use of legal authority (fake subpoena) and executive targeting makes this whaling."),
        opt("c", "Vishing", "The attack was conducted via email with an attachment, not through a phone call."),
        opt("d", "Pharming", "Pharming redirects users from legitimate websites. This attack used a malicious email attachment.")
    ],
    ["b"],
    "Whaling targets high-profile executives like CEOs, CFOs, or board members. The attack leverages authority, urgency, and fear of legal consequences to bypass the executive's normal skepticism. The subpoena pretext is a common whaling technique."
))

NEW.append(q(
    "mcq-2-012", "2.2", "scenario", "single-choice", 1,
    "A defense industry trade association website is compromised. The attackers injected JavaScript that exploits an unpatched browser vulnerability in Chrome. The exploit downloads and executes a backdoor on visiting systems. The website is known to be frequently visited by employees of defense contractors. What type of attack vector is this?",
    "A defense industry trade association website is compromised. JavaScript injected into the site exploits an unpatched Chrome vulnerability, downloading a backdoor on visiting systems. The site is frequented by defense contractor employees.",
    [
        opt("a", "Watering hole attack", "The attackers compromised a site known to be visited by their target population (defense contractors). This is the classic watering hole pattern: poison the water hole and wait for prey to come drink."),
        opt("b", "Spear phishing", "Spear phishing sends targeted emails. This attack compromised a legitimate website and waited for victims to visit."),
        opt("c", "Direct exploitation", "Direct exploitation targets the vulnerable system directly. Here the trade association site is the intermediary vector."),
        opt("d", "Man-in-the-middle", "MITM intercepts communications between two parties. This attack does not require interception; victims voluntarily visit the compromised site.")
    ],
    ["a"],
    "A watering hole attack compromises a website that a specific target group frequents. The attacker waits for members of that group to visit and trigger the exploit. This is more stealthy than phishing because no messages are sent that could be detected as malicious."
))

NEW.append(q(
    "mcq-2-013", "2.2", "scenario", "single-choice", 1,
    "A software vendor that produces a popular network monitoring tool has its build pipeline compromised. Attackers inject malicious code into the source repository. The next software update, signed with the vendor's valid code-signing certificate, includes a backdoor that phones home to a C2 server. Thousands of customers install the update trusting the valid signature. What attack vector does this represent?",
    "A software vendor's build pipeline is compromised. Malicious code is injected and signed with the vendor's valid certificate. The next update includes a backdoor installed by all customers.",
    [
        opt("a", "Watering hole attack", "Watering hole compromises a website to target visitors. This attack compromised the software build and distribution pipeline itself."),
        opt("b", "Supply chain attack", "Compromising the vendor's build pipeline and code-signing process to distribute malicious updates to all customers is the textbook definition of a software supply chain attack."),
        opt("c", "DNS poisoning", "DNS poisoning alters DNS resolution. This attack compromised the software update process."),
        opt("d", "Trojan horse", "While the update functioned as a trojan (appearing legitimate), the attack vector is better described as a supply chain compromise because the infection occurred upstream during development.")
    ],
    ["b"],
    "A supply chain attack targets the less-secure elements in a trusted vendor's development or distribution pipeline. The SolarWinds attack is the most famous example: attackers compromised the build system and distributed trojanized updates signed with valid certificates."
))

NEW.append(q(
    "mcq-2-014", "2.2", "scenario", "single-choice", 1,
    "A user reports that their mouse cursor moves on its own, typing commands in a command prompt window. The security team finds an outbound connection from the workstation to an IP address in a foreign country on TCP port 4444. The process is disguised as svch0st.exe (with a zero replacing the 'o') running from the user's AppData folder. What type of malware is this?",
    "A user reports their mouse cursor moving on its own, typing commands. An outbound connection to a foreign IP on TCP port 4444 is found, with a process disguised as svch0st.exe in the AppData folder.",
    [
        opt("a", "Worm", "Worms self-replicate across networks. This malware requires manual installation and does not exhibit propagation behavior."),
        opt("b", "Ransomware", "Ransomware encrypts files and demands payment. No encryption or ransom note was found."),
        opt("c", "Remote access trojan (RAT)", "Remote control of mouse and keyboard, hidden C2 connection, masquerading as a legitimate process, and persistence in AppData are all classic RAT indicators."),
        opt("d", "Rootkit", "Rootkits hide the malware's presence from the OS. This malware was visible as a running process and connection. It was not hidden.")
    ],
    ["c"],
    "A remote access trojan (RAT) provides attackers with remote control over the victim's system. Key indicators: interactive remote control, outbound C2 connection on a common RAT port (4444), process masquerading (svch0st.exe vs legitimate svchost.exe), and running from user-writable AppData."
))

NEW.append(q(
    "mcq-2-015", "2.2", "scenario", "single-choice", 1,
    "An attacker carrying a large delivery box approaches a secured entrance with a card reader. An employee with a badge approaches the door. The attacker says, 'Can you grab that? My hands are full.' The employee holds the door open, and the attacker enters without badging in. Which social engineering technique did the attacker use?",
    "An attacker carrying a large box approaches a secured entrance. An employee badges in, and the attacker asks the employee to hold the door, entering without badging.",
    [
        opt("a", "Piggybacking", "Piggybacking occurs with the employee's implicit consent. However, the Security+ exam distinguishes tailgating as following without awareness."),
        opt("b", "Tailgating", "While similar to piggybacking, tailgating is the specific CompTIA term for following an authorized person into a restricted area without authorization."),
        opt("c", "Baiting", "Baiting uses an enticing lure (USB drive, download). The attacker used a box as a prop, not as bait."),
        opt("d", "Pretexting", "Pretexting creates a fabricated scenario to extract information. The attacker used a physical prop but did not extract information.")
    ],
    ["b"],
    "Tailgating is when an unauthorized person follows an authorized person into a restricted area without swiping a badge. The distinction from piggybacking: tailgating occurs without the authorized person's full awareness, while piggybacking involves the authorized person knowingly allowing entry."
))

NEW.append(q(
    "mcq-2-016", "2.2", "scenario", "single-choice", 1,
    "Employees at a company receive a text message that appears to be from the HR department: 'Your 2024 W-2 is ready for review. Sign in to verify your tax information: https://hr-portal-login.co.' Several employees click the link and enter their domain credentials on a page that looks identical to the company's HR portal. What type of attack is this?",
    "Employees receive a text message appearing to be from HR with a link to a fake HR portal login page. Several employees enter their credentials.",
    [
        opt("a", "Vishing", "Vishing uses voice calls. This attack used SMS text messages, not voice."),
        opt("b", "SMiShing", "SMiShing (SMS phishing) uses text messages to deliver phishing links. The W-2 pretext is a common SMiShing lure during tax season."),
        opt("c", "Pharming", "Pharming redirects legitimate website traffic without user interaction via DNS poisoning. This required users to click a link."),
        opt("d", "Spear phishing via SMS", "While technically SMS-delivered, the specific term for SMS-based phishing is SMiShing. This attack was not personally targeted.")
    ],
    ["b"],
    "SMiShing is SMS-based phishing. Attackers send text messages with malicious links or phone numbers. Tax season W-2 scams are a common SMiShing vector because employees expect HR communications about tax documents."
))

NEW.append(q(
    "mcq-2-017", "2.2", "scenario", "single-choice", 1,
    "An attacker leaves USB drives labeled 'Employee Bonus Structure 2024 - Confidential' in the parking lot and smoking area of a company's office building. An employee finds one, plugs it into their workstation, and the USB drive executes a keystroke injection attack that installs a backdoor. What type of social engineering technique does this demonstrate?",
    "An attacker leaves labeled USB drives in the parking lot. An employee plugs one into their workstation, triggering a keystroke injection attack that installs a backdoor.",
    [
        opt("a", "Tailgating", "Tailgating follows an authorized person through a physical barrier. This attack used USB devices."),
        opt("b", "Baiting", "Baiting offers something enticing (curiosity about confidential bonus information) to trick the victim into performing an action (plugging in the USB drive). The labeled USB drive is the bait."),
        opt("c", "Pretexting", "Pretexting involves fabricating a scenario to extract information. The USB drive delivers malware, not extraction."),
        opt("d", "Phishing", "Phishing uses electronic communication. USB drops are physical social engineering.")
    ],
    ["b"],
    "Baiting exploits human curiosity or greed by offering something desirable. In a USB drop attack, the physical device serves as bait. Rubber Ducky-style keystroke injection USB devices can execute keystrokes automatically when plugged in."
))

# ===================================================================
# OBJECTIVE 2.3 - Vulnerabilities (9 questions)
# ===================================================================

NEW.append(q(
    "mcq-2-018", "2.3", "scenario", "single-choice", 1,
    "A security researcher submits a vulnerability report: sending a 2048-character string to a network service's authentication field causes the service to crash and spawn a shell at a memory address overwritten in the input. The application was written in C and does not validate input length. What type of vulnerability was exploited?",
    "A C-based network application crashes and spawns a shell when sent a 2048-character input to the authentication field. The application does not validate input length.",
    [
        opt("a", "SQL injection", "SQL injection targets database queries. No database interaction is described here."),
        opt("b", "Cross-site scripting", "XSS injects client-side scripts into web pages. This vulnerability is in a network service, not a web application."),
        opt("c", "Buffer overflow", "Overwriting memory with more data than allocated, executing code at an attacker-controlled return address, crashing the service, and spawning a shell: all classic buffer overflow indicators. C's lack of bounds checking enables this."),
        opt("d", "Integer overflow", "Integer overflow involves arithmetic exceeding numeric limits, not overwriting memory with a long string to hijack execution flow.")
    ],
    ["c"],
    "A buffer overflow occurs when a program writes more data to a fixed-length memory buffer than it can hold. The excess data overwrites adjacent memory, including the return address on the stack. By controlling this address, the attacker redirects execution to malicious shellcode. C and C++ are vulnerable because they do not perform automatic bounds checking."
))

NEW.append(q(
    "mcq-2-019", "2.3", "scenario", "single-choice", 1,
    "During a web application penetration test, a tester enters the following into a search field: ' OR 1=1; -- . The application returns all records from the database instead of the searched item. The tester then enters '; DROP TABLE Users; -- and receives a database error indicating the Users table no longer exists. What vulnerability was exploited?",
    "A tester enters ' OR 1=1; -- into a search field, returning all database records. Then '; DROP TABLE Users; -- destroys the Users table.",
    [
        opt("a", "Cross-site scripting", "XSS executes scripts in the browser. This attack executed SQL commands on the database server."),
        opt("b", "SQL injection", "The single quote broke out of the SQL string context, OR 1=1 returned all rows, and DROP TABLE Users executed a destructive command. The comment syntax ignored the rest of the query."),
        opt("c", "Command injection", "Command injection executes OS-level commands. SQL injection targets database queries."),
        opt("d", "LDAP injection", "LDAP injection targets LDAP directory queries with crafted LDAP syntax, not SQL database queries.")
    ],
    ["b"],
    "SQL injection occurs when untrusted user input is concatenated into SQL queries without parameterization. The single quote character breaks the SQL string delimiter, and SQL metacharacters like -- (comment) and ; (statement separator) allow query manipulation. Parameterized queries using prepared statements are the primary defense."
))

NEW.append(q(
    "mcq-2-020", "2.3", "scenario", "multiple-choice", 2,
    "A penetration tester examines a web forum application. In the user profile 'Bio' field, the tester enters <script>fetch('/api/changeEmail?new=attacker@evil.com')</script>. When an administrator views the tester's profile page, the script executes and changes the admin's email address. Which TWO vulnerabilities are present in this application?",
    "A penetration tester enters a script tag in the profile Bio field. When an admin views the profile, the script executes and changes the admin's email via an API call.",
    [
        opt("a", "Reflected XSS", "Reflected XSS requires the malicious script to be in the request. Here the script is stored in the database."),
        opt("b", "Stored (persistent) XSS", "The script is stored in the user's profile bio in the database and executes when anyone views the profile. This is stored XSS."),
        opt("c", "CSRF (Cross-Site Request Forgery)", "The script performs a state-changing action by making a request that inherits the admin's authenticated session. The API does not validate a CSRF token."),
        opt("d", "SQL injection", "No SQL syntax was injected. The attack uses JavaScript, not database query manipulation."),
        opt("e", "Directory traversal", "Directory traversal accesses files outside the web root. This attack stored and executed JavaScript."),
        opt("f", "Server-side request forgery", "SSRF makes the server send requests to internal resources. This attack made a client-side request from the admin's browser.")
    ],
    ["b", "c"],
    "Two combined vulnerabilities: (1) Stored XSS: user input stored in the database renders without sanitization, executing JavaScript when viewed. (2) CSRF: the API endpoint accepts requests without a CSRF token, so the XSS payload can forge a state-changing request using the admin's session."
))

NEW.append(q(
    "mcq-2-021", "2.3", "scenario", "single-choice", 1,
    "A web application uses a URL parameter to serve documents: https://example.com/download?file=report_2024.pdf. A user changes the parameter to download?file=../../../etc/shadow. The application returns the contents of the system's password file. What vulnerability was exploited?",
    "A web application serves files via a URL parameter. Modifying the parameter to include ../ sequences returns the system password file.",
    [
        opt("a", "Remote code execution", "The attacker obtained file contents but did not execute arbitrary code on the server."),
        opt("b", "Directory traversal (path traversal)", "Using ../ parent directory sequences to escape the intended web-accessible directory and access files elsewhere on the filesystem is classic directory traversal."),
        opt("c", "Local file inclusion", "LFI includes file contents for execution or rendering. While related, the specific ../ sequence technique is directory traversal."),
        opt("d", "Server-side request forgery", "SSRF makes the server send requests to other servers. This attack reads local server files.")
    ],
    ["b"],
    "Directory traversal exploits insufficient input validation by using ../ sequences to navigate outside the web root directory. The server should validate that the resolved path stays within the intended directory. Input sanitization should strip or reject path traversal sequences."
))

NEW.append(q(
    "mcq-2-022", "2.3", "scenario", "single-choice", 1,
    "A file-sharing application checks whether a user is authorized to access a document by verifying permissions against an access control list. Immediately after the check passes but before the file is opened, the attacker rapidly replaces the file with a symbolic link to a protected system file. The application opens the file using the already-verified authorization and exposes the protected file. What type of vulnerability is this?",
    "An application checks authorization before opening a file. The attacker replaces the file with a symlink to a protected file after the check passes but before the file is opened.",
    [
        opt("a", "Time-of-check to time-of-use (TOCTOU) race condition", "The gap between authorization check and file access creates a race window. The attacker who wins the race can substitute the resource after the check but before use."),
        opt("b", "Buffer overflow", "No memory buffer was overwritten. The vulnerability is in the timing gap between two operations."),
        opt("c", "Privilege escalation", "The attacker accessed a protected file, but the mechanism was a race condition, not vertical/horizontal escalation."),
        opt("d", "Insecure deserialization", "No serialized objects were tampered with. The attack exploits a timing gap in file access operations.")
    ],
    ["a"],
    "TOCTOU race conditions occur when a resource is checked (authorization) and then used (file opened) in non-atomic operations. An attacker who can modify the resource between check and use can bypass the security control. Proper mitigation uses atomic operations or locking mechanisms."
))

NEW.append(q(
    "mcq-2-023", "2.3", "scenario", "single-choice", 1,
    "A software vendor releases an emergency security patch for a vulnerability that was actively exploited in the wild. The vendor states they first learned of the vulnerability through a third-party incident response firm. No CVE was published before the attacks, and no prior versions of the software contained a fix. How should this vulnerability be classified?",
    "A vendor releases an emergency patch for a vulnerability they first learned about through an incident response firm. No CVE or patch existed before the attacks were observed.",
    [
        opt("a", "Zero-day vulnerability", "A zero-day vulnerability is unknown to the vendor when exploited. The vendor was unaware before the attacks, no CVE existed, and no patch was available. This is zero-day."),
        opt("b", "Known vulnerability", "A known vulnerability has a published CVE and available patch. This was exploited before any disclosure or patch."),
        opt("c", "Legacy platform vulnerability", "Legacy vulnerabilities exist in unsupported systems. This software was still supported, as evidenced by the emergency patch."),
        opt("d", "Configuration vulnerability", "Configuration vulnerabilities result from misconfiguration, not software flaws. This was a code-level vulnerability.")
    ],
    ["a"],
    "A zero-day vulnerability is a security flaw unknown to the software vendor at the time of exploitation. The term zero-day refers to the number of days the vendor has had to fix the problem. Defenses include defense-in-depth, application whitelisting, and intrusion detection."
))

NEW.append(q(
    "mcq-2-024", "2.3", "scenario", "single-choice", 1,
    "A hospital continues to run Windows Embedded Standard 7 on a $2 million MRI machine because the manufacturer has not validated newer operating systems and upgrading could void the warranty. The system is connected to the hospital network for image sharing but cannot receive security updates. What type of vulnerability does this create?",
    "A hospital runs an unsupported OS on an MRI machine because the manufacturer has not validated newer OS versions. The system is network-connected but cannot receive security updates.",
    [
        opt("a", "Zero-day vulnerability", "The vulnerabilities in Windows 7 are well-known with published CVEs. Not zero-day. The risk is from unpatched known vulnerabilities."),
        opt("b", "Legacy platform vulnerability", "Running an end-of-life OS that no longer receives security updates on a network-connected device is a legacy platform vulnerability. The device cannot be patched against known exploits."),
        opt("c", "Improper input handling", "No input handling flaw is described. The vulnerability is the inability to apply security patches."),
        opt("d", "Race condition", "No TOCTOU issue is present. The core issue is the use of unsupported software.")
    ],
    ["b"],
    "Legacy platforms are systems no longer supported by the vendor or that cannot receive security updates. Medical devices, industrial controllers, and embedded systems are common legacy platforms. Mitigations include network segmentation, strict access controls, and compensating controls like virtual patching via IPS."
))

NEW.append(q(
    "mcq-2-025", "2.3", "scenario", "single-choice", 1,
    "A penetration tester navigates to a login page and enters an invalid username. The application responds: 'User jsmith not found in the system.' When entering a valid username with a wrong password, the response changes to: 'Invalid password for user jsmith.' After three failed attempts, the application displays a detailed stack trace revealing internal file paths and code structure. What vulnerability is being demonstrated?",
    "A login page reveals whether usernames are valid through different error messages, then displays a detailed stack trace with internal file paths after failed attempts.",
    [
        opt("a", "Improper error handling leading to information disclosure", "The application reveals whether usernames are valid (user enumeration), and the stack trace exposes internal file paths and code structure. Both aid attackers."),
        opt("b", "SQL injection", "No SQL syntax was injected. The vulnerability is in error message verbosity, not database query construction."),
        opt("c", "Cross-site scripting", "XSS requires injecting executable scripts. This vulnerability leaks information through error messages."),
        opt("d", "Insecure direct object reference", "IDOR involves accessing unauthorized objects by modifying reference identifiers. This is information disclosure through error messages.")
    ],
    ["a"],
    "Proper error handling should return generic error messages (e.g., 'Invalid username or password') and log detailed errors server-side. Revealing valid usernames enables account enumeration. Stack traces containing file paths reveal application structure."
))

NEW.append(q(
    "mcq-2-026", "2.3", "scenario", "single-choice", 1,
    "A security assessment of a web application reveals that TLS certificates are validated using MD5, passwords are stored as unsalted SHA-1 hashes, and the application supports SSLv3 for backward compatibility. Which category of vulnerability BEST describes these findings?",
    "A web application uses MD5 for TLS certificate validation, unsalted SHA-1 for password storage, and supports SSLv3.",
    [
        opt("a", "Weak cryptographic implementation", "MD5 is vulnerable to collision attacks, SHA-1 is deprecated for password storage, and SSLv3 is vulnerable to POODLE. All three are weak or outdated cryptographic implementations."),
        opt("b", "Improper certificate validation", "MD5 certificate validation is one issue, but the broader category is weak cryptography including hashing and protocol support."),
        opt("c", "Misconfiguration", "While these are configuration choices, the fundamental issue is using cryptographically broken algorithms, not a configuration syntax error."),
        opt("d", "Insecure deserialization", "No serialized data is being processed. The issues are all in cryptographic algorithms and protocols.")
    ],
    ["a"],
    "Weak or outdated cryptographic implementations are a common vulnerability. MD5 is collision-broken, SHA-1 is nearing practical collision attacks, unsalted fast hashes allow offline password cracking, and SSLv3 has known protocol-level vulnerabilities (POODLE)."
))

# ===================================================================
# OBJECTIVE 2.4 - Malicious Activity (9 questions)
# ===================================================================

NEW.append(q(
    "mcq-2-027", "2.4", "scenario", "single-choice", 1,
    "A SOC analyst reviews authentication logs and finds the following pattern: over a 4-hour period, each of 1,200 user accounts received exactly 3 failed login attempts using the passwords Summer2024!, Fall2024!, and Winter2024!, in that order. No account had more than 3 attempts before moving to the next account. No account was locked out. What type of attack is this?",
    "Over 4 hours, 1,200 user accounts each received exactly 3 failed login attempts with seasonal passwords. No account was locked out.",
    [
        opt("a", "Brute force attack", "Brute force tries many password combinations against a single account. Here, few passwords were tried against many accounts."),
        opt("b", "Password spraying", "Password spraying tries a small number of common passwords against many accounts. The attacker moves from account to account to avoid lockout thresholds."),
        opt("c", "Dictionary attack", "A dictionary attack tries many curated passwords against a single account. This attack tried only 3 passwords per account."),
        opt("d", "Credential stuffing", "Credential stuffing uses breached username/password pairs from other sites. This attack used seasonal passwords.")
    ],
    ["b"],
    "Password spraying is a low-and-slow attack that tries a few commonly used passwords against many accounts, staying below account lockout thresholds. Key indicator: many accounts targeted with few passwords each, with no lockouts triggered."
))

NEW.append(q(
    "mcq-2-028", "2.4", "scenario", "multiple-choice", 2,
    "A company's web server becomes unresponsive during a product launch. Network traffic analysis shows 500,000 incomplete TCP connections per second, all with the SYN flag set but no ACK completing the three-way handshake. Source IPs are spoofed. Meanwhile, the company's DNS servers are receiving 10 Gbps of traffic from open DNS resolvers sending large responses to spoofed source addresses. Which TWO attack types are occurring?",
    "A web server is overwhelmed by half-open TCP connections (SYN sent but no ACK). DNS servers receive 10 Gbps from open resolvers responding to spoofed queries.",
    [
        opt("a", "SYN flood", "The server is overwhelmed by half-open TCP connections. The connection table fills up, preventing legitimate connections."),
        opt("b", "Ping of death", "Ping of death sends oversized ICMP packets. This attack uses TCP SYN packets and DNS UDP traffic."),
        opt("c", "DNS amplification", "Attackers send small queries to open resolvers with spoofed source IPs. The resolvers send large responses to the victim, amplifying traffic."),
        opt("d", "ARP poisoning", "ARP poisoning maps a MAC to a different IP on the local network. This is a volumetric DDoS."),
        opt("e", "Ping flood", "Ping flood uses ICMP echo requests. This attack uses TCP SYN and DNS UDP traffic."),
        opt("f", "Smurf attack", "Smurf sends ICMP echo requests to broadcast addresses with spoofed source IPs.")
    ],
    ["a", "c"],
    "Two simultaneous DDoS vectors: (1) SYN flood consumes server resources with half-open TCP connections, and (2) DNS amplification uses open resolvers to multiply traffic directed at the victim's DNS infrastructure. Both use IP spoofing."
))

NEW.append(q(
    "mcq-2-029", "2.4", "scenario", "single-choice", 1,
    "Users report that the company web server is intermittently unreachable. A network technician checks the switch and finds that the MAC address associated with the default gateway IP address (192.168.1.1) has changed three times in the past hour. Several workstations show multiple MAC addresses for the same IP in their ARP cache. What type of attack is likely occurring?",
    "The MAC address for the default gateway IP keeps changing. Multiple workstations show multiple MACs for the same IP in their ARP cache.",
    [
        opt("a", "DNS poisoning", "DNS poisoning alters DNS records. The MAC-to-IP mappings in ARP cache are affected, not DNS resolution."),
        opt("b", "MAC flooding", "MAC flooding overwhelms a switch's MAC table to fail open. Here the ARP cache is poisoned."),
        opt("c", "ARP spoofing", "Unsolicited ARP replies associating the gateway IP with a malicious MAC poison the ARP caches, redirecting traffic through the attacker for interception."),
        opt("d", "DHCP starvation", "DHCP exhaustion prevents clients from getting addresses. This attack poisons IP-to-MAC mappings.")
    ],
    ["c"],
    "ARP spoofing sends forged ARP replies mapping an IP (usually the gateway) to an attacker's MAC. This enables MITM where the attacker can intercept, modify, or drop traffic. Dynamic ARP inspection on switches can detect and prevent this."
))

NEW.append(q(
    "mcq-2-030", "2.4", "scenario", "single-choice", 1,
    "Customers of a regional bank report that when they type the bank's URL into their browsers, they are redirected to a site that looks identical but prompts for additional authentication information. The bank investigates and finds that the DNS A record for www.securebank.com now points to 203.0.113.45 instead of the legitimate IP. The bank's authoritative DNS server was compromised. What type of attack occurred?",
    "Customers are redirected to a fake bank site. The bank's authoritative DNS server was compromised and the A record was modified to point to an attacker IP.",
    [
        opt("a", "DNS cache poisoning", "Cache poisoning affects a resolver's temporary cache. Here the authoritative DNS server's zone data was modified."),
        opt("b", "DNS zone poisoning", "The attacker compromised the authoritative DNS server and modified the A record. This is zone-level poisoning affecting all queries."),
        opt("c", "Pharming", "Pharming is the effect of redirection. The exam objective categorizes the DNS-level technique under DNS poisoning."),
        opt("d", "DNSSEC bypass", "DNSSEC validates responses with signatures. DNSSEC was likely not implemented.")
    ],
    ["b"],
    "DNS poisoning at the authoritative level means actual zone records on the DNS server were modified. Unlike cache poisoning (affecting a single resolver's cache), zone poisoning affects all users querying the compromised server. DNSSEC with zone signing prevents unauthorized modifications."
))

NEW.append(q(
    "mcq-2-031", "2.4", "scenario", "single-choice", 1,
    "An attacker gains administrative access to a workstation and runs a tool that extracts credential material from the Local Security Authority Subsystem Service (LSASS) process memory. The attacker then uses this material to authenticate to a file server without knowing the plaintext password. Logs show the file server accepted the authentication using NTLM. What type of attack was performed?",
    "An attacker extracts credential material from LSASS memory on a workstation and uses it to authenticate to a file server without knowing the plaintext password, using NTLM.",
    [
        opt("a", "Pass-the-hash attack", "Extracting NTLM hashes from LSASS memory and using them to authenticate to other systems without knowing the plaintext password is pass-the-hash."),
        opt("b", "Kerberoasting", "Kerberoasting requests Kerberos service tickets for offline brute-forcing. This extracts and reuses hashes immediately."),
        opt("c", "Golden ticket attack", "A golden ticket forges a Kerberos TGT using the KRBTGT hash. This uses NTLM hashes, not forged tickets."),
        opt("d", "LLMNR/NBT-NS poisoning", "Link-Local Multicast Name Resolution poisoning intercepts name resolution. This extracts and reuses credentials from a compromised host.")
    ],
    ["a"],
    "Pass-the-hash is a lateral movement technique where attackers extract NTLM password hashes from LSASS memory and reuse them to authenticate to other systems. Mitigations include Credential Guard, restricted admin mode for RDP, and Kerberos-only authentication."
))

NEW.append(q(
    "mcq-2-032", "2.4", "scenario", "single-choice", 1,
    "An organization's file servers are encrypted with files renamed to include the extension .crypted. A ransom note demands 50 Bitcoin for decryptor software. Forensic analysis reveals the encryption used ChaCha20 for file content and RSA-4096 for key encryption. The attackers exfiltrated 200 GB of data before triggering encryption. Which type of malware is this?",
    "File servers are encrypted with .crypted extension, a ransom note demands Bitcoin, ChaCha20/RSA encryption was used, and 200 GB was exfiltrated before encryption.",
    [
        opt("a", "Wiper malware", "Wipers destroy data without recovery possibility. This attack demands payment for decryption."),
        opt("b", "Ransomware with double extortion", "Files were encrypted, ransom demanded, and data exfiltrated before encryption: the double-extortion model."),
        opt("c", "Trojan horse", "While ransomware is often delivered as a trojan, the description focuses on the destructive payload. Ransomware is the accurate classification."),
        opt("d", "Rootkit", "Rootkits hide malware presence. This malware encrypted files and left notes. It was not stealthy.")
    ],
    ["b"],
    "Double-extortion ransomware both encrypts files and exfiltrates data before encryption. Attackers demand payment both for decryption and to prevent data leaks. Hybrid ChaCha20/RSA encryption is typical of modern ransomware."
))

NEW.append(q(
    "mcq-2-033", "2.4", "scenario", "single-choice", 1,
    "An EDR alert shows a Word document spawning a PowerShell process that executes an encoded command. The PowerShell script injects shellcode into a legitimate running process (notepad.exe) using Windows API calls (VirtualAlloc, CreateRemoteThread). No malicious files are written to disk. Registry run keys contain PowerShell commands that repeat the process after reboot. What type of malware technique is this?",
    "A Word document spawns PowerShell that injects shellcode into notepad.exe using Windows API calls. No files written to disk. Persistence via registry PowerShell commands.",
    [
        opt("a", "Fileless malware", "Operates entirely in memory: PowerShell executes encoded commands, injects shellcode into legitimate processes, and persists via registry without writing executables to disk."),
        opt("b", "Polymorphic malware", "Polymorphic malware changes its code signature with each infection. This uses memory injection, not code mutation."),
        opt("c", "Bootkit", "Bootkits infect the MBR or EFI. This runs from user-mode processes (PowerShell, notepad.exe)."),
        opt("d", "Macro virus", "While the initial vector may be a Word macro, the core technique is fileless execution via PowerShell and process injection.")
    ],
    ["a"],
    "Fileless malware operates without writing executable files to disk. Common techniques: PowerShell execution, WMI persistence, registry-based payloads, and process injection into legitimate processes. Fileless malware is harder to detect because file-scanning AV does not detect it."
))

NEW.append(q(
    "mcq-2-034", "2.4", "scenario", "single-choice", 1,
    "A SOC analyst reviews VPN authentication logs and finds 50,000 failed login attempts against a single user account over a 90-minute period. The passwords attempted include variations from the RockYou breach list, common seasonal passwords, and keyboard patterns (qwerty, 123456, password). The account was locked out after 10 failed attempts, but automated unlock scripts re-enabled it within minutes. What type of attack is this?",
    "50,000 failed VPN login attempts against one user account using passwords from breach lists, common passwords, and keyboard patterns. Lockout was bypassed by automated re-enablement.",
    [
        opt("a", "Brute force attack", "Brute force tries every possible character combination (aaaa, aaab, aaac). The use of curated password lists distinguishes this from brute force."),
        opt("b", "Dictionary attack", "A dictionary attack uses curated lists of likely passwords, breach lists, common passwords, and patterns. RockYou breach data is a key indicator."),
        opt("c", "Password spraying", "Password spraying tries few passwords against many accounts. This attack tried 50,000 passwords against a single account."),
        opt("d", "Credential stuffing", "Credential stuffing uses username/password pairs from other breaches. This targeted a single account with a dictionary.")
    ],
    ["b"],
    "A dictionary attack uses a curated wordlist of likely passwords rather than exhaustively trying all possible combinations. The RockYou breach list is a well-known password dictionary. Account lockout mechanisms are the primary defense, but automated re-enablement defeated it here."
))

NEW.append(q(
    "mcq-2-035", "2.4", "scenario", "multiple-choice", 2,
    "An attacker captures network traffic at a coffee shop using a rogue access point configured with the same SSID as the legitimate Wi-Fi. Later, the attacker replays the captured authentication packets to gain access to the coffee shop's guest network as if they were the original victim. The network uses an open captive portal that grants access after clicking 'Accept.' Which TWO conditions enabled this attack?",
    "An attacker uses a rogue AP with the same SSID to capture traffic at a coffee shop. Later, they replay authentication packets to access the guest network.",
    [
        opt("a", "The Wi-Fi network did not use WPA3 with SAE", "WPA3's Simultaneous Authentication of Equals provides forward secrecy and prevents handshake replay."),
        opt("b", "The attacker had physical access to the coffee shop", "Physical access was needed for the rogue AP but the replay was remote. The network protocol flaw is the root cause."),
        opt("c", "The network used an open or captive-portal-only authentication model", "Open networks and basic captive portals do not provide per-session cryptographic authentication, making them vulnerable to replay."),
        opt("d", "The attacker captured the victim's NTLM hash", "NTLM hashes are for Windows authentication, not Wi-Fi network access."),
        opt("e", "The network used WPA2-PSK without replay protection", "WPA2-PSK includes sequence numbers to prevent replay of data packets, though handshake capture is possible for offline cracking."),
        opt("f", "The network lacked replay protection mechanisms", "Replay attacks succeed when there is no cryptographic binding of each session or timestamps/nonces in the authentication protocol.")
    ],
    ["a", "c"],
    "This attack succeeds because (1) WPA3-SAE with forward secrecy would prevent handshake capture and replay, and (2) the open/captive-portal-only model provides no per-session cryptographic authentication. The rogue AP with the same SSID is an evil twin component."
))

# ===================================================================
# OBJECTIVE 2.5 - Mitigation Techniques (9 questions)
# ===================================================================

NEW.append(q(
    "mcq-2-036", "2.5", "standard", "single-choice", 1,
    "A security architect needs to protect a publicly accessible web application from SQL injection and cross-site scripting attacks. The solution must inspect HTTP/HTTPS traffic at the application layer and understand web-specific contexts such as URL parameters, form fields, and cookies. Which security control should the architect deploy?",
    "",
    [
        opt("a", "Web application firewall (WAF)", "A WAF is specifically designed to inspect HTTP/HTTPS at Layer 7 and understands web-specific contexts including URL parameters, POST bodies, headers, and cookies."),
        opt("b", "Stateful network firewall", "Stateful firewalls operate at Layers 3-4 and do not inspect HTTP application-layer content."),
        opt("c", "Intrusion prevention system (IPS)", "A network IPS can detect some web attacks via signatures, but a WAF provides deeper application-layer inspection with web-specific context."),
        opt("d", "Data loss prevention (DLP)", "DLP monitors data exfiltration. It does not prevent SQL injection or XSS.")
    ],
    ["a"],
    "A web application firewall is designed to protect web applications by filtering HTTP/HTTPS traffic. WAFs understand web application context and can detect application-layer attacks that network firewalls and IPS systems might miss."
))

NEW.append(q(
    "mcq-2-037", "2.5", "standard", "single-choice", 1,
    "A vulnerability scanner identifies a critical remote code execution vulnerability (CVSS 9.8) in a public-facing web application. The vendor has not yet released a security patch, and the application cannot be taken offline. Which mitigation strategy should the security team implement FIRST?",
    "",
    [
        opt("a", "Deploy a virtual patch via the web application firewall", "Virtual patching applies WAF rules that block exploit traffic without modifying application code. It is the fastest risk reduction when no vendor patch exists."),
        opt("b", "Disconnect the server from the network until the patch is available", "The requirement states the application cannot be taken offline. Disconnection violates business continuity."),
        opt("c", "Re-run the vulnerability scan with different credentials", "Re-scanning will not address the vulnerability, only confirm its presence."),
        opt("d", "Uninstall the web application and replace it", "Replacement is a long-term fix, not immediate mitigation.")
    ],
    ["a"],
    "Virtual patching (vulnerability filter) uses a WAF or IPS to block exploit attempts until the permanent vendor patch can be tested and deployed. This is a compensating control that reduces risk without code changes or downtime."
))

NEW.append(q(
    "mcq-2-038", "2.5", "standard", "multiple-choice", 2,
    "A security administrator is designing a defense-in-depth strategy for a new data center. The goal is to ensure that if one security control fails, additional controls continue to protect the assets. Which TWO controls BEST achieve defense in depth?",
    "",
    [
        opt("a", "A single network firewall at the perimeter only", "A single firewall creates a single point of failure. This violates defense in depth."),
        opt("b", "Internal network segmentation with separate firewall rules between each security zone", "Segmentation creates multiple layers: even if the perimeter is breached, the attacker must pass additional firewalls."),
        opt("c", "Host-based firewalls on all servers in addition to network firewalls", "Host firewalls provide endpoint-level protection even if network firewalls are bypassed."),
        opt("d", "Single-factor authentication for all systems", "Single-factor removes a critical layer. MFA provides an additional authentication layer."),
        opt("e", "Vulnerability scanning once per year", "Annual scanning leaves large exposure windows. Continuous monitoring is needed."),
        opt("f", "Full disk encryption with centralized key management", "Full disk encryption protects data at rest but is a single control for that specific risk.")
    ],
    ["b", "c"],
    "Defense in depth requires multiple overlapping controls so failure of any single control does not compromise the entire system. Internal segmentation and host-based firewalls create multiple layers between an attacker and the target."
))

NEW.append(q(
    "mcq-2-039", "2.5", "standard", "single-choice", 1,
    "An organization wants to implement multi-factor authentication for remote VPN access. Currently, users authenticate with a username and password. Which additional factor would satisfy the requirement of using a different authentication category?",
    "",
    [
        opt("a", "A second password known only to the user", "A second password is still a knowledge factor, the same category as the existing password."),
        opt("b", "A hardware TOTP token", "A TOTP token is something you have (possession factor), a different category from knowledge (password). This satisfies MFA."),
        opt("c", "A security question", "Security questions are still knowledge factors, the same category as the password."),
        opt("d", "The user's IP address being within the corporate range", "IP address is a location/context factor, not one of the three primary factors (knowledge, possession, inherence).")
    ],
    ["b"],
    "MFA requires at least two different authentication factors: something you know (password), something you have (token, phone, smart card), or something you are (biometric). A TOTP hardware token is a possession factor."
))

NEW.append(q(
    "mcq-2-040", "2.5", "standard", "single-choice", 1,
    "A security architect is designing a network for a payment processing environment. Credit card transactions must be processed on systems that meet PCI DSS requirements. Corporate systems (email, file sharing, printing) should not be able to communicate directly with payment systems. Which architectural approach BEST meets this requirement?",
    "",
    [
        opt("a", "All systems on the same VLAN with host-based firewalls", "Same VLAN allows Layer 2 communication. Host firewalls alone are insufficient for PCI DSS segmentation."),
        opt("b", "Physically separate networks with no connectivity", "While secure, this may be impractical and prevent legitimate business workflows."),
        opt("c", "VLAN segmentation with firewall rules and a DMZ for payment systems", "VLANs with firewall rules create logical separation. A DMZ allows controlled access while blocking direct communication from corporate systems."),
        opt("d", "Flat network with IPS monitoring", "A flat network with IPS can detect but not prevent lateral movement. PCI DSS requires preventing communication.")
    ],
    ["c"],
    "Network segmentation divides the network into security zones with different trust levels. VLANs with ACLs and firewall rules enforce separation. A DMZ for payment systems prevents lateral movement from compromised corporate systems."
))

NEW.append(q(
    "mcq-2-041", "2.5", "standard", "single-choice", 1,
    "A SOC analyst needs a detection rule that identifies potential password spraying attacks while minimizing false positives. The rule should trigger when a single source IP attempts to authenticate against many different user accounts. Which SIEM correlation logic BEST achieves this?",
    "",
    [
        opt("a", "Alert on any single failed login event", "Too noisy. Users mistype passwords frequently."),
        opt("b", "Alert when more than 5 failed logins from one source IP target different user accounts within 60 seconds", "Multiple failed logins from one IP targeting different accounts in a short window is the signature pattern of password spraying."),
        opt("c", "Alert when a single user account has more than 3 failed logins from any source", "This detects brute force against one account, not spraying against many."),
        opt("d", "Alert on logins from geographic regions outside normal operating areas", "Geo alerts detect anomalous locations but not specifically password spraying.")
    ],
    ["b"],
    "Password spraying is characterized by one attacker trying a few passwords against many accounts. The correlation should look for multiple unique accounts targeted from one source IP within a short window."
))

NEW.append(q(
    "mcq-2-042", "2.5", "standard", "single-choice", 1,
    "A security auditor reviews a new Windows server deployment and finds that USB mass storage, Remote Desktop, and PowerShell script execution are all enabled. The server will be accessible from the internal network. Which industry best practice should be applied to reduce the attack surface?",
    "",
    [
        opt("a", "System hardening using a security baseline or benchmark", "System hardening applies configuration standards to disable unnecessary services, restrict features, and reduce attack surface. Microsoft security baselines or CIS benchmarks define secure configurations."),
        opt("b", "Network segmentation only", "Segmentation alone does not address the enabled services on the server itself."),
        opt("c", "Full disk encryption", "BitLocker protects data at rest but does not disable unnecessary services."),
        opt("d", "Intrusion detection system monitoring", "IDS can detect attacks against these services but does not prevent them. Hardening removes the attack surface proactively.")
    ],
    ["a"],
    "System hardening uses security baselines (CIS benchmarks, Microsoft Security Baselines, DISA STIGs) to configure systems securely by disabling unnecessary services, applying least privilege, and enforcing secure settings. This reduces attack surface proactively."
))

NEW.append(q(
    "mcq-2-043", "2.5", "standard", "single-choice", 1,
    "An employee emails a spreadsheet containing customer credit card numbers to their personal email account. The email is blocked and the security team receives an alert before any data leaves the corporate network. Which security control detected and prevented this incident?",
    "",
    [
        opt("a", "Data loss prevention (DLP)", "DLP monitors data in motion (email), at rest, and in use. Content inspection detected credit card numbers in the email and blocked the transmission."),
        opt("b", "Web application firewall (WAF)", "WAF protects web applications from attacks like SQLi and XSS. It does not inspect outbound emails for sensitive data."),
        opt("c", "Intrusion prevention system (IPS)", "IPS detects and blocks network-level attacks. It does not perform content inspection of email attachments for PII."),
        opt("d", "Antivirus software", "AV detects known malware signatures. The spreadsheet was not malicious, it contained sensitive data.")
    ],
    ["a"],
    "Data loss prevention (DLP) systems monitor and control data transmission to prevent unauthorized disclosure of sensitive information. DLP can inspect email content and attachments for patterns like credit card numbers, SSNs, or custom keywords."
))

NEW.append(q(
    "mcq-2-044", "2.5", "standard", "single-choice", 1,
    "An organization wants to ensure that only approved applications can execute on employee workstations. Which application control approach provides the STRONGEST security?",
    "",
    [
        opt("a", "Application allow listing (whitelisting)", "Allow listing explicitly permits only approved applications and blocks everything else. This provides the strongest security by default-denying all unapproved software."),
        opt("b", "Application deny listing (blacklisting)", "Deny listing blocks known malicious applications but permits everything else. It is reactive and easily bypassed by new or renamed malware."),
        opt("c", "Antivirus with real-time scanning", "AV detects known malware signatures but does not block unapproved legitimate software or zero-day threats."),
        opt("d", "User education and acceptable use policy", "Policies and training are important but do not technically enforce application restrictions.")
    ],
    ["a"],
    "Application allow listing (whitelisting) is the most secure approach because it defaults to deny: only explicitly approved applications can run. Deny listing is weaker because it defaults to permit and must be continuously updated with new threats."
))

# ===================================================================
# MAIN: Replace Domain 2 questions in the bank
# ===================================================================

def main():
    with open(BANK_PATH) as f:
        bank = json.load(f)

    original_count = len(bank["mcqs"])
    
    # Filter out all domain 2 questions
    bank["mcqs"] = [q for q in bank["mcqs"] if q.get("domain") != 2]
    
    removed = original_count - len(bank["mcqs"])
    print(f"Removed {removed} existing Domain 2 questions")
    
    # Add new questions
    bank["mcqs"].extend(NEW)
    print(f"Added {len(NEW)} new Domain 2 questions")
    print(f"Total questions in bank: {len(bank['mcqs'])}")
    
    # Write back
    with open(BANK_PATH, "w") as f:
        json.dump(bank, f, indent=2)
    
    print(f"Updated {BANK_PATH}")
    
    # Validate
    d2 = [q for q in bank["mcqs"] if q.get("domain") == 2]
    assert len(d2) == 44, f"Expected 44 Domain 2 questions, got {len(d2)}"
    
    multi = [q for q in d2 if q["kind"] == "multiple-choice"]
    scenario = [q for q in d2 if q["format"] == "scenario"]
    print(f"Multi-select count: {len(multi)}")
    print(f"Scenario count: {len(scenario)}")
    print(f"Standard count: {len(d2) - len(scenario)}")
    
    by_obj = {}
    for q in d2:
        by_obj.setdefault(q["objective"], []).append(q["id"])
    for o in sorted(by_obj):
        print(f"  {o}: {len(by_obj[o])} questions")
    
    print("\nDomain 2 questions successfully replaced!")


if __name__ == "__main__":
    main()
