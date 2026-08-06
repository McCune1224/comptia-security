#!/usr/bin/env python3
"""Expand A+ 1201 Domain 4 MCQs (Virtualization and Cloud Computing): 16 total
(4.1 x8, 4.2 x8, incl. 2 multi-selects). All original scenario-format text."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import importlib

alib = importlib.import_module("aplus-lib")
load_bank, merge, opt = alib.load_bank, alib.merge, alib.opt


def q(id_, obj, kind, sel, prompt, context, options, correct, explanation):
    return {
        "id": id_, "domain": 4, "objective": obj, "format": "scenario",
        "prompt": prompt, "context": context, "kind": kind, "options": options,
        "correctOptionIds": correct, "selectCount": sel,
        "explanation": explanation, "sourceRefs": [
            {"source": "comptia", "section": f"Objective {obj}"},
            {"source": "professor-messer", "section": "220-1201 4.1/4.2 Virtualization & Cloud"},
        ],
    }


R = lambda obj: [{"source": "comptia", "section": f"Objective {obj}"},
                 {"source": "professor-messer", "section": "220-1201 4.1/4.2 Virtualization & Cloud"}]

NEW = []

# ── 4.1 Virtualization (8) ──────────────────────────────────────────────────
NEW.append(q("a1-4-001", "4.1", "single-choice", 1,
    "A technician is provisioning a new server that will run four virtual machines for a small business. The technician installs a hypervisor directly on the server hardware, with no host operating system underneath. Which hypervisor type is being deployed?",
    "A new server runs four VMs; the hypervisor is installed directly on the hardware with no host OS underneath.",
    [opt("a", "Type 2 hypervisor", "A Type 2 hypervisor runs as an application on top of a host operating system (e.g., VirtualBox, VMware Workstation)."),
     opt("b", "Type 1 hypervisor", "A Type 1 (bare-metal) hypervisor installs directly on the hardware and manages VMs without a host OS — the deployment described."),
     opt("c", "Container engine", "Containers share the host kernel rather than virtualizing hardware; no hypervisor is involved."),
     opt("d", "Emulator", "Emulators translate instructions for a different CPU architecture; a native hypervisor virtualizes the same architecture.")],
    ["b"],
    "Type 1 (bare-metal) hypervisors such as VMware ESXi, Microsoft Hyper-V, and Proxmox install directly on hardware and provide the VM management layer without a host OS. Type 2 hypervisors run inside a general-purpose OS."))
NEW.append(q("a1-4-002", "4.1", "single-choice", 1,
    "A support technician needs to create a full point-in-time copy of a virtual machine before applying a risky driver update, so the VM can be rolled back if the update fails. Which virtualization feature should the technician use?",
    "A VM needs a full point-in-time rollback point before a risky driver update.",
    [opt("a", "Snapshot", "A snapshot captures the VM's disk and memory state at a point in time, allowing a quick rollback — exactly the pre-update safety net described."),
     opt("b", "Live migration", "Live migration moves a running VM between hosts without downtime; it does not create a rollback point."),
     opt("c", "Resource pooling", "Resource pooling aggregates CPU/RAM/storage across hosts; unrelated to rollback."),
     opt("d", "Virtual switch", "A virtual switch forwards traffic between VMs and the network; unrelated to VM state.")],
    ["a"],
    "Snapshots save the VM state (disk and optionally memory) so you can revert after a failed change. Live migration, resource pooling, and virtual switching are management/network features, not rollback mechanisms."))
NEW.append(q("a1-4-003", "4.1", "single-choice", 1,
    "An administrator notices that a virtual machine on a shared host is consuming so much CPU that the other VMs on the same host have become sluggish. Which virtualization feature should be used to guarantee each VM a minimum amount of CPU capacity?",
    "One VM is starving other VMs of CPU on a shared hypervisor host.",
    [opt("a", "Sandboxing", "Sandboxing isolates a VM's processes for security; it does not guarantee CPU capacity."),
     opt("b", "Resource allocation/reservation", "Resource reservations guarantee a VM a minimum share of CPU, memory, or I/O, preventing one VM from starving its neighbors."),
     opt("c", "Snapshotting", "Snapshots capture state for rollback; unrelated to performance guarantees."),
     opt("d", "Virtual NIC teaming", "NIC teaming aggregates network interfaces for throughput/redundancy, not CPU guarantees.")],
    ["b"],
    "Resource allocation (reservations/limits/shares) lets an administrator guarantee minimum capacity or cap usage per VM. Without it, a runaway VM can degrade every other VM on the host."))
NEW.append(q("a1-4-004", "4.1", "multiple-choice", 2,
    "A security-conscious administrator plans to test untrusted software inside an isolated virtual machine that cannot affect the host or other VMs. Which TWO virtualization concepts are MOST directly related to this goal?",
    "Untrusted software will be tested in a VM that must not affect the host or other VMs.",
    [opt("a", "Sandboxing", "Running untrusted code in an isolated VM is sandboxing — the VM contains the software's effects."),
     opt("b", "Snapshot", "Snapshots aid rollback but do not themselves isolate the VM from the host."),
     opt("c", "Virtualization security/VM isolation", "Hypervisor isolation ensures a compromised guest cannot break out to the host or other guests."),
     opt("d", "Live migration", "Live migration moves VMs between hosts; it does not isolate untrusted code."),
     opt("e", "Resource pooling", "Resource pooling aggregates capacity; irrelevant to isolation.")],
    ["a", "c"],
    "Sandboxing uses VM isolation to contain untrusted software, and hypervisor-enforced isolation is the security property that makes the sandbox effective. Snapshots and migration are operational features; resource pooling is capacity management."))
NEW.append(q("a1-4-005", "4.1", "single-choice", 1,
    "A technician needs to move a running virtual machine from one hypervisor host to another with NO downtime while the server hosting a production application is being maintained. Which virtualization feature supports this?",
    "A running production VM must move between hosts with zero downtime during maintenance.",
    [opt("a", "Virtual machine migration (live migration)", "Live migration moves a running VM between hosts with no interruption — the maintenance-friendly option."),
     opt("b", "Snapshot", "Snapshots are rollback points; they do not move a VM to another host."),
     opt("c", "Cloning", "Cloning copies a VM to create an identical instance, but the original keeps running on the source host."),
     opt("d", "Virtual desktop infrastructure (VDI)", "VDI hosts user desktops as VMs; it is a deployment model, not a zero-downtime move tool.")],
    ["a"],
    "Live migration (vMotion/Live Migration) moves a running VM between hosts without downtime, enabling maintenance without service interruption."))
NEW.append(q("a1-4-006", "4.1", "single-choice", 1,
    "An organization provides each call-center employee with a remote virtual desktop that runs on a central server, so the company can centrally manage the OS and applications. Which virtualization technology is described?",
    "Call-center employees get centrally managed remote virtual desktops hosted on a server.",
    [opt("a", "Virtual desktop infrastructure (VDI)", "VDI hosts desktop operating systems as VMs on central servers; users connect remotely and IT manages them centrally."),
     opt("b", "Virtual network", "A virtual network interconnects VMs; it does not deliver desktops to users."),
     opt("c", "Storage virtualization", "Storage virtualization pools physical disks; unrelated to desktop delivery."),
     opt("d", "Application virtualization", "Application virtualization isolates individual apps, not full desktops.")],
    ["a"],
    "VDI runs desktop OS images on centralized servers (e.g., VMware Horizon, Citrix Virtual Apps and Desktops); users access them remotely and IT manages one gold image instead of many PCs."))
NEW.append(q("a1-4-007", "4.1", "single-choice", 1,
    "A hypervisor host has 64 GB of RAM installed and four VMs configured with 16 GB each. The administrator wants to run a fifth VM that also needs 16 GB, but only 8 GB is free. Which virtualization feature would allow the fifth VM to start by reclaiming unused memory from the other VMs?",
    "Four VMs use 16 GB each on a 64 GB host; a fifth VM needs 16 GB but only 8 GB is free.",
    [opt("a", "Memory overcommitment", "Memory overcommitment lets the hypervisor assign more memory to VMs than physically exists, reclaiming idle pages from guests — enabling the fifth VM."),
     opt("b", "Disk thin provisioning", "Thin provisioning grows virtual disks on demand; it does not free RAM."),
     opt("c", "VM cloning", "Cloning copies a VM; it does not create free memory."),
     opt("d", "Network address translation (NAT)", "NAT translates IP addresses; unrelated to memory.")],
    ["a"],
    "Memory overcommitment (ballooning, page sharing) lets a hypervisor run VMs whose total configured RAM exceeds physical RAM by reclaiming unused guest memory. Thin provisioning is the disk analog."))
NEW.append(q("a1-4-008", "4.1", "single-choice", 1,
    "A technician is explaining to a small business owner that a single physical server can run multiple isolated operating systems, reducing hardware costs. Which virtualization component directly controls and allocates the physical hardware among the guest OSes?",
    "A single physical server runs multiple isolated OSes; which component allocates physical hardware among guests?",
    [opt("a", "The hypervisor", "The hypervisor (VMM) directly controls and allocates CPU, memory, and I/O among guest VMs — the core of server virtualization."),
     opt("b", "The guest operating system", "Guest OSes run inside VMs and cannot directly allocate the physical hardware."),
     opt("c", "A virtual switch", "A virtual switch handles VM networking only."),
     opt("d", "A RAID controller", "A RAID controller manages physical disk arrays, not VM resource allocation.")],
    ["a"],
    "The hypervisor is the virtualization layer that partitions and allocates physical resources (CPU, RAM, storage, I/O) among the guest VMs running on the host.")),

# ── 4.2 Cloud computing (8) ─────────────────────────────────────────────────
NEW.append(q("a1-4-009", "4.2", "single-choice", 1,
    "A startup rents virtual servers, block storage, and a virtual network from a cloud provider and configures the operating systems and applications itself. Which cloud service model is the startup using?",
    "A startup rents virtual servers, block storage, and networking, and manages the OS/apps itself.",
    [opt("a", "Software as a Service (SaaS)", "SaaS provides a finished application; the customer does not manage the OS."),
     opt("b", "Platform as a Service (PaaS)", "PaaS provides a managed platform (runtime/database) but hides the underlying servers."),
     opt("c", "Infrastructure as a Service (IaaS)", "IaaS delivers raw compute, storage, and networking; the customer installs and manages the OS and applications — exactly this scenario."),
     opt("d", "Desktop as a Service (DaaS)", "DaaS delivers virtual desktops, not raw infrastructure.")],
    ["c"],
    "IaaS (AWS EC2, Azure VMs) provides virtualized infrastructure — compute, storage, networking — and the customer is responsible for the OS, middleware, and applications."))
NEW.append(q("a1-4-010", "4.2", "single-choice", 1,
    "A small law firm subscribes to a cloud email and document suite. The provider manages the application, data storage, and infrastructure, and the firm only manages its user accounts and content. Which cloud service model is this?",
    "A firm subscribes to a cloud email/docs suite; the provider manages app, storage, and infrastructure.",
    [opt("a", "Infrastructure as a Service (IaaS)", "IaaS would require the firm to manage the OS and apps itself."),
     opt("b", "Platform as a Service (PaaS)", "PaaS is a development platform; users build apps rather than consume a finished suite."),
     opt("c", "Software as a Service (SaaS)", "SaaS delivers a complete application over the internet (e.g., Microsoft 365, Google Workspace) — the provider runs everything, the customer manages accounts/content."),
     opt("d", "Community cloud", "Community cloud describes the deployment (shared by a community), not the service model.")],
    ["c"],
    "SaaS (Microsoft 365, Google Workspace, Salesforce) delivers finished applications; the provider handles infrastructure, platform, and app maintenance while the customer manages users and data."))
NEW.append(q("a1-4-011", "4.2", "single-choice", 1,
    "A hospital must keep sensitive patient data on its own premises for legal reasons, but wants to use a public cloud provider for non-sensitive development workloads. Which cloud deployment model combines these environments?",
    "A hospital keeps sensitive data on-premises for compliance but uses public cloud for dev workloads.",
    [opt("a", "Private cloud", "Private cloud is dedicated to one organization; it does not combine with a public provider."),
     opt("b", "Hybrid cloud", "Hybrid cloud combines private (on-premises) and public cloud environments, often with data remaining where required by compliance — exactly this mix."),
     opt("c", "Community cloud", "Community cloud is shared by several organizations with common interests, not a private/public mix."),
     opt("d", "Multi-cloud", "Multi-cloud uses multiple PUBLIC providers; it does not include on-premises infrastructure.")],
    ["b"],
    "Hybrid cloud = private/on-premises + public cloud, letting organizations keep sensitive data local while bursting dev workloads to the public cloud. Multi-cloud is multiple public providers; community cloud is shared by a group."))
NEW.append(q("a1-4-012", "4.2", "multiple-choice", 2,
    "A consultant lists the defining characteristics of cloud computing for a client. Which TWO characteristics are core cloud attributes?",
    "Which two are defining characteristics of cloud computing?",
    [opt("a", "Pay-as-you-go metered usage", "Cloud resources are metered and billed by consumption — a core cloud characteristic."),
     opt("b", "Self-service on-demand provisioning", "Users provision resources on demand without provider intervention — a core cloud characteristic."),
     opt("c", "A fixed, dedicated hardware footprint", "Clouds pool shared resources; a fixed dedicated footprint is the opposite of elasticity."),
     opt("d", "On-premises-only deployment", "Clouds are accessed over the network, not limited to on-premises."),
     opt("e", "Single-tenant hardware by default", "Cloud providers pool multi-tenant resources; single-tenant hardware is not a defining characteristic.")],
    ["a", "b"],
    "Core cloud characteristics include on-demand self-service, broad network access, resource pooling, rapid elasticity, and measured (metered) service. Fixed dedicated hardware and on-premises-only models contradict these."))
NEW.append(q("a1-4-013", "4.2", "single-choice", 1,
    "An accounting firm's workload has predictable peak usage at month end. The firm wants its cloud environment to automatically add virtual servers during the peak and remove them afterward, paying only for what is used. Which cloud characteristic enables this?",
    "A workload needs automatic server scaling up at month-end peaks and down afterward, billed by usage.",
    [opt("a", "Rapid elasticity", "Rapid elasticity automatically scales resources up/down to match demand — the month-end peak scenario."),
     opt("b", "Resource pooling", "Resource pooling shares infrastructure among tenants; it does not auto-scale."),
     opt("c", "Metered service", "Metered billing tracks usage but does not itself scale resources."),
     opt("d", "Broad network access", "Broad network access means resources are reachable over the network; unrelated to scaling.")],
    ["a"],
    "Rapid elasticity lets cloud resources scale out and in automatically with demand. Metered service bills for that usage; pooling and access are separate attributes."))
NEW.append(q("a1-4-014", "4.2", "single-choice", 1,
    "Two municipal agencies with identical compliance requirements decide to share a cloud infrastructure operated by a third party, solely for their joint use. Which cloud deployment model is this?",
    "Two agencies with identical compliance needs share a third-party-operated cloud for their joint use only.",
    [opt("a", "Public cloud", "Public cloud is open to the general public, not restricted to two agencies."),
     opt("b", "Community cloud", "Community cloud is shared by organizations with common interests/compliance needs, operated by a third party — exactly this."),
     opt("c", "Hybrid cloud", "Hybrid combines private and public; this is not a mixed deployment."),
     opt("d", "Private cloud", "Private cloud serves a single organization, not a shared community.")],
    ["b"],
    "Community cloud is a shared environment for organizations with common concerns (compliance, jurisdiction) — e.g., government agencies or healthcare bodies — operated by themselves or a third party."))
NEW.append(q("a1-4-015", "4.2", "single-choice", 1,
    "A business is evaluating a cloud provider and asks who is responsible for patching the operating system of the rented virtual servers. Under IaaS, which party is responsible for OS patching?",
    "Under IaaS, who is responsible for patching the guest OS of rented virtual servers?",
    [opt("a", "The cloud provider", "Under IaaS the provider maintains the physical infrastructure, not the guest OS."),
     opt("b", "The customer", "In IaaS the customer manages and patches the guest OS, middleware, and applications; the provider handles the physical layer."),
     opt("c", "The hypervisor vendor", "The hypervisor vendor supplies the virtualization layer; it does not patch the customer's guests."),
     opt("d", "A managed service provider contracted by the provider", "The provider's own contracts do not cover the customer's OS.")],
    ["b"],
    "Shared responsibility in IaaS: the provider secures the physical host and hypervisor; the customer patches and secures the guest OS, applications, and data."))
NEW.append(q("a1-4-016", "4.2", "single-choice", 1,
    "A sales team needs the same customer relationship management (CRM) application available from phones, tablets, and laptops with no local installation or server management. Which cloud service model fits BEST?",
    "A team needs the same CRM app on any device with no local install or server management.",
    [opt("a", "Infrastructure as a Service (IaaS)", "IaaS requires building and managing the application stack."),
     opt("b", "Platform as a Service (PaaS)", "PaaS is for developing apps, not consuming a ready-made CRM."),
     opt("c", "Software as a Service (SaaS)", "SaaS delivers the CRM over the web on any device with zero local installation or server management — the best fit."),
     opt("d", "Desktop as a Service (DaaS)", "DaaS provides desktops, not a specific business application.")],
    ["c"],
    "SaaS (e.g., Salesforce, Microsoft 365) delivers the finished application to any device via browser/client with the provider handling all infrastructure — the classic no-install CRM scenario.")),

merge(load_bank("1201"), "1201", new_mcqs=NEW)
