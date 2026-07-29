#!/usr/bin/env python3
"""Generate 56 Domain 4 (Security Operations) questions for CompTIA SY0-701."""

import json, os

questions = []

def Q(id, objective, kind, prompt, context, options, correct, selectCount, explanation):
    opts = []
    for letter, (text, rationale) in zip("abcd", options):
        opts.append({"id": letter, "text": text, "rationale": rationale})
    q = {
        "id": id, "domain": 4, "objective": objective, "format": "scenario",
        "prompt": prompt, "context": context, "kind": kind,
        "options": opts,
        "correctOptionIds": correct if isinstance(correct, list) else [correct],
        "selectCount": selectCount, "explanation": explanation,
        "sourceRefs": [
            {"source": "exam-objectives", "section": f"Objective {objective}"},
            {"source": "study-guide", "section": "Domain 4 — Security Operations"}
        ]
    }
    questions.append(q)

# === OBJECTIVE 4.1 — Security Configurations (mcq-4-001 to mcq-4-008) ===

Q("mcq-4-001", "4.1", "single-choice",
  "A security team uses Ansible to apply CIS Level 2 benchmarks to 40 Linux servers. After deployment, an auditor finds four servers still have root SSH login enabled. What is the MOST likely cause?",
  "A security team uses Ansible to apply CIS Level 2 benchmarks to 40 Linux servers. After deployment, an auditor finds four servers still have root SSH login enabled.",
  [
    ("The four servers were not included in the Ansible inventory file", "Ansible only targets hosts defined in the inventory file. Missing inventory entries means playbooks never execute on those hosts."),
    ("The SSH daemon was restarted before the playbook completed", "Ansible applies configurations idempotently; service restart order does not prevent configuration changes from being applied."),
    ("SELinux prevented Ansible from modifying sshd_config", "Ansible modules handle SELinux contexts, and the CIS playbook typically includes SELinux configuration tasks."),
    ("The Wazuh agent blocked the SSH configuration change", "Wazuh agents monitor and report events; they do not block system configuration changes."),
  ], "a", 1,
  "Ansible only applies configurations to hosts defined in its inventory file. If four servers were not listed, they would not receive any playbook tasks including SSH hardening. Regular inventory audits and automated CMDB integration help prevent this issue.")

Q("mcq-4-002", "4.1", "single-choice",
  "A SOC analyst notices a newly deployed Linux server is not forwarding audit logs to the Wazuh manager. The Wazuh agent service is running and /var/ossec/etc/ossec.conf exists. Which configuration issue MOST likely explains the missing logs?",
  "A SOC analyst notices a newly deployed Linux server is not forwarding audit logs to the Wazuh manager. The Wazuh agent is running and ossec.conf exists.",
  [
    ("The <client><server><address> tag points to an incorrect manager IP or hostname", "If the Wazuh agent cannot reach the manager, it runs but queues logs locally without forwarding them."),
    ("The auditd service is not installed on the server", "Wazuh agents collect logs from multiple sources and are not dependent on auditd for forwarding."),
    ("The ossec.conf file lacks a <syscheck> section", "File integrity monitoring is a separate capability; <syscheck> controls FIM, not log forwarding."),
    ("SELinux is enforcing mode and blocking the agent's outbound connection", "SELinux does not typically block outbound TCP connections made by the Wazuh agent on port 1514/1515."),
  ], "a", 1,
  "The most likely cause is an incorrect manager address in ossec.conf. The Wazuh agent starts and appears healthy, but cannot connect to the wrong manager IP, so logs are queued and never forwarded. Verifying the manager address and testing connectivity with tcpdump on port 1514 is the standard troubleshooting step.")

Q("mcq-4-003", "4.1", "single-choice",
  "After applying a Windows Server hardening baseline via GPO, six servers have reverted to weaker TLS settings three weeks later. Group Policy confirms the GPO is still linked and enforced. What is the MOST likely explanation?",
  "After applying a Windows Server hardening baseline via GPO, six servers have reverted to weaker TLS settings. Group Policy confirms the GPO is still linked and enforced.",
  [
    ("A local administrator used Local Group Policy Editor to modify the TLS settings, overriding the domain GPO", "Local Group Policy can override domain GPO settings if the domain GPO is not set to 'Enforced'."),
    ("Windows Update automatically reset the TLS settings during patching", "Windows updates do not override Group Policy security settings; GPO reapplies settings at every refresh interval."),
    ("The servers were rebooted and lost their GPO cache", "Rebooting does not clear Group Policy cache; GPO is re-downloaded and reapplied at startup and periodically."),
    ("An antivirus update quarantined the registry keys controlling TLS", "Antivirus software does not modify TLS registry keys; it scans files for malware signatures."),
  ], "a", 1,
  "Local Group Policy can override domain-level GPO settings if the domain policy is not enforced. Domain GPOs should be set to 'Enforced' and Local Group Policy should be restricted via the 'Turn off Local Group Policy Objects processing' setting.")

Q("mcq-4-004", "4.1", "single-choice",
  "An organization adopts immutable infrastructure for web servers using AWS EC2 Auto Scaling with a hardened AMI. After a critical patch is released, a junior engineer connects to a running instance, installs the patch manually, and creates a new AMI from that instance. What security principle did this violate?",
  "An organization adopts immutable infrastructure using AWS EC2 Auto Scaling with hardened AMIs. A junior engineer patches a running instance manually and creates a new AMI from it.",
  [
    ("Immutable infrastructure requires building new images from a clean, unmodified source, not from a running instance that may have configuration drift", "Creating AMIs from running instances risks inheriting undocumented changes, configuration drift, or undetected compromise."),
    ("The engineer should have applied the patch using AWS Systems Manager Patch Manager instead", "While Systems Manager can patch instances, immutable infrastructure requires building new images rather than patching running instances."),
    ("The engineer should have tested the patch in a staging environment first", "Testing is important, but the core violation is creating an image from a running instance rather than from a clean build."),
    ("The engineer should have updated the Auto Scaling launch template before creating the new AMI", "The launch template must be updated, but the fundamental issue is the mutable approach to image creation."),
  ], "a", 1,
  "Immutable infrastructure mandates that servers are never modified in-place. A new hardened image is built from a clean source, tested, and deployed through the CI/CD pipeline. By patching a running instance, the engineer introduced configuration drift by inheritance.")

Q("mcq-4-005", "4.1", "multiple-choice",
  "A patch management team needs to prioritize deployment for four scenarios. Which two scenarios represent the highest risk and should be expedited? (Select TWO.)",
  "A patch management team needs to prioritize deployment for multiple vulnerabilities. Two scenarios represent the highest risk.",
  [
    ("A remote code execution vulnerability in the company's public-facing web server with an active exploit in the wild", "RCE with active exploitation against an internet-facing asset represents the highest possible risk requiring immediate out-of-band patching."),
    ("A medium-severity privilege escalation vulnerability in a productivity application used by 10% of users", "Local privilege escalation in a non-critical app with low prevalence is a routine patch-cycle candidate."),
    ("A denial-of-service vulnerability in the internal DNS server that requires local network access to exploit", "DoS requiring local access in an internal system is lower priority than actively exploited RCE."),
    ("A critical information disclosure vulnerability in the VPN concentrator with a published proof-of-concept exploit", "VPN concentrators are perimeter devices; a critical vuln with a published PoC against perimeter infrastructure is extremely urgent."),
  ], ["a", "d"], 2,
  "Risk-based patch management prioritizes: (1) vulnerabilities with active exploitation, (2) critical/high CVSS severity, (3) internet-facing systems, (4) vulnerabilities with public exploit code. Options A and D both represent imminent threats requiring emergency out-of-band patching.")

Q("mcq-4-006", "4.1", "single-choice",
  "A SOC analyst uses Splunk to detect configuration drift on Windows servers. A search identifies that the 'RestrictAnonymous' registry key was changed on 12 servers without change management approval. Which Splunk correlation BEST identifies this drift?",
  "A SOC analyst uses Splunk to detect configuration drift on Windows servers. A registry key change was unauthorized.",
  [
    ("A scheduled search comparing current registry values against a known-good baseline with alerts on discrepancies", "Baseline comparison is the standard approach for configuration drift detection — establish a known-good state and alert on deviations."),
    ("A real-time search for Event ID 4657 (Registry modification) on all servers", "Event ID 4657 logs registry modifications but does not evaluate whether the new value matches the expected baseline."),
    ("A machine learning model detecting anomalous registry changes based on historical patterns", "ML-based anomaly detection requires significant training data and may miss infrequent but authorized changes."),
    ("A lookup table of all registry keys with their creation timestamps", "Registry key creation timestamps do not indicate the current value or whether it deviates from the baseline."),
  ], "a", 1,
  "Configuration drift detection requires an authoritative baseline. In Splunk, known-good configuration values are stored in a lookup table, and a scheduled search compares current values against the baseline.")

