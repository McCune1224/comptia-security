import type { Domain } from '$lib/types';
import type { CourseDefinition } from './course';
import type { ExamConfig } from './quiz';

/**
 * CompTIA A+ V15 course definitions — Core 1 (220-1201) and Core 2 (220-1202).
 *
 * Mirrors the Security+ course shape: 4 weekly modules, 7 lessons, 12 graded
 * assignments (6 quizzes / 2 scenario+PBQ sets / 4 full exams), grade weights
 * quiz 30% / scenario-pbq 20% / full 50%.
 *
 * ID prefixes: `ap1-` (Core 1) / `ap2-` (Core 2) for lessons and assignments,
 * `ap1-week-N` / `ap2-week-N` for modules — the Security+ course already owns
 * `a1-`…`a4-` and `week-N`, and course_* tables use those ids as PRIMARY KEYs.
 */

const D1 = 1 as Domain;
const D2 = 2 as Domain;
const D3 = 3 as Domain;
const D4 = 4 as Domain;
const D5 = 5 as Domain;

/** Core 1 (220-1201): 5 domains — 90-Q exam quotas proportional to 13/23/25/11/28%. */
export const APLUS_1201_EXAM_CONFIG: ExamConfig = {
	domains: [1, 2, 3, 4, 5],
	quotas: { 1: 12, 2: 21, 3: 22, 4: 10, 5: 25 }
};

/** Core 2 (220-1202): 4 domains — 90-Q exam quotas proportional to 28/28/23/21%. */
export const APLUS_1202_EXAM_CONFIG: ExamConfig = {
	domains: [1, 2, 3, 4],
	quotas: { 1: 25, 2: 25, 3: 21, 4: 19 }
};

