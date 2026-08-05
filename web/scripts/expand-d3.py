#!/usr/bin/env python3
"""Expand Domain 3 MCQs (+16: 3.1-3.4 each +4)."""
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
        "id": id_, "domain": 3, "objective": obj, "format": "scenario",
        "prompt": prompt, "context": context, "kind": kind, "options": options,
        "correctOptionIds": correct, "selectCount": sel,
        "explanation": explanation, "sourceRefs": refs,
    }


R = lambda obj, src="study-guide", sec=None: [
    {"source": "exam-objectives", "section": f"Objective {obj}"},
    {"source": src, "section": sec or "Domain 3 - Security Architecture"},
]

NEW = []

# ---- 3.1 Architecture models (+4) ----
NEW.append(q("mcq-3-037", "3.1", "single-choice", 1,
    "A company moves its email, customer relationship management, and office productivity applications to a provider that manages the underlying infrastructure, platform, and application, delivering everything through a web browser. The company manages only user accounts and content. Which service model is this?",
    "A provider delivers email, CRM, and office apps via browser; the customer manages only accounts and content.",
    [opt("a", "Infrastructure as a Service (IaaS)", "IaaS provides raw compute/storage/network; the customer manages OS, runtime, and apps."),
     opt("b", "Platform as a Service (PaaS)", "PaaS provides a managed runtime and platform; the customer still builds/deploys applications."),
     opt("c", "Software as a Service (SaaS)", "Fully managed applications delivered over the web, with the customer managing only data and users, is SaaS."),
     opt("d", "Serverless", "Serverless is an execution model for customer code, not a delivered business application suite.")],
    ["c"],
    "SaaS delivers complete applications with the provider responsible for infrastructure, platform, and application layers. The customer's residual responsibilities are data, user access, and configuration — matching the scenario.",
    R("3.1")))

NEW.append(q("mcq-3-038", "3.1", "single-choice", 1,
    "An organization hosts a legacy application on-premises but bursts compute-heavy workloads to a public cloud provider during peak demand, using a VPN for connectivity. Which cloud deployment model does this describe?",
    "Legacy app on-premises; compute-heavy workloads burst to public cloud during peak demand over VPN.",
    [opt("a", "Public cloud", "Public cloud alone ignores the on-premises component."),
     opt("b", "Private cloud", "Private cloud is dedicated to one organization; the burst workloads run in shared public infrastructure."),
     opt("c", "Hybrid cloud", "Combining on-premises infrastructure with public cloud capacity, connected securely, is a hybrid cloud deployment."),
     opt("d", "Community cloud", "Community cloud is shared by several organizations with common interests, not a private-plus-public mix.")],
    ["c"],
    "Hybrid cloud = on-premises/private infrastructure plus public cloud, integrated and connected. Cloud bursting is a classic hybrid pattern: steady state on-prem, elasticity in the public cloud.",
    R("3.1")))

NEW.append(q("mcq-3-039", "3.1", "multiple-choice", 2,
    "A startup deploys its application as small, independently deployable services that communicate over APIs, each scaling separately. The team also provisions all cloud resources from version-controlled configuration files in a Git repository. Which TWO architecture practices are in use?",
    "Small independently deployable services communicating over APIs, each scaling separately; all cloud resources provisioned from version-controlled config.",
    [opt("a", "Microservices", "Independently deployable, separately scalable services communicating over APIs are microservices."),
     opt("b", "Monolithic architecture", "A monolith is a single deployable unit; the scenario explicitly describes independent services."),
     opt("c", "Infrastructure as code (IaC)", "Provisioning resources from version-controlled configuration files is infrastructure as code."),
     opt("d", "Virtual desktop infrastructure (VDI)", "VDI centralizes desktops; it is unrelated to application architecture."),
     opt("e", "Serverless", "No event-driven function execution model is described."),
     opt("f", "Vertical scaling", "Vertical scaling adds resources to a single instance; the services scale independently.")],
    ["a", "c"],
    "Microservices break applications into independently deployable, API-communicating services. Infrastructure as code (IaC) manages infrastructure through versioned, reviewable configuration — enabling repeatable, auditable provisioning.",
    R("3.1")))

NEW.append(q("mcq-3-040", "3.1", "single-choice", 1,
    "A hospital uses a cloud provider for its electronic health record (EHR) system. During a security review, the hospital's CISO notes the provider is responsible for the physical data centers, hypervisor, and network, while the hospital configures user access, encryption settings, and audit policies. Which concept does this division describe?",
    "Provider handles data centers, hypervisor, and network; hospital handles access, encryption settings, and audit policies.",
    [opt("a", "Shared responsibility model", "Cloud security obligations are divided between provider (security of the cloud) and customer (security in the cloud) — the shared responsibility model."),
     opt("b", "Zero Trust", "Zero Trust is an architecture philosophy, not the division of cloud obligations."),
     opt("c", "Defense in depth", "Defense in depth layers controls; it does not describe provider/customer division."),
     opt("d", "Segmentation", "Segmentation separates network zones; it is not the responsibility division.")],
    ["a"],
    "The shared responsibility model allocates cloud security duties: the provider secures the underlying infrastructure, and the customer secures what it controls (access, data, configuration, identities). The split varies by service model (IaaS/PaaS/SaaS).",
    R("3.1")))