Q("mcq-4-007", "4.1", "single-choice",
  "A DevSecOps team uses Trivy to scan container images in a CI/CD pipeline. A scan of the production base image reports a critical vulnerability in the OpenSSL package. The developer argues it is a false positive because the application does not use OpenSSL directly. Which response BEST addresses the risk?",
  "A DevSecOps team uses Trivy to scan container images. A critical OpenSSL CVE is found in the base image. The developer claims it is irrelevant since the app does not use OpenSSL directly.",
  [
    ("The vulnerability must still be remediated because OpenSSL is linked into the image and could be leveraged through dependency confusion or transitive calls", "Any library present in the image expands the attack surface and can be exploited through other dependencies or future code changes."),
    ("The scan result is a false positive because only directly imported libraries present a security risk", "Transitive dependencies and unused libraries still count toward the attack surface and must be patched."),
    ("The team should configure Trivy to suppress CVEs for libraries the application does not import", "Suppressing CVEs bypasses security policy; the correct approach is to patch the base image."),
    ("The container should be deployed with a WAF that blocks exploitation of the OpenSSL vulnerability", "WAFs operate at the HTTP/HTTPS layer and cannot mitigate vulnerabilities within the container's linked libraries."),
  ], "a", 1,
  "In container security, every package in the image contributes to the attack surface. The correct remediation is to rebuild the base image with an updated OpenSSL version or switch to a patched distro image.")

Q("mcq-4-008", "4.1", "single-choice",
  "During a forensic investigation, the analyst discovers that PowerShell commands executed by an attacker were not recorded in Event ID 4104 (ScriptBlock Logging). Event ID 400 (Engine start) events are present. What is the MOST likely configuration gap?",
  "PowerShell commands were not recorded in Event ID 4104. Event ID 400 is present.",
  [
    ("Script Block Logging was not enabled via Group Policy or registry", "Event ID 4104 requires explicit enablement via Group Policy. Without it, only engine start/stop events (400/403) are recorded."),
    ("The attacker used PowerShell in constrained language mode which bypasses logging", "Constrained language mode restricts capabilities but does not disable Script Block Logging."),
    ("The attacker deleted the event logs after executing commands", "Log deletion would remove both Event IDs 400 and 4104. Since Event ID 400 is present, logs were not deleted."),
    ("The attacker used PowerShell 7 (pwsh.exe) which does not write to the Windows Event Log", "PowerShell 7 writes to Windows Event Log similarly to Windows PowerShell 5.1."),
  ], "a", 1,
  "PowerShell Script Block Logging (Event ID 4104) is disabled by default and must be enabled through Group Policy. Attackers target systems without Script Block Logging to execute in-memory payloads without leaving traces.")

# === OBJECTIVE 4.2 — Security Data Analytics (mcq-4-009 to mcq-4-016) ===

Q("mcq-4-009", "4.2", "single-choice",
  "A Splunk correlation rule triggers an impossible-travel alert: a user authenticated from New York at 09:05 UTC and London at 09:35 UTC. The user is a remote employee who uses a company VPN. What is the MOST likely explanation?",
  "A Splunk correlation rule for impossible travel triggers. A user authenticated from New York at 09:05 and London at 09:35. The user uses a company VPN.",
  [
    ("The VPN connection egressed through a different geographic POP, and the geolocation reflects the VPN server location, not the user's actual location", "VPN concentrators route traffic through regional Points of Presence. If the VPN session dropped and reconnected to a different POP, the source IP geolocation changes."),
    ("The user physically traveled from New York to London in 30 minutes using a private jet", "While technically possible, this is far less likely than a VPN routing issue for a remote employee."),
    ("An attacker obtained the user's credentials and is authenticating from London", "Credential theft is possible, but VPN egress switching is a well-known cause of impossible-travel false positives."),
    ("The Splunk geolocation database contains an error mapping the London IP address", "Geolocation errors can occur, but VPN POP switching is more common and explains the proximity in time."),
  ], "a", 1,
  "Impossible-travel detections frequently produce false positives when users connect through VPNs or cloud-based VDI. The VPN egress IP determines geolocation. If a VPN session reconnects to a different POP, the user appears to teleport.")

Q("mcq-4-010", "4.2", "single-choice",
  "A Windows server shows 500 failed logon attempts (Event ID 4625) from a single IP address within 10 minutes, followed by a successful logon (Event ID 4624) with Logon Type 3 from the same IP. Which conclusion is MOST accurate?",
  "A Windows server shows 500 Event ID 4625 failures from one IP, then one Event ID 4624 success from the same IP with Logon Type 3.",
  [
    ("A brute-force attack succeeded — the attacker found valid credentials after multiple failed attempts", "Multiple failed logons followed by a successful logon from the same IP is the classic pattern of a successful brute-force attack."),
    ("This is a password-spraying attack where the attacker tried one password against many usernames", "Password spraying involves few attempts per user across many accounts, not many attempts from one IP."),
    ("The account is locked out and the successful logon is from a service using cached credentials", "Account lockout prevents any logon including service accounts."),
    ("The failed events are caused by a misconfigured service account using expired credentials", "A misconfigured service generates failures from the server itself, not an external IP."),
  ], "a", 1,
  "The evidence chain clearly indicates a successful brute-force attack: hundreds of Event ID 4625 failures followed by Event ID 4624 success from the same source IP. Logon Type 3 indicates a network logon (SMB, RDP).")

Q("mcq-4-011", "4.2", "single-choice",
  "A Linux server sends syslog messages to a central ELK stack. Authentication failure messages show severity 4 (WARNING) instead of severity 3 (ERROR). The syslog-ng configuration uses 'authpriv.info' as the filter. What is the root cause?",
  "A Linux server sends syslog to ELK. Auth failures show WARNING (4) instead of ERROR (3). The syslog-ng filter is 'authpriv.info'.",
  [
    ("The Linux PAM module defaults to LOG_WARNING for authentication failures", "PAM modules can use LOG_WARNING for auth failures, which explains the severity. The 'authpriv.info' filter captures all messages at INFO and above."),
    ("The syslog-ng configuration should use 'authpriv.err' to capture only ERROR severity messages", "Using 'authpriv.err' would exclude WARNING messages, not explain why failures show as WARNING."),
    ("The ELK Logstash pipeline is misconfigured and incorrectly parsing the syslog PRI field", "Log parsing could affect displayed severity, but the root cause is the priority set by the sending application."),
    ("The syslog-ng filter 'authpriv.info' captures all messages at severity INFO and above", "This describes how the filter works but does not explain the root cause of the severity level."),
  ], "a", 1,
  "PAM (Pluggable Authentication Modules) modules set syslog priorities. Many Linux distributions configure PAM to log authentication failures with LOG_WARNING (severity 4) rather than LOG_ERR. Understanding syslog facility/severity codes (0-7) is essential for accurate SIEM parsing.")

Q("mcq-4-012", "4.2", "single-choice",
  "A security analyst reviews NetFlow data and identifies a workstation that sent 2 GB of data to a remote IP in Russia between 2:00 AM and 4:00 AM. The remote IP has no prior history. Which additional NetFlow attribute would BEST confirm exfiltration?",
  "A workstation sent 2 GB to a remote Russian IP at 2-4 AM. The remote IP has no prior history.",
  [
    ("The flow uses a non-standard destination port (TCP 4444) and the transfer occurred outside of business hours", "Non-standard ports and off-hours transfers are strong behavioral indicators of data exfiltration."),
    ("The source workstation has high CPU usage during the transfer period", "CPU usage is not captured in NetFlow data; NetFlow captures IPs, ports, protocols, and byte counts."),
    ("The researcher's account shows a concurrent interactive login during the transfer", "NetFlow does not capture authentication data."),
    ("The destination IP is in the same /24 subnet as a legitimate business partner", "This would reduce suspicion, not confirm exfiltration."),
  ], "a", 1,
  "NetFlow records include IP, ports, protocol, packet count, byte count, and timestamps. For exfiltration detection, analysts look for unusual destination countries, non-standard ports, off-hours transfers, and disproportionate data volumes.")

Q("mcq-4-013", "4.2", "multiple-choice",
  "A security analyst configures an ELK stack to parse application logs. The Logstash grok filter fails on lines like '2024-03-15 14:30:22 ERROR auth_user[1423]: Login failed for user admin from IP 10.0.0.5'. Which two grok patterns would correctly parse this log line? (Select TWO.)",
  "A security analyst configures Logstash to parse application logs. The grok filter fails on a specific log line format.",
  [
    ("%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:log_level} %{WORD:process}\\[%{NUMBER:pid}\\]: %{GREEDYDATA:message}", "This correctly captures ISO8601 timestamps, log levels, process names, PIDs, and the remaining message."),
    ("%{DATA:timestamp} %{WORD:level} %{USERNAME:app}\\[%{INT:pid}\\]:%{GREEDYDATA:msg}", "DATA is too permissive for ISO timestamps and USERNAME may fail on underscores in process names."),
    ("%{SYSLOGTIMESTAMP:timestamp} %{LOGLEVEL:log_level} %{WORD:process}\\[%{NUMBER:pid}\\]: %{IP:client_ip}", "SYSLOGTIMESTAMP does not match ISO 8601 timestamps. This pattern would fail on the timestamp field."),
    ("%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:log_level} %{WORD:process}\\[%{INT:pid}\\]: Login failed for user %{USERNAME:user} from IP %{IP:client_ip}", "This captures the full structured data with high specificity, avoiding greedy matching issues."),
  ], ["a", "d"], 2,
  "Logstash grok filters parse unstructured log data. Pattern (a) captures key metadata using GREEDYDATA for flexibility. Pattern (d) extracts specific fields (username, IP) with higher precision.")

