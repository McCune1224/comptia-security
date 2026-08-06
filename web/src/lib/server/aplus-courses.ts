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

Laptop and mobile hardware is built for serviceability (FRUs — field-replaceable units). Know what each part looks like, how it's secured, and the safe way to swap it.

- **Battery** — lithium-ion; swollen battery = replace immediately (do not puncture). Laptop batteries are often internal (screw-down, connector + screws) or external (latch). When replacing, power off, unplug AC, and use a plastic spudger — never pry with metal near the cells.
- **Keyboard/keys** — laptop keyboards use scissors/butterfly mechanisms; key cap replacement via retainer clips; beware ribbon cables (thin, fragile, ZIF connectors with a flip-up latch). A keyboard swap on many laptops means removing the whole palmrest.
- **RAM** — laptops use **SODIMM**; some are soldered (non-upgradable); check max supported, DDR generation, and number of slots before ordering. Match speed and voltage; mixing DDR4/DDR5 physically won't fit (different notches).
- **Storage** — 2.5" HDD/SSD (SATA), **M.2** (SATA or NVMe — check key: B-key SATA, M-key NVMe, B+M both); upgrading HDD→SSD is the single biggest perceived speedup. M.2 cards need a standoff screw; don't overtighten.
- **Wireless cards** — Mini-PCIe/M.2 Wi-Fi cards with **antenna connectors** (U.FL/MHF tiny coax, color-coded main/aux); re-seat antenna connectors after a card swap — a loose antenna kills signal, not the card.
- **Physical privacy/security** — biometrics (fingerprint reader, IR camera for Windows Hello), NFC scanner features (contactless cards); smart card readers (CAC/PIV) on business laptops.
- **Camera/webcam, microphone** — ribbon cables; camera privacy shutters; mic array location; some webcams are modular (top bezel assembly).

**Exam traps:** (1) NVMe M.2 keys — B-key (SATA) vs M-key (NVMe) vs B+M (either). (2) Laptop RAM is SODIMM, not DIMM. (3) A swollen battery is a safety issue — stop using the device. (4) After a Wi-Fi card swap, the FIRST suspect for no signal is the antenna connector.

## 1.2 Connections & accessories

| Connection | Use | Notes |
|---|---|---|
| USB-C | Modern data/charging | Reversible, up to 40 Gbps (TB3/4), Power Delivery (PD) |
| USB-A (3.x) | Peripherals/storage | 3.0 = 5 Gbps (blue insert), 3.1 = 10 Gbps, 3.2 = 20 Gbps |
| microUSB/miniUSB | Legacy Android/accessories | Micro-USB B is the common legacy one |
| Lightning | Apple devices (pre-USB-C) | Proprietary, 8-pin |
| Thunderbolt | High-speed docking/display | TB1/2 = Mini-DP, TB3/4 = USB-C, 40 Gbps, daisy-chain |
| NFC | Contactless payments/pairing | ~4 cm range, tap-to-pair |
| Bluetooth | Wireless peripherals | Pairing via PIN; discoverable mode; version matters (5.x = better range/LE) |
| Tethering/hotspot | Share phone data | USB tethering, Bluetooth PAN, Wi-Fi hotspot (uses data cap!) |
| HDMI/DisplayPort | External display | Video-out via adapter or native port |

- **Accessories** — stylus (precision input; active = pressure-sensitive digitizer, passive = any-touch), headsets (3.5mm/USB-C/Bluetooth), speakers, webcam, docking station (full expansion + power), port replicator (ports only, no expansion slot), trackpad/trackpoint, drawing pad (digitizer).

**Exam trap:** Docking station ≠ port replicator — a dock adds expansion (eGPU, multiple monitors, charging), a replicator just mirrors existing ports.

## 1.3 Mobile connectivity, MDM, sync

- **Cellular** — 3G/4G/5G; enable/disable data, **hotspot** shares the cellular connection (watch data caps). **SIM/eSIM** — eSIM is programmable without a physical card; IMEI identifies the device (report a stolen phone by IMEI). **APN** — the data profile (access point name) carriers use; wrong APN = no data but calls work.
- **Wi-Fi** — connect to SSID, WPA2/WPA3 passphrase; airplane mode disables radios; forget/repair a network by forgetting the SSID.
- **Bluetooth** — enable, pairing (discoverable → select device → PIN/confirm → test connectivity); unpair to fix connection loops.
- **Location services** — GPS (satellite, precise), cellular location (tower triangulation, works indoors), Wi-Fi positioning (MAC-based, urban). Location privacy settings per app.
- **MDM** — mobile device management: enforce corporate policy on enrolled devices, push corporate apps, remote wipe/lock, enforce screen locks/passcodes, block sideloading, geofencing. **BYOD** (personal device, containerization — corporate data in a sandbox) vs **corporate-owned** (full control), **COPE** (corporate-owned, personally enabled), **CYOD** (choose your own device from an approved list).
- **Sync** — calendar, contacts, mail, cloud storage; recognize **data caps** when syncing over cellular (sync on Wi-Fi); account sync errors → check credentials, storage, and sync toggles.

## Sample questions