export const APLUS_1201_COURSE: CourseDefinition = {
	title: 'CompTIA A+ Core 1 (220-1201)',
	code: 'A+ 1201',
	examName: '220-1201 Certification Exam',
	passingScore: 675,
	scaleMax: 900,
	gradeWeights: { quiz: 0.3, 'scenario-pbq': 0.2, full: 0.5 },
	modules: [
		{
			id: 'ap1-week-1',
			week: 1,
			title: 'Mobile & Hardware Foundations',
			description:
				'Domains 1 & 3 — Mobile Devices and Hardware (38% of exam). Laptops, phones, displays, cables, RAM, storage.',
			position: 1
		},
		{
			id: 'ap1-week-2',
			week: 2,
			title: 'Networking & Virtualization',
			description:
				'Domains 2 & 4 — Networking and Virtualization/Cloud (34% of exam). Ports, wireless, SOHO, hypervisors, cloud models.',
			position: 2
		},
		{
			id: 'ap1-week-3',
			week: 3,
			title: 'Hardware & Network Troubleshooting',
			description:
				'Domain 5 — the heaviest domain at 28%. Motherboards, storage/RAID, displays, mobile, networks, and printers.',
			position: 3
		},
		{
			id: 'ap1-week-4',
			week: 4,
			title: 'Final Review & Readiness',
			description:
				'Targeted review, full-length timed exams, and a final readiness check before test day.',
			position: 4
		}
	],
	lessons: [
		{
			id: 'ap1-lesson-1-1',
			moduleId: 'ap1-week-1',
			title: 'Domain 1 — Mobile Devices',
			summary:
				'Laptop hardware replacement, mobile connections and accessories, cellular/Wi-Fi config, MDM, and sync.',
			content: `**Objectives covered:** 1.1–1.3 · **Exam weight:** 13% · **~12 questions**

## 1.1 Mobile device hardware & replacement

- **Battery** — lithium-ion; swollen battery = replace immediately (do not puncture). Laptop batteries are often internal (screw-down) or external (latch).
- **Keyboard/keys** — laptop keyboards use scissors/butterfly mechanisms; key cap replacement via retainer clips; beware ribbon cables.
- **RAM** — laptops use **SODIMM**; some are soldered (non-upgradable); check max supported and DDR generation before ordering.
- **Storage** — 2.5" HDD/SSD (SATA), **M.2** (SATA or NVMe); upgrading HDD→SSD is the single biggest perceived speedup.
- **Wireless cards** — Mini-PCIe/M.2 Wi-Fi cards with **antenna connectors** (U.FL/MHF tiny coax); re-seat antenna connectors after card swap.
- **Physical privacy/security** — biometrics (fingerprint reader, IR camera for Windows Hello), NFC scanner features (contactless cards).
- **Camera/webcam, microphone** — ribbon cables; camera privacy shutters; mic array location.

**Exam traps:** (1) NVMe M.2 keys — B-key (SATA) vs M-key (NVMe) vs B+M. (2) Laptop RAM is SODIMM, not DIMM. (3) A swollen battery is a safety issue — stop using the device.

## 1.2 Connections & accessories

| Connection | Use | Notes |
|---|---|---|
| USB-C | Modern data/charging | Reversible, up to 40 Gbps (TB3/4), Power Delivery (PD) |
| microUSB/miniUSB | Legacy Android/accessories | Micro-USB B is the common legacy one |
| Lightning | Apple devices (pre-USB-C) | Proprietary, 8-pin |
| NFC | Contactless payments/pairing | ~4 cm range, tap-to-pair |
| Bluetooth | Wireless peripherals | Pairing via PIN; discoverable mode |
| Tethering/hotspot | Share phone data | USB tethering, Bluetooth PAN, Wi-Fi hotspot (uses data cap!) |

- **Accessories** — stylus (precision input), headsets (3.5mm/USB-C/Bluetooth), speakers, webcam, docking station (full expansion + power), port replicator (ports only, no expansion slot), trackpad/trackpoint, drawing pad (digitizer).

**Exam trap:** Docking station ≠ port replicator — a dock adds expansion (eGPU, multiple monitors, charging), a replicator just mirrors existing ports.

## 1.3 Mobile connectivity, MDM, sync

- **Cellular** — 3G/4G/5G; enable/disable data, **hotspot** shares the cellular connection (watch data caps). **SIM/eSIM** — eSIM is programmable without a physical card; IMEI identifies the device.
- **Wi-Fi** — connect to SSID, WPA2/WPA3 passphrase; airplane mode disables radios.
- **Bluetooth** — enable, pairing (discoverable → select device → PIN/confirm → test connectivity).
- **Location services** — GPS (satellite, precise), cellular location (tower triangulation, works indoors).
- **MDM** — mobile device management: enforce corporate policy on enrolled devices, push corporate apps, remote wipe/lock; **BYOD** (personal device, containerization) vs **corporate-owned** (full control).
- **Sync** — calendar, contacts, mail, cloud storage; recognize **data caps** when syncing over cellular (sync on Wi-Fi).

## Sample questions

1. **Q:** A user's 3-year-old laptop suddenly won't hold a charge and the trackpad area feels swollen. What's the FIRST action? **A:** Power down and replace the battery — swelling is a lithium-ion safety hazard.
2. **Q:** Which mobile connection is BEST for contactless payments at a terminal? **A:** NFC — a few centimeters of range, tap-to-pay.
3. **Q:** A company needs to enforce a screen-lock policy on employee-owned phones. Which technology? **A:** MDM enrollment with policy enforcement (BYOD container).`,
			position: 1
		},
		{
			id: 'ap1-lesson-1-2',
			moduleId: 'ap1-week-1',
			title: 'Domain 3 — Displays, Cables & Memory',
			summary:
				'Display tech, cable/connector standards, RAM characteristics, and storage devices with RAID.',
			content: `**Objectives covered:** 3.1–3.4 · **Exam weight:** Domain 3 total 25% (~22 questions), split across lessons 1-2 and 2-1

## 3.1 Display components & attributes

- **LCD** — TN (cheap, fast, poor angles), IPS (good color/angles — most common), VA (contrast). Backlit by LEDs; **inverter** converts DC→AC for the backlight (older CCFL); a dim screen with faint image = backlight/inverter issue.
- **OLED** — self-emissive (no backlight), true blacks, thin; burn-in risk. **Mini-LED** — many small LEDs for local dimming.
- **Touch screen/digitizer** — capacitive (finger) vs active digitizer (stylus pressure).
- **Attributes** — pixel density (PPI), refresh rate (Hz; 60/120/144+), resolution (1080p/1440p/4K), color gamut (sRGB/Adobe RGB/DCI-P3).

## 3.2 Cables & connectors

| Cable/connector | Use | Notes |
|---|---|---|
| Cat 5e/6/6a twisted pair | Ethernet | RJ-45; 1/10 Gbps; **T568A vs T568B** wiring; **plenum-rated** for air-handling spaces; **STP** shielded vs **UTP**; **direct burial** for outdoor |
| Coaxial | Cable internet/TV | F-type connectors |
| Fiber | Long/fast links | **Single-mode** (laser, long) vs **multimode** (LED, short); LC/SC/ST |
| HDMI | Audio+video | 19-pin; ARC/eARC |
| DisplayPort | Audio+video | Daisy-chain, higher bandwidth |
| DVI / VGA | Legacy video | DVI digital, VGA analog |
| USB-C / Thunderbolt | Data+video+power | TB3/4 = 40 Gbps |
| SATA | Internal drives | 6 Gbps |
| M.2 | SSDs/Wi-Fi cards | SATA or NVMe |

**Exam traps:** (1) T568A/B differ in the orange/green pair positions — never mix standards on one run. (2) Plenum cable = fire-retardant for ceilings, not "better speed". (3) VGA is analog — no digital signal.

## 3.3 RAM

- **DDR generations** — DDR3 (240-pin DIMM / 204 SODIMM), DDR4 (288/260), DDR5 (288, different notch). Not interchangeable — notches differ.
- **DIMM vs SODIMM** — desktop vs laptop. **ECC** (error-correcting, servers) vs non-ECC.
- **Dual-channel** — matched pairs = more bandwidth; single stick = single channel.
- **Speed/latency** — DDR4-3200 (MT/s), CAS latency; matching modules avoids instability.

## 3.4 Storage

- **HDD** — spinning platters, SATA 6 Gbps, cheap per GB, mechanical failure (clicking = heads). **SSD** — SATA SSD vs **NVMe** (PCIe, 4-7 GB/s). **Hybrid** (SSHD) — small flash cache.
- **RAID** — 0 striping (speed, no redundancy), 1 mirroring (50% capacity), 5 striping+parity (n-1 capacity, 1-drive fault tolerance), 10 mirrored stripes (50%, survives multiple). **S.M.A.R.T.** — drive self-diagnostics. **IOPS** — operations per second.

**Exam trap:** RAID 5 with 3×1TB = 2TB usable (one drive for parity). RAID 1 with 2×1TB = 1TB.

## Sample questions

1. **Q:** A user's laptop screen is very dim but shows a faint image under a bright light. What's the likely fault? **A:** Backlight/inverter failure.
2. **Q:** Which cable type is required for runs through a building's plenum ceiling space? **A:** Plenum-rated (fire-retardant jacket).
3. **Q:** 3×2TB drives in RAID 5 — usable capacity? **A:** 4TB (n-1).`,
			position: 2
		},
		{
			id: 'ap1-lesson-2-1',
			moduleId: 'ap1-week-2',
			title: 'Domain 3 — Motherboards, CPUs, Power, Printers',
			summary:
				'Motherboard form factors and BIOS, CPU installation, power supplies, MFDs, and printer types/maintenance.',
			content: `**Objectives covered:** 3.5–3.8 · **Exam weight:** Domain 3 total 25%, split across lessons 1-2 and 2-1

## 3.5 Motherboards, CPUs, add-on cards

- **Form factors** — ATX, microATX (mATX), Mini-ITX (ITX). Smaller = fewer slots; case must match.
- **Sockets/chipsets** — CPU socket must match CPU (LGA 1700, AM5…); chipset determines features (PCIe lanes, USB, SATA). **Compatibility first** — check CPU ↔ socket ↔ chipset ↔ RAM generation ↔ BIOS support.
- **Slots** — PCIe x1/x4/x16 (GPU = x16), M.2 (SSD/Wi-Fi), DIMM slots (channel order).
- **BIOS/UEFI** — **UEFI** (modern, Secure Boot, GPT) vs legacy BIOS (MBR). Settings: boot order, Secure Boot, **TPM** (hardware security chip — BitLocker, Windows 11 requirement), **XMP/EXPO** (RAM profile), virtualization (VT-x/AMD-V).
- **CPU install** — socket lever, **thermal paste** (pea-size), heat sink/fan or liquid cooler; overheat = shutdowns.
- **Expansion cards** — GPU, NIC, sound; match slot/lane; power (6/8-pin PCIe).

**Exam trap:** Always check CPU socket compatibility before ordering — a CPU physically fits ONLY its socket family.

## 3.6 Power

- **PSU** — wattage must exceed total draw with headroom; **80 Plus** efficiency (Bronze/Silver/Gold/Platinum); **modular** (detachable cables) vs fixed.
- **Connectors** — 24-pin ATX main, 4/8-pin **EPS** (CPU), SATA power, Molex (legacy), 6/8-pin PCIe (GPU).
- **Protection** — surge suppressor (spikes) vs **UPS** (battery backup + surge; keeps PC running during outages). **Power supply tester** verifies rails.
- **Safety** — never open a PSU (charged capacitors); ESD strap when working inside a case.

## 3.7 Multifunction devices

- **MFD** — print/scan/copy/fax in one; **duplexer** (two-sided), **ADF** (automatic document feeder), flatbed scanner.
- **Connectivity** — USB, Ethernet, Wi-Fi, NFC (tap-to-print), cloud printing; install driver; **print queue/spooler** (jobs stuck = spooler service/queue).

## 3.8 Printer types & maintenance

- **Laser** — toner (powder) + **imaging drum** + **fuser** (heat/pressure). Maintenance kit = fuser + rollers. Calibration; cleaning. Faded = low toner; lines = drum/wiper.
- **Inkjet** — liquid ink, **printhead** (clog = streaks → clean printhead), ink cartridges; paper feed issues.
- **Thermal** — heat + special paper (receipts); no ink/toner.
- **Impact** — dot-matrix pins + ribbon (multi-part forms).
- **3D printers** — filament; maintenance per vendor.
- **General** — clear jams by opening access panels (follow the diagram), replace paper, run calibration/test pages; **fuser is HOT** — let it cool.

## Sample questions

1. **Q:** A new GPU needs more power than the motherboard slot provides. Which connector? **A:** 6/8-pin PCIe power from the PSU.
2. **Q:** Windows 11 requires a security chip for BitLocker and device health. Which one? **A:** TPM 2.0.
3. **Q:** A laser printer shows vertical lines on every page. What's most likely? **A:** Damaged imaging drum or dirty wiper blade.`,
			position: 3
		},
		{
			id: 'ap1-lesson-2-2',
			moduleId: 'ap1-week-2',
			title: 'Domain 2 — Networking',
			summary:
				'Ports and protocols, wireless technologies, network services, DNS/DHCP config, hardware, SOHO, connection types, and tools.',
			content: `**Objectives covered:** 2.1–2.8 · **Exam weight:** 23% · **~21 questions**

## 2.1 Ports & protocols (memorize these)

| Port | Protocol | Purpose |
|---|---|---|
| 20/21 | FTP | File transfer (21 control, 20 data) |
| 22 | SSH | Encrypted remote shell |
| 23 | Telnet | Plaintext remote shell (insecure) |
| 25 | SMTP | Send email |
| 53 | DNS | Name resolution |
| 67/68 | DHCP | IP assignment |
| 80 | HTTP | Web (plaintext) |
| 110 | POP3 | Receive email (download) |
| 143 | IMAP | Receive email (server-side folders) |
| 137-139 | NetBIOS/NetBT | Legacy Windows naming |
| 389 | LDAP | Directory services |
| 443 | HTTPS | Web (encrypted) |
| 445 | SMB/CIFS | Windows file sharing |
| 3389 | RDP | Remote desktop |

- **TCP** — connection-oriented (3-way handshake), reliable, ordered. **UDP** — connectionless, fast, no guarantee (streaming, VoIP, DHCP, DNS queries).

## 2.2 Wireless

- **Frequencies** — 2.4 GHz (longer range, more interference), 5 GHz (faster, shorter), 6 GHz (Wi-Fi 6E). **Channels** — regulations limit power/channels; select non-overlapping channels (1/6/11 on 2.4 GHz). **Channel width** — wider = faster but more interference.
- **802.11 standards** — a (5GHz), b/g (2.4), n (dual), ac (5GHz), ax (Wi-Fi 6, dual+6E). **Bluetooth** — PAN, pairing. **NFC** — ~4cm contactless. **RFID** — tags/readers (access badges, inventory).

## 2.3 Network services

- **Server roles** — DNS (name→IP), DHCP (IP assignment), file share, print server, mail, **syslog** (log aggregation), web, **AAA** (auth/authorization/accounting), database, **NTP** (time sync).
- **Internet appliances** — spam gateway, **UTM** (all-in-one firewall/IPS/AV), load balancer, proxy (forward/caching/filtering).
- **Legacy/embedded** — **SCADA** (industrial control), IoT devices.

## 2.4 Network configuration

- **DNS records** — A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail), TXT (SPF/DKIM/DMARC — anti-spoofing/email auth).
- **DHCP** — scope (pool), **exclusions**, **reservations** (MAC→fixed IP), leases (renewal).
- **VLAN** — segment broadcast domains on a switch. **VPN** — encrypted tunnel (client-to-site, site-to-site).

## 2.5 Hardware devices

- **Router** (routes between networks/NAT), **switch** (LAN forwarding; managed = configurable/VLANs, unmanaged = plug-and-play), **access point** (wireless), **patch panel** (cable termination point), **firewall**, **PoE** (power over Ethernet via injector or switch; 802.3af/at), **cable modem** (coax), **DSL modem** (phone line), **ONT** (fiber), **NIC** (has MAC address).

## 2.6 SOHO configuration

- **IPv4** — private ranges: **10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16**; public = internet-routable. **IPv6** — 128-bit (fe80:: link-local). **APIPA** — 169.254.x.x when DHCP fails. **Static vs dynamic** (DHCP). **Subnet mask** (255.255.255.0 = /24). **Gateway** — next hop off the LAN.
- SOHO router: WAN to modem, LAN to devices; configure SSID + **WPA2/WPA3**, change default admin password, update firmware.

## 2.7 Connection & network types

- **Internet** — satellite (high latency), fiber (fast, symmetric), cable (coax, shared), DSL (phone), cellular (4G/5G), **WISP** (wireless ISP).
- **Network types** — LAN, WAN, PAN (Bluetooth), MAN, SAN (storage), WLAN.

## 2.8 Network tools

- **Crimper** (attach RJ-45), **cable stripper**, **Wi-Fi analyzer** (signal/channel survey), **toner probe** (trace cables), **punchdown tool** (patch panel/keystone), **cable tester** (wiring verify), **loopback plug** (test NIC), **network tap** (passive traffic capture).

## Sample questions

1. **Q:** Which port does encrypted remote administration of a server use? **A:** 22 (SSH).
2. **Q:** A user's PC shows 169.254.x.x after boot. What happened? **A:** DHCP failed — APIPA link-local address.
3. **Q:** Which device separates broadcast domains? **A:** A VLAN-capable (managed) switch.`,
			position: 4
		},
		{
			id: 'ap1-lesson-3-1',
			moduleId: 'ap1-week-3',
			title: 'Domain 4 — Virtualization & Cloud',
			summary:
				'Hypervisors, VMs, sandboxing, and the cloud service/deployment models.',
			content: `**Objectives covered:** 4.1–4.2 · **Exam weight:** 11% · **~10 questions**

## 4.1 Virtualization

- **Hypervisor** — the VM management layer. **Type 1 (bare-metal)** — runs directly on hardware (ESXi, Hyper-V, Proxmox). **Type 2 (hosted)** — runs inside an OS (VirtualBox, Workstation).
- **Host vs guest** — host = physical server; guest = VM. **VM resources** — virtual CPU/RAM/disk/NIC allocated from the host.
- **Snapshot** — point-in-time VM state for rollback. **Clone** — identical copy. **Live migration** — move a running VM between hosts, zero downtime.
- **Sandboxing** — isolate untrusted software in a VM. **VM escape** — a guest breaking out to the host (security risk).
- **Resource allocation** — CPU/RAM reservations, **memory overcommitment** (ballooning), thin vs thick provisioning.
- **VDI** — virtual desktop infrastructure (centralized desktops).

## 4.2 Cloud computing

- **Service models** — **IaaS** (rent VMs/storage/network; you manage OS), **PaaS** (managed platform for apps), **SaaS** (finished app — Microsoft 365, Google Workspace).
- **Deployment models** — public, private (single org), **hybrid** (private + public), community (shared by orgs with common needs), **multi-cloud** (multiple public providers).
- **Characteristics** — on-demand self-service, broad network access, **resource pooling**, **rapid elasticity** (auto-scale), **metered** (pay-per-use).
- **Shared responsibility** — provider secures the cloud (physical/host), customer secures what's in it (OS, data, config).

**Exam trap:** IaaS = you patch the OS; SaaS = provider does everything. Hybrid = mix of private AND public.

## Sample questions

1. **Q:** A hypervisor installed directly on server hardware, no host OS. Which type? **A:** Type 1 (bare-metal).
2. **Q:** A company rents VMs and manages the OS itself. Which model? **A:** IaaS.
3. **Q:** What feature rolls a VM back after a bad update? **A:** Snapshot.`,
			position: 5
		},
		{
			id: 'ap1-lesson-3-2',
			moduleId: 'ap1-week-3',
			title: 'Domain 5 — Troubleshooting',
			summary:
				'Hardware, drive/RAID, display, mobile, network, and printer troubleshooting — fault → cause → fix tables.',
			content: `**Objectives covered:** 5.1–5.6 · **Exam weight:** 28% · **~25 questions** — the single heaviest domain

> Note: the 6-step troubleshooting *methodology* is a competency standard in V15, NOT tested as an objective. What IS tested: recognizing symptoms, isolating causes, and applying fixes.

## 5.1 Motherboards, RAM, CPUs, power

| Symptom | Likely cause | Fix |
|---|---|---|
| POST beeps, no video | RAM/GPU fault | Reseat RAM/GPU, test one stick |
| Blank screen, fans spin | GPU/display cable | Check cable, reseat GPU |
| No power at all | PSU/cable/switch | Verify wall, PSU switch, test PSU |
| Random shutdowns under load | Overheating | Clean fans, reapply thermal paste |
| Date/time resets | CMOS battery dead | Replace CR2032 |
| Capacitor swelling | Failing board | Replace motherboard |

## 5.2 Drive & RAID

- **Grinding/clicking** — failing HDD heads: back up NOW, replace drive.
- **S.M.A.R.T. warnings / reallocated sectors** — drive failing: replace.
- **Bootable device not found** — boot order, dead drive, loose SATA/power cable.
- **RAID** — array missing/offline: check drives, rebuild after replacement; degraded = one drive failed.

## 5.3 Displays

- **Incorrect input source** — check input button. **Fuzzy image** — resolution/cable. **Burnt-out bulb (projector)** — replace lamp. **Dim image** — backlight/inverter. **Burn-in** — OLED static image. **Dead pixels** — panel defect. **Flashing** — cable/refresh. **Audio issues** — default device/settings.

## 5.4 Mobile devices

- **Poor battery health / swollen battery** — replace battery; swelling = safety issue.
- **Broken screen** — digitizer vs LCD: touch dead but display fine = digitizer; both = LCD+digitizer assembly.
- **Improper charging** — charge port debris/damage, wrong charger wattage.
- **Poor/no connectivity** — airplane mode, Wi-Fi off, SIM seated, data cap.
- **Liquid damage** — power off, dry, do not charge. **Overheating** — remove case, close apps.
- **Cursor drift/touch calibration** — recalibrate digitizer, screen protector issues.
- **Malware on mobile** — uninstall suspicious apps, factory reset if needed.

## 5.5 Networks

- **Intermittent wireless** — channel interference, distance, AP placement, outdated drivers.
- **Slow speeds** — bandwidth saturation, duplex mismatch, cabling, Wi-Fi signal.
- **Limited connectivity** — APIPA 169.254 = DHCP failure; check DHCP server/cable.
- **Jitter / poor VoIP** — latency variation, QoS off, congestion.
- **Port flapping** — bad cable/NIC, duplex mismatch. **High latency** — congestion, long path, ISP.
- **Authentication failures** — wrong password, RADIUS/802.1X, roaming.

## 5.6 Printers

| Symptom | Likely cause |
|---|---|
| Lines down the page | Dirty/damaged drum or wiper |
| Garbled print | Wrong driver, corrupted spool |
| Paper jams | Worn rollers, misfeed, debris |
| Faded prints | Low toner (laser) / clogged printhead (inkjet) |
| Multipage misfeed | Separation pad worn |
| Multiple prints pending | Stuck print queue/spooler |
| Grinding noise | Gear/roller issue |
| Finishing (staple/hole punch) | Finisher jam |

## Sample questions

1. **Q:** A desktop beeps repeatedly at POST with no video. First step? **A:** Reseat/replace RAM modules.
2. **Q:** A drive makes a clicking sound. What should the technician do FIRST? **A:** Back up the data immediately.
3. **Q:** Pages have vertical black lines. What's the likely cause in a laser printer? **A:** Damaged imaging drum.`,
			position: 6
		},
		{
			id: 'ap1-lesson-4-1',
			moduleId: 'ap1-week-4',
			title: 'Exam Strategy & Objective Walkthrough',
			summary:
				'Readiness checklist, PBQ strategy, Core 1 exam-day rules, and the 27-objective walkthrough.',
			content: `**Week 4 — the final sprint before test day**

## Readiness checklist

- [ ] All six objective quizzes submitted (Domains 1–5 + weak-topic review)
- [ ] Both scenario/PBQ sets completed
- [ ] Full Practice Exams #1 and #2 under real conditions (90 Q, 90 min, no notes)
- [ ] Gradebook weak topics reviewed — redo targeted domain quizzes for anything < 75%
- [ ] Score **675/900 (75%) or higher** on at least one full exam → readiness ring reads "Exam-ready"

## Core 1 exam facts

- **90 questions / 90 minutes, pass = 675/900 (75%).** Domains: Mobile 13%, Networking 23%, Hardware 25%, Virtualization/Cloud 11%, Troubleshooting 28%.
- **The troubleshooting methodology is NOT tested** in V15 — don't waste time memorizing the 6 steps; DO practice symptom→cause recognition.

## Objective walkthrough drill

For every objective (1.1 → 5.6) you should be able to: (1) say the title, (2) explain each bullet in 1-2 sentences, (3) give a concrete example. Miss any → targeted review.

**Acronyms to know cold** — from the 1201 list: BIOS, UEFI, TPM, POST, S.M.A.R.T., RAID, NVMe, M.2, SATA, SODIMM, DIMM, DDR, ECC, HDMI, DP, DVI, VGA, USB, RJ-45, RJ-11, STP, UTP, PoE, ONT, DSL, WISP, APIPA, DHCP, DNS, NAT, PAT, SSID, WPA2/WPA3, MAC, IP, IPv6, VPN, VLAN, PAN, LAN, WAN, MAN, SAN, WLAN, FTP, SSH, SMTP, POP3, IMAP, LDAP, SMB, RDP, HTTP(S), NFC, RFID, SIM, eSIM, GPS, MDM, BYOD, IaaS, PaaS, SaaS, VDI, VM, UPS, PSU, LED, LCD, OLED, MFD, ADF, CPU, GPU, CMOS, ESD, UPS…

## PBQ strategy

- **Do PBQs first or last** — they're the most time-consuming; many test-takers flag and return.
- **Read the scenario twice** — PBQs bury the key constraint ("MOST secure", "FIRST step", "least expensive").
- **Ordering** — find the anchor step (only one can be first/last) and build outward.
- **Matching** — match the sure pairs first; leftover targets narrow the rest.
- **Configuration** — best practice = enable encryption (WPA3), change defaults, update firmware, least privilege.
- **Evidence (command output)** — know what ipconfig 169.254, ping failures, and POST beeps mean.

## Exam-day rules

- ~1 minute per question. Flag and move on; keep 10 min for review. **No penalty for guessing — never leave a blank.**
- "Which TWO…" → select exactly the stated count. "BEST/MOST/FIRST" → satisfy the stated constraint.
- Scenario questions: the answer is usually the FIRST action or the ROOT CAUSE, not a downstream step.

## Day before / day of

Rest; light review of weakest 2-3 topics (ports, RAID math, connector table, acronyms). Confirm test center/online proctor, photo ID, arrive 30 min early, no smartwatch/notes. Target 675+, expect ~10 flagged questions, keep moving.`,
			position: 7
		}
	],
	assignments: [
		// Week 1 — Domains 1 & 3
		{
			id: 'ap1-1',
			moduleId: 'ap1-week-1',
			title: 'Domain 1 Objective Quiz',
			description:
				'20 multiple-choice questions covering objectives 1.1–1.3 (Mobile Devices).',
			kind: 'quiz',
			category: 'quiz',
			points: 20,
			count: 20,
			domain: D1,
			mode: 'practice',
			durationMinutes: 25,
			dueOffsetDays: -24,
			position: 1
		},
		{
			id: 'ap1-2',
			moduleId: 'ap1-week-1',
			title: 'Domain 3 Objective Quiz',
			description:
				'20 multiple-choice questions covering objectives 3.1–3.8 (Hardware).',
			kind: 'quiz',
			category: 'quiz',
			points: 20,
			count: 20,
			domain: D3,
			mode: 'practice',
			durationMinutes: 25,
			dueOffsetDays: -22,
			position: 2
		},
		{
			id: 'ap1-3',
			moduleId: 'ap1-week-1',
			title: 'Week 1 Checkpoint Exam',
			description:
				'20-question timed mini-exam mixing Domains 1 & 3. Your first exam-conditions check-in.',
			kind: 'quiz',
			category: 'full',
			points: 20,
			count: 20,
			domain: null,
			mode: 'exam',
			durationMinutes: 20,
			dueOffsetDays: -20,
			position: 3
		},
		// Week 2 — Domains 2 & 4
		{
			id: 'ap1-4',
			moduleId: 'ap1-week-2',
			title: 'Domain 2 Objective Quiz',
			description:
				'20 multiple-choice questions covering objectives 2.1–2.8 (Networking).',
			kind: 'quiz',
			category: 'quiz',
			points: 20,
			count: 20,
			domain: D2,
			mode: 'practice',
			durationMinutes: 25,
			dueOffsetDays: -17,
			position: 4
		},
		{
			id: 'ap1-5',
			moduleId: 'ap1-week-2',
			title: 'Domain 4 Objective Quiz',
			description:
				'15 multiple-choice questions covering objectives 4.1–4.2 (Virtualization and Cloud).',
			kind: 'quiz',
			category: 'quiz',
			points: 15,
			count: 15,
			domain: D4,
			mode: 'practice',
			durationMinutes: 20,
			dueOffsetDays: -15,
			position: 5
		},
		{
			id: 'ap1-6',
			moduleId: 'ap1-week-2',
			title: 'PBQ Practice Set',
			description:
				'5 performance-based questions — ordering, matching, configuration, and evidence tasks.',
			kind: 'pbq',
			category: 'scenario-pbq',
			points: 5,
			count: 5,
			domain: null,
			mode: 'practice',
			durationMinutes: 30,
			dueOffsetDays: -14,
			position: 6
		},
		{
			id: 'ap1-7',
			moduleId: 'ap1-week-2',
			title: 'Full Practice Exam #1',
			description:
				'90-question, 90-minute full-length exam with all five domains and 5 PBQs — exam conditions.',
			kind: 'full',
			category: 'full',
			points: 90,
			count: 90,
			domain: null,
			mode: 'exam',
			durationMinutes: 90,
			dueOffsetDays: -13,
			position: 7
		},
		// Week 3 — Domain 5 + heavy practice
		{
			id: 'ap1-8',
			moduleId: 'ap1-week-3',
			title: 'Domain 5 Objective Quiz',
			description:
				'20 multiple-choice questions covering objectives 5.1–5.6 (Hardware & Network Troubleshooting).',
			kind: 'quiz',
			category: 'quiz',
			points: 20,
			count: 20,
			domain: D5,
			mode: 'practice',
			durationMinutes: 25,
			dueOffsetDays: -9,
			position: 8
		},
		{
			id: 'ap1-9',
			moduleId: 'ap1-week-3',
			title: 'Scenario Practice Set',
			description:
				'10 applied scenario-based questions testing real-world troubleshooting decisions.',
			kind: 'scenario',
			category: 'scenario-pbq',
			points: 10,
			count: 10,
			domain: null,
			mode: 'practice',
			durationMinutes: 20,
			dueOffsetDays: -8,
			position: 9
		},
		{
			id: 'ap1-10',
			moduleId: 'ap1-week-3',
			title: 'Full Practice Exam #2',
			description:
				'Second 90-question, 90-minute full-length exam. Aim for 80%+ and note your weak domains.',
			kind: 'full',
			category: 'full',
			points: 90,
			count: 90,
			domain: null,
			mode: 'exam',
			durationMinutes: 90,
			dueOffsetDays: -6,
			position: 10
		},
		// Week 4 — Final review
		{
			id: 'ap1-11',
			moduleId: 'ap1-week-4',
			title: 'Weak-Topic Targeted Review',
			description:
				'Mixed 20-question practice quiz to close out your weakest objectives before the final exam.',
			kind: 'quiz',
			category: 'quiz',
			points: 20,
			count: 20,
			domain: null,
			mode: 'practice',
			durationMinutes: 25,
			dueOffsetDays: -3,
			position: 11
		},
		{
			id: 'ap1-12',
			moduleId: 'ap1-week-4',
			title: 'Full Practice Exam #3 (Final)',
			description:
				'Final 90-question, 90-minute exam. Target 675/900 scaled (75%) or higher — the real pass mark.',
			kind: 'full',
			category: 'full',
			points: 90,
			count: 90,
			domain: null,
			mode: 'exam',
			durationMinutes: 90,
			dueOffsetDays: -2,
			position: 12
		}
	]
};