# ---- 3.2 Security implications (+4) ----
NEW.append(q("mcq-3-041", "3.2", "single-choice", 1,
    "A security architect wants to prevent an attacker who compromises one application server from easily reaching other servers in the same tier. The architect creates separate network segments and restricts traffic between them so that only specific application-to-application flows are permitted. Which concept is being implemented?",
    "Separate segments with restricted inter-segment traffic so a compromised server cannot easily reach peers.",
    [opt("a", "Microsegmentation", "Dividing the network into fine-grained segments with per-flow allow rules limits east-west movement — microsegmentation."),
     opt("b", "North-south filtering", "North-south traffic enters/leaves the network; the scenario addresses server-to-server (east-west) movement."),
     opt("c", "Air gap", "An air gap is a complete physical/logical isolation, which would break required application flows."),
     opt("d", "Network address translation", "NAT rewrites addresses; it does not restrict inter-segment flows.")],
    ["a"],
    "Microsegmentation (often software-defined) creates granular security zones with explicit per-application allow rules, containing east-west lateral movement. It is a core Zero Trust architectural control.",
    R("3.2", "nist", "NIST SP 800-207 Zero Trust Architecture")))

NEW.append(q("mcq-3-042", "3.2", "single-choice", 1,
    "An organization's security team discovers that a container image pulled from a public registry contains a known vulnerable version of a library, and that the image was built from a Dockerfile that runs as root. Which TWO hardening steps address the root causes?",
    "A container image from a public registry contains a vulnerable library and runs as root.",
    [opt("a", "Scan images for known vulnerabilities before deployment", "Image scanning (e.g., Trivy, Grype) detects vulnerable dependencies before they run — addressing the vulnerable library."),
     opt("b", "Run containers as non-root users", "Running the container process as a non-root user limits the impact of a container compromise."),
     opt("c", "Disable the container runtime", "Disabling the runtime breaks the application entirely."),
     opt("d", "Remove the network from all containers", "Removing networking would break legitimate service communication."),
     opt("e", "Use only manually built images", "Manual builds do not guarantee security and are not a defined control."),
     opt("f", "Increase container memory limits", "Memory limits address resource exhaustion, not vulnerable code or root execution.")],
    ["a", "b"],
    "Container security requires scanning images for known CVEs and running with least privilege (non-root, read-only rootfs, dropped capabilities). These address the two root causes described: vulnerable dependencies and root execution.",
    R("3.2")))

NEW.append(q("mcq-3-043", "3.2", "single-choice", 1,
    "A water utility operates a SCADA system that controls pumps and valves. The system runs on legacy controllers that cannot be patched, and the vendor recommends the controllers never be directly reachable from the corporate network or the internet. Which architectural control is the vendor describing?",
    "Legacy SCADA controllers that cannot be patched should never be directly reachable from the corporate network or internet.",
    [opt("a", "Air gap with controlled data exchange", "Keeping unpatched industrial controllers off the corporate network/internet — physically or logically isolated with controlled data diodes or one-way gateways — is an air gap."),
     opt("b", "DMZ for web servers", "A DMZ fronts internet services; the controllers are not web services."),
     opt("c", "Load balancing", "Load balancing distributes traffic; it does not isolate legacy controllers."),
     opt("d", "Geo-replication", "Replication provides resilience, not isolation from the network.")],
    ["a"],
    "ICS/SCADA environments with unpatched, long-lifecycle controllers rely on air gaps and controlled one-way data exchange to remove attack surface. OT/IT segmentation, data diodes, and jump hosts are the standard protections.",
    R("3.2", "cisa", "CISA ICS/OT guidance")))

NEW.append(q("mcq-3-044", "3.2", "single-choice", 1,
    "An organization needs to give remote employees access to a small set of internal applications without placing those applications on the public internet or requiring a full VPN to the entire corporate network. Which technology fits this requirement BEST?",
    "Remote employees need access to a small set of internal apps without public exposure or full-network VPN.",
    [opt("a", "Zero Trust Network Access (ZTNA)", "ZTNA brokers access per application via an identity-aware proxy — no public exposure, no broad network access. It fits precisely."),
     opt("b", "Full-tunnel VPN", "A full-tunnel VPN exposes the entire corporate network, exceeding the requirement."),
     opt("c", "Port forwarding on the perimeter firewall", "Port forwarding exposes applications publicly, defeating the requirement."),
     opt("d", "Virtual desktop infrastructure", "VDI provides desktops, not targeted application access, and is heavier than needed.")],
    ["a"],
    "ZTNA (a Zero Trust access model) connects users to specific applications through an identity-aware proxy without exposing them publicly or granting general network access — the modern replacement for remote-access VPN for application-level access.",
    R("3.2", "nist", "NIST SP 800-207 Zero Trust Architecture")))