1. **Q:** A user's 3-year-old laptop suddenly won't hold a charge and the trackpad area feels swollen. What's the FIRST action? **A:** Power down and replace the battery — swelling is a lithium-ion safety hazard.
2. **Q:** Which mobile connection is BEST for contactless payments at a terminal? **A:** NFC — a few centimeters of range, tap-to-pay.
3. **Q:** A company needs to enforce a screen-lock policy on employee-owned phones. Which technology? **A:** MDM enrollment with policy enforcement (BYOD container).
4. **Q:** A laptop's Wi-Fi works at 1 meter but drops at 5 meters after a card swap. First suspect? **A:** The antenna connectors weren't re-seated.`,
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
- **OLED** — self-emissive (no backlight), true blacks, thin; burn-in risk. **Mini-LED** — many small LEDs for local dimming (better contrast than plain LED).
- **Touch screen/digitizer** — capacitive (finger) vs active digitizer (stylus pressure). A dead touch layer with a working display = digitizer replacement; both dead = full LCD+digitizer assembly.
- **Attributes** — pixel density (PPI), refresh rate (Hz; 60/120/144+), resolution (1080p/1440p/4K), aspect ratio (16:9, 16:10, 21:9 ultrawide), color gamut (sRGB/Adobe RGB/DCI-P3), brightness (nits), native resolution (always match it — non-native looks blurry).
- **Projectors** — lamp vs laser; lamp hours burn out over time (dim/warm image → replace lamp); throw distance and ambient light affect image.

**Exam trap:** "Native resolution" — an LCD always looks best at its native resolution; scaling to anything else softens text.

## 3.2 Cables & connectors

| Cable/connector | Use | Notes |
|---|---|---|
| Cat 5e/6/6a twisted pair | Ethernet | RJ-45; 1/10 Gbps; **T568A vs T568B** wiring; **plenum-rated** for air-handling spaces; **STP** shielded vs **UTP**; **direct burial** for outdoor |
| Coaxial | Cable internet/TV | F-type connectors; RG-6 (better shielding) vs RG-59 |
| Fiber | Long/fast links | **Single-mode** (laser, long, yellow) vs **multimode** (LED, short, orange/teal); LC/SC/ST connectors |
| HDMI | Audio+video | 19-pin; ARC/eARC; versions add bandwidth (2.1 = 8K) |
| DisplayPort | Audio+video | Daisy-chain, higher bandwidth; common on monitors |
| DVI / VGA | Legacy video | DVI digital (DVI-D), VGA analog (blue, 15-pin) |
| USB-C / Thunderbolt | Data+video+power | TB3/4 = 40 Gbps, single-cable docking |
| SATA | Internal drives | 6 Gbps; data + power connectors |
| M.2 | SSDs/Wi-Fi cards | SATA or NVMe; 2230/2242/2260/2280 lengths |
| eSATA | External SATA drives | Legacy external storage |

**Exam traps:** (1) T568A/B differ in the orange/green pair positions — never mix standards on one run. (2) Plenum cable = fire-retardant for ceilings, not "better speed". (3) VGA is analog — no digital signal. (4) Single-mode fiber = long distance + laser; multimode = short + LED.

## 3.3 RAM

- **DDR generations** — DDR3 (240-pin DIMM / 204 SODIMM, 1.5V), DDR4 (288/260, 1.2V), DDR5 (288, different notch, 1.1V, on-die ECC). Not interchangeable — notches differ. **DDR5** doubles the prefetch and adds on-die ECC (not the same as system ECC).
- **DIMM vs SODIMM** — desktop vs laptop. **ECC** (error-correcting, servers, usually registered/buffered) vs non-ECC. ECC RAM in a non-ECC board usually won't boot.
- **Dual-channel** — matched pairs in the correct slots (usually color-coded A1/B1 or A2/B2) = more bandwidth; single stick = single channel. Quad-channel on high-end platforms.
- **Speed/latency** — DDR4-3200 (MT/s), CAS latency (CL) — lower CL = lower latency; matching modules avoids instability. XMP/EXPO profiles overclock RAM to rated speeds.
- **Upgrades** — check max capacity per slot, generation, and voltage; a 32GB max board with two slots = 16GB per slot.

**Exam trap:** Speed (MT/s) and latency (CL) are separate — DDR4-3600 CL16 can be faster than DDR4-3600 CL18.

## 3.4 Storage

- **HDD** — spinning platters, SATA 6 Gbps, cheap per GB, mechanical failure (clicking = heads); 5400 (quiet/slow) vs 7200 RPM (faster).
- **SSD** — SATA SSD (≈550 MB/s) vs **NVMe** (PCIe, 4-7 GB/s); no moving parts, silent, shock-resistant. **Hybrid (SSHD)** — small flash cache in front of a platter drive.
- **Form factors** — 2.5"/3.5" SATA, M.2 (2230–2280), U.2 (enterprise).
- **RAID** — 0 striping (speed, no redundancy), 1 mirroring (50% capacity), 5 striping+parity (n-1 capacity, 1-drive fault tolerance), 10 mirrored stripes (50%, survives multiple). Hardware RAID (controller card) vs software (OS).
- **S.M.A.R.T.** — drive self-diagnostics (reallocated sectors, spin-up time); warnings = back up and replace. **IOPS** — operations per second (random I/O performance).

**Exam trap:** RAID 5 with 3×1TB = 2TB usable (one drive for parity). RAID 1 with 2×1TB = 1TB. RAID 0 with 2×1TB = 2TB but NO fault tolerance.

## Sample questions

1. **Q:** A user's laptop screen is very dim but shows a faint image under a bright light. What's the likely fault? **A:** Backlight/inverter failure.
2. **Q:** Which cable type is required for runs through a building's plenum ceiling space? **A:** Plenum-rated (fire-retardant jacket).
3. **Q:** 3×2TB drives in RAID 5 — usable capacity? **A:** 4TB (n-1).
4. **Q:** A server needs RAM that can detect and correct single-bit errors. Which type? **A:** ECC (error-correcting) memory.`,
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