Q("mcq-4-014", "4.2", "single-choice",
  "A company must comply with PCI DSS requirement 10.7, retaining audit trail history for at least 12 months. The SIEM team configures Elasticsearch hot/warm/cold storage tiers. After 14 months, logs from month 10 are unsearchable. What is the MOST likely cause?",
  "A company configures Elasticsearch hot/warm/cold storage for PCI DSS compliance. After 14 months, logs from month 10 are unsearchable.",
  [
    ("The cold storage node was configured with snapshot lifecycle management that deleted indices older than 12 months", "If the SLM policy deleted indices at 12 months instead of transitioning to frozen/archive storage, month 10 data would be permanently removed."),
    ("The logs were corrupted during the transition from warm to cold storage", "Corruption would be detected by Elasticsearch index health checks."),
    ("The hard drive on the cold storage node failed and RAID reconstruction is in progress", "A failed disk would affect all cold data, not just month 10."),
    ("The Elasticsearch cluster ran out of disk space and initiated shard deletion for the oldest indices", "Elasticsearch does not automatically delete shards due to disk space."),
  ], "a", 1,
  "Elasticsearch Snapshot Lifecycle Management (SLM) automates index deletion. If configured for 12-month deletion rather than transitioning to frozen tier, data is permanently removed. PCI DSS requires 12 months of retained logs.")

Q("mcq-4-015", "4.2", "single-choice",
  "A security auditor requires proof that log files collected from 50 Linux servers have not been modified since collection. The current syslog-ng setup writes logs to rotating files. Which enhancement BEST provides non-repudiation of log integrity?",
  "A security auditor requires proof that Linux syslog logs have not been modified since collection. The current setup writes syslog-ng to rotating files.",
  [
    ("Configure syslog-ng to sign each log line with an HMAC-SHA256 key stored in a hardware security module (HSM)", "HMAC-based signing provides cryptographic proof of integrity and non-repudiation when the key is secured in an HSM."),
    ("Store logs on a RAID 6 array to protect against disk failure", "RAID protects against disk failure but does not provide cryptographic integrity verification."),
    ("Enable syslog-ng disk-based buffering to prevent log loss during network outages", "Disk buffering improves reliability but does not provide integrity verification."),
    ("Set the log files to read-only with chmod 444 after rotation", "File permissions can be changed by any root user and do not provide cryptographic proof."),
  ], "a", 1,
  "Non-repudiation requires cryptographic verification. HMAC-SHA256 signing provides integrity verification, key management through HSM, and non-repudiation. Alternatives include WORM storage and signed syslog formats.")

Q("mcq-4-016", "4.2", "single-choice",
  "A Splunk analyst needs to find all instances where the Windows Task Scheduler created a new task on domain controllers. Event ID 4698 (scheduled task created) should be searched in the 'wineventlog' index. Which Splunk SPL query accomplishes this while showing task name and command?",
  "A Splunk analyst needs to find Event ID 4698 on domain controllers and see task name and command.",
  [
    ("index=wineventlog EventCode=4698 TaskName=* TaskCommand=* | table _time, host, TaskName, TaskCommand", "This query filters the index for Event ID 4698 and presents the relevant fields."),
    ("index=wineventlog EventID=4698 | table _time, host, EventData", "EventID is incorrect for this index; Splunk for Windows uses EventCode, not EventID."),
    ("index=wineventlog EventCode=4698 | search TaskName=* | fields TaskName, TaskCommand", "The search command after the pipe is redundant; filters should be in the base search for performance."),
    ("sourcetype=WinEventLog:Security EventID=4698 | table taskname, command", "Field names are case-sensitive and the Windows TA uses EventCode, not EventID."),
  ], "a", 1,
  "The correct SPL uses index=wineventlog EventCode=4698. Event ID 4698 tracks scheduled task creation. Event ID 4699 is task deletion, and 4700 is task enabled.")

# === OBJECTIVE 4.3 — SOAR & Orchestration (mcq-4-017 to mcq-4-024) ===

Q("mcq-4-017", "4.3", "single-choice",
  "A SOC uses a SOAR platform to automate phishing response. When a user clicks a phishing link and submits credentials on a fake login page, the playbook should isolate the workstation and reset the password. During a test, the playbook isolates the workstation but does NOT reset the password. What is the MOST likely playbook design flaw?",
  "A SOAR playbook for phishing response isolates the workstation but does not reset the password. The playbook uses a conditional block after setting the credential-theft indicator.",
  [
    ("The playbook branches on the phishing indicator alone, and the password-reset action is in a branch that only executes if a 'credential-theft' boolean is true", "If the playbook uses parallel branches, the password-reset branch depends on a boolean flag that was never set."),
    ("The API call to the identity provider timed out due to network latency", "API timeouts would generate an error and typically trigger a retry, which was not observed."),
    ("The SOAR platform lacks the correct IAM permissions to execute password resets", "Permission errors would generate an explicit failure response logged by the SOAR platform."),
    ("The user was already isolated by a previous playbook, so the password reset was skipped", "Playbooks execute independently; prior isolation does not prevent a password reset action."),
  ], "a", 1,
  "SOAR playbook logic often uses conditional branches based on indicators. The phishing indicator triggers isolation, but the credential-theft indicator may not have been set because the playbook only checked the URL, not the follow-on credential capture.")

Q("mcq-4-018", "4.3", "single-choice",
  "A SOC analyst configures a SOAR platform to ingest threat intelligence from AlienVault OTX, IBM X-Force, and a commercial STIX/TAXII feed. The SOAR generates many false positive alerts for IPs that appear in only one feed with low confidence scores. Which configuration change would BEST reduce false positives?",
  "A SOAR platform ingests threat intelligence from multiple feeds and generates many false positives for low-confidence, single-feed IOCs.",
  [
    ("Trigger only when the same IOC appears in at least two independent feeds with a confidence score above a defined threshold", "Cross-referencing multiple independent sources with a minimum confidence threshold filters out low-quality threat intelligence."),
    ("Remove all free threat intelligence feeds and use only the commercial STIX/TAXII feed", "Commercial feeds can also contain false positives; removing sources reduces coverage."),
    ("Increase the confidence score threshold for all feeds to 90%", "Blindly increasing thresholds may filter out legitimate threats reported at lower confidence levels."),
    ("Disable all automated playbooks and manually review each alert", "This defeats the purpose of SOAR automation."),
  ], "a", 1,
  "Threat intelligence quality management uses confidence scoring and source cross-referencing. The STIX/TAXII protocol provides standardized confidence and TLP markings.")

Q("mcq-4-019", "4.3", "multiple-choice",
  "A SOC manager designs a SOAR playbook for EDR IOCs. Which two triggers should be configured for FULL automation (no human approval required)? (Select TWO.)",
  "A SOC manager designs a SOAR playbook for EDR IOCs. Two trigger types should be fully automated.",
  [
    ("Isolation of a workstation confirmed to be communicating with a known C2 server in a threat intelligence feed", "Definitive C2 communication requires immediate containment. Automated isolation reduces dwell time."),
    ("Blocking an IP address on the firewall after 10 failed SSH attempts from that IP", "Failed logins may indicate brute-force or be caused by misconfigured services. This requires human review."),
    ("Password reset for a user whose credentials were found in a dark web credential dump", "Credential dumps may contain old or inaccurate data. Automated resets could lock out legitimate users."),
    ("Quarantining a file identified as malicious by three independent AV engines with 100% match", "Multi-engine consensus with unanimous detection provides high confidence. Automated quarantine prevents spread."),
  ], ["a", "d"], 2,
  "Full automation is appropriate when: the indicator is highly reliable, the action is reversible or low-risk, and speed is critical. Actions with potential business disruption typically require human approval.")