# ---- 3.3 Data protection (+4) ----
NEW.append(q("mcq-3-045", "3.3", "single-choice", 1,
    "A payment processor must store credit card numbers to handle refunds but wants to minimize PCI DSS compliance scope. The processor replaces card numbers with randomly generated values that are unique per transaction, and stores the mapping between the real number and the replacement in a highly secured vault. Which technique is this?",
    "A payment processor replaces card numbers with random unique values and stores the mapping in a secured vault to reduce PCI scope.",
    [opt("a", "Tokenization", "Replacing sensitive data with non-sensitive, randomly generated tokens, with the mapping secured separately, is tokenization — a PCI DSS-friendly technique."),
     opt("b", "Masking", "Masking partially obscures data (e.g., 4111-****-****-1234) but retains the full value; it does not remove the data from scope."),
     opt("c", "Encryption", "Encryption transforms data reversibly with a key but the encrypted value can be decrypted; PCI scope reduction specifically relies on tokenization's non-reversible tokens."),
     opt("d", "Hashing", "Hashing is one-way and not reversible for refunds; it cannot replace card numbers that must be retrieved.")],
    ["a"],
    "Tokenization substitutes sensitive values with non-sensitive tokens stored separately from the original data. Because tokens are not the real PAN and cannot be reversed without vault access, systems handling only tokens fall out of PCI DSS scope.",
    R("3.3")))

NEW.append(q("mcq-3-046", "3.3", "single-choice", 1,
    "A data analyst needs to use customer email addresses to join two databases for analysis, but the security team requires that the addresses not be recoverable from the analytic environment. Which technique satisfies this requirement?",
    "Joining databases on email addresses that must not be recoverable from the analytic environment.",
    [opt("a", "Hashing the email addresses with a salt", "Hashing (with salt) allows consistent joins on the same value while making the original unrecoverable — satisfying the requirement."),
     opt("b", "Encrypting the email addresses", "Encryption is reversible with the key; the requirement says not recoverable."),
     opt("c", "Masking the email addresses", "Masking keeps most of the value (e.g., j***@domain.com) and would still reveal partial PII."),
     opt("d", "Tokenization with reversible mapping", "A reversible mapping defeats the 'not recoverable' requirement.")],
    ["a"],
    "Salting and hashing pseudonymizes data: identical inputs hash identically (enabling joins), but the original value is computationally infeasible to recover. This is the standard approach for analytics on sensitive identifiers.",
    R("3.3")))

NEW.append(q("mcq-3-047", "3.3", "single-choice", 1,
    "A company deploys an agent on employee workstations that monitors files containing patterns matching social security numbers and credit card numbers, and blocks attempts to copy them to USB drives or email them externally. Which control is this?",
    "An endpoint agent detects files with SSN/CC patterns and blocks copying to USB or external email.",
    [opt("a", "Data loss prevention (DLP)", "Endpoint DLP inspects content on the device and enforces egress rules (USB, email) based on data patterns — data loss prevention."),
     opt("b", "Network access control (NAC)", "NAC controls device admission to the network, not data egress."),
     opt("c", "Intrusion prevention system (IPS)", "IPS inspects network traffic for attacks; the described control is content-based data protection."),
     opt("d", "Security information and event management (SIEM)", "SIEM aggregates and correlates logs; it does not block data egress.")],
    ["a"],
    "Endpoint DLP agents perform content inspection on the device and enforce policies on sensitive data movement — blocking USB copy, email, and other egress channels. Network DLP and storage DLP complement it.",
    R("3.3")))

NEW.append(q("mcq-3-048", "3.3", "single-choice", 1,
    "An organization's records management policy requires that audit logs be retained for seven years and be tamper-evident. The security team stores the logs on write-once, read-many (WORM) storage and hashes each log batch. Which data lifecycle concept is being addressed?",
    "Audit logs retained 7 years on WORM storage with hashing for tamper evidence.",
    [opt("a", "Data retention and preservation", "Retention policies specify how long data is kept; WORM storage and hashing preserve integrity during that period."),
     opt("b", "Data classification", "Classification labels data sensitivity; the scenario addresses retention duration and integrity."),
     opt("c", "Data sovereignty", "Sovereignty concerns jurisdictional storage location."),
     opt("d", "Data minimization", "Minimization limits collection; retention is about how long collected data is kept.")],
    ["a"],
    "Data retention defines how long records are kept and how they are preserved. WORM storage and cryptographic hashing ensure retained logs remain intact and tamper-evident for the full retention period — a compliance and forensics requirement.",
    R("3.3")))