- **Form factors** — ATX (12×9.6"), microATX (mATX, smaller, fewer slots), Mini-ITX (ITX, compact). Smaller = fewer slots; case and PSU must match the board.
- **Sockets/chipsets** — CPU socket must match CPU (Intel LGA 1700/1851, AMD AM4/AM5…); chipset determines features (PCIe lanes, USB, SATA, overclocking). **Compatibility first** — check CPU ↔ socket ↔ chipset ↔ RAM generation ↔ BIOS support before ordering parts.
- **Slots** — PCIe x1/x4/x16 (GPU = x16; lane width matters for bandwidth), M.2 (SSD/Wi-Fi), DIMM slots (channel order — install matched pairs in the correct slots), SATA ports, front-panel headers, 24-pin/8-pin power headers.
- **BIOS/UEFI** — **UEFI** (modern, Secure Boot, GPT, mouse-driven) vs legacy BIOS (MBR, keyboard-only). Settings: boot order, Secure Boot on/off, **TPM** (hardware security chip — BitLocker, Windows 11 requirement; TPM 2.0), **XMP/EXPO** (RAM profile), virtualization (VT-x/AMD-V), secure boot keys, firmware updates (via USB or internet flash).
- **CPU install** — socket lever, alignment notches/arrow, **thermal paste** (pea-size, no need to spread), heat sink/fan or liquid cooler with correct mounting pressure; overheat = shutdowns/throttling. Apply paste BEFORE mounting the cooler; replace on re-seats.
- **Expansion cards** — GPU (PCIe x16 + 6/8-pin power), NIC, sound card, capture card; match slot/lane; secure with bracket screw; update drivers after install.

**Exam trap:** Always check CPU socket compatibility before ordering — a CPU physically fits ONLY its socket family (and often only with a matching BIOS version).

## 3.6 Power

- **PSU** — wattage must exceed total draw with headroom (add up components, aim 20-30% above); **80 Plus** efficiency (Bronze/Silver/Gold/Platinum — higher = less waste heat); **modular** (detachable cables) vs semi vs fixed.
- **Connectors** — 24-pin ATX main, 4/8-pin **EPS** (CPU), SATA power, Molex (legacy drives/fans), 6/8-pin PCIe (GPU; 12VHPWR on newest GPUs).
- **Protection** — surge suppressor (spikes only) vs **UPS** (battery backup + surge; keeps PC running through outages — size it for runtime), **line conditioner** (voltage regulation). A power supply tester verifies rail voltages.
- **Safety** — never open a PSU (charged capacitors can hold lethal voltage for days); ESD strap when working inside a case; unplug before touching internals.

**Exam trap:** A UPS ≠ surge protector — only a UPS keeps the machine running during an outage. Read PSU wattage from the label, never assume from size.

## 3.7 Multifunction devices

- **MFD** — print/scan/copy/fax in one; **duplexer** (two-sided printing), **ADF** (automatic document feeder — multi-page scanning), flatbed scanner (books, thick originals), **finisher** (staple/hole-punch options on office models).
- **Connectivity** — USB, Ethernet (wired network printing), Wi-Fi (WPS or SSID config), NFC (tap-to-print), cloud printing; install the right driver; **print queue/spooler** (jobs stuck = restart the spooler service or clear the queue).
- **Scan features** — scan to email, scan to network folder (SMB), scan to cloud, OCR; **copy** — reduce/enlarge, collate, duplex.

## 3.8 Printer types & maintenance

- **Laser** — toner (powder) + **imaging drum** + **fuser** (heat/pressure bonds toner). Imaging process (know the order): charge → expose (laser writes image) → develop (toner sticks) → transfer (to paper) → fuse (heat seals it). Maintenance kit = fuser + rollers. Faded = low toner; vertical lines = drum/wiper; ghost images = drum not fully cleaned/old.
- **Inkjet** — liquid ink, **printhead** (clog = streaks/missing colors → run the printhead cleaning cycle), ink cartridges; paper feed issues = rollers; **pigment vs dye** inks.
- **Thermal** — heat + special paper (receipts, labels); no ink/toner; fading over time is normal for thermal paper.
- **Impact** — dot-matrix pins + ribbon (multi-part forms, carbon copies); ribbon replacement.
- **3D printers** — filament (FDM) or resin; bed leveling, nozzle cleaning, filament jams.
- **General maintenance** — clear jams by opening access panels (follow the diagram — don't pull paper), replace paper (fan it first), run calibration/test pages, clean rollers, update firmware; **fuser is HOT** — let it cool before servicing.

**Exam trap:** Laser = toner+drum+fuser (heat); inkjet = printhead (liquid); thermal = heat+paper only; impact = pins+ribbon.

## Sample questions

1. **Q:** A new GPU needs more power than the motherboard slot provides. Which connector? **A:** 6/8-pin PCIe power from the PSU.
2. **Q:** Windows 11 requires a security chip for BitLocker and device health. Which one? **A:** TPM 2.0.
3. **Q:** A laser printer shows vertical lines on every page. What's most likely? **A:** Damaged imaging drum or dirty wiper blade.
4. **Q:** Which device keeps a workstation running through a power outage? **A:** A UPS (uninterruptible power supply).`,
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
| 67/68 | DHCP | IP assignment (67 server, 68 client) |
| 80 | HTTP | Web (plaintext) |
| 110 | POP3 | Receive email (download) |
| 143 | IMAP | Receive email (server-side folders) |
| 137-139 | NetBIOS/NetBT | Legacy Windows naming |
| 389 | LDAP | Directory services |
| 443 | HTTPS | Web (encrypted) |
| 445 | SMB/CIFS | Windows file sharing |
| 3389 | RDP | Remote desktop |

- **TCP** — connection-oriented (3-way handshake: SYN, SYN-ACK, ACK), reliable, ordered, retransmits lost segments. **UDP** — connectionless, fast, no guarantee (streaming, VoIP, DHCP, DNS queries, TFTP).
- Quick mnemonic: *email* = 25/110/143, *remote* = 22 (secure)/23 (insecure)/3389 (desktop), *files* = 20/21/445, *web* = 80/443.

## 2.2 Wireless

- **Frequencies** — 2.4 GHz (longer range, more interference), 5 GHz (faster, shorter), 6 GHz (Wi-Fi 6E/7). **Channels** — regulations limit power/channels; select non-overlapping channels (1/6/11 on 2.4 GHz). **Channel width** — wider (40/80/160 MHz) = faster but more interference.
- **802.11 standards** — a (5 GHz, 54 Mbps), b/g (2.4 GHz, 11/54 Mbps), n (dual-band, ~600 Mbps), ac (5 GHz, ~1.3+ Gbps), ax (Wi-Fi 6, dual + 6E, OFDMA/MU-MIMO), be (Wi-Fi 7).
- **Bluetooth** — PAN, pairing, ~10 m; **NFC** — ~4 cm contactless; **RFID** — tags/readers (access badges, inventory); **infrared** — legacy line-of-sight.

## 2.3 Network services

- **Server roles** — DNS (name→IP), DHCP (IP assignment), file share (SMB), print server, mail, **syslog** (log aggregation), web, **AAA** (authentication/authorization/accounting), database, **NTP** (time sync — important for logs), **proxy** (forward/caching/filtering).
- **Internet appliances** — spam gateway (email filtering), **UTM** (all-in-one firewall/IPS/AV/web filter), load balancer (distribute traffic), content filter (CIPA/parental controls).
- **Legacy/embedded** — **SCADA** (industrial control systems), IoT devices (often insecure by default).

## 2.4 Network configuration

- **DNS records** — A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail server), TXT (SPF/DKIM/DMARC — anti-spoofing/email auth), PTR (reverse lookup), SRV (service location).
- **DHCP** — **DORA** (Discover → Offer → Request → Acknowledge); scope (address pool), **exclusions** (reserved out of pool), **reservations** (MAC→fixed IP), lease times (renewal at 50%).
- **VLAN** — segment broadcast domains on a switch (security + performance). **VPN** — encrypted tunnel (client-to-site for remote users, site-to-site between offices; protocols: IPsec, WireGuard, SSL/TLS VPN).

## 2.5 Hardware devices

- **Router** (routes between networks/NAT), **switch** (LAN forwarding; managed = configurable/VLANs/SNMP, unmanaged = plug-and-play), **access point** (wireless bridge to wired LAN), **patch panel** (cable termination point — punchdown), **firewall** (filter traffic), **PoE** (power over Ethernet via injector or switch; 802.3af ≈15W / at ≈30W / bt ≈60-90W), **cable modem** (coax), **DSL modem** (phone line), **ONT** (fiber — optical network terminal), **NIC** (has a MAC address; can be wired or wireless).

## 2.6 SOHO configuration

- **IPv4** — private ranges: **10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16**; public = internet-routable; **loopback** 127.0.0.1. **IPv6** — 128-bit (fe80:: link-local, ::1 loopback). **APIPA** — 169.254.x.x when DHCP fails. **Static vs dynamic** (DHCP). **Subnet mask** (255.255.255.0 = /24). **Gateway** — next hop off the LAN. **DNS servers** — resolver config.
- SOHO router: WAN to modem, LAN to devices; configure SSID + **WPA2/WPA3**, change default admin password, update firmware, set DHCP pool, port forwarding (expose services), QoS (prioritize traffic), guest network isolation.

**Exam trap:** 169.254.x.x (APIPA) ALWAYS means "couldn't reach a DHCP server" — check the cable/DHCP, not the internet.

## 2.7 Connection & network types

- **Internet** — satellite (high latency, anywhere), fiber (fast, symmetric, expensive to install), cable (coax, shared bandwidth), DSL (phone line, distance-limited), cellular (4G/5G, mobile), **WISP** (wireless ISP — point-to-point microwave).
- **Network types** — LAN (local), WAN (wide, internet-scale), PAN (Bluetooth personal), MAN (metro), SAN (storage area network), WLAN (wireless LAN), VPN (virtual overlay).

## 2.8 Network tools

- **Crimper** (attach RJ-45/RJ-11 connectors), **cable stripper**, **Wi-Fi analyzer** (signal/channel survey — pick clean channels), **toner probe** (trace cables through walls/patch panels), **punchdown tool** (patch panel/keystone termination), **cable tester** (verify wiring/pinout), **loopback plug** (test NIC), **network tap** (passive traffic capture).

## Sample questions

1. **Q:** Which port does encrypted remote administration of a server use? **A:** 22 (SSH).
2. **Q:** A user's PC shows 169.254.x.x after boot. What happened? **A:** DHCP failed — APIPA link-local address.
3. **Q:** Which device separates broadcast domains? **A:** A VLAN-capable (managed) switch.
4. **Q:** A SOHO needs PoE for a ceiling AP. Which standard supplies ~30W per port? **A:** 802.3at (PoE+).`,
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

- **Hypervisor** — the VM management layer. **Type 1 (bare-metal)** — runs directly on hardware (ESXi, Hyper-V, Proxmox, XenServer). **Type 2 (hosted)** — runs inside an OS (VirtualBox, VMware Workstation, Parallels). Type 1 is the datacenter standard; Type 2 is for testing/workstations.
- **Host vs guest** — host = physical server; guest = VM. **VM resources** — virtual CPU/RAM/disk/NIC allocated from the host's physical pool. VMs are files on the host (disk images, config, NVRAM).
- **Resource allocation** — **reservations** (guaranteed minimum), **limits** (cap), **shares** (priority), **memory overcommitment** (allocating more vRAM than physical; **ballooning** reclaims idle guest memory), thin vs thick provisioning (thin = grows on demand; thick = allocated up front).
- **Snapshots** — point-in-time VM state for rollback (great before updates). **Clone** — identical copy (fast provisioning). **Template** — golden image for deploying many VMs. **Live migration** — move a running VM between hosts, zero downtime (vMotion). **Cold migration** — move a powered-off VM.
- **Sandboxing** — isolate untrusted software in a VM (malware analysis, testing). **VM escape** — a guest breaking out to the host (critical security risk — patch hypervisors, keep isolation).
- **Virtual switches** — vSwitch inside the host connecting VMs to each other and the physical NIC; VLAN tagging on virtual ports.
- **VDI** — virtual desktop infrastructure: centralized desktops streamed to thin clients (management + security win); **DaaS** — the cloud-hosted version.
- **Emulation vs virtualization** — emulation translates instructions (slow, cross-architecture); virtualization runs native instructions (fast).

**Exam trap:** Type 1 = no host OS (ESXi/Hyper-V/Proxmox); Type 2 = an OS runs first (VirtualBox/Workstation). A snapshot ≠ a backup — snapshots depend on the host and don't protect against host loss.

## 4.2 Cloud computing

- **Service models** —
  - **IaaS** (rent VMs/storage/network; you manage the OS, apps, data — e.g. AWS EC2, Azure VMs)
  - **PaaS** (managed platform: runtime, DB, build tools; you bring the app — e.g. Heroku, Azure App Service)
  - **SaaS** (finished application; provider does everything — e.g. Microsoft 365, Google Workspace, Salesforce)
- **Deployment models** — public (shared provider infrastructure), private (single org, own or hosted), **hybrid** (private + public, workloads burst to cloud), community (shared by orgs with common needs, e.g. government/healthcare), **multi-cloud** (multiple public providers for resilience/avoiding lock-in), **on-premises** (no cloud).
- **Characteristics** (NIST five) — on-demand self-service, broad network access, **resource pooling**, **rapid elasticity** (auto-scale with load), **metered/pay-per-use** (measured billing).
- **Shared responsibility** — provider secures the cloud (physical, host, network); customer secures what's IN the cloud (OS, apps, data, access, config). The split moves up the stack: IaaS = customer does more; SaaS = provider does almost everything.
- **Cloud migration** — lift-and-shift (rehost), replatform, refactor; **cloud bursting** — spill overflow to public cloud during peaks.
- **Concepts to know** — availability zones/regions (redundancy), scaling (vertical = bigger VM, horizontal = more VMs), orchestration/automation (infrastructure as code), cost (pay-as-you-go vs reserved).

**Exam trap:** IaaS = you patch the OS; SaaS = provider does everything. Hybrid = mix of private AND public. Scaling UP = bigger machine; scaling OUT = more machines.

## Sample questions

1. **Q:** A hypervisor installed directly on server hardware, no host OS. Which type? **A:** Type 1 (bare-metal).
2. **Q:** A company rents VMs and manages the OS itself. Which model? **A:** IaaS.
3. **Q:** What feature rolls a VM back after a bad update? **A:** Snapshot.
4. **Q:** An app must handle seasonal traffic spikes by adding temporary capacity from a public provider while keeping its private datacenter. Which deployment? **A:** Hybrid cloud (cloud bursting).
5. **Q:** Which NIST characteristic lets users provision resources without waiting for IT? **A:** On-demand self-service.`,
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
| POST beeps, no video | RAM/GPU fault | Reseat RAM/GPU, test one stick at a time |
| Blank screen, fans spin | GPU/display cable | Check cable, reseat GPU, test integrated video |
| No power at all | PSU/cable/switch | Verify wall outlet, PSU switch, test PSU with tester |
| Random shutdowns under load | Overheating | Clean fans, reapply thermal paste, check cooler mount |
| Repeated reboots / BSOD | RAM or driver fault | Run memory test (memtest), update drivers |
| Date/time resets | CMOS battery dead | Replace CR2032 |
| Capacitor swelling | Failing board | Replace motherboard |
| CPU fan error at POST | Fan unplugged/failed | Reseat fan header, replace fan |
| Intermittent freezes | RAM/PSU/overheating | Check temps, test RAM, verify PSU rails |
| No display, no beeps, fans spin | CPU/RAM/board | Remove all but CPU+1 stick, listen for beeps |

**Method:** power off → unplug → check cables/connections → minimal boot (CPU + one RAM stick, no add-ons) → swap known-good parts one at a time.

## 5.2 Drive & RAID

- **Grinding/clicking** — failing HDD heads: back up NOW, replace drive.
- **S.M.A.R.T. warnings / reallocated sectors** — drive failing: replace (back up first).
- **Bootable device not found** — check boot order, drive connection (SATA power+data), dead drive, BIOS drive detection.
- **RAID** — array missing/offline: check drives; degraded = one drive failed (replace + rebuild); multiple failures = rebuild from backup. Controller battery/BBU failing = array may need forced mount.
- **Slow performance** — near-full drive, failing sectors, wrong SATA mode (IDE vs AHCI).
- **Not recognized / wrong capacity** — loose cable, driver, MBR/GPT or uninitialized disk (Disk Management).

## 5.3 Displays

- **Incorrect input source** — check input button. **Fuzzy image** — resolution/native res or cable. **Burnt-out bulb (projector)** — replace lamp. **Dim image** — backlight/inverter. **Burn-in** — OLED/plasma static image. **Dead pixels** — panel defect (warranty). **Flashing/flickering** — cable, refresh rate, GPU driver. **Audio issues** — default playback device, muted, wrong output. **Color issues** — calibration, cable, GPU settings. **Flicker on laptop** — inverter/backlight, display cable (hinge wear).

## 5.4 Mobile devices

- **Poor battery health / swollen battery** — replace battery; swelling = safety issue (stop using, don't puncture).
- **Broken screen** — digitizer vs LCD: touch dead but display fine = digitizer; both dead = LCD+digitizer assembly.
- **Improper charging** — charge port debris/damage, wrong charger wattage, cable quality.
- **Poor/no connectivity** — airplane mode, Wi-Fi off, SIM seated, data cap, wrong APN.
- **Liquid damage** — power off, dry, do NOT charge (corrosion).
- **Overheating** — remove case, close apps, check charging while using.
- **Cursor drift/touch calibration** — recalibrate digitizer, screen protector issues, palm rejection.
- **Malware on mobile** — uninstall suspicious apps (especially sideloaded), revoke permissions, factory reset if needed.
- **App crashes / battery drain by app** — update/clear cache/reinstall; check background data.

## 5.5 Networks

- **Intermittent wireless** — channel interference, distance, AP placement, outdated drivers, power saving.
- **Slow speeds** — bandwidth saturation, duplex mismatch, bad cabling, weak Wi-Fi signal, ISP plan.
- **Limited connectivity** — APIPA 169.254 = DHCP failure; check DHCP server, cable, NIC.
- **Jitter / poor VoIP** — latency variation, QoS off, congestion.
- **Port flapping** — bad cable/NIC, duplex mismatch. **High latency** — congestion, long path, ISP issues.
- **Authentication failures** — wrong password, RADIUS/802.1X, roaming between APs.
- **IP conflict** — two devices same static IP (error 169.x or "address already in use") — check statics.
- **DNS issues** — "server not found" but IP works: check DNS servers, flush cache, wrong proxy.

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
| No connectivity | Wrong IP, driver, firewall, offline printer |
| Ghost images (laser) | Old drum, drum cleaning failed |

## Sample questions

1. **Q:** A desktop beeps repeatedly at POST with no video. First step? **A:** Reseat/replace RAM modules.
2. **Q:** A drive makes a clicking sound. What should the technician do FIRST? **A:** Back up the data immediately.
3. **Q:** Pages have vertical black lines. What's the likely cause in a laser printer? **A:** Damaged imaging drum.
4. **Q:** A laptop's battery area is swollen. What's the correct action? **A:** Power off, stop using it, and replace the battery — it's a safety hazard.`,
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

## Objective walkthrough (all 27)

| Objective | Key topics to be able to explain |
|---|---|
| 1.1 | Laptop FRUs: battery, keyboard, RAM (SODIMM), storage (2.5"/M.2), Wi-Fi cards, biometrics, webcam |
| 1.2 | USB versions, Thunderbolt, Lightning, NFC, Bluetooth pairing, tethering/hotspot, docking vs port replicator |
| 1.3 | Cellular (SIM/eSIM/IMEI/APN), Wi-Fi, GPS vs cellular location, MDM policies, BYOD/COPE/CYOD, sync + data caps |
| 2.1 | Ports 20/21, 22, 23, 25, 53, 67/68, 80, 110, 143, 137-139, 389, 443, 445, 3389; TCP vs UDP |
| 2.2 | 2.4/5/6 GHz, channels 1/6/11, 802.11 a/b/g/n/ac/ax, Bluetooth, NFC, RFID |
| 2.3 | DNS, DHCP, file/print/mail, syslog, AAA, NTP, web, DB; spam gateway, UTM, load balancer, proxy |
| 2.4 | DNS records (A/AAAA/CNAME/MX/TXT), DHCP DORA + reservations, VLANs, VPN types |
| 2.5 | Router, switch (managed/unmanaged), AP, patch panel, firewall, PoE 802.3af/at/bt, modems, ONT, NIC |
| 2.6 | Private ranges, IPv6 link-local, APIPA 169.254, subnet mask, gateway, SOHO router security config |
| 2.7 | Satellite/fiber/cable/DSL/cellular/WISP; LAN/WAN/PAN/MAN/SAN/WLAN |
| 2.8 | Crimper, stripper, Wi-Fi analyzer, toner probe, punchdown, cable tester, loopback, tap |
| 3.1 | LCD (TN/IPS/VA), OLED, backlight/inverter, touch/digitizer, resolution/refresh/PPI, projectors |
| 3.2 | Cat 5e/6/6a, T568A/B, plenum, coax, fiber single/multi-mode, HDMI/DP/DVI/VGA, USB-C/TB, SATA, M.2 |
| 3.3 | DDR3/4/5, DIMM vs SODIMM, ECC, dual-channel, CAS latency, XMP/EXPO |
| 3.4 | HDD vs SSD vs NVMe vs hybrid, RAID 0/1/5/10 capacity math, S.M.A.R.T., form factors |
| 3.5 | Form factors, sockets/chipsets, PCIe, UEFI/Secure Boot/TPM, CPU install + thermal paste |
| 3.6 | PSU wattage/80 Plus, 24-pin/EPS/SATA/Molex/PCIe connectors, surge vs UPS, safety |
| 3.7 | MFD: duplexer, ADF, scan-to-email/folder, spooler, NFC/cloud printing |
| 3.8 | Laser (charge→expose→develop→transfer→fuse), inkjet printhead, thermal, impact, 3D; jam/faded/lines fixes |
| 4.1 | Hypervisor Type 1 vs 2, snapshots/clones/templates, live migration, overcommitment/ballooning, sandboxing, VDI |
| 4.2 | IaaS/PaaS/SaaS, public/private/hybrid/multi-cloud, NIST five characteristics, shared responsibility |
| 5.1 | POST beeps, no power, overheating, CMOS battery, capacitors, minimal-boot method |
| 5.2 | Clicking drive, S.M.A.R.T., boot device not found, RAID degraded/rebuild |
| 5.3 | Dim/backlight, fuzzy, projector lamp, burn-in, dead pixels, flicker |
| 5.4 | Swollen battery, digitizer vs LCD, charging, connectivity, liquid, overheating, mobile malware |
| 5.5 | Intermittent Wi-Fi, slow speeds, APIPA, jitter, port flapping, auth failures, IP conflict, DNS |
| 5.6 | Lines, garbled, jams, faded, misfeed, queue, grinding, ghost images |

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

- **Workstation OSes** — Windows (10/11 — the exam's primary focus), Linux (Ubuntu, Fedora, Debian, Mint — free, open-source, CLI-centric), macOS (Apple, Unix-based, polished GUI), Chrome OS (cloud-centric, web apps, cheap hardware, managed via Google Admin).
- **Mobile OSes** — iOS/iPadOS (Apple, App Store only — no sideloading), Android (open, sideloading possible, Google Play, vendor skins).
- **Filesystems** —
  | FS | Where | Notes |
  |---|---|---|
  | NTFS | Windows default | Permissions, EFS encryption, compression, quotas, journaling |
  | ReFS | Server | Resilience, large volumes, self-healing |
  | FAT32 | Legacy/universal | 4 GB file limit, 2 TB partition max — no permissions |
  | exFAT | Flash/USB | No 4 GB limit, cross-OS (Windows/macOS/Linux) |
  | ext4 | Linux default | Journaling, permissions |
  | XFS | Linux (large files) | High performance, scalability |
  | APFS | macOS/iOS default | Snapshots, encryption, space sharing |
- **Vendor life cycle** — **EOL** (end-of-life: no more patches — security risk), EOS dates matter for compliance; unsupported hardware blocks upgrades.
- **Compatibility** — file format sharing across OSes (docx/xlsx, PDF), exFAT USB for cross-OS transfer, case sensitivity (Linux), drive formats not readable cross-OS (ext4 in Windows needs third-party tools).

## 1.2 Install & upgrade paths

- **Boot methods** — USB, network (**PXE**), solid-state/flash, internet-based (cloud recovery), external/hot-swappable drive, internal partition, **multiboot** (dual-boot — boot manager picks), **image deployment** (golden image → many machines), remote network install.
- **Install types** — **clean install** (wipe + fresh — slowest but cleanest), **upgrade/in-place** (keep files/apps/settings), **repair installation** (fix corrupted OS files), recovery partition/Media Creation Tool.
- **Partitioning** — **GPT** (modern, UEFI, 128+ partitions, >2 TB) vs **MBR** (legacy BIOS, 4 primary partitions, 2 TB limit); format the drive before install; check boot mode matches partition scheme (UEFI+GPT, BIOS+MBR).
- **Upgrade considerations** — backup files/preferences first, app/driver backward compatibility, hardware compatibility (Windows 11: 64-bit CPU, 4 GB RAM, 64 GB storage, **TPM 2.0**, Secure Boot, UEFI), activation/licensing, 32→64-bit migration = clean install (no in-place).
- **Windows 11 editions** —
  | Edition | Key features |
  |---|---|
  | Home | Consumer baseline |
  | Pro | BitLocker, RDP host, gpedit, domain join, Hyper-V |
  | Pro for Workstations | ReFS, more RAM/CPUs, faster file sharing |
  | Enterprise | Volume licensing, advanced management |
  | N versions | EU — no media player |
- **Enterprise deployment** — third-party drivers (slipstream), mass deployment tools (SCCM/MDT, imaging), unattended installs.

**Exam traps:** (1) FAT32 ≠ exFAT — exFAT lifts the 4 GB file limit. (2) GPT needs UEFI; MBR pairs with legacy BIOS. (3) In-place upgrade ≠ clean install — upgrade preserves apps/settings. (4) 32-bit → 64-bit always requires a clean install.

## Sample questions

1. **Q:** Which filesystem is the default for modern Windows and supports per-file encryption (EFS)? **A:** NTFS.
2. **Q:** A USB stick must carry a 6 GB video between Windows and macOS. Best format? **A:** exFAT.
3. **Q:** Which partition scheme is required to boot from a >2 TB drive in UEFI mode? **A:** GPT.
4. **Q:** A machine must run Windows 11. Which two hardware features are required beyond CPU/RAM? **A:** TPM 2.0 and UEFI with Secure Boot.`,
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

- **Task Manager** — processes, performance, startup apps, users, services (end task, startup disable, app history, GPU usage).
- **MMC snap-ins** — **Event Viewer** (eventvwr.msc — system/application/security logs; check error events near crash time), **Disk Management** (diskmgmt.msc — partitions, format, shrink/extend, assign letters), **Task Scheduler** (taskschd.msc — automated tasks), **Device Manager** (devmgmt.msc — drivers, disable/update/roll back; yellow exclamation = problem), **Certificate Manager** (certmgr.msc), **Local Users and Groups** (lusrmgr.msc — Pro), **Performance Monitor** (perfmon.msc), **Group Policy Editor** (gpedit.msc — Pro only), Registry Editor (regedit.exe).
- **Additional tools** — System Information (msinfo32.exe — hardware/OS summary), Resource Monitor (resmon.exe — real-time CPU/RAM/disk/network per process), System Configuration (**msconfig.exe** — boot options, safe boot, services; note: startup apps moved to Task Manager), Disk Defragmenter (dfrgui.exe — HDDs; SSDs don't need defrag), Indexing Options, Administrative Tools.

**Exam trap:** Device Manager shows a yellow triangle for driver problems; roll back a driver that worked before the update rather than reinstalling blindly.

## 1.5 Command line

- **Navigation** — cd, dir, md, rmdir, cls.
- **Network** — **ipconfig** (IP config: /all for details, /release + /renew to re-lease, /flushdns to clear DNS cache), **ping** (reachability — ping 127.0.0.1 tests the local stack), **netstat** (connections: -ano shows PIDs), **nslookup** (DNS queries), **tracert** (route hops), **pathping** (trace + latency stats over time), **net use** (map/remove drive shares).
- **Disk** — **chkdsk** (check/fix disk errors), **format**, **diskpart** (scriptable partition tool).
- **File/info** — robocopy (robust copy with flags), winver (Windows version), whoami (current user), hostname, **gpupdate /force** (refresh policy), **gpresult** (policy results), **sfc /scannow** (system file check — needs DISM to repair the image first if corrupt), **DISM** (deployment image servicing), **net user** (user mgmt), **[cmd] /?** (help).

**Exam trap:** sfc fixes system files; DISM /Online /Cleanup-Image /RestoreHealth repairs the component store that sfc depends on — run DISM first when sfc fails.

## 1.6 Windows settings

- Network and Sharing Center (connection status), System (about, display), Device Manager, Indexing Options, Devices and Printers, Program and Features (uninstall), Internet Options (proxy, security zones), Windows Defender Firewall, Mail, Sound, User Accounts, File Explorer Options (**show hidden files, hide extensions**, show file extensions), Power Options (**hibernate vs sleep/suspend vs standby**, power plans, closing-lid action, fast startup, USB selective suspend), Ease of Access, Time and Language (timezone!), Update and Security, Personalization, Apps (default apps), Network and Internet, Gaming, Accounts.
- **Power states** — sleep (RAM-powered, fast resume), hibernate (disk — uses no power), hybrid sleep; fast startup = hybrid shutdown (can cause boot issues after updates).

## 1.7 Client networking

- **Domain joined vs workgroup** — domain = centralized AD authentication, group policy, shared printers/file servers, mapped drives, roaming profiles; workgroup = peer-to-peer, local accounts only.
- **Connections** — VPN (client config, username/password or cert), wireless (SSID/security type), WWAN/cellular (SIM).
- **Client IP config** — IP addressing scheme, subnet mask, gateway, static vs dynamic, DNS settings; **proxy settings** (system proxy for browsers); **network profile** — **private** = file sharing allowed, **public** = locked down (most restrictive firewall profile), domain profile for AD networks.

**Exam traps:** (1) msconfig startup tab is legacy — Task Manager > Startup is current. (2) "Public" network profile = most restrictive firewall. (3) Sleep uses RAM; hibernate writes to disk.

## Sample questions

1. **Q:** Which command refreshes Group Policy immediately? **A:** gpupdate /force.
2. **Q:** Where do you disable a program that launches at sign-in? **A:** Task Manager > Startup.
3. **Q:** A PC joined to a domain can log in with which type of account? **A:** Domain account (AD credentials).
4. **Q:** Which two commands fix a corrupt system file when sfc alone fails? **A:** DISM /Online /Cleanup-Image /RestoreHealth, then sfc /scannow again.`,
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

- **Core tools** — **Finder** (file manager), **Dock** (app launcher), Spotlight (search — Cmd+Space), System Settings, **Time Machine** (automatic local backups — the exam answer for "Mac backups"), **Disk Utility** (format/repair — first aid), **Keychain** (password/cert store), **Activity Monitor** (processes — the Mac Task Manager), Terminal (Unix shell), Mission Control (window management), **Gatekeeper** (blocks unsigned/unnotarized apps), App Store.
- **File structure** — /Applications, /Users/<name> (home), /Library (system/user libraries); APFS default; **.dmg** (disk image — mount, drag app to Applications) and **.pkg** (installer) formats.
- **Remote & sync** — Screen Sharing (VNC), iCloud (files, photos, keychain sync), Continuity (Handoff, AirDrop).
- **Key differences vs Windows** — Cmd vs Ctrl, no C: drive lettering (mounted volumes), Unix file permissions, spotlight vs start menu.

## 1.9 Linux

- **Distros** — Ubuntu, Fedora, Debian, Linux Mint (desktop), Kali (security testing), CentOS/Rocky (server).
- **CLI basics** — ls (list), cd, pwd (print working dir), cp, mv, rm, mkdir, **chmod** (permissions: 755 = rwxr-xr-x, 644 = rw-r--r--; owner/group/others), **chown** (change owner), **grep** (search text), **sudo** (admin), **apt/apt-get** (Debian-family packages), **dnf/yum** (Red Hat-family), **ps** (processes), **top** (live process monitor), **df -h** (disk free), **du** (disk usage), **ifconfig/ip addr** (network), **ping**, man pages (documentation).
- **GUI** — GNOME/KDE desktops, software centers, file managers — Linux isn't only CLI.
- **Filesystem** — ext4/XFS; structure: / (root), /home (users), /root (root's home), /etc (config), /var (logs/spool), /tmp (temp), /usr (programs), /bin (binaries).

**Exam trap:** chmod 755 = owner rwx, group r-x, others r-x. apt is Debian-family; dnf/yum is Red Hat-family — the exam tests the concept, and Ubuntu (apt) is the common example.

## 1.10 Application install

- **Windows** — MSI/EXE installers, UAC prompts, 32-bit vs 64-bit, per-user vs machine install, Store apps (sideloading = install outside Store), compatibility mode (run old apps), uninstall via Programs and Features.
- **macOS** — DMG/pkg, Gatekeeper approval, drag-to-Applications; **Linux** — package manager (apt/dnf), repos, tarballs (source), flatpak/snap.
- **Requirements** — check RAM/disk/OS version, license key, driver dependencies, admin rights; close other apps during install; verify installer source (hash/checksum).

## 1.11 Cloud productivity tools

- **SaaS apps** — Microsoft 365 (Word/Excel/Outlook/Teams), Google Workspace (Docs/Sheets/Slides/Drive), Zoom (video), Slack (chat).
- **Features** — real-time collaboration (co-authoring), version history, file sync (OneDrive/Drive desktop clients), sharing/permissions (view/edit/comment), offline mode, browser-based vs installed clients, admin consoles for org management.

**Exam traps:** (1) Time Machine = macOS backups; Disk Utility = format/repair. (2) 32-bit apps may not run on ARM Windows without emulation. (3) Cloud files sync locally — "offline mode" is the exam term for working without connectivity.

## Sample questions

1. **Q:** Which Linux command changes file permissions? **A:** chmod.
2. **Q:** A Mac user needs automatic local backups. Which built-in tool? **A:** Time Machine.
3. **Q:** Which command installs packages on Ubuntu? **A:** sudo apt install <package>.
4. **Q:** A downloaded Mac app is blocked by Gatekeeper. What's the safe way to handle it? **A:** Verify the source, then allow it via System Settings (or right-click → Open) — don't disable Gatekeeper globally.`,
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

- **Physical** — door locks (smart locks), badges + **ID badges with photos**, biometrics (fingerprint/iris), security cameras, RFID badges, **mantrap** (two-door airlock), cable locks, safes, access control vestibules.
- **Logical** — passwords/PINs, **MFA** (something you know/have/are — two factors minimum), smart cards (CAC/PIV), **BitLocker** (full-disk encryption; needs TPM), EFS (per-file encryption), **least privilege**, user account control (**UAC** — prompt on privilege changes), **Active Directory** (central auth + group policy), access control lists (ACLs), NTFS permissions (read/write/execute/full control), screen locks, trusted platform module (**TPM** — hardware key storage, measured boot).
- **Best practices** — default-deny mentality, defense in depth (layered controls), data classification.

## 2.2 Windows security settings

- **Defender** — antivirus + firewall (inbound/outbound rules, per-profile: domain/private/public), Windows Security Center (health dashboard), exploit protection, controlled folder access.
- **Accounts** — user accounts (admin vs standard — standard by default), UAC levels, password policy (length/complexity/expiration/history), **account lockout** (failed attempts threshold), disable/rename guest, sign-in options (PIN, fingerprint, face).
- **Active Directory** — domains, **Group Policy** (enforce security settings centrally), organizational units (OUs), domain vs local accounts, **BitLocker via GPO**.

## 2.3 Wireless security

| Protocol | Cipher | Status |
|---|---|---|
| WEP | RC4 (broken) | Never use — cracked in minutes |
| WPA | TKIP | Deprecated — legacy only |
| WPA2 | AES/CCMP | Current baseline — still common |
| WPA3 | AES/GCMP + SAE | Strongest — resists offline dictionary attacks |

- **Authentication** — **802.1X** (enterprise: RADIUS + EAP — PEAP, EAP-TLS; per-user certs), captive portals (hotel/airport web login), preshared key (PSK — home) vs enterprise mode (corporate), **MAC filtering** (weak — MACs are spoofable), WPS (Wi-Fi Protected Setup — PIN brute-forceable, disable it).

**Exam trap:** 802.1X is enterprise *authentication*, not encryption — the encryption comes from WPA2/WPA3.

## 2.4 Malware & anti-malware

- **Types** —
  | Type | What it does |
  |---|---|
  | Virus | Attaches to a host file, spreads with user action |
  | Worm | Self-spreads across the network, no user action |
  | Trojan | Disguised as something legit |
  | Ransomware | Encrypts data, demands payment |
  | Spyware | Covertly collects data |
  | Adware | Unwanted ads (often bundled) |
  | Keylogger | Captures keystrokes |
  | Rootkit | Hides deep in the OS/kernel |
  | Botnet | Enlisted for DDoS/spam |
  | PUP | Potentially unwanted program (bundled junk) |
  | Logic bomb | Triggers on a condition (date/event) |
  | RAT | Remote access trojan — backdoor control |
- **Indicators** — slow system, popups, unusual network traffic, browser redirects, new processes, disabled security tools, files renamed (ransomware).
- **Tools** — antivirus/anti-malware (real-time + on-demand), **EDR** (endpoint detection and response — behavioral detection), Windows Defender, on-demand scanners, **quarantine**, safe mode (clean boot environment), System Restore, **removal workflow** (see the 2.6 nine-step process).

**Exam traps:** (1) WPA3 > WPA2 > WPA > WEP — always the order for "most secure". (2) Ransomware removal is NOT just deleting files — see 2.6's 9-step process. (3) A worm needs no user action; a virus does.

## Sample questions

1. **Q:** Which wireless protocol resists offline dictionary attacks? **A:** WPA3 (SAE).
2. **Q:** Which technology encrypts an entire Windows system drive? **A:** BitLocker (with TPM).
3. **Q:** Malware that spreads itself across the network without user action? **A:** Worm.
4. **Q:** An enterprise wants per-user certificate authentication on Wi-Fi. Which mode? **A:** WPA2/WPA3-Enterprise with 802.1X/EAP-TLS.`,
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

- **Phishing family** —
  | Type | Vector |
  |---|---|
  | Phishing | Mass email with fake login links |
  | Spear phishing | Targeted at a specific person/org |
  | Whaling | Executives / high-value targets |
  | Vishing | Voice calls (fake support/IRS) |
  | Smishing | SMS texts with malicious links |
  | BEC | Business email compromise — fake invoice/"CEO asks for wire" |
- **Other attacks** — pretexting (fabricated scenario to get info), baiting (USB drop — curiosity installs malware), tailgating/piggybacking (follow through the door), impersonation (fake tech support), shoulder surfing, dumpster diving, **on-path (MITM)**, zero-day, **SQL injection**, XSS, insider threat, supply chain attacks.
- **Password attacks** — brute force, dictionary, password spraying (few passwords, many accounts), credential stuffing (reused creds from breaches).

**Exam trap:** Spear phishing = targeted; whaling = targeted at executives; vishing = voice; smishing = SMS. BEC is the "urgent wire transfer" email.

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

- Screen locks (PIN/pattern/biometric), remote wipe/locate, **MDM enrollment**, app allow-listing, update OS/apps, disable sideloading, **jailbreaking/rooting detection** (bypasses security), Bluetooth disable when unused, secure Wi-Fi (WPA2/3, no public), backup/encryption, app permissions review.

## 2.9 Data destruction & disposal

| Media | Methods (match!) |
|---|---|
| HDD | Degaussing, shredding, overwrite (multi-pass), incineration, drill |
| SSD | **Secure erase** (degaussing ineffective on flash), crypto-shred (destroy keys), physical destruction |
| Optical (CD/DVD) | Shredding, incineration |
| Paper | Cross-cut shredder, incineration |
| Mobile | Factory reset + encryption, secure wipe |

- **Crypto-shred** — destroy the encryption keys so data is unrecoverable; the fastest "destruction" for encrypted drives.

## 2.10 SOHO network security

- Change default admin password, **WPA2/WPA3**, disable WPS, disable SSID broadcast (weak but common), MAC filtering (weak), firmware updates, disable remote management, guest network isolation, DHCP reservations.

## 2.11 Browser security

- **Pop-up blockers**, trusted sites/zones, **private/incognito browsing**, **HTTPS/TLS**, clear cache/cookies, extensions/add-ons management, **phishing filters**, autofill/password manager caution, secure DNS (DoH), update browser.

**Exam trap:** The 9-step malware removal order — System Restore is DISABLED early (step 3) so malware can't restore itself, then RE-ENABLED at step 9. This is a classic ordering PBQ.

## Sample questions

1. **Q:** In the SOHO malware removal process, when do you disable System Restore? **A:** Step 3, after quarantining — before remediation.
2. **Q:** Which data destruction method works for SSDs but NOT for HDDs? **A:** Secure erase / crypto-shred (degaussing is ineffective on flash).
3. **Q:** An email from the CEO asks finance to urgently wire funds. Which attack? **A:** Business email compromise (BEC).
4. **Q:** An attacker leaves infected USB drives in a parking lot. Which social engineering technique? **A:** Baiting.`,
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

- **Tools** — sfc /scannow, DISM /Online /Cleanup-Image /RestoreHealth, chkdsk, System Restore, msconfig safe boot, Event Viewer, Task Manager, Device Manager (roll back driver), **Windows Recovery Environment** (WinRE — startup repair, command prompt).
- **Process** — reproduce the issue, note error codes, check Event Viewer around the failure time, isolate (safe mode = clean drivers; clean boot = no startup apps), apply one fix at a time, verify.

## 3.2 Mobile OS & app issues

- App crashes/freezes → update/reinstall, clear cache; **battery drain** → background apps, screen brightness, sync, radios; **overheating**; connectivity (Wi-Fi/cellular toggle, airplane mode, forget/rejoin); sync failures (account re-auth, storage full, sync toggles); **app not installing** → storage, OS version, sideloading blocked; **unresponsive touchscreen** → restart, remove protector, check for damage.

## 3.3 Mobile OS & app SECURITY issues

- **Unauthorized location tracking** → check app permissions, revoke; **malware/adware** → uninstall suspicious apps, factory reset if persistent; **jailbroken/rooted device** → cannot trust security, factory reset + don't restore from compromised backup; **sideloaded apps** → disable unknown sources; **phishing/SMishing** → educate; **unsecured Wi-Fi** → use VPN/HTTPS; **lost/stolen** → remote lock/wipe; **account compromise** → change password, MFA, sign out everywhere; **unsolicited notifications/overlay** → check for malicious apps, revoke notification permissions.

## 3.4 PC security issues

- **Pop-ups/adware** → remove suspicious extensions/programs, run anti-malware; **browser hijacking** (homepage/search changed) → reset browser, check extensions; **ransomware note** → don't pay, restore from backup, isolate; **unusual logins** → change password, MFA, review sign-in activity; **fake antivirus/scareware** → don't call the number, remove the program; **unknown processes at startup** → investigate in Task Manager, remove; **USB autorun malware** → disable AutoPlay, scan the drive; **phishing emails** → report, don't click.

**Exam trap:** "Troubleshoot mobile OS and application issues" (3.2) is about FUNCTION; "…application security issues" (3.3) is about SECURITY (malware, permissions, tracking). Keep them straight — the exam does.

## Sample questions

1. **Q:** Windows updates keep failing with a corrupt cache. What should you try? **A:** Stop the update service, clear SoftwareDistribution, retry.
2. **Q:** A user's phone was jailbroken and now shows unknown apps. What's the safest action? **A:** Factory reset and restore from a trusted backup (or don't restore).
3. **Q:** A browser's homepage changed to an ad site after an install. First step? **A:** Remove suspicious extensions and reset browser settings.
4. **Q:** An app crashes only after a recent Windows update. Which tool quickly tests whether a driver is at fault? **A:** Safe mode (or Device Manager driver rollback).`,
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

## Objective walkthrough (all 36)

| Objective | Key topics to be able to explain |
|---|---|
| 1.1 | Windows/Linux/macOS/Chrome OS, iOS/Android, NTFS/exFAT/ext4/APFS, EOL |
| 1.2 | Boot methods (PXE, USB, image), clean vs in-place, GPT vs MBR, Win 11 requirements |
| 1.3 | Windows editions: Home vs Pro (BitLocker, RDP host, gpedit, domain join), N versions |
| 1.4 | Task Manager, Event Viewer, Disk Management, Device Manager, msconfig, regedit |
| 1.5 | ipconfig, ping, netstat, nslookup, tracert, chkdsk, diskpart, sfc, DISM, gpupdate |
| 1.6 | Network settings, Power Options (sleep vs hibernate), File Explorer Options, User Accounts |
| 1.7 | Domain vs workgroup, VPN/wireless/WWAN, static vs DHCP, network profiles (public/private) |
| 1.8 | Finder, Time Machine, Disk Utility, Keychain, Activity Monitor, Gatekeeper, .dmg/.pkg |
| 1.9 | ls/cd/chmod/chown/grep/sudo/apt, /etc /var /home structure, GNOME/KDE |
| 1.10 | MSI/EXE, UAC, 32 vs 64-bit, DMG/pkg, apt/dnf, compatibility, requirements |
| 1.11 | M365, Google Workspace, real-time collaboration, sync, sharing permissions, offline |
| 2.1 | Physical + logical controls, MFA factors, BitLocker/EFS, least privilege, UAC, TPM |
| 2.2 | Defender, firewall profiles, admin vs standard, password policy, lockout, Group Policy |
| 2.3 | WEP/WPA/WPA2/WPA3, 802.1X/EAP-TLS, PSK vs enterprise, MAC filtering, WPS |
| 2.4 | Malware types (virus/worm/trojan/ransomware/rootkit), indicators, AV/EDR tools |
| 2.5 | Phishing family (spear/whaling/vishing/smishing/BEC), pretexting, baiting, tailgating |
| 2.6 | 9-step SOHO malware removal ORDER (System Restore off early, on last) |
| 2.7 | BitLocker, password best practices, disable guest, lockout, screen lock, AutoRun |
| 2.8 | Screen locks, remote wipe, MDM, sideloading, jailbreak/rooting, Bluetooth |
| 2.9 | HDD (degauss/shred), SSD (secure erase/crypto-shred), optical, paper, mobile |
| 2.10 | WPA2/3, disable WPS, firmware, guest network, MAC filtering, default admin |
| 2.11 | Pop-up blocker, private browsing, HTTPS, extensions, phishing filter, DoH |
| 3.1 | BSOD, slow startup, app crashes, update failures, sfc/DISM/chkdsk, safe mode |
| 3.2 | Mobile app FUNCTION issues: crashes, battery drain, sync, connectivity |
| 3.3 | Mobile app SECURITY issues: tracking, malware, rooting, sideloading, lost/stolen |
| 3.4 | Pop-ups, browser hijacking, ransomware, scareware, unknown startup processes |
| 4.1 | Ticketing, asset management/CMDB, SOPs, SLAs, onboarding/offboarding |
| 4.2 | Change management flow: request → review → approve → plan → implement → document |
| 4.3 | Full/incremental/differential, 3-2-1 rule, restore testing, WinRE |
| 4.4 | ESD, electrical safety, fire extinguisher types, lifting |
| 4.5 | E-waste, batteries, hazardous materials, temp/humidity, UPS |
| 4.6 | PII, GDPR/HIPAA, EULA, per-seat vs per-device, DRM, data retention |
| 4.7 | Active listening, no jargon, status updates, escalation, empathy |
| 4.8 | PowerShell, bash, variables/loops, execution policy, test in staging |
| 4.9 | RDP/VNC/SSH, VPN, remote support tools, RMM, DaaS; MFA + session logging |
| 4.10 | LLMs, RAG, hallucinations, deepfakes, prompt injection, AI ethics |

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