Q("mcq-4-020", "4.3", "single-choice",
  "A SOAR platform triages 200 alerts per hour using a priority matrix based on CVSS score and asset criticality. A medium-severity (CVSS 5.5) alert on an internet-facing web server gets LOW priority, while a low-severity (CVSS 3.0) alert on the same server gets HIGH priority. What BEST explains this?",
  "A SOAR assigns LOW priority to CVSS 5.5 but HIGH priority to CVSS 3.0 on the same internet-facing web server.",
  [
    ("The CVSS 3.0 alert corresponds to active exploitation in the wild, while the CVSS 5.5 has no known exploits — the SOAR integrates exploit intelligence into priority scoring", "SOAR platforms augment CVSS with threat intelligence such as CISA KEV, exploit availability, and active campaign data."),
    ("The CVSS 5.5 vulnerability was incorrectly scored and the SOAR should recalculate it", "The scenario describes intelligence-augmented prioritization, not CVSS recalculation."),
    ("The SOAR automation engine has a bug that reversed the priority assignments", "A bug is possible but less likely than intentional exploit-intelligence integration."),
    ("The medium severity vulnerability is in a compensating control so it is less relevant", "Compensating controls affect risk but do not explain why CVSS 3.0 would be prioritized over CVSS 5.5."),
  ], "a", 1,
  "Modern SOAR platforms integrate threat intelligence to augment CVSS scores with exploit context. A vulnerability with active exploitation poses an immediate threat superseding its base CVSS score.")

Q("mcq-4-021", "4.3", "single-choice",
  "A SOAR playbook enriches file hashes from email attachments by querying VirusTotal's API. After deployment, the SOC exceeds the VirusTotal free tier quota within two hours. Which design improvement BEST ensures continuous enrichment without exceeding API limits?",
  "A SOAR playbook queries VirusTotal API for file hash enrichment but exceeds the free tier quota within two hours.",
  [
    ("Implement a cache store that checks if the hash was already queried in the last 24 hours before making an API call", "Caching prevents redundant API calls for duplicated or re-sent attachments, the most common cause of quota exhaustion."),
    ("Upgrade to a VirusTotal Enterprise license with unlimited API calls", "Purchasing a higher tier addresses the symptom but caching reduces cost and API load."),
    ("Remove VirusTotal enrichment and rely on the email gateway's built-in reputation scoring", "Removing enrichment reduces detection capability."),
    ("Increase the playbook's timeout to wait longer for API responses", "Timeout settings do not affect API call volume."),
  ], "a", 1,
  "API rate limiting and quota management are essential SOAR design considerations. Caching hash-to-verdict mappings with appropriate TTL significantly reduces API calls while maintaining enrichment quality.")

Q("mcq-4-022", "4.3", "single-choice",
  "A SOAR playbook detects a compromised host using EDR signals and triggers network isolation via a switch management API. The playbook runs successfully, but the isolated host continues communicating with internal servers. What is the MOST likely cause?",
  "A SOAR playbook triggers network isolation via a switch API, but the isolated host continues communicating with internal servers.",
  [
    ("The playbook disabled the switch port but the host has a redundant network connection through a different switch that was not isolated", "Hosts with multiple NICs connected to different switches require all switch ports to be disabled."),
    ("The EDR agent failed to detect the C2 traffic after isolation", "EDR detection is not relevant to network isolation effectiveness."),
    ("The switch API call returned success but the ACL was applied to the wrong VLAN", "While possible, the redundant NIC scenario is a more common operational gap."),
    ("The host was already quarantined by the EDR agent before the SOAR action completed", "EDR quarantine does not explain why traffic continued after switch isolation."),
  ], "a", 1,
  "SOAR isolation playbooks must account for hosts with multiple network paths (dual NICs, cellular modems, virtual switches). The playbook should query the CMDB for all interfaces and disable all connected ports.")

Q("mcq-4-023", "4.3", "single-choice",
  "A SOAR integration with a cloud SIEM fails after the SIEM provider rotates API keys for routine security maintenance. The playbook runs but returns HTTP 401 errors. Which SOAR capability would have prevented this outage?",
  "A SOAR integration fails after the SIEM provider rotates API keys. The playbook returns 401 errors.",
  [
    ("A secrets management integration with HashiCorp Vault or AWS Secrets Manager that automatically retrieves the current API key", "Automated secrets management allows the SOAR to retrieve current API keys dynamically when rotated."),
    ("An API retry policy that resubmits failed requests after a 5-second delay", "Retry policies handle transient network errors, not authentication failures from credential changes."),
    ("A webhook that alerts the SOC when API calls return error codes", "Alerting detects the problem but does not prevent the outage."),
    ("A playbook test mode that validates API connectivity before execution", "Test mode would detect the failure but not resolve it."),
  ], "a", 1,
  "Secrets management integration prevents outages from credential rotation. Best practices include dynamic secrets with short TTLs and automated rotation that updates the vault before the old key expires.")

Q("mcq-4-024", "4.3", "multiple-choice",
  "A SOC designs a SOAR playbook for email quarantine. The playbook must analyze sender reputation, attachment hashes, and URL reputation before deciding delete/quarantine/deliver. Which two design principles minimize false positives? (Select TWO.)",
  "A SOC designs a SOAR playbook for email quarantine. It must analyze sender reputation, attachments, and URLs before deciding the action.",
  [
    ("Implement a weighted scoring system where each indicator contributes to a final risk score, and the action is determined by configurable thresholds", "Weighted scoring allows fine-tuning based on organizational risk tolerance."),
    ("Use a binary decision tree where any single malicious indicator triggers immediate deletion", "Binary decision trees with immediate deletion based on a single indicator generate excessive false positives."),
    ("Include a human-in-the-loop decision point when the risk score falls in a middle range that is neither clearly malicious nor clearly benign", "Gray-area decisions benefit from human analysis."),
    ("Deliver all messages with any benign indicator and only quarantine messages where ALL indicators are malicious", "This is too permissive — a single benign indicator should not override an overall malicious assessment."),
  ], ["a", "c"], 2,
  "Weighted scoring enables nuanced decision-making combining multiple risk factors. Human-in-the-loop for borderline cases reduces false positives while maintaining security.")

# === OBJECTIVE 4.4 — Incident Response (mcq-4-025 to mcq-4-032) ===

Q("mcq-4-025", "4.4", "single-choice",
  "A security analyst receives an EDR alert that a workstation is beaconing to a known C2 server every 60 seconds. The analyst isolates the workstation, captures memory and disk images, then rebuilds the workstation from a known-good image. Which NIST IR lifecycle phase is the analyst performing when rebuilding the workstation?",
  "A security analyst confirms a C2 beaconing alert, isolates the workstation, captures images, then rebuilds from a known-good image.",
  [
    ("Eradication — removing all traces of the incident by rebuilding the compromised system", "Eradication eliminates the root cause. Rebuilding from a known-good image removes malware and restores trust."),
    ("Recovery — returning the system to production operation", "Recovery follows eradication; rebuilding is part of eradication, bringing it online is recovery."),
    ("Containment — preventing the incident from spreading", "Containment (isolation) was performed earlier when the analyst isolated the workstation."),
    ("Post-Incident Activity — conducting a lessons-learned review", "Post-incident occurs after recovery and involves documentation and process improvement."),
  ], "a", 1,
  "The NIST SP 800-61 IR Lifecycle: (1) Preparation, (2) Detection & Analysis, (3) Containment, Eradication & Recovery, (4) Post-Incident Activity. Rebuilding is specifically Eradication within phase 3.")

Q("mcq-4-026", "4.4", "single-choice",
  "A company conducts an IR exercise where participants verbally describe their actions and decisions based on a pre-defined script without using live systems. What type of exercise is this?",
  "An IR exercise where participants verbally describe their response to a scenario without executing technical actions.",
  [
    ("Tabletop exercise — a discussion-based session where participants talk through their response without executing technical actions", "Tabletop exercises are discussion-based, focusing on roles, communications, and decision-making."),
    ("Functional exercise — a live simulation where participants execute actual response procedures", "Functional exercises involve actual execution of procedures in a simulated environment."),
    ("Full-scale exercise — a comprehensive, multi-agency exercise with live systems", "Full-scale exercises involve actual deployment of personnel and resources."),
    ("Walkthrough — a technical review of system configurations", "A walkthrough is a code or configuration review, not an IR exercise."),
  ], "a", 1,
  "The three IR exercise types are: Tabletop (discussion-based), Functional (hands-on with test systems), and Full-scale (comprehensive, multi-agency live exercise). Tabletop exercises are the most cost-effective way to test IR plans.")

Q("mcq-4-027", "4.4", "single-choice",
  "An organization's IR plan requires notifying law enforcement within 4 hours of confirming ransomware on critical infrastructure. The CISO delays notification by 6 hours to collect more evidence. Which IR plan component did the CISO violate?",
  "An IR plan requires law enforcement notification within 4 hours. The CISO delays by 6 hours for more evidence.",
  [
    ("The communication plan — specifically the external notification and escalation procedures with defined SLAs", "The communication plan defines who must be notified, by when, and by whom. Delaying violates defined SLAs."),
    ("The containment strategy — isolating affected systems to prevent spread", "Containment involves technical actions, not notification timelines."),
    ("The evidence preservation policy — collecting forensic data before remediation", "While evidence collection is important, the violation is of notification timelines."),
    ("The business continuity plan — maintaining operations during the incident", "BCP focuses on maintaining critical functions, not notification timelines."),
  ], "a", 1,
  "The IR plan's communication plan defines internal and external notification requirements with SLAs. Violating defined SLAs may have legal and regulatory consequences.")