# ---- 3.4 Resilience & recovery (+4) ----
NEW.append(q("mcq-3-049", "3.4", "single-choice", 1,
    "A company performs a full backup every Sunday night and differential backups every other night. On Thursday, the file server fails and must be restored from backups. Which backups are required for a complete restore?",
    "Full backup Sundays, differential backups other nights; restore after Thursday failure.",
    [opt("a", "Sunday full + Thursday differential only", "A differential backup contains all changes since the last full backup, so restoring the last full plus the latest differential is sufficient."),
     opt("b", "Sunday full + all differentials Monday through Thursday", "Differentials are cumulative; only the latest is needed, making earlier ones redundant."),
     opt("c", "Sunday full + Monday through Wednesday incrementals", "Incrementals are a different scheme; this scenario uses differentials."),
     opt("d", "Thursday differential only", "A differential alone cannot restore the full dataset; the full backup is required as the base.")],
    ["a"],
    "Differential backups capture all changes since the last full backup. Restore = last full + latest differential (2 tapes). Incremental backups, by contrast, would require the last full plus every incremental since it.",
    R("3.4")))

NEW.append(q("mcq-3-050", "3.4", "single-choice", 1,
    "An organization determines it can tolerate at most 4 hours of downtime for its order-processing system and at most 15 minutes of data loss. Which pair of metrics defines these requirements?",
    "Max 4 hours downtime tolerated; max 15 minutes of data loss tolerated.",
    [opt("a", "RTO = 4 hours; RPO = 15 minutes", "RTO is the maximum acceptable downtime to restore service; RPO is the maximum acceptable data loss (how far back recovery can go)."),
     opt("b", "RPO = 4 hours; RTO = 15 minutes", "These are swapped; RTO concerns downtime, RPO concerns data loss."),
     opt("c", "MTD = 15 minutes; MTTR = 4 hours", "MTD is maximum tolerable downtime (related to RTO); MTTR is the mean time to repair — a measured statistic, not a requirement."),
     opt("d", "SLE = 4 hours; ALE = 15 minutes", "SLE/ALE are risk formula values in monetary terms, not time requirements.")],
    ["a"],
    "RTO (recovery time objective) = max acceptable downtime (4h); RPO (recovery point objective) = max acceptable data loss (15 min). The RPO drives backup frequency: to lose at most 15 minutes, backups/replication must run at least that often.",
    R("3.4")))

NEW.append(q("mcq-3-051", "3.4", "single-choice", 1,
    "A financial firm requires near-continuous availability after a disaster, with systems continuously replicated to a secondary facility that is fully equipped and can take over within minutes. Which disaster recovery site type is this?",
    "Continuously replicated, fully equipped secondary facility that can take over within minutes.",
    [opt("a", "Hot site", "A hot site is continuously running with replicated data and can assume operations in minutes — matching the requirement."),
     opt("b", "Warm site", "A warm site has equipment ready but data is not current; takeover takes hours."),
     opt("c", "Cold site", "A cold site is empty space/facilities; restoration takes days."),
     opt("d", "Mobile site", "A mobile site is a portable facility (trailer) — slower to activate than a hot site.")],
    ["a"],
    "Hot sites maintain mirrored, continuously replicated environments that can resume operations within minutes. Warm sites need loading and configuration; cold sites need full build-out.",
    R("3.4")))

NEW.append(q("mcq-3-052", "3.4", "single-choice", 1,
    "A company's backup administrator takes a nightly snapshot of a database and stores it in the same storage array as the production database. After a ransomware attack encrypts the array, the backup is also unusable. Which change to the backup strategy would have prevented this outcome?",
    "Backups stored on the same storage array as production are encrypted by ransomware too.",
    [opt("a", "Store an immutable/offline copy of backups on separate media or an isolated system", "Immutable (write-once) or offline/air-gapped backups on separate infrastructure survive ransomware that encrypts the primary array — the key resilience control."),
     opt("b", "Increase the snapshot frequency", "More frequent snapshots on the same array are still encrypted by the same attack."),
     opt("c", "Use compression on the backups", "Compression saves space but does not protect against encryption of the array."),
     opt("d", "Encrypt the backups with the same key as production", "Shared-key encryption does not prevent ransomware from encrypting the backup files themselves.")],
    ["a"],
    "Ransomware resilience requires backups that the attacker cannot reach or modify: immutable storage (WORM/object locking), offline/air-gapped copies, or separate isolated backup infrastructure — plus tested restores.",
    R("3.4", "cisa", "CISA Ransomware Guidance")))

merge(load_bank(), new_mcqs=NEW)