export const APLUS_1202_COURSE: CourseDefinition = {
	title: 'CompTIA A+ Core 2 (220-1202)',
	code: 'A+ 1202',
	examName: '220-1202 Certification Exam',
	passingScore: 700,
	scaleMax: 900,
	gradeWeights: { quiz: 0.3, 'scenario-pbq': 0.2, full: 0.5 },
	modules: [
		{
			id: 'ap2-week-1',
			week: 1,
			title: 'Operating Systems',
			description:
				'Domain 1 — OS types, filesystems, boot methods, Windows editions, tools, CLI, settings, networking, macOS/Linux (28% of exam).',
			position: 1
		},
		{
			id: 'ap2-week-2',
			week: 2,
			title: 'Security',
			description:
				'Domain 2 — security measures, Windows security, wireless protocols, malware, social engineering, hardening, data destruction, SOHO and browser security (28% of exam).',
			position: 2
		},
		{
			id: 'ap2-week-3',
			week: 3,
			title: 'Software Troubleshooting & Operations',
			description:
				'Domains 3 & 4 — Windows/mobile/security troubleshooting, documentation, change management, backup, safety, environmental, privacy, communication, scripting, remote access, and AI basics (44% of exam).',
			position: 3
		},
		{
			id: 'ap2-week-4',
			week: 4,
			title: 'Final Review & Readiness',
			description:
				'Targeted review, full-length timed exams, and a final readiness check before test day.',
			position: 4
		}
	],
	lessons: [
		{
			id: 'ap2-lesson-1-1',
			moduleId: 'ap2-week-1',
			title: 'Domain 1 — OS Types, Filesystems & Install',
			summary:
				'Windows/macOS/Linux/Chrome OS, mobile OSes, filesystems, boot methods, and installation/upgrade paths.',
			content: `**Objectives covered:** 1.1–1.2 · **Exam weight:** Domain 1 total 28% (~25 questions), split across lessons 1-1 and 1-2

## 1.1 OS types & filesystems

- **Workstation OSes** — Windows (10/11), Linux (Ubuntu, Fedora, Debian), macOS, Chrome OS (cloud-centric, web apps).
- **Mobile OSes** — iOS/iPadOS (Apple, App Store only), Android (open, sideloading possible, Google Play).
- **Filesystems** — **NTFS** (Windows default: permissions, encryption EFS, compression, quotas), **ReFS** (server resilience), **FAT32** (legacy, 4 GB file limit, max 2 TB partition), **exFAT** (flash drives, no 4 GB limit), **ext4** (Linux default), **XFS** (Linux, large files), **APFS** (macOS/iOS default).
- **Vendor life cycle** — **EOL** (end-of-life: no more patches — security risk), update limitations (unsupported hardware).
- **Compatibility** — file format sharing across OSes (docx/xlsx, exFAT USB), case sensitivity (Linux), drive formats not readable cross-OS.

## 1.2 Install & upgrade paths

- **Boot methods** — USB, network (PXE), solid-state/flash, internet-based (cloud recovery), external/hot-swappable drive, internal partition, multiboot (dual-boot), **image deployment**, remote network install.
- **Install types** — **clean install** (wipe + fresh), **upgrade/in-place** (keep files/apps), **repair installation** (fix OS files), recovery partition.
- **Partitioning** — **GPT** (modern, UEFI, 128+ partitions, >2 TB) vs **MBR** (legacy BIOS, 4 primary partitions, 2 TB limit); drive format before install.
- **Upgrade considerations** — backup files/preferences first, app/driver backward compatibility, hardware compatibility (TPM 2.0, RAM, CPU for Win 11).
- **Windows 11 editions** — Home, Pro (BitLocker, RDP host, gpedit, domain join), Pro for Workstations; Windows 10 Home/Pro; N versions (no media player); feature differences (domain vs workgroup, RAM support limits, BitLocker, RDP availability, desktop styles).
- **Enterprise deployment** — third-party drivers, mass deployment tools.

**Exam traps:** (1) FAT32 ≠ exFAT — exFAT lifts the 4 GB file limit. (2) GPT needs UEFI; MBR pairs with legacy BIOS. (3) In-place upgrade ≠ clean install — upgrade preserves apps/settings.

## Sample questions

1. **Q:** Which filesystem is the default for modern Windows and supports per-file encryption (EFS)? **A:** NTFS.
2. **Q:** A USB stick must carry a 6 GB video between Windows and macOS. Best format? **A:** exFAT.
3. **Q:** Which partition scheme is required to boot from a >2 TB drive in UEFI mode? **A:** GPT.`,
			position: 1
		},
		{
			id: 'ap2-lesson-1-2',
			moduleId: 'ap2-week-1',
			title: 'Domain 1 — Windows Tools, CLI, Settings & Networking',
			summary:
				'Task Manager, MMC snap-ins, command-line tools, Windows settings, and client networking.',
			content: `**Objectives covered:** 1.3–1.7 · **Exam weight:** Domain 1 total 28%

## 1.4 Windows tools

- **Task Manager** — processes, performance, startup apps, users, services (end task, startup disable).
- **MMC snap-ins** — **Event Viewer** (eventvwr.msc — system/application/security logs), **Disk Management** (diskmgmt.msc — partitions, format, shrink/extend), **Task Scheduler** (taskschd.msc), **Device Manager** (devmgmt.msc — drivers, disable/update, exclamation = problem), **Certificate Manager** (certmgr.msc), **Local Users and Groups** (lusrmgr.msc), **Performance Monitor** (perfmon.msc), **Group Policy Editor** (gpedit.msc — Pro only), Registry Editor (regedit.exe).
- **Additional tools** — System Information (msinfo32.exe), Resource Monitor (resmon.exe), System Configuration (**msconfig.exe** — startup, services, boot options; note: startup apps moved to Task Manager), Disk Defragmenter (dfrgui.exe), Indexing Options, Administrative Tools.

## 1.5 Command line

- **Navigation** — cd, dir, md, rmdir.
- **Network** — **ipconfig** (IP config: /all, /release, /renew, /flushdns), **ping** (reachability), **netstat** (connections), **nslookup** (DNS queries), **pathping** (trace + latency stats), **net use** (map drives).
- **Disk** — **chkdsk** (check/fix disk errors), **format**, **diskpart** (partition tool).
- **File/info** — robocopy (robust copy), winver (Windows version), whoami (current user), hostname, **gpupdate** (refresh policy), **gpresult** (policy results), **sfc /scannow** (system file check), **net user** (user mgmt), **[cmd] /?** (help).

## 1.6 Windows settings

- Network and Sharing Center, System, Device Manager, Indexing Options, Devices and Printers, Program and Features (uninstall), Internet Options, Windows Defender Firewall, Mail, Sound, User Accounts, File Explorer Options (hidden files, hide extensions), Power Options (**hibernate vs sleep/suspend vs standby**, power plans, closing-lid action, fast startup, USB selective suspend), Ease of Access, Time and Language, Update and Security, Personalization, Apps, Network and Internet, Gaming, Accounts.

## 1.7 Client networking

- **Domain joined vs workgroup** — domain = centralized AD auth, group policy, shared printers/file servers, mapped drives; workgroup = peer-to-peer, local accounts.
- **Connections** — VPN (client config), wireless (SSID/security), WWAN/cellular.
- **Client IP config** — IP addressing scheme, subnet mask, gateway, static vs dynamic, DNS settings; **proxy settings** (system proxy); **public vs private network** (Windows firewall profile: private = file sharing allowed, public = locked down).

**Exam traps:** (1) msconfig startup tab is legacy — Task Manager > Startup is current. (2) sfc fixes system files; DISM repairs the image sfc relies on. (3) "Public" network profile = most restrictive firewall.

## Sample questions

1. **Q:** Which command refreshes Group Policy immediately? **A:** gpupdate /force.
2. **Q:** Where do you disable a program that launches at sign-in? **A:** Task Manager > Startup.
3. **Q:** A PC joined to a domain can log in with which type of account? **A:** Domain account (AD credentials).`,
			position: 2
		},
		{
			id: 'ap2-lesson-2-1',
			moduleId: 'ap2-week-2',
			title: 'Domain 1 — macOS, Linux & Applications',
			summary:
				'macOS features and tools, Linux commands, application installation, and cloud productivity tools.',
			content: `**Objectives covered:** 1.8–1.11 · **Exam weight:** Domain 1 total 28%

## 1.8 macOS

- **Finder** (file manager), **Dock**, Spotlight (search), System Preferences/Settings, **Time Machine** (backups), **Disk Utility** (format/repair), **Keychain** (passwords/certs), **Activity Monitor** (processes), Terminal (Unix shell), Mission Control, Gatekeeper (app signing).
- **File structure** — /Applications, /Users, /Library; APFS; **.dmg/.pkg** installers; drag-to-Applications.
- **Remote** — Screen Sharing (VNC), iCloud sync. **Shortcuts** — Cmd+C/V, Cmd+Space (Spotlight).

## 1.9 Linux

- **Distros** — Ubuntu, Fedora, Debian, Linux Mint, Kali.
- **CLI basics** — ls, cd, pwd, cp, mv, rm, mkdir, **chmod** (permissions 755/644), **chown**, **grep** (search), **apt/apt-get** (package install), sudo (admin), **ps**, **top**, **df -h** (disk space), **ifconfig/ip addr** (network), man pages.
- **GUI** — GNOME/KDE desktops, software centers, file managers.
- **Filesystem** — ext4, XFS; /root /home /etc /var /tmp structure.

## 1.10 Application install

- **Windows** — MSI/EXE installers, UAC prompts, 32-bit vs 64-bit, per-user vs machine install, sideloading/Store apps, compatibility mode.
- **macOS** — DMG/pkg, Gatekeeper; **Linux** — package manager (apt/dnf), repos, tarballs.
- **Requirements** — check RAM/disk/OS version, license, driver dependencies, admin rights.

## 1.11 Cloud productivity tools

- **SaaS apps** — Microsoft 365, Google Workspace (Docs/Sheets/Slides/Drive), Zoom/Teams (video).
- **Features** — real-time collaboration, version history, file sync (OneDrive/Drive), sharing/permissions, offline mode, browser-based vs installed clients.

**Exam traps:** (1) chmod 755 = owner rwx, group r-x, others r-x. (2) apt is Debian-family; dnf/yum is Red Hat-family. (3) 32-bit apps may not run on ARM Windows without emulation.

## Sample questions

1. **Q:** Which Linux command changes file permissions? **A:** chmod.
2. **Q:** A Mac user needs automatic local backups. Which built-in tool? **A:** Time Machine.
3. **Q:** Which command installs packages on Ubuntu? **A:** sudo apt install <package>.`,
			position: 3
		},
		{
			id: 'ap2-lesson-2-2',
			moduleId: 'ap2-week-2',
			title: 'Domain 2 — Security Measures & Malware',
			summary:
				'Physical/logical security, Windows security settings, wireless protocols, and malware types/tools.',
			content: `**Objectives covered:** 2.1–2.4 · **Exam weight:** Domain 2 total 28% (~25 questions), split across lessons 2-2 and 3-1

## 2.1 Security measures

- **Physical** — locks, badges, biometrics, security cameras, RFID badges, mantrap, cable locks.
- **Logical** — passwords/PINs, **MFA** (something you know/have/are), smart cards, **BitLocker** (full-disk encryption; needs TPM), EFS (file encryption), least privilege, user account control (**UAC**), **Active Directory** (central auth + group policy), access control lists, NTFS permissions, screen locks, trusted platform module (**TPM**).

## 2.2 Windows security settings

- **Defender** — antivirus, firewall (inbound/outbound rules, profiles), Windows Security Center.
- **Accounts** — user accounts, admin vs standard, UAC levels, password policy (length/complexity/expiration), account lockout, disable guest.
- **Active Directory** — domains, group policy, organizational units, domain vs local accounts.

## 2.3 Wireless security

- **WEP** — broken, never use. **WPA** — TKIP, deprecated. **WPA2** — AES/CCMP, current baseline. **WPA3** — SAE, strongest (resists offline dictionary attacks).
- **Authentication** — **802.1X** (enterprise: RADIUS + EAP — PEAP, EAP-TLS), captive portals, preshared key (PSK) vs enterprise mode, MAC filtering (weak — spoofable).

## 2.4 Malware & anti-malware

- **Types** — virus (host file), worm (self-spreads), trojan (disguised), ransomware (encrypt + extort), spyware, adware, keylogger, rootkit (kernel), botnet, **PUP** (potentially unwanted program), logic bomb, **RAT** (remote access trojan).
- **Indicators** — slow system, popups, unusual network traffic, browser redirects, new processes.
- **Tools** — antivirus/anti-malware (real-time + on-demand), **EDR** (endpoint detection and response), Windows Defender, Malwarebytes-style scanners, quarantining, safe mode, System Restore.

**Exam traps:** (1) WPA3 > WPA2 > WPA > WEP — always the order for "most secure". (2) 802.1X is enterprise authentication, not encryption. (3) Ransomware removal is NOT just deleting files — see 2.6's 9-step process.

## Sample questions

1. **Q:** Which wireless protocol resists offline dictionary attacks? **A:** WPA3 (SAE).
2. **Q:** Which technology encrypts an entire Windows system drive? **A:** BitLocker (with TPM).
3. **Q:** Malware that spreads itself across the network without user action? **A:** Worm.`,
			position: 4
		},
		{
			id: 'ap2-lesson-3-1',
			moduleId: 'ap2-week-3',
			title: 'Domain 2 — Social Engineering, Hardening & Security Ops',
			summary:
				'Social engineering, SOHO malware removal, workstation/mobile hardening, data destruction, SOHO and browser security.',
			content: `**Objectives covered:** 2.5–2.11 · **Exam weight:** Domain 2 total 28%

## 2.5 Social engineering

- **Phishing family** — phishing (mass email), spear phishing (targeted), whaling (executives), vishing (voice), smishing (SMS), **BEC** (business email compromise — fake invoice/exec request).
- **Other** — pretexting (fabricated scenario), baiting (USB drop), tailgating (follow through door), impersonation, **DoS/DDoS**, on-path (MITM), zero-day, **SQL injection**, XSS, insider threat, supply chain attacks.
- **Password attacks** — brute force, dictionary, password spraying (few passwords, many accounts), credential stuffing.

## 2.6 SOHO malware removal — the 9-step process (ordering PBQ!)

1. **Investigate and verify** malware symptoms.
2. **Quarantine the infected system** (disconnect from network).
3. **Disable System Restore** in Windows.
4. **Remediate infected systems** (remove malware).
5. **Update anti-malware software.**
6. **Scan and removal techniques** (safe mode, preinstallation environment).
7. **Reimage/reinstall** if needed.
8. **Schedule scans and run updates.**
9. **Enable System Restore and create a restore point** in Windows Home; educate the end user.

## 2.7 Workstation hardening

- Data-at-rest encryption (BitLocker), password best practices (length, character types, uniqueness, complexity, expiration), end-user practices (screensaver locks, log off, protect PII, password managers), BIOS/UEFI passwords, **disable guest account**, failed-attempt lockout, timeout/screen lock, account expiration, **change default admin account/password**, disable AutoRun/AutoPlay, restrict log-in times.

## 2.8 Mobile device security

- Screen locks, remote wipe/locate, **MDM enrollment**, app allow-listing, update OS/apps, disable sideloading, **jailbreaking/rooting detection** (bypasses security), Bluetooth disable when unused, secure Wi-Fi, biometric locks, backup/encryption.

## 2.9 Data destruction & disposal

- **Physical** — shredding, degaussing (magnetic), incineration, drill. **Logical** — **overwrite/wipe** (multiple passes), **secure erase**, **factory reset** (mobile), **crypto-shred** (destroy encryption keys). Paper: shredder/cross-cut.
- Match method to media: HDD = degauss/shred/overwrite; SSD = secure erase (degauss ineffective on flash); optical = shred; paper = shred.

## 2.10 SOHO network security

- Change default admin password, **WPA2/WPA3**, disable WPS, disable SSID broadcast (weak but common), MAC filtering (weak), firmware updates, disable remote management, guest network isolation, DHCP reservations.

## 2.11 Browser security

- **Pop-up blockers**, trusted sites/zones, **private/incognito browsing**, **HTTPS/TLS**, clear cache/cookies, extensions/add-ons management, **phishing filters**, autofill/password manager caution, secure DNS (DoH), update browser.

**Exam trap:** The 9-step malware removal order — System Restore is DISABLED early (step 3) so malware can't restore itself, then RE-ENABLED at step 9. This is a classic ordering PBQ.

## Sample questions

1. **Q:** In the SOHO malware removal process, when do you disable System Restore? **A:** Step 3, after quarantining — before remediation.
2. **Q:** Which data destruction method works for SSDs but NOT for HDDs? **A:** Secure erase / crypto-shred (degaussing is ineffective on flash).
3. **Q:** An email from the CEO asks finance to urgently wire funds. Which attack? **A:** Business email compromise (BEC).`,
			position: 5
		},
		{
			id: 'ap2-lesson-3-2',
			moduleId: 'ap2-week-3',
			title: 'Domain 3 — Software Troubleshooting',
			summary:
				'Windows OS issues, mobile OS/app issues and security, and PC security issues — symptom → cause → fix.',
			content: `**Objectives covered:** 3.1–3.4 · **Exam weight:** 23% · **~21 questions**

## 3.1 Windows troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| BSOD (blue screen) | Driver/hardware fault | Note the stop code; check drivers, run sfc/DISM, test RAM |
| Slow startup | Too many startup apps | Task Manager > Startup, disable |
| Application won't start | Missing DLL/dependency, permissions | Reinstall app, run as admin, check Event Viewer |
| Application crashes | Corrupt install, incompatible | Repair install, compatibility mode |
| Windows updates fail | Corrupt update cache | Stop wuauserv, clear SoftwareDistribution, retry |
| "Low memory" | RAM exhaustion, leak | Close apps, increase page file, add RAM |
| Profile issues | Corrupt user profile | Create/repair profile |
| Missing desktop icons | Explorer issue | Restart explorer.exe |
| Wrong time/date | CMOS, timezone, NTP | Set timezone, sync time |
| System sluggish | Disk full, malware, HDD dying | Free space, scan, check S.M.A.R.T. |

- **Tools** — sfc /scannow, DISM /Online /Cleanup-Image /RestoreHealth, chkdsk, System Restore, msconfig safe boot, Event Viewer, Task Manager, Device Manager (roll back driver).

## 3.2 Mobile OS & app issues

- App crashes/freezes → update/reinstall, clear cache; **battery drain** → background apps, screen brightness, sync; **overheating**; connectivity (Wi-Fi/cellular toggle, airplane mode, forget/rejoin); sync failures (account re-auth, storage full); **app not installing** → storage, OS version, sideloading blocked.

## 3.3 Mobile OS & app SECURITY issues

- **Unauthorized location tracking** → check app permissions, revoke; **malware/adware** → uninstall suspicious apps, factory reset if persistent; **jailbroken/rooted device** → cannot trust security, factory reset + don't restore; **sideloaded apps** → disable unknown sources; **phishing/SMishing** → educate; **unsecured Wi-Fi** → use VPN/HTTPS; **lost/stolen** → remote lock/wipe; **account compromise** → change password, MFA, sign out everywhere.

## 3.4 PC security issues

- **Pop-ups/adware** → remove suspicious extensions/programs, run anti-malware; **browser hijacking** (homepage/search changed) → reset browser, check extensions; **ransomware note** → don't pay, restore from backup, isolate; **unusual logins** → change password, MFA, review sign-in activity; **fake antivirus/scareware** → don't call the number, remove the program; **unknown processes at startup** → investigate in Task Manager, remove; **USB autorun malware** → disable AutoPlay, scan the drive; **phishing emails** → report, don't click.

**Exam trap:** "Troubleshoot mobile OS and application issues" (3.2) is about FUNCTION; "…application security issues" (3.3) is about SECURITY (malware, permissions, tracking). Keep them straight — the exam does.

## Sample questions

1. **Q:** Windows updates keep failing with a corrupt cache. What should you try? **A:** Stop the update service, clear SoftwareDistribution, retry.
2. **Q:** A user's phone was jailbroken and now shows unknown apps. What's the safest action? **A:** Factory reset and restore from a trusted backup (or don't restore).
3. **Q:** A browser's homepage changed to an ad site after an install. First step? **A:** Remove suspicious extensions and reset browser settings.`,
			position: 6
		},
		{
			id: 'ap2-lesson-4-1',
			moduleId: 'ap2-week-4',
			title: 'Domain 4 — Operational Procedures + Exam Strategy',
			summary:
				'Documentation, change management, backup/recovery, safety, environmental, privacy/licensing, communication, scripting, remote access, AI basics — plus Core 2 exam-day strategy.',
			content: `**Objectives covered:** 4.1–4.10 · **Exam weight:** 21% · **~19 questions** + Core 2 strategy

## 4.1 Documentation & support systems

- **Ticketing systems** — user info, device info, description, categories, severity, escalation levels, clear concise written communication, progress notes, issue resolution.
- **Asset management** — inventory lists, **CMDB**, asset tags/IDs, procurement lifecycle, warranty/licensing, assigned users.
- **Document types** — incident reports, **SOPs** (standard operating procedures), knowledge base/articles, new-user onboarding checklist, off-boarding checklist, **SLAs** (service-level agreements).

## 4.2 Change management

- **Request → review → approve → plan (rollback) → schedule → implement → document.** Emergency changes still need documentation; **backout plans** required; approval from change advisory board for major changes.

## 4.3 Backup & recovery

- **Backup types** — full, incremental (since last backup of any type), differential (since last full); **scheduled backups**, 3-2-1 rule (3 copies, 2 media, 1 offsite); **restore testing** (verify backups!), cloud backup, system image, file history (Windows), Time Machine (macOS).
- **Recovery** — restore files, system image restore, boot from recovery media, **Windows Recovery Environment (WinRE)**.

## 4.4 Safety procedures

- **ESD** — anti-static wrist strap, mat; handle components by edges; **electrical safety** — unplug before working, never open PSU/monitor (capacitors), one-hand rule for live circuits; **fire safety** — know extinguisher types (ABC, CO2 for electrical), evacuation routes; **physical safety** — lifting technique, trip hazards, sharp edges.

## 4.5 Environmental impacts & controls

- **Recycling** — e-waste, batteries (lithium), toner cartridges; **hazardous materials** — lead, mercury (old monitors), CRTs; **temperature/humidity** — server rooms, cooling; **power** — surge suppressors, UPS, generators; **airflow/cable management**; proper disposal per local regulations.

## 4.6 Privacy, licensing & policies

- **PII** — personally identifiable information: handle/encrypt/minimize; **GDPR** — EU data rights; **HIPAA** — health data; **prohibited content/activity** — AUP violations, illegal content, policy on personal use; **licensing** — **EULA** (end-user license agreement), per-seat vs per-device, volume licensing, open-source (GPL/MIT), **DRM**; **data retention** policies.

## 4.7 Communication & professionalism

- **Active listening**, avoid jargon, set expectations, **status updates**, documentation in tickets, professional tone, empathy, proper escalation, don't argue/blame, follow up, remote support etiquette (ask before controlling), cultural awareness.

## 4.8 Scripting basics

- **Languages** — PowerShell (Windows automation), cmd/batch (.bat), bash (Linux/macOS), Python, JavaScript.
- **Concepts** — variables, loops, conditionals, functions; **use cases** — user creation, log aggregation, file cleanup, monitoring, scheduled tasks; run scripts with appropriate privileges; test in staging; PowerShell execution policy; shebang (#!) in bash.

## 4.9 Remote access

- **RDP** (Windows, 3389), **VNC** (cross-platform), **SSH** (secure shell), VPN (client-to-site), remote support tools (TeamViewer, AnyDesk, Quick Assist), **screen sharing**, RMM (remote monitoring and management), cloud desktops (DaaS/VDI), security: MFA + strong auth, restrict by IP, log sessions.

## 4.10 Basic AI concepts (NEW in V15)

- **LLMs** — large language models; **RAG** (retrieval-augmented generation — ground answers in fetched documents to reduce hallucination); **hallucinations** — confident wrong answers (verify AI output, cite sources); **deepfakes** — AI-generated fake media (verify identity, media literacy); **prompt injection** — malicious instructions hidden in prompt context; **ethical use** — privacy (don't paste PII into public AI tools), bias, transparency, data governance.

## Core 2 exam facts

- **90 questions / 90 minutes, pass = 700/900 (77.8%).** Domains: OS 28%, Security 28%, Software Troubleshooting 23%, Operational Procedures 21%.

## Readiness checklist

- [ ] All six objective quizzes submitted (Domains 1–4 + targeted reviews)
- [ ] Both scenario/PBQ sets completed
- [ ] Full Practice Exams #1 and #2 under real conditions (90 Q, 90 min)
- [ ] Weak topics reviewed — redo quizzes for anything < 78%
- [ ] Score **700/900 (77.8%) or higher** on at least one full exam

## PBQ & exam-day strategy (Core 2)

- **Ordering PBQ lock**: malware removal 9-step (disable System Restore early, re-enable last), change management, backup schedule.
- **Matching**: Windows tool ↔ function (Task Manager ↔ performance, msconfig ↔ boot options, Disk Management ↔ partitions), malware ↔ description, data destruction ↔ media type.
- **Configuration**: Windows security settings (UAC level, firewall profile, Defender), SOHO router (WPA3, admin password), browser security settings.
- **Evidence**: interpret ipconfig/ping output, Event Viewer entries, BSOD stop codes.
- ~1 minute per question, flag and move on, never leave a blank, "Which TWO" = exact count, "BEST/MOST/FIRST" = satisfy the constraint.

## Day before / day of

Rest; review weakest 2-3 topics (commands, 9-step process, acronyms). Confirm test logistics, photo ID, arrive early. Target 700+, keep moving.`,
			position: 7
		}
	],
	assignments: [
		// Week 1 — Domain 1
		{
			id: 'ap2-1',
			moduleId: 'ap2-week-1',
			title: 'Domain 1 Objective Quiz',
			description:
				'20 multiple-choice questions covering objectives 1.1–1.11 (Operating Systems).',
			kind: 'quiz',
			category: 'quiz',
			points: 20,
			count: 20,
			domain: D1,
			mode: 'practice',
			durationMinutes: 25,
			dueOffsetDays: -24,
			position: 1
		},
		{
			id: 'ap2-2',
			moduleId: 'ap2-week-1',
			title: 'Windows Tools & CLI Drill',
			description:
				'20 multiple-choice questions focused on Windows tools, MMC snap-ins, and command-line utilities.',
			kind: 'quiz',
			category: 'quiz',
			points: 20,
			count: 20,
			domain: D1,
			mode: 'practice',
			durationMinutes: 25,
			dueOffsetDays: -22,
			position: 2
		},
		{
			id: 'ap2-3',
			moduleId: 'ap2-week-1',
			title: 'Week 1 Checkpoint Exam',
			description:
				'20-question timed mini-exam over Domain 1. Your first exam-conditions check-in.',
			kind: 'quiz',
			category: 'full',
			points: 20,
			count: 20,
			domain: null,
			mode: 'exam',
			durationMinutes: 20,
			dueOffsetDays: -20,
			position: 3
		},
		// Week 2 — Domain 2
		{
			id: 'ap2-4',
			moduleId: 'ap2-week-2',
			title: 'Domain 2 Objective Quiz',
			description:
				'20 multiple-choice questions covering objectives 2.1–2.11 (Security).',
			kind: 'quiz',
			category: 'quiz',
			points: 20,
			count: 20,
			domain: D2,
			mode: 'practice',
			durationMinutes: 25,
			dueOffsetDays: -17,
			position: 4
		},
		{
			id: 'ap2-5',
			moduleId: 'ap2-week-2',
			title: 'Security Scenario Set',
			description:
				'10 applied security scenarios — social engineering, hardening, malware response decisions.',
			kind: 'scenario',
			category: 'scenario-pbq',
			points: 10,
			count: 10,
			domain: D2,
			mode: 'practice',
			durationMinutes: 20,
			dueOffsetDays: -15,
			position: 5
		},
		{
			id: 'ap2-6',
			moduleId: 'ap2-week-2',
			title: 'PBQ Practice Set',
			description:
				'5 performance-based questions — ordering (malware removal), matching, configuration, and evidence tasks.',
			kind: 'pbq',
			category: 'scenario-pbq',
			points: 5,
			count: 5,
			domain: null,
			mode: 'practice',
			durationMinutes: 30,
			dueOffsetDays: -14,
			position: 6
		},
		{
			id: 'ap2-7',
			moduleId: 'ap2-week-2',
			title: 'Full Practice Exam #1',
			description:
				'90-question, 90-minute full-length exam with all four domains and 4 PBQs — exam conditions.',
			kind: 'full',
			category: 'full',
			points: 90,
			count: 90,
			domain: null,
			mode: 'exam',
			durationMinutes: 90,
			dueOffsetDays: -13,
			position: 7
		},
		// Week 3 — Domains 3 & 4
		{
			id: 'ap2-8',
			moduleId: 'ap2-week-3',
			title: 'Domain 3 Objective Quiz',
			description:
				'20 multiple-choice questions covering objectives 3.1–3.4 (Software Troubleshooting).',
			kind: 'quiz',
			category: 'quiz',
			points: 20,
			count: 20,
			domain: D3,
			mode: 'practice',
			durationMinutes: 25,
			dueOffsetDays: -9,
			position: 8
		},
		{
			id: 'ap2-9',
			moduleId: 'ap2-week-3',
			title: 'Domain 4 Objective Quiz',
			description:
				'20 multiple-choice questions covering objectives 4.1–4.10 (Operational Procedures).',
			kind: 'quiz',
			category: 'quiz',
			points: 20,
			count: 20,
			domain: D4,
			mode: 'practice',
			durationMinutes: 25,
			dueOffsetDays: -7,
			position: 9
		},
		{
			id: 'ap2-10',
			moduleId: 'ap2-week-3',
			title: 'Full Practice Exam #2',
			description:
				'Second 90-question, 90-minute full-length exam. Aim for 80%+ and note your weak domains.',
			kind: 'full',
			category: 'full',
			points: 90,
			count: 90,
			domain: null,
			mode: 'exam',
			durationMinutes: 90,
			dueOffsetDays: -6,
			position: 10
		},
		// Week 4 — Final review
		{
			id: 'ap2-11',
			moduleId: 'ap2-week-4',
			title: 'Weak-Topic Targeted Review',
			description:
				'Mixed 20-question practice quiz to close out your weakest objectives before the final exam.',
			kind: 'quiz',
			category: 'quiz',
			points: 20,
			count: 20,
			domain: null,
			mode: 'practice',
			durationMinutes: 25,
			dueOffsetDays: -3,
			position: 11
		},
		{
			id: 'ap2-12',
			moduleId: 'ap2-week-4',
			title: 'Full Practice Exam #3 (Final)',
			description:
				'Final 90-question, 90-minute exam. Target 700/900 scaled (77.8%) or higher — the real pass mark.',
			kind: 'full',
			category: 'full',
			points: 90,
			count: 90,
			domain: null,
			mode: 'exam',
			durationMinutes: 90,
			dueOffsetDays: -2,
			position: 12
		}
	]
};