Q("mcq-4-028", "4.4", "single-choice",
  "A forensic analyst uses 'dd if=/dev/sda of=/evidence/image.dd bs=4096 conv=noerror,sync' to image a hard drive. After completion, the SHA-256 hash of the original drive does not match the image hash. What is the MOST likely cause?",
  "An analyst runs dd with conv=noerror,sync. The source disk hash does not match the image hash.",
  [
    ("The 'conv=noerror,sync' option caused dd to pad unreadable sectors with zeros, altering the data from the original", "The noerror option continues on read errors, and sync pads failed blocks with zeros. This causes hash mismatch."),
    ("The dd command was used incorrectly — the if and of parameters were reversed", "If reversed, dd would have overwritten the source drive, an immediately catastrophic failure."),
    ("The SHA-256 hash was calculated on the image file instead of the device", "Hashing the image vs. device produces different results, but investigators typically hash both."),
    ("The block size of 4096 caused dd to skip the MBR/GPT partition table", "Block size does not affect whether dd reads the partition table."),
  ], "a", 1,
  "The conv=noerror,sync option handles bad sectors by padding with zeros. While this maintains correct image sizing, the padded zeros differ from original data, causing hash mismatch. Forensic documentation should note all read errors.")

Q("mcq-4-029", "4.4", "single-choice",
  "An incident responder arrives at a scene where a server is actively running ransomware. The responder needs to preserve volatile data. Which action should be performed FIRST?",
  "An incident responder arrives at a scene where a server is actively running ransomware. The responder needs to preserve volatile data.",
  [
    ("Capture the contents of volatile memory using a tool like memdump.exe or LiME before any other action", "Memory contains running processes, encryption keys, network connections, and the ransomware binary. Memory must be captured first."),
    ("Pull the power cable to instantly stop the encryption process", "Pulling power destroys volatile data and may corrupt disk writes. Not recommended."),
    ("Run 'netstat -an' to capture active network connections to a text file", "Running netstat changes system state and should only occur after memory capture."),
    ("Disconnect the network cable to prevent further C2 communication", "Disconnecting the network stops C2 but does not preserve the most volatile data."),
  ], "a", 1,
  "Order of Volatility (OOV): CPU registers > routing tables > process table/kernel memory > temporary files > disk > remote logs. Memory acquisition (RAM) must come before any action that alters system state.")

Q("mcq-4-030", "4.4", "multiple-choice",
  "During a ransomware incident affecting 50 workstations, the IR team disables non-essential network services on the floor switch instead of physically disconnecting each workstation, before evidence collection. Which TWO containment objectives is the team achieving with this switch-level approach? (Select TWO.)",
  "During a ransomware incident, the IR team disables services on the switch instead of disconnecting 50 workstations individually.",
  [
    ("Preventing lateral movement by segmenting the affected subnet from the rest of the network", "Switch-level ACLs isolate the compromised subnet, stopping the ransomware from spreading to other network segments."),
    ("Preserving forensic evidence on individual workstations by avoiding actions that alter system state", "Physical disconnection or power-off would alter volatile data. Switch isolation stops network traffic without changing the forensic state of each workstation."),
    ("Eradicating the ransomware by removing malicious files from all 50 workstations", "Eradication requires removing malware from each system, which switch-level isolation does not accomplish."),
    ("Recovering encrypted files by initiating automated backup restoration", "File recovery is a separate recovery-phase action, not a containment objective."),
  ], ["a", "b"], 2,
  "Network segmentation as containment uses network infrastructure to isolate compromised subnets. This achieves two objectives: (1) stops lateral movement by blocking the propagation path, (2) preserves forensic evidence by avoiding power-off or physical disconnection. This approach is scalable for large incidents and enables remote forensic analysis through managed access rules.")

Q("mcq-4-031", "4.4", "single-choice",
  "After containing a web application breach caused by an unpatched SQL injection vulnerability in a custom application, the IR team needs permanent removal. Which action represents COMPLETE eradication?",
  "After containing a web application breach caused by SQL injection in a custom app, the IR team needs complete eradication.",
  [
    ("Patching the SQL injection vulnerability AND verifying all compromised data and backdoors are removed", "Eradication requires removing the root cause AND eliminating all persistence mechanisms."),
    ("Restoring the application from the last known-good backup", "Restoring from backup may reintroduce the vulnerability and does not remove attacker backdoors."),
    ("Changing all database passwords used by the application", "Password changes are recovery, not eradication. The SQLi vulnerability itself must be fixed."),
    ("Rebuilding the web server from a hardened image", "Rebuilding removes webshells but does not fix the application code vulnerability."),
  ], "a", 1,
  "Complete eradication requires removing root cause, eliminating all persistence mechanisms, and verifying the system is in a known-good state. NIST SP 800-61 emphasizes eradication is only complete when all threats are removed.")

Q("mcq-4-032", "4.4", "single-choice",
  "A post-incident review meeting 30 days after a data breach presents metrics (72-hour dwell time, 15-minute MTTD, 4-hour MTTR) and recommends implementing MFA. The root cause was a missing access control policy. Which NIST IR lifecycle phase is being performed?",
  "A post-incident review 30 days after a breach presents metrics, identifies root cause, and recommends MFA.",
  [
    ("Post-Incident Activity — the lessons-learned phase where the incident is analyzed and improvements are recommended", "Post-incident activity involves detailed review, metrics analysis, root cause identification, and improvement recommendations."),
    ("Recovery — returning systems to normal operations", "Recovery occurs immediately after eradication, not 30 days later."),
    ("Detection and Analysis — identifying and confirming the incident", "Detection occurs during the active incident, not in a review meeting."),
    ("Preparation — establishing policies and tools before an incident", "Preparation occurs before incidents. The post-incident review feeds into preparation."),
  ], "a", 1,
  "Post-Incident Activity (NIST SP 800-61 Phase 4) occurs 2-4 weeks after recovery. It involves lessons-learned, root cause analysis, metric review, and improvement recommendations that feed back into Preparation.")

# === OBJECTIVE 4.5 — Investigations (mcq-4-033 to mcq-4-040) ===

Q("mcq-4-033", "4.5", "single-choice",
  "A forensic analyst must collect evidence from a running, compromised Linux server. Which sequence represents the CORRECT order of volatility?",
  "A forensic analyst must collect evidence from a running, compromised Linux server following the correct order of volatility.",
  [
    ("RAM -> network connections -> running processes -> temporary files -> hard drive -> remote backups", "This follows the correct OOV: most volatile (RAM) to least volatile (archived data)."),
    ("Hard drive -> RAM -> network connections -> running processes -> temporary files -> remote backups", "Hard drive is less volatile than RAM; network connections are lost on power-off."),
    ("Remote backups -> hard drive -> temporary files -> running processes -> RAM -> network connections", "This is the reverse of the correct order."),
    ("Running processes -> hard drive -> RAM -> network connections -> temporary files -> remote backups", "RAM is more volatile than running processes."),
  ], "a", 1,
  "RFC 3227 Order of Volatility: (1) CPU registers/cache, (2) routing/ARP/process tables, (3) live network connections, (4) temporary files, (5) disk, (6) remote logs, (7) archival media.")

Q("mcq-4-034", "4.5", "single-choice",
  "A forensic analyst collects a hard drive from a suspected insider threat. The analyst documents everyone who handled the drive, when and why it was transferred, and secures it in a locked evidence locker. During legal proceedings, the defense argues evidence tampering. Which document BEST addresses this challenge?",
  "An analyst documents who handled the evidence, when, and why, and secures it. The defense challenges evidence integrity.",
  [
    ("The chain of custody form — documenting every transfer with date, time, purpose, and signatures", "Chain of custody provides a documented, auditable trail establishing that evidence was not tampered with."),
    ("The forensic report describing tools and methods used during analysis", "The forensic report describes analysis methodology, not evidence handling before analysis."),
    ("The incident response report describing the overall investigation", "The IR report covers the incident timeline but not detailed custody logs."),
    ("The evidence bag seal showing whether the bag was opened", "Evidence seals show if the container was opened but not who handled it or when."),
  ], "a", 1,
  "Chain of custody documents every transfer with: who transferred, who received, date/time, purpose, and signatures. Breaks can render evidence inadmissible under Daubert or Frye standards.")

Q("mcq-4-035", "4.5", "single-choice",
  "An organization issues a legal hold notice. A system administrator receives the notice but continues the standard 30-day log rotation, deleting logs that are 35 days old. What is the consequence?",
  "A system administrator receives a legal hold notice but continues standard log rotation, deleting logs that are 35 days old.",
  [
    ("The organization may face spoliation of evidence sanctions including adverse inference instructions or monetary penalties", "Spoliation is destruction of evidence relevant to litigation. Courts may impose adverse inference instructions, monetary sanctions, or default judgment."),
    ("There is no consequence because logs older than 30 days are outside the scope of the legal hold", "Legal holds apply to ALL relevant ESI regardless of retention policies."),
    ("The administrator should have deleted the logs before the legal hold was issued", "Deleting evidence before a hold may also be spoliation if litigation is foreseeable."),
    ("The organization only needs to preserve logs if a lawsuit is actually filed", "Legal holds begin when litigation is reasonably anticipated, not just when filed."),
  ], "a", 1,
  "A legal hold suspends normal retention policies for relevant ESI. Deleting evidence under a legal hold constitutes spoliation, resulting in court sanctions.")

