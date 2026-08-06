#!/usr/bin/env python3
"""Expand A+ 1201 PBQs: 20 total — D1 3, D2 5, D3 4, D4 2, D5 6.
Covers matching, ordering, configuration, evidence, numeric, multi-step,
fill-blank, and word-bank kinds. All original text."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import importlib

alib = importlib.import_module("aplus-lib")
load_bank, merge, opt = alib.load_bank, alib.merge, alib.opt

REFS = lambda obj, sec: [
    {"source": "comptia", "section": f"Objective {obj}"},
    {"source": "professor-messer", "section": sec},
]

NEW = []

# ── D1 Mobile Devices (3) ───────────────────────────────────────────────────
NEW.append({
    "id": "a1-pbq-1-001", "domain": 1, "objective": "1.2", "format": "pbq",
    "kind": "word-bank",
    "prompt": "A technician is connecting mobile devices for users. Complete each statement with the correct term.\n\n1. The ____ connection method is reversible and is the standard modern charging/data port on Android and Windows devices.\n2. The ____ connector is proprietary to Apple mobile devices.\n3. ____ allows two devices to exchange data when held a few centimeters apart.\n4. Sharing a phone's cellular data connection with a laptop over Wi-Fi is called ____.",
    "blanks": [
        {"id": "b1", "label": "Reversible modern port"},
        {"id": "b2", "label": "Apple proprietary connector"},
        {"id": "b3", "label": "Contactless short-range exchange"},
        {"id": "b4", "label": "Sharing cellular data over Wi-Fi"},
    ],
    "bank": [
        {"id": "w1", "word": "USB-C"},
        {"id": "w2", "word": "Lightning"},
        {"id": "w3", "word": "NFC"},
        {"id": "w4", "word": "tethering"},
        {"id": "w5", "word": "Bluetooth"},
        {"id": "w6", "word": "hotspot pairing"},
    ],
    "correctAssignments": {"b1": "w1", "b2": "w2", "b3": "w3", "b4": "w4"},
    "explanation": "USB-C is the reversible modern standard; Lightning is Apple's proprietary connector. NFC exchanges data over a few centimeters, and tethering shares a phone's cellular data connection with other devices.",
    "sourceRefs": REFS("1.2", "220-1201 1.2 Connecting Mobile Devices"),
})
NEW.append({
    "id": "a1-pbq-1-002", "domain": 1, "objective": "1.2", "format": "pbq",
    "kind": "matching",
    "prompt": "Match each mobile accessory to its primary purpose.",
    "premises": [
        {"id": "p1", "text": "Docking station"},
        {"id": "p2", "text": "Port replicator"},
        {"id": "p3", "text": "Stylus"},
        {"id": "p4", "text": "Trackpoint"},
        {"id": "p5", "text": "Drawing pad"},
    ],
    "targets": [
        {"id": "t1", "text": "Connects a laptop to multiple peripherals and power in one cradle"},
        {"id": "t2", "text": "Adds the laptop's common ports (USB, video, network) without a full dock"},
        {"id": "t3", "text": "Precision input on a touchscreen or digitizer"},
        {"id": "t4", "text": "Cursor control embedded in the keyboard"},
        {"id": "t5", "text": "Digitizer surface for sketching and signatures"},
    ],
    "extraTargets": [{"id": "t6", "text": "Wireless charging pad"}],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"},
    "explanation": "A docking station cradles the laptop with power and peripherals; a port replicator adds ports without a full dock. A stylus provides precision input, a trackpoint is the keyboard-embedded cursor control, and a drawing pad is a digitizer surface.",
    "sourceRefs": REFS("1.2", "220-1201 1.2 Mobile Device Accessories"),
})
NEW.append({
    "id": "a1-pbq-1-003", "domain": 1, "objective": "1.3", "format": "pbq",
    "kind": "fill-blank",
    "prompt": "Type the acronym that matches each definition.\n\n1. ____ — a programmable card profile built into a phone that can activate cellular service without a physical card.\n2. ____ — satellite-based positioning used by navigation apps.\n3. ____ — the platform IT uses to enroll, configure, and wipe corporate mobile devices.\n4. ____ — the ownership model where employees use their personal devices for work.",
    "blanks": [
        {"id": "b1", "label": "Programmable cellular profile", "placeholder": "Acronym", "acceptedAnswers": ["eSIM"]},
        {"id": "b2", "label": "Satellite positioning", "placeholder": "Acronym", "acceptedAnswers": ["GPS"]},
        {"id": "b3", "label": "Corporate mobile device platform", "placeholder": "Acronym", "acceptedAnswers": ["MDM"]},
        {"id": "b4", "label": "Personal devices for work", "placeholder": "Acronym", "acceptedAnswers": ["BYOD"]},
    ],
    "explanation": "eSIM is the embedded programmable SIM profile; GPS provides satellite positioning. MDM (mobile device management) enforces corporate policy and can remote-wipe; BYOD means employees use personal devices for work.",
    "sourceRefs": REFS("1.3", "220-1201 1.3 Mobile Device Management"),
})

# ── D2 Networking (5) ────────────────────────────────────────────────────────
NEW.append({
    "id": "a1-pbq-2-001", "domain": 2, "objective": "2.1", "format": "pbq",
    "kind": "matching",
    "prompt": "Match each protocol to its well-known port number.",
    "premises": [
        {"id": "p1", "text": "SSH"},
        {"id": "p2", "text": "SMTP"},
        {"id": "p3", "text": "HTTPS"},
        {"id": "p4", "text": "RDP"},
        {"id": "p5", "text": "DNS"},
    ],
    "targets": [
        {"id": "t1", "text": "22"},
        {"id": "t2", "text": "25"},
        {"id": "t3", "text": "443"},
        {"id": "t4", "text": "3389"},
        {"id": "t5", "text": "53"},
    ],
    "extraTargets": [{"id": "t6", "text": "445"}],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"},
    "explanation": "SSH uses 22 for encrypted remote shell, SMTP 25 for outgoing mail, HTTPS 443 for encrypted web, RDP 3389 for remote desktop, and DNS 53 for name resolution. SMB/CIFS uses 445.",
    "sourceRefs": REFS("2.1", "220-1201 2.1 Common Ports"),
})
NEW.append({
    "id": "a1-pbq-2-002", "domain": 2, "objective": "2.6", "format": "pbq",
    "kind": "ordering",
    "prompt": "A technician is setting up a new SOHO wireless router for a small office. Place the configuration steps in the correct order.",
    "items": [
        {"id": "i1", "text": "Connect the router's WAN port to the ISP modem and power it on"},
        {"id": "i2", "text": "Log in to the router's management interface with the default credentials"},
        {"id": "i3", "text": "Change the default administrator password"},
        {"id": "i4", "text": "Set the wireless network name (SSID) and enable WPA2/WPA3 security"},
        {"id": "i5", "text": "Update the router firmware"},
        {"id": "i6", "text": "Connect a client and verify internet access"},
    ],
    "correctOrder": ["i1", "i2", "i3", "i4", "i5", "i6"],
    "explanation": "Physical connection comes first, then management access, then security hardening (admin password, wireless encryption), firmware update, and finally verification. Changing the default admin password before configuring wireless prevents the router from being managed with default credentials.",
    "sourceRefs": REFS("2.6", "220-1201 2.6 SOHO Networks"),
})
NEW.append({
    "id": "a1-pbq-2-003", "domain": 2, "objective": "2.6", "format": "pbq",
    "kind": "configuration",
    "prompt": "A technician is securing a new SOHO wireless router. Configure each setting with the most secure option.",
    "fields": [
        {"id": "f1", "label": "Wireless security mode", "options": [
            {"id": "o1", "text": "WPA3"},
            {"id": "o2", "text": "WPA2"},
            {"id": "o3", "text": "WEP"},
            {"id": "o4", "text": "Open"},
        ]},
        {"id": "f2", "label": "SSID broadcast", "options": [
            {"id": "o1", "text": "Enabled"},
            {"id": "o2", "text": "Disabled"},
            {"id": "o3", "text": "Set to the default name"},
            {"id": "o4", "text": "Broadcast only during business hours"},
        ]},
        {"id": "f3", "label": "Default administrator password", "options": [
            {"id": "o1", "text": "Leave unchanged"},
            {"id": "o2", "text": "Change to a strong unique passphrase"},
            {"id": "o3", "text": "Change to the SSID"},
            {"id": "o4", "text": "Disable the password"},
        ]},
        {"id": "f4", "label": "Router firmware", "options": [
            {"id": "o1", "text": "Update to the latest vendor release"},
            {"id": "o2", "text": "Keep the factory version"},
            {"id": "o3", "text": "Install a custom third-party build"},
            {"id": "o4", "text": "Disable updates"},
        ]},
    ],
    "correctValues": {"f1": "o1", "f2": "o2", "f3": "o2", "f4": "o1"},
    "explanation": "WPA3 is the strongest wireless security; disabling SSID broadcast reduces casual discovery (though it is not real security). A strong unique admin password and current firmware close the most common SOHO router attack paths.",
    "sourceRefs": REFS("2.6", "220-1201 2.6 SOHO Networks"),
})
NEW.append({
    "id": "a1-pbq-2-004", "domain": 2, "objective": "2.6", "format": "pbq",
    "kind": "evidence",
    "prompt": "A user reports no internet access. The technician runs ipconfig and sees the output below. Which line is the strongest evidence that DHCP failed and the NIC fell back to link-local addressing?",
    "artifact": {
        "label": "ipconfig output (excerpt)",
        "format": "command-output",
        "lines": [
            {"id": "l1", "text": "IPv4 Address. . . . . . . . . . . : 169.254.10.42"},
            {"id": "l2", "text": "Subnet Mask . . . . . . . . . . : 255.255.0.0"},
            {"id": "l3", "text": "Default Gateway . . . . . . . . : 0.0.0.0"},
            {"id": "l4", "text": "Physical Address. . . . . . . . : 3C-97-0E-4B-11-2F"},
            {"id": "l5", "text": "DHCP Enabled. . . . . . . . . . : Yes"},
        ],
    },
    "selectCount": 1,
    "correctLineIds": ["l1"],
    "explanation": "An IPv4 address in the 169.254.x.x range is APIPA (Automatic Private IP Addressing) — the NIC self-assigned a link-local address because no DHCP server responded. The 0.0.0.0 gateway confirms there is no routable network path.",
    "sourceRefs": REFS("2.6", "220-1201 2.6 Assigning IP Addresses"),
})
NEW.append({
    "id": "a1-pbq-2-005", "domain": 2, "objective": "2.4", "format": "pbq",
    "kind": "word-bank",
    "prompt": "Complete each statement about network configuration concepts.\n\n1. A ____ record maps a hostname to an IPv6 address.\n2. A ____ record identifies the mail servers for a domain.\n3. A DHCP ____ guarantees a specific device always receives the same IP address.\n4. A ____ separates broadcast domains on a switch.\n5. A ____ provides an encrypted tunnel between two sites over the internet.",
    "blanks": [
        {"id": "b1", "label": "IPv6 address record"},
        {"id": "b2", "label": "Mail server record"},
        {"id": "b3", "label": "Fixed DHCP assignment"},
        {"id": "b4", "label": "Broadcast domain separator"},
        {"id": "b5", "label": "Encrypted site-to-site tunnel"},
    ],
    "bank": [
        {"id": "w1", "word": "AAAA"},
        {"id": "w2", "word": "MX"},
        {"id": "w3", "word": "reservation"},
        {"id": "w4", "word": "VLAN"},
        {"id": "w5", "word": "VPN"},
        {"id": "w6", "word": "CNAME"},
        {"id": "w7", "word": "scope"},
    ],
    "correctAssignments": {"b1": "w1", "b2": "w2", "b3": "w3", "b4": "w4", "b5": "w5"},
    "explanation": "AAAA maps names to IPv6 addresses and MX identifies mail servers. A DHCP reservation binds an IP to a MAC address; VLANs segment broadcast domains; VPNs encrypt traffic between sites. CNAME is an alias and a scope is the DHCP address pool.",
    "sourceRefs": REFS("2.4", "220-1201 2.4 DNS Configuration and DHCP"),
})

# ── D3 Hardware (4) ─────────────────────────────────────────────────────────
NEW.append({
    "id": "a1-pbq-3-001", "domain": 3, "objective": "3.2", "format": "pbq",
    "kind": "matching",
    "prompt": "Match each connector to its most common use.",
    "premises": [
        {"id": "p1", "text": "RJ-45"},
        {"id": "p2", "text": "HDMI"},
        {"id": "p3", "text": "SATA"},
        {"id": "p4", "text": "M.2"},
        {"id": "p5", "text": "RJ-11"},
    ],
    "targets": [
        {"id": "t1", "text": "Ethernet network cable (8P8C)"},
        {"id": "t2", "text": "Audio/video to a TV or monitor"},
        {"id": "t3", "text": "Internal storage drive data"},
        {"id": "t4", "text": "Small form-factor SSD (SATA or NVMe)"},
        {"id": "t5", "text": "Analog telephone line"},
    ],
    "extraTargets": [{"id": "t6", "text": "DisplayPort daisy-chaining"}],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"},
    "explanation": "RJ-45 terminates twisted-pair Ethernet; HDMI carries audio+video; SATA connects internal drives; M.2 is the small card slot for SATA/NVMe SSDs; RJ-11 is the 6-pin telephone connector.",
    "sourceRefs": REFS("3.2", "220-1201 3.2 Cables and Connectors"),
})
NEW.append({
    "id": "a1-pbq-3-002", "domain": 3, "objective": "3.8", "format": "pbq",
    "kind": "ordering",
    "prompt": "A laser printer is producing faded prints and the maintenance kit is due. Place the technician's maintenance steps in the correct order.",
    "items": [
        {"id": "i1", "text": "Power the printer off and unplug it"},
        {"id": "i2", "text": "Open the printer's access panels and remove the toner cartridge"},
        {"id": "i3", "text": "Replace the maintenance kit (fuser, rollers, and pickup assembly)"},
        {"id": "i4", "text": "Reinstall the toner cartridge and close the panels"},
        {"id": "i5", "text": "Plug the printer in, power it on, and run the calibration routine"},
        {"id": "i6", "text": "Print a test page and verify output quality"},
    ],
    "correctOrder": ["i1", "i2", "i3", "i4", "i5", "i6"],
    "explanation": "Always power down and unplug before opening a laser printer (the fuser gets very hot and there are high voltages). Remove the toner, swap the maintenance kit components, reassemble, calibrate, and verify with a test page.",
    "sourceRefs": REFS("3.8", "220-1201 3.8 Printer Maintenance"),
})
NEW.append({
    "id": "a1-pbq-3-003", "domain": 3, "objective": "3.4", "format": "pbq",
    "kind": "numeric",
    "prompt": "A server is built with three 1 TB drives in RAID 5. How many terabytes of usable storage capacity does the array provide (excluding RAID overhead)?",
    "unit": "TB",
    "correctValue": 2,
    "tolerance": 0,
    "explanation": "RAID 5 stripes data with distributed parity: one drive's worth of capacity is consumed by parity, so usable capacity = (n-1) × drive size = 2 × 1 TB = 2 TB. The array survives a single drive failure.",
    "sourceRefs": REFS("3.4", "220-1201 3.4 Storage Devices"),
})
NEW.append({
    "id": "a1-pbq-3-004", "domain": 3, "objective": "3.5", "format": "pbq",
    "kind": "configuration",
    "prompt": "A technician is configuring a new workstation in the UEFI setup utility. Configure each setting appropriately.",
    "fields": [
        {"id": "f1", "label": "Boot mode", "options": [
            {"id": "o1", "text": "UEFI"},
            {"id": "o2", "text": "Legacy BIOS"},
            {"id": "o3", "text": "Network boot only"},
            {"id": "o4", "text": "Disabled"},
        ]},
        {"id": "f2", "label": "Secure Boot", "options": [
            {"id": "o1", "text": "Enabled"},
            {"id": "o2", "text": "Disabled"},
            {"id": "o3", "text": "Enabled only for legacy OS"},
            {"id": "o4", "text": "Unavailable"},
        ]},
        {"id": "f3", "label": "Intel VT-x / AMD-V virtualization", "options": [
            {"id": "o1", "text": "Enabled"},
            {"id": "o2", "text": "Disabled"},
            {"id": "o3", "text": "Set to automatic"},
            {"id": "o4", "text": "Only for the OS"},
        ]},
        {"id": "f4", "label": "Boot order", "options": [
            {"id": "o1", "text": "Internal SSD first"},
            {"id": "o2", "text": "USB first"},
            {"id": "o3", "text": "Network first"},
            {"id": "o4", "text": "Optical drive first"},
        ]},
    ],
    "correctValues": {"f1": "o1", "f2": "o1", "f3": "o1", "f4": "o1"},
    "explanation": "Modern systems boot UEFI with Secure Boot enabled to prevent unauthorized boot code. Hardware virtualization (VT-x/AMD-V) must be on for hypervisors/VMs. The internal SSD should be first in boot order so the OS loads normally.",
    "sourceRefs": REFS("3.5", "220-1201 3.5 Motherboards and BIOS"),
})

# ── D4 Virtualization and Cloud (2) ─────────────────────────────────────────
NEW.append({
    "id": "a1-pbq-4-001", "domain": 4, "objective": "4.2", "format": "pbq",
    "kind": "matching",
    "prompt": "Match each cloud service model to its description.",
    "premises": [
        {"id": "p1", "text": "IaaS"},
        {"id": "p2", "text": "PaaS"},
        {"id": "p3", "text": "SaaS"},
        {"id": "p4", "text": "Hybrid cloud"},
        {"id": "p5", "text": "Community cloud"},
    ],
    "targets": [
        {"id": "t1", "text": "Rented virtual servers, storage, and networking; customer manages the OS"},
        {"id": "t2", "text": "Managed development platform with runtime and database services"},
        {"id": "t3", "text": "Finished application delivered over the internet"},
        {"id": "t4", "text": "Combines private/on-premises and public cloud"},
        {"id": "t5", "text": "Shared by organizations with common compliance needs"},
    ],
    "extraTargets": [{"id": "t6", "text": "A single tenant's dedicated hardware"}],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"},
    "explanation": "IaaS = raw infrastructure, PaaS = managed platform for developers, SaaS = finished app. Hybrid combines private+public; community cloud is shared by organizations with common interests or compliance requirements.",
    "sourceRefs": REFS("4.2", "220-1201 4.2 Cloud Models"),
})
NEW.append({
    "id": "a1-pbq-4-002", "domain": 4, "objective": "4.1", "format": "pbq",
    "kind": "word-bank",
    "prompt": "Complete each statement about virtualization.\n\n1. The ____ is the software layer that creates and runs virtual machines on physical hardware.\n2. A ____ is a point-in-time copy of a VM's state used for rollback.\n3. The ____ is the physical server that provides resources to virtual machines.\n4. Running untrusted software inside a VM so it cannot affect the host is called ____.\n5. Moving a running VM between hosts with no downtime is called ____.",
    "blanks": [
        {"id": "b1", "label": "VM management layer"},
        {"id": "b2", "label": "Rollback point"},
        {"id": "b3", "label": "Physical provider"},
        {"id": "b4", "label": "Containment of untrusted code"},
        {"id": "b5", "label": "Zero-downtime move"},
    ],
    "bank": [
        {"id": "w1", "word": "hypervisor"},
        {"id": "w2", "word": "snapshot"},
        {"id": "w3", "word": "host"},
        {"id": "w4", "word": "sandboxing"},
        {"id": "w5", "word": "live migration"},
        {"id": "w6", "word": "guest"},
        {"id": "w7", "word": "cloning"},
    ],
    "correctAssignments": {"b1": "w1", "b2": "w2", "b3": "w3", "b4": "w4", "b5": "w5"},
    "explanation": "The hypervisor manages VMs on the host. Snapshots enable rollback; sandboxing contains untrusted software; live migration moves VMs without downtime. The guest is the VM itself, and cloning creates an identical copy.",
    "sourceRefs": REFS("4.1", "220-1201 4.1 Virtualization"),
})

# ── D5 Troubleshooting (6) ───────────────────────────────────────────────────
NEW.append({
    "id": "a1-pbq-5-001", "domain": 5, "objective": "5.1", "format": "pbq",
    "kind": "evidence",
    "prompt": "A technician powers on a desktop and hears a repeating beep pattern from the speaker; the screen stays blank. Which line of evidence BEST indicates a RAM fault?",
    "artifact": {
        "label": "POST behavior log",
        "format": "log",
        "lines": [
            {"id": "l1", "text": "Repeating short beeps on power-on, no video output"},
            {"id": "l2", "text": "One short beep followed by normal boot"},
            {"id": "l3", "text": "Continuous long beeps, fans spin normally"},
            {"id": "l4", "text": "No beeps at all, power LED off"},
            {"id": "l5", "text": "Two short beeps then successful Windows load"},
        ],
    },
    "selectCount": 1,
    "correctLineIds": ["l1"],
    "explanation": "On most boards, repeating short beeps indicate a memory (RAM) failure during POST. One short beep is the normal 'all clear', and no beeps with no power LED points to a power problem instead.",
    "sourceRefs": REFS("5.1", "220-1201 5.1 Troubleshooting Hardware"),
})
NEW.append({
    "id": "a1-pbq-5-002", "domain": 5, "objective": "5.5", "format": "pbq",
    "kind": "multi-step",
    "context": "A workstation in a small office lost all network connectivity. The technician follows a structured diagnosis.",
    "steps": [
        {
            "id": "s1", "domain": 5, "objective": "5.5", "format": "pbq",
            "kind": "single-choice",
            "prompt": "Step 1: The technician first checks the patch cable and sees the NIC's link LED is dark. What does this indicate?",
            "options": [
                {"id": "a", "text": "The NIC has no active physical link", "rationale": "A dark link LED means no link signal is being received — a physical layer problem."},
                {"id": "b", "text": "The NIC is operating normally", "rationale": "A normal link shows a lit (or blinking) link LED."},
                {"id": "c", "text": "DNS resolution failed", "rationale": "DNS failures do not affect the link LED."},
                {"id": "d", "text": "The OS firewall blocked traffic", "rationale": "Firewall rules do not extinguish the link LED."},
            ],
            "correctOptionIds": ["a"],
            "selectCount": 1,
            "explanation": "A dark link LED means no physical link (cable, port, or NIC).",
            "sourceRefs": REFS("5.5", "220-1201 5.5 Troubleshooting Networks"),
        },
        {
            "id": "s2", "domain": 5, "objective": "5.5", "format": "pbq",
            "kind": "single-choice",
            "prompt": "Step 2: The technician reseats the cable in a different wall port and the link LED lights up, but the workstation still cannot reach the internet. Which command should be run NEXT to test the default gateway?",
            "options": [
                {"id": "a", "text": "ping <gateway IP>", "rationale": "Pinging the default gateway tests local routing before moving to external connectivity."},
                {"id": "b", "text": "ipconfig /release", "rationale": "Releasing the lease would drop the working IP assignment."},
                {"id": "c", "text": "tracert -d to the ISP", "rationale": "Tracing to the ISP skips the gateway hop test."},
                {"id": "d", "text": "netstat -a", "rationale": "netstat shows connections, not reachability of the gateway."},
            ],
            "correctOptionIds": ["a"],
            "selectCount": 1,
            "explanation": "Ping the gateway first to isolate whether the problem is local routing or beyond.",
            "sourceRefs": REFS("5.5", "220-1201 5.5 Troubleshooting Networks"),
        },
        {
            "id": "s3", "domain": 5, "objective": "5.5", "format": "pbq",
            "kind": "single-choice",
            "prompt": "Step 3: The gateway responds, but pinging a public IP address fails while pinging a public hostname also fails. What is the MOST likely remaining fault?",
            "options": [
                {"id": "a", "text": "The DNS server is unreachable", "rationale": "Both name and IP pings fail, so name resolution is not the bottleneck — the fault is upstream routing."},
                {"id": "b", "text": "The workstation's subnet mask is wrong", "rationale": "A wrong mask would break gateway reachability, which worked."},
                {"id": "c", "text": "The ISP link is down or the WAN is unplugged", "rationale": "Gateway works but nothing beyond it resolves or answers — the WAN/ISP path is down."},
                {"id": "d", "text": "The switch port is administratively down", "rationale": "A down switch port would have failed the link test in step 1."},
            ],
            "correctOptionIds": ["c"],
            "selectCount": 1,
            "explanation": "Local routing works (gateway answers) but all external traffic fails — the fault is on the WAN/ISP side.",
            "sourceRefs": REFS("5.5", "220-1201 5.5 Troubleshooting Networks"),
        },
    ],
    "explanation": "The layered approach — physical link first, then gateway, then external path — isolates the fault quickly. A dark link LED is a physical layer issue; gateway success with external failure points to the WAN/ISP link.",
    "sourceRefs": REFS("5.5", "220-1201 5.5 Troubleshooting Networks"),
})
NEW.append({
    "id": "a1-pbq-5-003", "domain": 5, "objective": "5.2", "format": "pbq",
    "kind": "ordering",
    "prompt": "A company is retiring drives that contained sensitive data. Place the data destruction steps in the correct order.",
    "items": [
        {"id": "i1", "text": "Back up any data still needed from the drives"},
        {"id": "i2", "text": "Overwrite the drives with a secure erase utility"},
        {"id": "i3", "text": "Degauss magnetic drives to destroy the platters' magnetic field"},
        {"id": "i4", "text": "Physically shred or incinerate the drives"},
        {"id": "i5", "text": "Document the destruction with serial numbers and certificates"},
        {"id": "i6", "text": "Verify no drive is readable before disposal"},
    ],
    "correctOrder": ["i1", "i2", "i3", "i4", "i5", "i6"],
    "explanation": "Preserve needed data first, then destroy: overwrite, then degauss (magnetic media), then physical destruction, then verify and document. Verification before disposal catches incomplete destruction.",
    "sourceRefs": REFS("5.2", "220-1201 5.2 Troubleshooting Storage"),
})
NEW.append({
    "id": "a1-pbq-5-004", "domain": 5, "objective": "5.6", "format": "pbq",
    "kind": "ordering",
    "prompt": "A laser printer reports a paper jam. Place the technician's response steps in the correct order.",
    "items": [
        {"id": "i1", "text": "Open the printer's jam-access panels following the on-screen diagram"},
        {"id": "i2", "text": "Remove the jammed paper gently in the direction of paper travel"},
        {"id": "i3", "text": "Inspect the rollers and pickup assembly for wear or debris"},
        {"id": "i4", "text": "Clear any torn fragments from the paper path"},
        {"id": "i5", "text": "Close the panels and press Resume"},
        {"id": "i6", "text": "Print a test page and confirm the jam does not recur"},
    ],
    "correctOrder": ["i1", "i2", "i3", "i4", "i5", "i6"],
    "explanation": "Open the jam access, remove paper in the direction of travel (never force it backward), inspect for debris and worn rollers, clear fragments, resume, then verify with a test page.",
    "sourceRefs": REFS("5.6", "220-1201 5.6 Troubleshooting Printers"),
})
NEW.append({
    "id": "a1-pbq-5-005", "domain": 5, "objective": "5.1", "format": "pbq",
    "kind": "matching",
    "prompt": "Match each symptom to its MOST likely hardware cause.",
    "premises": [
        {"id": "p1", "text": "Loud clicking or grinding from the drive bay"},
        {"id": "p2", "text": "Laptop screen is dim but faint image is visible"},
        {"id": "p3", "text": "Random shutdowns under load, system is very hot"},
        {"id": "p4", "text": "System date resets every time the PC is unplugged"},
        {"id": "p5", "text": "Repeating beeps at POST with no video"},
    ],
    "targets": [
        {"id": "t1", "text": "Failing HDD read/write heads"},
        {"id": "t2", "text": "Failed display backlight/inverter"},
        {"id": "t3", "text": "Overheating CPU (fans/heat sink clogged)"},
        {"id": "t4", "text": "Dead CMOS battery"},
        {"id": "t5", "text": "Faulty RAM module"},
    ],
    "extraTargets": [{"id": "t6", "text": "Defective power cord"}],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"},
    "explanation": "Clicking/grinding = failing HDD heads; a dim-but-visible screen = backlight/inverter failure; heat-related shutdowns = cooling failure; date resets = dead CMOS battery; POST beeps with no video = RAM fault.",
    "sourceRefs": REFS("5.1", "220-1201 5.1 Troubleshooting Hardware"),
})
NEW.append({
    "id": "a1-pbq-5-006", "domain": 5, "objective": "5.2", "format": "pbq",
    "kind": "fill-blank",
    "prompt": "Type the term that matches each definition.\n\n1. ____ — the drive self-diagnostics standard that reports reallocated sectors and pending failures.\n2. ____ — the firmware self-test that runs when a PC powers on.\n3. ____ — a measure of storage performance expressed in operations per second.\n4. ____ — a RAID level that mirrors data across pairs of drives for redundancy.",
    "blanks": [
        {"id": "b1", "label": "Drive self-diagnostics", "placeholder": "Acronym", "acceptedAnswers": ["S.M.A.R.T.", "SMART"]},
        {"id": "b2", "label": "Power-on self-test", "placeholder": "Acronym", "acceptedAnswers": ["POST"]},
        {"id": "b3", "label": "Operations per second metric", "placeholder": "Acronym", "acceptedAnswers": ["IOPS"]},
        {"id": "b4", "label": "Mirroring RAID level", "placeholder": "Level", "acceptedAnswers": ["RAID 1", "RAID1", "1"]},
    ],
    "explanation": "S.M.A.R.T. monitors drive health indicators; POST is the firmware power-on test; IOPS measures storage performance; RAID 1 mirrors pairs of drives for fault tolerance.",
    "sourceRefs": REFS("5.2", "220-1201 5.2 Troubleshooting Storage"),
})

merge(load_bank("1201"), "1201", new_pbqs=NEW)
alib.count_check(load_bank("1201"), "1201")