Q("mcq-4-036", "4.5", "single-choice",
  "A forensic analyst needs to acquire a SATA hard drive from a powered-off Windows workstation used to access illegal content. Which acquisition method should be used?",
  "A forensic analyst needs to acquire a SATA hard drive from a powered-off Windows workstation.",
  [
    ("Remove the drive, connect it to a forensic write-blocker, attach to a forensic workstation, and create a bit-for-bit image using FTK Imager", "For powered-off systems, use a hardware write-blocker and create a forensic image (E01 or dd)."),
    ("Boot the workstation from a Linux live CD and use dd to image the drive to USB", "Booting from a live CD modifies system state and risks writing to the evidence drive."),
    ("Create a network-based image by connecting to the forensic server via crossover cable", "Network imaging requires the system to be running, changing system state."),
    ("Remove the drive and connect it directly to a forensic workstation without a write-blocker", "Connecting without a write-blocker allows the OS to write to the drive, contaminating evidence."),
  ], "a", 1,
  "Forensic acquisition best practices: hardware write-blocker, bit-for-bit imaging, forensic imaging tools (FTK Imager creates E01 with metadata and hashes), and hash verification.")

Q("mcq-4-037", "4.5", "multiple-choice",
  "A forensic analyst needs evidence from a live, critical Windows server that cannot be shut down. Which two acquisition methods should be prioritized? (Select TWO.)",
  "A forensic analyst needs evidence from a live, critical Windows server that cannot be shut down.",
  [
    ("Live memory acquisition using FTK Imager's memory capture or Dumplt to capture RAM before any other action", "Memory is the most volatile data and must be captured first."),
    ("Full disk imaging via network boot (PXE) to a forensic server", "Network boot requires a reboot, destroying volatile data. Not suitable."),
    ("Triage imaging of specific files and folders relevant to the investigation using PowerShell or a forensic tool", "Triage imaging collects key evidence without impacting the running system."),
    ("Shutting down the server gracefully and removing the hard drives for offline imaging", "The server cannot be shut down. Graceful shutdown also destroys volatile data."),
  ], ["a", "c"], 2,
  "Live forensics: capture volatile memory first, then perform triage collection of key files (registry hives, prefetch, event logs, $MFT). Full disk imaging requires shutdown, which is not an option here.")

Q("mcq-4-038", "4.5", "single-choice",
  "A security analyst needs to capture network traffic to investigate possible data exfiltration from workstation 10.0.1.50. The traffic crosses a core switch carrying all VLANs. Which packet capture approach is MOST appropriate?",
  "A security analyst needs to capture traffic from a specific workstation. The traffic crosses a core switch with all VLANs.",
  [
    ("Configure a SPAN/port mirror on the core switch to copy traffic from the workstation's access switch port, capture with Wireshark or tcpdump", "SPAN/port mirror copies traffic from specific ports without disrupting production traffic."),
    ("Install a network TAP inline between the workstation and the switch", "A TAP requires physical installation and a maintenance window, not ideal during an active investigation."),
    ("Run tcpdump directly on the workstation to capture its own traffic", "Running tcpdump on a suspect workstation alerts the attacker and risks evidence tampering."),
    ("Use Wireshark on the core switch's management interface to capture all VLAN traffic", "Capturing all VLAN traffic is unnecessary and may miss the specific workstation's traffic."),
  ], "a", 1,
  "Network forensics: SPAN/port mirror copies specific port traffic to a monitoring port without disrupting production. Filter to the target IP to minimize capture file size.")

Q("mcq-4-039", "4.5", "single-choice",
  "A forensic analyst has physical access to a seized, powered-on, passcode-locked iOS smartphone. Which acquisition method is MOST appropriate?",
  "A forensic analyst has physical access to a seized, powered-on, passcode-locked iOS smartphone.",
  [
    ("Check if the device supports logical acquisition via USB using Cellebrite UFED or GrayKey to bypass the lock screen on supported iOS versions", "Commercial forensic tools use available exploits to bypass iOS lock screens for logical or full file system acquisition."),
    ("Remove the NAND flash chip for chip-off acquisition", "Chip-off is invasive, destroys the device, and is rarely effective for iOS due to hardware encryption."),
    ("Guess the passcode by trying common PINs", "Guessing triggers device wipe after 10 failed attempts."),
    ("Perform JTAG acquisition by connecting to the test access port", "Modern iOS devices have locked bootloaders preventing JTAG access."),
  ], "a", 1,
  "Mobile forensics for iOS: (1) Logical acquisition via USB using exploits, (2) iCloud backup, (3) Full file system (requires jailbreak), (4) Chip-off/JTAG as last resort. Modern iOS uses Secure Enclave hardware encryption.")

Q("mcq-4-040", "4.5", "single-choice",
  "A forensic investigator needs to collect logs from a compromised AWS EC2 instance that was terminated by the attacker. The investigator has AWS account access. Which AWS feature should be used to recover the instance's logs?",
  "A forensic investigator needs logs from a compromised, terminated EC2 instance. The investigator has AWS account access.",
  [
    ("AWS CloudTrail logs and Amazon CloudWatch Logs — stored independently of the EC2 instance lifecycle", "CloudTrail records API calls (including termination), and CloudWatch stores instance logs that persist after termination."),
    ("The EC2 instance's system log (console output) accessible after termination", "Console output only contains early boot diagnostics, not detailed application logs."),
    ("An EBS snapshot of the root volume", "EBS snapshots persist if taken before termination, but are not automatically created."),
    ("The EC2 instance's instance metadata service (IMDS)", "IMDS is internal to running instances and inaccessible after termination."),
  ], "a", 1,
  "Cloud forensics: CloudTrail records API calls, CloudWatch stores instance logs independently of instance lifecycle. Key forensic sources for terminated instances.")

# === OBJECTIVE 4.6 — Digital Forensics Concepts (mcq-4-041 to mcq-4-048) ===

Q("mcq-4-041", "4.6", "single-choice",
  "In a data breach trial, the prosecution presents: (1) a printed log showing the defendant's IP, (2) expert testimony about the log format, (3) the actual hard drive with original logs. Which evidence types are represented?",
  "In a data breach trial: printed log showing IP, expert testimony, actual hard drive. Which evidence types?",
  [
    ("(1) Demonstrative — (2) Testimonial — (3) Real evidence", "Printed log is demonstrative (visual aid), expert testimony is testimonial (sworn statement), hard drive is real evidence (physical object)."),
    ("(1) Documentary — (2) Real — (3) Demonstrative", "Expert testimony is testimonial, not real evidence. Hard drive is real, not demonstrative."),
    ("(1) Real — (2) Documentary — (3) Testimonial", "Printed log is demonstrative, not real. Testimony is testimonial, not documentary."),
    ("(1) Testimonial — (2) Real — (3) Documentary", "Printed log is not testimonial. Hard drive is real, not documentary."),
  ], "a", 1,
  "Four evidence types: Real (physical objects), Documentary (writings/records), Demonstrative (visual aids), Testimonial (sworn statements). Understanding classification is critical for admissibility.")

Q("mcq-4-042", "4.6", "multiple-choice",
  "A forensic analyst examines a Windows 10 system for evidence of a portable application run from a USB drive that was never installed. Which two artifacts would contain evidence of execution? (Select TWO.)",
  "A forensic analyst needs to find evidence of a portable application run from USB on Windows 10 that was never installed.",
  [
    ("Prefetch files (.pf) recording application execution paths, run count, and last run time", "Prefetch files track executable launches regardless of installation status, including from removable media."),
    ("The Windows Installer cache (C:\\Windows\\Installer) storing MSI installation packages", "The Installer cache only contains MSI packages; portable apps that were never installed have no entries."),
    ("AmCache.hive storing execution artifacts for all PE files including portable executables", "AmCache records SHA-1 hashes and execution metadata for all PE-like files executed on the system."),
    ("The SAM registry hive storing local user account credentials", "SAM stores account data, not program execution artifacts."),
  ], ["a", "c"], 2,
  "Windows execution artifacts: Prefetch records exe launches with path and timestamps. AmCache.hive stores SHA-1 hashes and execution data for all PE files including portable executables from removable media.")

Q("mcq-4-043", "4.6", "single-choice",
  "A forensic analyst investigating a file exfiltration on NTFS needs to determine which files were accessed or deleted between 2:00 PM and 3:00 PM. Which NTFS artifact is BEST suited?",
  "A forensic analyst needs to determine which files were accessed or deleted on NTFS within a 1-hour window.",
  [
    ("The NTFS Change Journal ($UsnJrnl) recording every file and directory modification, creation, deletion, and access", "$UsnJrnl records all NTFS changes sequentially with timestamps, ideal for timeline analysis."),
    ("The Master File Table ($MFT) storing current file metadata", "$MFT shows current state but does not maintain a historical log of changes."),
    ("The Volume Shadow Copy (VSS) storing previous file versions", "VSS contains point-in-time snapshots but not a comprehensive log of all changes."),
    ("The $LogFile recording file system transactions for crash recovery", "$LogFile is primarily for crash recovery and harder to parse than $UsnJrnl."),
  ], "a", 1,
  "NTFS $UsnJrnl records: file creation, deletion, modification, access with USN_REASON constants and timestamps. It's stored in Extend\\$UsnJrnl with a 32 MB default maximum.")

Q("mcq-4-044", "4.6", "single-choice",
  "A Prefetch file for malware.exe shows last run time 2023-03-15 14:30 UTC. $MFT shows file created 2023-03-15 13:00 UTC and last modified 2023-03-14 10:00 UTC. What does this timeline indicate?",
  "Prefetch malware.exe: last run 03-15 14:30. $MFT: created 03-15 13:00, last modified 03-14 10:00.",
  [
    ("The file was created elsewhere and copied to this system on March 15. The modified timestamp reflects the original source time", "When a file is copied to NTFS, creation timestamp updates to copy time but last modified is preserved from source. Modified before creation indicates file originated elsewhere."),
    ("The file was created on March 14, modified on March 15, and executed on March 15", "$MFT creation is March 15 13:00, not March 14. Modified is BEFORE creation — only possible with file copy."),
    ("An attacker used timestomping to hide the execution time", "Timestomping modifies timestamps; creation after modification is a natural artifact of file copying."),
    ("The Prefetch file timestamp is unreliable", "Prefetch timestamps are reliable indicators of last execution time."),
  ], "a", 1,
  "NTFS timestamp behavior during copy: Creation -> current time, Last Modified -> preserved from source, Last Accessed -> current time. Modified-before-created indicates file origin from another system.")

Q("mcq-4-045", "4.6", "single-choice",
  "A forensic analyst investigates a system that may have executed a file from a spear-phishing email three days ago. Which registry-based artifact would provide evidence of execution time?",
  "A forensic analyst needs to find evidence of a malicious file's execution time from three days ago.",
  [
    ("The UserAssist key in NTUSER.DAT recording GUI-based program launches with count and last run timestamp", "UserAssist tracks GUI application launches via Windows Explorer with execution timestamps."),
    ("The Shimcache (AppCompatCache) key recording executable path and last modified timestamp", "Shimcache stores the file's last modified timestamp, not execution time. It updates at boot, not execution."),
    ("The RunMRU key recording programs run from the Start Menu Run dialog", "RunMRU only captures Start > Run launches, not email attachment executions."),
    ("The MUICache key recording application names for UI language caching", "MUICache stores display names without execution timestamps."),
  ], "a", 1,
  "UserAssist (HKCU\\...\\UserAssist\\{GUID}\\Count) tracks GUI executions with path (ROT13-encoded), session count, and last run timestamp. Tools like RegRipper and Registry Explorer parse these entries.")

Q("mcq-4-046", "4.6", "multiple-choice",
  "A forensic analyst investigates fileless malware that executes only in memory via PowerShell. Which two artifacts would still contain evidence of execution? (Select TWO.)",
  "A forensic analyst investigates fileless malware that runs in-memory via PowerShell and never writes to disk.",
  [
    ("Windows Event Log (Event ID 4104 — PowerShell ScriptBlock Logging) capturing script content for in-memory execution", "If Script Block Logging is enabled, Event ID 4104 captures full script text for all PowerShell execution."),
    ("Prefetch files for powershell.exe showing execution timestamps even without malware on disk", "Fileless malware launched via PowerShell creates a Prefetch file for powershell.exe with execution timestamps."),
    ("The $MFT recording file metadata on disk", "Fileless malware writes no files to disk, so $MFT has no evidence of the payload."),
    ("The Windows Page File (pagefile.sys) containing remnants of scripts swapped from memory", "Pagefile may contain fragments but is less reliable than Event Log and Prefetch."),
  ], ["a", "b"], 2,
  "Fileless malware artifacts: Event ID 4104 captures PowerShell script content (if enabled). Prefetch records powershell.exe execution. Additional sources: Event ID 4688 with command-line logging, SRUM, and network captures.")

Q("mcq-4-047", "4.6", "single-choice",
  "Shimcache (AppCompatCache) shows a malicious executable with timestamp 2024-06-15. The system was last rebooted on 2024-06-20. The user claims they never ran the file. What can the analyst conclude?",
  "Shimcache shows a file with timestamp 2024-06-15. System last rebooted 2024-06-20. User denies running the file.",
  [
    ("The Shimcache timestamp reflects the file's last modified timestamp from $MFT, not execution time", "Shimcache stores the file's last modified timestamp from $MFT $FILE_NAME, NOT execution time. It updates at boot, not execution."),
    ("The user is lying — Shimcache directly records execution time", "Shimcache does NOT record execution time; it records file last modified timestamp."),
    ("The timestamp is from the BIOS clock and should be converted to UTC", "Shimcache timestamps use system local time."),
    ("The file was executed on June 15 and updated during the June 20 reboot", "Shimcache timestamp is the file's modified timestamp, not execution or boot time."),
  ], "a", 1,
  "Shimcache confusion: it stores executable paths with the file's last modified timestamp (from $MFT), not execution time. It cannot prove execution — Prefetch and UserAssist are better for execution evidence.")

Q("mcq-4-048", "4.6", "single-choice",
  "Multiple System32 executables have identical timestamps in $STANDARD_INFORMATION and $FILE_NAME (2024-07-04 03:00:00). However, $LogFile shows different values. What technique has been used?",
  "System32 executables have identical timestamps in $SI and $FN. $LogFile shows different values. What anti-forensic technique?",
  [
    ("Timestomping using SetMACE that modifies $SI timestamps but cannot alter $LogFile records", "Timestomping tools modify $MFT $STANDARD_INFORMATION timestamps but cannot retroactively alter transactional logs in $LogFile."),
    ("Windows Update bulk-updated all executables on July 4", "Windows Update causes legitimate timestamp updates. Different $LogFile values indicate tampering."),
    ("An antivirus scan modified the file timestamps during a scheduled scan", "Antivirus reads, not modifies, file timestamps."),
    ("The NTFS volume was compressed, causing timestamp normalization", "NTFS compression does not set all timestamps to an identical date across different executables."),
  ], "a", 1,
  "Timestomping modifies $SI timestamps. Detection: compare $SI, $FN, $LogFile, and $UsnJrnl timestamps. $LogFile preserves original timestamps before modification, providing definitive evidence of tampering.")

# === OBJECTIVE 4.8 — Security Tools (mcq-4-049 to mcq-4-056) ===

Q("mcq-4-049", "4.8", "single-choice",
  "A penetration tester runs 'nmap -sS -sV -O -p 1-10000 10.0.0.1'. All 10,000 ports show as 'filtered' but the web application is accessible via a browser. Why did Nmap report all ports as filtered?",
  "A tester runs 'nmap -sS -sV -O -p 1-10000 10.0.0.1'. All ports show filtered but web app is accessible via browser.",
  [
    ("A stateful firewall drops SYN packets (SYN scan) but allows established TCP connections — the browser uses an established connection", "A stateful firewall blocks unsolicited inbound SYN packets but allows traffic belonging to established connections."),
    ("The tester specified a port range that does not include port 80 or 443", "The range 1-10000 includes ports 80 and 443, and the browser accesses the app successfully."),
    ("Nmap's -O flag requires root privileges to function correctly", "Lack of root affects OS detection results, not port state reporting."),
    ("The target has a host-based firewall blocking the tester's IP", "If the tester's IP were blocked, the browser would also fail."),
  ], "a", 1,
  "Nmap port states: open (accepting), closed (RST received), filtered (firewall blocking probe). Stateful firewalls track connection state and block unsolicited SYN packets. TCP connect scan (-sT) may bypass some firewalls.")

Q("mcq-4-050", "4.8", "single-choice",
  "An analyst captures network traffic and sees HTTP POST requests with encrypted 200-400 byte payloads every 5 minutes to an external IP from one workstation. Which Wireshark filter BEST isolates this traffic?",
  "An analyst sees HTTP POST requests with small encrypted payloads every 5 minutes to an external IP from one workstation.",
  [
    ("http.request.method == POST and ip.src == 10.0.1.50 and ip.dst == 203.0.113.5", "This filter precisely captures POST method from the suspect workstation to the external IP."),
    ("tcp.port == 80 and ip.addr == 10.0.1.50", "This captures all port 80 traffic to/from the workstation, too broad."),
    ("http.request and ip.addr == 203.0.113.5", "This does not restrict to POST or the specific source workstation."),
    ("data.len > 100 and tcp.port == 80", "This captures any large HTTP payload, too broad."),
  ], "a", 1,
  "Wireshark display filters: http.request.method == POST targets specific HTTP methods. Combine with IP filters. C2/exfiltration patterns use periodic small POST requests.")

Q("mcq-4-051", "4.8", "single-choice",
  "An analyst uses tcpdump to capture suspicious traffic. The capture must include only TCP traffic to/from 10.0.1.50 on ports 80 and 443, saving to a file for analysis. Which tcpdump command accomplishes this?",
  "An analyst uses tcpdump to capture only TCP traffic to/from 10.0.1.50 on ports 80 and 443.",
  [
    ("tcpdump -i eth0 -w capture.pcap tcp and host 10.0.1.50 and (port 80 or port 443)", "This captures TCP traffic to/from the specified host on ports 80 and 443, writing to a pcap file."),
    ("tcpdump -i eth0 port 80 or port 443", "This captures all port 80/443 traffic, not filtered by host IP."),
    ("tcpdump -i eth0 -w capture.pcap host 10.0.1.50", "This captures all traffic to/from the host, including non-TCP protocols."),
    ("tcpdump -i eth0 -r capture.pcap tcp and host 10.0.1.50", "The -r flag reads from a file, not captures live traffic."),
  ], "a", 1,
  "tcpdump syntax: -i (interface), -w (write file), -r (read file). Berkeley Packet Filter (BPF) syntax: 'tcp and host X and (port Y or port Z)'.")

Q("mcq-4-052", "4.8", "multiple-choice",
  "A security analyst runs a Nessus vulnerability scan against a web server. The scan reports a 'Critical' vulnerability for Apache Struts2 with a CVSS score of 10.0. The development team confirms Apache Struts2 is NOT installed on the server. Which two actions should the analyst take? (Select TWO.)",
  "Nessus reports a Critical Apache Struts2 vulnerability on a web server. The dev team says Struts2 is not installed.",
  [
    ("Verify the Nessus plugin output to check whether the detection was based on a banner grab or actual exploitation attempt", "Banner-based detections can be false positives if the web server's banner is misleading or the plugin matched the wrong product."),
    ("Immediately patch the server as the scanner is highly accurate", "Ignoring the development team's input and patching a non-existent vulnerability is wasted effort."),
    ("Check if the server uses middleware or components that include the vulnerable Struts2 libraries", "Struts2 libraries might be bundled as transitive dependencies even if not directly installed."),
    ("Mark the vulnerability as accepted risk and close the ticket", "The vulnerability should be investigated, not simply accepted without verification."),
  ], ["a", "c"], 2,
  "Nessus uses plugin signatures including banner grabbing and version detection. False positives occur when banners are misleading. Verify by checking plugin details and examining if libraries are included via transitive dependencies.")

Q("mcq-4-053", "4.8", "single-choice",
  "A security team uses OpenVAS to scan internal network infrastructure. The scan completes but misses several known vulnerabilities on a legacy Windows Server 2008 R2 system. What is the MOST likely reason?",
  "OpenVAS scans internal infrastructure but misses known vulnerabilities on a legacy Windows Server 2008 R2 system.",
  [
    ("The target was not properly authenticated for the credentialed scan, preventing OpenVAS from performing local security checks", "Credentialed scans provide far deeper visibility by examining registry, file versions, and patch levels. Without credentials, OpenVAS only performs external checks that may miss OS-level vulnerabilities."),
    ("OpenVAS cannot detect vulnerabilities in Windows Server 2008 R2 because it is out of support", "OpenVAS can scan any OS; however, unauthenticated scans miss local vulnerabilities."),
    ("The scan was configured to only check for critical severity vulnerabilities", "Scan severity filters affect reporting but not detection; the scanner still checks for all vulnerabilities."),
    ("The network firewall blocked OpenVAS from reaching the target system", "If the firewall blocked access, no vulnerabilities would be detected at all."),
  ], "a", 1,
  "Credentialed (authenticated) vulnerability scans provide significantly more accurate results by allowing the scanner to examine the local system state. OpenVAS supports credentialed scanning via SMB, SSH, or local agent.")

Q("mcq-4-054", "4.8", "single-choice",
  "A security analyst uses Kismet to monitor wireless networks. During a site survey, Kismet detects an access point broadcasting a SSID that matches the company's guest network, but the signal strength is very weak and the BSSID does not match any known corporate AP. What type of threat does this MOST likely represent?",
  "Kismet detects an AP with the company's guest SSID but weak signal and unknown BSSID.",
  [
    ("An evil twin attack — a rogue access point impersonating the legitimate guest network to capture credentials", "An evil twin AP broadcasts the same SSID as a legitimate network but with a different BSSID. Kismet detects the discrepancy between SSID and known BSSID mappings."),
    ("A deauthentication attack targeting the guest network", "Deauth attacks send disassociation frames to disconnect clients but do not create new access points."),
    ("A PKI authentication bypass attempt", "PKI bypass is not related to rogue AP detection."),
    ("A Bluetooth relay attack exploiting the guest Wi-Fi", "Bluetooth relay is a different attack vector targeting Bluetooth, not Wi-Fi SSID impersonation."),
  ], "a", 1,
  "Kismet is a wireless sniffer/detector that identifies rogue APs by cross-referencing SSID with known BSSID MAC prefixes. An evil twin uses the same SSID to trick users into connecting. Detection methods include signal strength monitoring, BSSID verification, and 802.11 frame analysis.")

Q("mcq-4-055", "4.8", "multiple-choice",
  "A security analyst uses airodump-ng to capture WPA2 handshakes for a security assessment. The analyst later uses aircrack-ng with a wordlist but cannot crack the PSK. Which TWO factors could explain this failure? (Select TWO.)",
  "An analyst captures a WPA2 handshake with airodump-ng but cannot crack the PSK with aircrack-ng using a wordlist.",
  [
    ("The WPA2 passphrase does not appear in the wordlist — dictionary attacks only succeed if the passphrase is in the list", "aircrack-ng performs dictionary attacks against captured handshakes. If the passphrase was randomly generated or is complex, it will not be in any wordlist."),
    ("The captured handshake is missing one or more of the four EAPOL frames required for cracking", "aircrack-ng requires all four frames of the WPA2 4-way handshake. If airodump-ng missed frames due to weak signal or client disconnection, cracking is impossible."),
    ("The target network uses WPA3-Enterprise which prevents dictionary attacks on captured handshakes", "The scenario explicitly states WPA2. WPA3 uses SAE (Simultaneous Authentication of Equals) which is resistant to dictionary attacks, but this does not apply here."),
    ("The passphrase uses special characters that aircrack-ng cannot process", "aircrack-ng supports all ASCII and Unicode passphrases. Special characters do not affect its ability to compute the PMKID."),
  ], ["a", "b"], 2,
  "WPA2-PSK cracking with aircrack-ng requires: (1) a complete 4-way handshake (all four EAPOL frames), and (2) the passphrase must be in the wordlist. Two common failure modes are an incomplete capture (missing EAPOL frames due to weak signal or brief client association) and a passphrase absent from the wordlist. GPU-accelerated tools like Hashcat (mode 2500) can brute-force passphrases, but dictionary attacks remain limited to wordlist coverage.")

Q("mcq-4-056", "4.8", "single-choice",
  "A security analyst needs to audit password strength for a Windows Active Directory environment. The analyst has access to the NTDS.dit file and SYSTEM registry hive from a domain controller backup. Which tool should the analyst use to extract and crack the password hashes?",
  "An analyst has NTDS.dit and SYSTEM hive from a DC backup and needs to audit password strength.",
  [
    ("Use impacket-secretsdump to extract NTLM hashes from NTDS.dit, then use Hashcat with GPU acceleration to crack the hashes", "secretsdump extracts NTLM hashes from the NTDS.dit database using the SYSTEM hive's boot key. Hashcat cracks NTLM hashes efficiently using GPU acceleration."),
    ("Use aircrack-ng to capture authentication traffic from domain controllers", "aircrack-ng is a wireless tool and cannot extract or crack Windows NTLM hashes."),
    ("Use John the Ripper directly against NTDS.dit without extracting hashes first", "John the Ripper cannot parse NTDS.dit directly. The hashes must first be extracted using tools like secretsdump or DSInternals."),
    ("Use Nmap to enumerate user accounts and attempt password guessing", "Nmap can enumerate SMB users but cannot extract password hashes from NTDS.dit."),
  ], "a", 1,
  "Extracting AD password hashes: (1) Export NTDS.dit and SYSTEM hive from DC backup, (2) Use impacket-secretsdump (secretsdump.py -ntds NTDS.dit -system SYSTEM LOCAL) to extract NTLM hashes, (3) Crack with Hashcat (mode 1000 for NTLM) using GPU or John the Ripper. This is both a pentest technique and a defense audit method to identify weak passwords.")

# === Write to file ===
output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "lib", "server", "domain4-questions.json")
output_path = os.path.normpath(output_path)

with open(output_path, "w") as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

print(f"Generated {len(questions)} questions -> {output_path}")
