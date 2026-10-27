import type { Domain } from './types';

/**
 * SY0-701 terminology bank.
 *
 * One entry = one drillable fact: a protocol, an acronym, a port, or a named
 * concept. Entries are deliberately static and answer-safe: the client filters
 * and grades them locally, so nothing here is fetched from the database and no
 * session state is persisted.
 */
export type TerminologySection = 'protocols' | 'terminology';
export type TerminologyCategory = 'protocol' | 'acronym' | 'term' | 'port';

export interface TerminologyEntry {
	id: string;
	section: TerminologySection;
	category: TerminologyCategory;
	/** The answer shown to the learner (protocol name, acronym, port number, concept). */
	term: string;
	/** Concise exam-register definition used as the fill-in clue and matching premise. */
	definition: string;
	domain: Domain;
	/** Official SY0-701 objective id when the entry maps cleanly to one. */
	objective?: string;
	/** Explicit accepted answers beyond the displayed term. Normalization is not fuzzy. */
	aliases?: string[];
	/** Numeric port for category 'port'. */
	port?: number;
}

type Seed = Omit<TerminologyEntry, 'id'>;

const protocol = (
	term: string,
	definition: string,
	domain: Domain,
	objective: string,
	aliases: string[] = []
): Seed => ({
	section: 'protocols',
	category: 'protocol',
	term,
	definition,
	domain,
	objective,
	aliases
});

const acronym = (
	term: string,
	definition: string,
	domain: Domain,
	objective: string,
	aliases: string[] = []
): Seed => ({
	section: 'terminology',
	category: 'acronym',
	term,
	definition,
	domain,
	objective,
	aliases
});

const term = (
	term: string,
	definition: string,
	domain: Domain,
	objective: string,
	aliases: string[] = []
): Seed => ({
	section: 'terminology',
	category: 'term',
	term,
	definition,
	domain,
	objective,
	aliases
});

const port = (number: number, definition: string, domain: Domain = 4, objective = '4.5'): Seed => ({
	section: 'terminology',
	category: 'port',
	term: String(number),
	definition,
	domain,
	objective,
	port: number,
	aliases: [`port ${number}`]
});

const seeds: Seed[] = [
	// ── Protocols ────────────────────────────────────────────────────────────
	protocol(
		'TCP',
		'Connection-oriented transport that uses a three-way handshake, acknowledgements, and retransmission to deliver an ordered, reliable stream.',
		4,
		'4.1',
		['Transmission Control Protocol']
	),
	protocol(
		'UDP',
		'Connectionless transport with no handshake or delivery guarantee; used where low latency matters more than reliability.',
		4,
		'4.1',
		['User Datagram Protocol']
	),
	protocol(
		'IP',
		'Network-layer protocol that addresses and routes packets between hosts across interconnected networks.',
		4,
		'4.1',
		['Internet Protocol']
	),
	protocol(
		'ICMP',
		'Network-layer messaging protocol for error reporting and diagnostics such as ping and traceroute.',
		4,
		'4.1',
		['Internet Control Message Protocol']
	),
	protocol(
		'ARP',
		'Resolves an IPv4 address to a local MAC address on the same broadcast domain.',
		4,
		'4.1',
		['Address Resolution Protocol']
	),
	protocol(
		'DNS',
		'Hierarchical name service that resolves hostnames to IP addresses and stores other resource records.',
		2,
		'2.4',
		['Domain Name System']
	),
	protocol(
		'DHCP',
		'Automatically leases IP addresses, subnet masks, gateways, and DNS settings to clients.',
		4,
		'4.1',
		['Dynamic Host Configuration Protocol']
	),
	protocol(
		'HTTP',
		'Stateless application-layer request/response protocol for web content, sent in cleartext by default.',
		4,
		'4.5',
		['Hypertext Transfer Protocol']
	),
	protocol(
		'HTTPS',
		'HTTP carried inside a TLS session, providing confidentiality and integrity for web traffic.',
		4,
		'4.5',
		['Hypertext Transfer Protocol Secure']
	),
	protocol(
		'FTP',
		'Legacy file-transfer protocol using separate control and data connections, without encryption.',
		2,
		'2.2',
		['File Transfer Protocol']
	),
	protocol(
		'FTPS',
		'File transfer over TLS, adding encryption to the FTP control and data channels.',
		4,
		'4.5',
		['FTP Secure', 'FTP over TLS']
	),
	protocol(
		'SFTP',
		'File transfer and remote file management tunneled through an encrypted SSH session.',
		4,
		'4.5',
		['SSH File Transfer Protocol', 'Secure File Transfer Protocol']
	),
	protocol('SCP', 'Simple file copy over an encrypted SSH connection.', 4, '4.5', [
		'Secure Copy Protocol'
	]),
	protocol(
		'SSH',
		'Encrypted remote shell and tunneling protocol used for administration and secure file transfer.',
		4,
		'4.5',
		['Secure Shell']
	),
	protocol(
		'Telnet',
		'Legacy remote terminal protocol that sends credentials and session data in cleartext.',
		4,
		'4.5'
	),
	protocol(
		'SMTP',
		'Application-layer protocol for sending and relaying email between mail servers.',
		2,
		'2.2',
		['Simple Mail Transfer Protocol']
	),
	protocol('SMTPS', 'SMTP wrapped in TLS for encrypted mail submission or relay.', 4, '4.5', [
		'SMTP over TLS'
	]),
	protocol(
		'POP3',
		'Mail retrieval protocol that typically downloads messages to one client and can delete them from the server.',
		4,
		'4.5',
		['Post Office Protocol 3']
	),
	protocol(
		'IMAP',
		'Mail access protocol that keeps messages on the server and synchronizes folders and read state across clients.',
		4,
		'4.5',
		['Internet Message Access Protocol']
	),
	protocol(
		'SNMP',
		'UDP-based protocol for polling and managing network devices; traps report events.',
		5,
		'5.1',
		['Simple Network Management Protocol']
	),
	protocol(
		'LDAP',
		'Directory protocol for querying and modifying user, group, and device objects.',
		1,
		'1.2',
		['Lightweight Directory Access Protocol']
	),
	protocol(
		'LDAPS',
		'LDAP carried over TLS, encrypting directory queries and responses.',
		4,
		'4.6',
		['LDAP over TLS']
	),
	protocol(
		'Kerberos',
		'Ticket-based authentication protocol that uses a KDC and time-limited tickets for network services.',
		4,
		'4.6'
	),
	protocol(
		'RADIUS',
		'Centralized AAA protocol commonly used for VPN, wireless, and network-device access.',
		1,
		'1.2',
		['Remote Authentication Dial-In User Service']
	),
	protocol(
		'TACACS+',
		'Cisco-oriented AAA protocol that encrypts the full payload and separates authentication, authorization, and accounting.',
		1,
		'1.2',
		['TACACS Plus']
	),
	protocol(
		'NTP',
		'UDP port 123 protocol that synchronizes system clocks to a reference time source.',
		5,
		'5.1',
		['Network Time Protocol']
	),
	protocol(
		'SIP',
		'Signaling protocol for establishing, modifying, and terminating VoIP and video sessions.',
		4,
		'4.1',
		['Session Initiation Protocol']
	),
	protocol(
		'RTP',
		'Protocol that carries real-time audio and video media streams, usually over UDP.',
		4,
		'4.1',
		['Real-time Transport Protocol']
	),
	protocol(
		'SRTP',
		'RTP protected with encryption, authentication, and replay protection.',
		4,
		'4.1',
		['Secure Real-time Transport Protocol']
	),
	protocol(
		'IPsec',
		'Suite of protocols that secures IP traffic with authentication, integrity, and optional confidentiality.',
		3,
		'3.2',
		['IP Security']
	),
	protocol(
		'IKE',
		'Negotiates IPsec security associations and keys, typically over UDP port 500.',
		3,
		'3.2',
		['Internet Key Exchange']
	),
	protocol(
		'ESP',
		'IPsec protocol that provides confidentiality plus integrity and authentication; it encrypts the payload.',
		3,
		'3.2',
		['Encapsulating Security Payload']
	),
	protocol(
		'AH',
		'IPsec protocol that authenticates packets and protects integrity but does not encrypt the payload.',
		3,
		'3.2',
		['Authentication Header']
	),
	protocol(
		'TLS',
		'Transport-layer protocol that negotiates encryption and integrity for applications such as HTTPS.',
		3,
		'3.2',
		['Transport Layer Security']
	),
	protocol(
		'SSL',
		'Deprecated predecessor to TLS; should not be used for new deployments.',
		3,
		'3.2',
		['Secure Sockets Layer']
	),
	protocol(
		'DTLS',
		'TLS adapted for datagram transports such as UDP, preserving handshake and record protection.',
		3,
		'3.2',
		['Datagram TLS']
	),
	protocol(
		'MPLS',
		'Service-provider routing technique that forwards packets by short labels rather than full IP lookups.',
		3,
		'3.1',
		['Multiprotocol Label Switching']
	),
	protocol(
		'GRE',
		'Generic tunneling protocol that encapsulates one network protocol inside another; often paired with IPsec.',
		3,
		'3.2',
		['Generic Routing Encapsulation']
	),
	protocol(
		'PPTP',
		'Legacy VPN tunneling protocol with weak authentication and encryption; avoid in new designs.',
		3,
		'3.2',
		['Point-to-Point Tunneling Protocol']
	),
	protocol(
		'L2TP',
		'VPN tunneling protocol that carries PPP sessions and is normally paired with IPsec for encryption.',
		3,
		'3.2',
		['Layer 2 Tunneling Protocol']
	),
	protocol(
		'PPP',
		'Point-to-point link protocol for serial and dial-up connections, with authentication options such as PAP and CHAP.',
		3,
		'3.1',
		['Point-to-Point Protocol']
	),
	protocol(
		'CHAP',
		'Challenge-response authentication protocol that verifies a peer without sending the password in cleartext.',
		1,
		'1.2',
		['Challenge Handshake Authentication Protocol']
	),
	protocol(
		'PAP',
		'PPP authentication protocol that sends credentials in cleartext and is unsuitable for untrusted links.',
		1,
		'1.2',
		['Password Authentication Protocol']
	),
	protocol(
		'EAP',
		'Extensible framework for authentication methods used by 802.1X and VPNs.',
		1,
		'1.2',
		['Extensible Authentication Protocol']
	),
	protocol(
		'802.1X',
		'Port-based network access control that authenticates a device or user before allowing LAN or Wi-Fi access.',
		4,
		'4.1',
		['IEEE 802.1X', '8021X']
	),
	protocol(
		'PEAP',
		'EAP method that protects inner authentication inside a TLS tunnel, usually with a server certificate.',
		1,
		'1.2',
		['Protected Extensible Authentication Protocol']
	),
	protocol(
		'SMB',
		'File and printer sharing protocol used by Windows networks; modern versions support signing and encryption.',
		2,
		'2.2',
		['Server Message Block']
	),
	protocol(
		'NFS',
		'Network file-sharing protocol used mainly by Unix and Linux systems.',
		4,
		'4.1',
		['Network File System']
	),
	protocol(
		'RDP',
		'Remote desktop protocol that provides graphical access to a Windows session over TCP 3389.',
		2,
		'2.2',
		['Remote Desktop Protocol']
	),
	protocol(
		'VNC',
		'Cross-platform remote framebuffer protocol for graphical desktop access.',
		4,
		'4.1',
		['Virtual Network Computing']
	),

	// ── Ports (terminology section filter) ────────────────────────────────────
	port(20, 'FTP data channel for active-mode file transfers.'),
	port(21, 'FTP control channel for commands and replies.', 2, '2.2'),
	port(22, 'Secure Shell remote login, SFTP, and SCP.', 1, '1.2'),
	port(23, 'Telnet remote terminal, unencrypted.', 2, '2.2'),
	port(25, 'SMTP mail relay between servers.', 2, '2.2'),
	port(53, 'DNS name resolution, over UDP and TCP.', 2, '2.4'),
	port(67, 'DHCP server listens here for client requests.'),
	port(68, 'DHCP client listens here for server replies.'),
	port(69, 'TFTP trivial file transfer over UDP.', 2, '2.2'),
	port(80, 'HTTP web traffic, unencrypted.', 2, '2.2'),
	port(110, 'POP3 mail retrieval, usually downloading messages to one client.', 2, '2.2'),
	port(123, 'NTP time synchronization.', 5, '5.1'),
	port(143, 'IMAP mail access and server-side folder synchronization.', 2, '2.2'),
	port(161, 'SNMP queries to an agent for device status and metrics.', 5, '5.1'),
	port(162, 'SNMP trap notifications sent from an agent to a manager.', 5, '5.1'),
	port(389, 'LDAP directory queries and authentication.', 1, '1.2'),
	port(443, 'HTTPS web traffic over TLS.', 3, '3.2'),
	port(445, 'SMB file and printer sharing.', 2, '2.2'),
	port(514, 'Syslog event forwarding.', 5, '5.1'),
	port(587, 'SMTP submission with authentication, usually over TLS.'),
	port(636, 'LDAPS directory services over TLS.', 1, '1.2'),
	port(993, 'IMAP mail access secured by TLS.', 3, '3.2'),
	port(995, 'POP3 mail retrieval secured by TLS.', 3, '3.2'),
	port(1433, 'Microsoft SQL Server database.'),
	port(3306, 'MySQL or MariaDB database.'),
	port(3389, 'Microsoft Remote Desktop Protocol.'),
	port(5060, 'SIP signaling, unencrypted.'),
	port(5061, 'SIP signaling over TLS.', 3, '3.2'),

	// ── Acronyms & terminology ────────────────────────────────────────────────
	acronym(
		'AAA',
		'Framework that verifies identity, determines permitted actions, and records activity.',
		1,
		'1.2',
		['Authentication, Authorization, and Accounting']
	),
	acronym(
		'ACL',
		'Ordered rules that permit or deny access to a resource or network traffic.',
		1,
		'1.2',
		['Access Control List']
	),
	acronym(
		'ALE',
		'Expected yearly monetary loss from a risk: single loss expectancy multiplied by annualized rate of occurrence.',
		5,
		'5.2',
		['Annualized Loss Expectancy']
	),
	acronym('ARO', 'Expected number of times a risk occurs in a year.', 5, '5.2', [
		'Annualized Rate of Occurrence'
	]),
	acronym('AUP', 'Policy defining acceptable use of organizational systems and data.', 5, '5.1', [
		'Acceptable Use Policy'
	]),
	acronym(
		'BPA',
		'Agreement between business partners covering roles, responsibilities, and obligations.',
		5,
		'5.3',
		['Business Partners Agreement']
	),
	acronym('BYOD', 'Program where employees use personally owned devices for work.', 4, '4.1', [
		'Bring Your Own Device'
	]),
	acronym(
		'CIA',
		'Confidentiality, integrity, and availability — the core security objectives.',
		1,
		'1.2'
	),
	acronym(
		'COPE',
		'Program where the organization owns devices but permits limited personal use.',
		4,
		'4.1',
		['Corporate Owned, Personally Enabled']
	),
	acronym(
		'CSR',
		'Request sent to a certificate authority to issue a certificate for a public key.',
		1,
		'1.4',
		['Certificate Signing Request']
	),
	acronym('CVE', 'Public identifier assigned to a specific known vulnerability.', 4, '4.3', [
		'Common Vulnerability Enumeration',
		'Common Vulnerabilities and Exposures'
	]),
	acronym('CVSS', 'Standard scoring system for the severity of a vulnerability.', 4, '4.3', [
		'Common Vulnerability Scoring System'
	]),
	acronym('CYOD', 'Program where employees choose from organization-approved devices.', 4, '4.1', [
		'Choose Your Own Device'
	]),
	acronym(
		'DKIM',
		'Email authentication using a cryptographic signature to verify message integrity and domain.',
		4,
		'4.5',
		['DomainKeys Identified Mail']
	),
	acronym(
		'DLP',
		'Controls that detect and block sensitive data from leaving approved boundaries.',
		4,
		'4.5',
		['Data Loss Prevention']
	),
	acronym(
		'DMARC',
		'Email policy that tells receivers how to handle SPF and DKIM failures and where to report them.',
		4,
		'4.5',
		['Domain Message Authentication Reporting and Conformance']
	),
	acronym(
		'EDR',
		'Endpoint agent that detects, investigates, and responds to malicious behavior.',
		4,
		'4.5',
		['Endpoint Detection and Response']
	),
	acronym(
		'HIPS',
		'Host-based control that blocks malicious activity on a single system.',
		2,
		'2.5',
		['Host-based Intrusion Prevention System']
	),
	acronym('HSM', 'Dedicated appliance that generates and protects cryptographic keys.', 1, '1.4', [
		'Hardware Security Module'
	]),
	acronym('ICS', 'Systems that monitor and control industrial processes.', 3, '3.1', [
		'Industrial Control Systems'
	]),
	acronym('IDS', 'Passive sensor that detects suspicious activity and alerts.', 3, '3.2', [
		'Intrusion Detection System'
	]),
	acronym(
		'NIDS',
		'Network sensor that monitors traffic for malicious patterns and alerts.',
		2,
		'2.5',
		['Network-based Intrusion Detection System']
	),
	acronym('NIPS', 'Inline network control that detects and blocks malicious traffic.', 2, '2.5', [
		'Network-based Intrusion Prevention System'
	]),
	acronym('IM', 'Text messages exchanged in real time between users.', 2, '2.2', [
		'Instant Messaging'
	]),
	acronym('IPS', 'Inline control that detects and blocks malicious traffic.', 3, '3.2', [
		'Intrusion Prevention System'
	]),
	acronym(
		'MDM',
		'Centralized management of mobile devices, including configuration and remote wipe.',
		4,
		'4.1',
		['Mobile Device Management']
	),
	acronym(
		'MOA',
		'Formal agreement between parties that states intended responsibilities; generally less binding than a contract.',
		5,
		'5.3',
		['Memorandum of Agreement']
	),
	acronym(
		'MOU',
		'Document recording a common understanding between parties without a binding contract.',
		5,
		'5.3',
		['Memorandum of Understanding']
	),
	acronym(
		'MSP',
		'Third party that remotely manages IT services or infrastructure for a customer.',
		5,
		'5.3',
		['Managed Service Provider']
	),
	acronym(
		'MSA',
		'Overarching contract governing terms for multiple future work orders or services.',
		5,
		'5.3',
		['Master Service Agreement']
	),
	acronym('MTBF', 'Average operating time between failures for a repairable system.', 5, '5.2', [
		'Mean Time Between Failures'
	]),
	acronym('MTTR', 'Average time to restore a failed system to service.', 5, '5.2', [
		'Mean Time to Recover',
		'Mean Time to Repair'
	]),
	acronym(
		'NAC',
		'Control that checks identity and device posture before granting network access.',
		4,
		'4.5',
		['Network Access Control']
	),
	acronym(
		'GPO',
		'Windows directory object that applies policy settings to users and computers.',
		4,
		'4.5',
		['Group Policy Object']
	),
	acronym(
		'NTLM',
		'Legacy Windows challenge-response authentication protocol; weaker than Kerberos.',
		4,
		'4.6',
		['New Technology LAN Manager']
	),
	acronym('PAM', 'Controls and vaults privileged accounts and just-in-time access.', 4, '4.6', [
		'Privileged Access Management'
	]),
	acronym('NDA', 'Contract prohibiting disclosure of confidential information.', 5, '5.3', [
		'Non-disclosure Agreement'
	]),
	acronym(
		'NGFW',
		'Firewall with application awareness, intrusion prevention, and advanced inspection.',
		3,
		'3.2',
		['Next-generation Firewall']
	),
	acronym('OCSP', 'Protocol for real-time certificate revocation status checks.', 1, '1.4', [
		'Online Certificate Status Protocol'
	]),
	acronym(
		'OS',
		'Software platform that manages hardware and provides services to applications.',
		4,
		'4.1',
		['Operating System']
	),
	acronym('OSINT', 'Intelligence gathered from publicly available sources.', 4, '4.3', [
		'Open-source Intelligence'
	]),
	acronym(
		'PKI',
		'Framework of policies, roles, and systems that issues and manages digital certificates.',
		1,
		'1.4',
		['Public Key Infrastructure']
	),
	acronym('RFID', 'Technology that identifies objects using radio waves and tags.', 2, '2.4', [
		'Radio Frequency Identification'
	]),
	acronym('RPO', 'Maximum acceptable amount of data loss measured in time.', 5, '5.2', [
		'Recovery Point Objective'
	]),
	acronym(
		'RTO',
		'Maximum acceptable time to restore a system or process after disruption.',
		5,
		'5.2',
		['Recovery Time Objective']
	),
	acronym(
		'RTOS',
		'Operating system designed for deterministic, time-critical responses.',
		3,
		'3.1',
		['Real-time Operating System']
	),
	acronym(
		'SAML',
		'XML-based standard for exchanging authentication and authorization assertions between an identity provider and service provider.',
		4,
		'4.6',
		['Security Assertion Markup Language', 'Security Assertions Markup Language']
	),
	acronym(
		'SASE',
		'Cloud-delivered architecture combining network security and WAN edge services.',
		3,
		'3.2',
		['Secure Access Service Edge']
	),
	acronym('SCADA', 'System that supervises and controls remote industrial equipment.', 3, '3.1', [
		'Supervisory Control and Data Acquisition'
	]),
	acronym(
		'SCAP',
		'Standardized specifications for expressing and automating security configuration and vulnerability data.',
		4,
		'4.4',
		['Security Content Automation Protocol']
	),
	acronym(
		'SD-WAN',
		'Software-defined approach to managing WAN links and routing policy.',
		3,
		'3.2',
		['Software-defined Wide Area Network']
	),
	acronym(
		'SDLC',
		'Structured phases for planning, building, testing, deploying, and maintaining software.',
		5,
		'5.1',
		['Software Development Lifecycle']
	),
	acronym(
		'SDN',
		'Architecture that separates the network control plane from the data plane.',
		3,
		'3.1',
		['Software-defined Networking']
	),
	acronym(
		'SIEM',
		'Platform that aggregates logs, correlates events, and generates security alerts.',
		4,
		'4.4',
		['Security Information and Event Management']
	),
	acronym(
		'SLA',
		'Contract defining expected service levels, availability, and remedies.',
		5,
		'5.3',
		['Service-level Agreement']
	),
	acronym('SLE', 'Expected loss from a single occurrence of a risk.', 5, '5.2', [
		'Single Loss Expectancy'
	]),
	acronym('SMS', 'Text messaging service on mobile networks; also a phishing vector.', 2, '2.2', [
		'Short Message Service'
	]),
	acronym('SOW', 'Document defining specific work, deliverables, timeline, and price.', 5, '5.3', [
		'Statement of Work'
	]),
	acronym('SPF', 'DNS record listing hosts authorized to send email for a domain.', 4, '4.5', [
		'Sender Policy Framework'
	]),
	acronym(
		'SSO',
		'Authentication model that lets one login session access multiple applications.',
		4,
		'4.6',
		['Single Sign-on']
	),
	acronym(
		'TOC',
		'The check in a time-of-check/time-of-use flaw: a resource state verified before it is used.',
		2,
		'2.3',
		['Time-of-check']
	),
	acronym(
		'TOU',
		'The use in a time-of-check/time-of-use flaw: the moment a resource is acted on after verification.',
		2,
		'2.3',
		['Time-of-use']
	),
	acronym(
		'TPM',
		'Hardware chip that stores keys and measurements for platform integrity.',
		1,
		'1.4',
		['Trusted Platform Module']
	),
	acronym(
		'UPS',
		'Battery-backed power system that keeps equipment running during an outage.',
		3,
		'3.4',
		['Uninterruptible Power Supply']
	),
	acronym(
		'URL',
		'Address identifying the location of a resource on a network, such as a web page.',
		4,
		'4.5',
		['Uniform Resource Locator', 'Universal Resource Locator']
	),
	acronym(
		'UTM',
		'All-in-one security appliance combining firewall, intrusion prevention, antivirus, and other filters.',
		3,
		'3.2',
		['Unified Threat Management']
	),
	acronym(
		'VM',
		'Software-defined computer that runs an isolated operating system on shared hardware.',
		2,
		'2.3',
		['Virtual Machine']
	),
	acronym(
		'VLAN',
		'Logically segmented LAN that isolates traffic independent of physical switch ports.',
		3,
		'3.2',
		['Virtual Local Area Network']
	),
	acronym(
		'VPN',
		'Encrypted tunnel that extends a private network across an untrusted network.',
		3,
		'3.2',
		['Virtual Private Network']
	),
	acronym(
		'WAF',
		'Proxy that inspects and filters HTTP/HTTPS traffic to protect a web application.',
		3,
		'3.2',
		['Web Application Firewall']
	),
	acronym(
		'WO',
		'Authorization for a specific task or purchase, often under a master agreement.',
		5,
		'5.3',
		['Work Order']
	),
	acronym(
		'WPA3',
		'Current Wi-Fi security standard with stronger authentication and encryption than earlier versions.',
		4,
		'4.1',
		['Wi-Fi Protected Access 3']
	),
	acronym(
		'XDR',
		'Integrated detection and response across endpoint, network, cloud, and identity telemetry.',
		4,
		'4.5',
		['Extended Detection and Response']
	),
	acronym('XSS', 'Injection flaw where attacker script runs in another user’s browser.', 2, '2.3', [
		'Cross-site Scripting'
	]),
	acronym('2FA', 'Authentication using two different factor types.', 4, '4.6', [
		'Two-factor Authentication'
	]),
	acronym('AES', 'Symmetric block cipher used to protect data at rest and in transit.', 1, '1.4', [
		'Advanced Encryption Standard'
	]),
	acronym('RSA', 'Asymmetric algorithm used for key exchange and digital signatures.', 1, '1.4', [
		'Rivest, Shamir, and Adleman'
	]),
	acronym(
		'SHA',
		'Family of cryptographic hash algorithms used for integrity and signatures.',
		1,
		'1.4',
		['Secure Hashing Algorithm']
	),
	acronym(
		'BCP',
		'Planning that keeps critical business functions operating during disruption.',
		5,
		'5.1',
		['Business Continuity Planning']
	),
	acronym(
		'BIA',
		'Analysis identifying critical functions and the impact of their disruption.',
		5,
		'5.2',
		['Business Impact Analysis']
	),
	acronym(
		'CASB',
		'Control point between users and cloud services that enforces policy and provides visibility.',
		3,
		'3.1',
		['Cloud Access Security Broker']
	),
	acronym(
		'SOAR',
		'Platform that orchestrates tools and automates incident-response playbooks.',
		4,
		'4.7',
		['Security Orchestration, Automation, and Response']
	),
	acronym(
		'CSRF',
		'Attack that tricks an authenticated user’s browser into sending an unwanted request.',
		2,
		'2.3',
		['Cross-site Request Forgery', 'XSRF']
	),
	acronym(
		'DoS',
		'Attack that exhausts resources so a service becomes unavailable to legitimate users.',
		2,
		'2.4',
		['Denial of Service']
	),
	acronym(
		'DDoS',
		'Coordinated attack from many sources that overwhelms a target’s capacity.',
		2,
		'2.4',
		['Distributed Denial of Service']
	),
	acronym(
		'APT',
		'Well-resourced, persistent adversary that uses multiple techniques over time.',
		2,
		'2.1',
		['Advanced Persistent Threat']
	),
	acronym(
		'IoC',
		'Artifact such as a hash, IP address, or domain that suggests compromise.',
		2,
		'2.4',
		['Indicators of Compromise']
	),
	acronym(
		'TTP',
		'Adversary tactics, techniques, and procedures observed during an attack.',
		2,
		'2.1',
		['Tactics, Techniques, and Procedures']
	),
	acronym(
		'PII',
		'Data that can identify a specific person, directly or by combination.',
		5,
		'5.4',
		['Personally Identifiable Information']
	),
	acronym('PHI', 'Health information protected by privacy regulation.', 5, '5.4', [
		'Personal Health Information',
		'Protected Health Information'
	]),
	acronym(
		'GDPR',
		'EU data-protection regulation governing personal data processing and rights.',
		5,
		'5.4',
		['General Data Protection Regulation']
	),
	acronym('HIPAA', 'US law protecting the privacy and security of health information.', 5, '5.4', [
		'Health Insurance Portability and Accountability Act'
	]),
	acronym('PCI DSS', 'Industry standard for protecting payment card data.', 5, '5.4', [
		'Payment Card Industry Data Security Standard'
	]),
	acronym('SBOM', 'Inventory of software components and dependencies in a product.', 4, '4.3', [
		'Software Bill of Materials'
	]),
	acronym('KEV', 'Catalog of vulnerabilities known to be exploited in the wild.', 4, '4.3', [
		'Known Exploited Vulnerabilities'
	]),
	acronym(
		'FDE',
		'Encryption of an entire storage device, transparent to the user after boot.',
		1,
		'1.4',
		['Full Disk Encryption']
	),
	acronym('HMAC', 'Keyed hash used to verify message integrity and authenticity.', 1, '1.4', [
		'Hashed Message Authentication Code'
	]),
	acronym(
		'PBKDF2',
		'Password-based key derivation function that deliberately slows repeated guessing.',
		1,
		'1.4',
		['Password-based Key Derivation Function 2']
	),
	acronym(
		'DHE',
		'Ephemeral Diffie-Hellman key exchange that provides perfect forward secrecy.',
		1,
		'1.4',
		['Diffie-Hellman Ephemeral']
	),
	acronym(
		'ECDHE',
		'Elliptic-curve ephemeral key exchange providing forward secrecy with smaller keys.',
		1,
		'1.4',
		['Elliptic Curve Diffie-Hellman Ephemeral']
	),
	acronym(
		'TOTP',
		'One-time password derived from the current time and a shared secret.',
		4,
		'4.6',
		['Time-based One-time Password']
	),
	acronym(
		'API',
		'Interface that lets software components exchange requests and data programmatically.',
		4,
		'4.7',
		['Application Programming Interface']
	),
	acronym(
		'SELinux',
		'Linux mandatory access control framework enforcing a defined security policy.',
		4,
		'4.5',
		['Security-enhanced Linux']
	),
	acronym(
		'IoT',
		'Networked everyday devices with embedded sensors and limited security controls.',
		3,
		'3.1',
		['Internet of Things']
	),
	acronym(
		'OT',
		'Technology that monitors and controls physical equipment and industrial processes.',
		3,
		'3.1',
		['Operational Technology']
	),
	acronym('MFA', 'Authentication using two or more independent factor types.', 4, '4.6', [
		'Multifactor Authentication'
	]),
	acronym(
		'OAuth',
		'Authorization framework that grants scoped access tokens without sharing passwords.',
		4,
		'4.6',
		['Open Authorization']
	),
	acronym(
		'CRL',
		'Signed list of certificates that a certificate authority has revoked.',
		1,
		'1.4',
		['Certificate Revocation List']
	),
	acronym(
		'IaC',
		'Managing infrastructure through version-controlled configuration files rather than manual setup.',
		3,
		'3.1',
		['Infrastructure as Code']
	),
	acronym(
		'SQLi',
		'Injection attack that manipulates a database through unsanitized SQL input.',
		2,
		'2.3',
		['SQL Injection']
	),

	// ── Named concepts ────────────────────────────────────────────────────────
	term(
		'Zero trust',
		'Security model that verifies every request and grants least access rather than trusting a network location.',
		1,
		'1.2'
	),
	term(
		'Defense in depth',
		'Layered controls so one failed safeguard does not expose the whole environment.',
		1,
		'1.2'
	),
	term(
		'Least privilege',
		'Granting only the access needed for a task, for only as long as needed.',
		1,
		'1.2'
	),
	term(
		'Separation of duties',
		'Dividing sensitive tasks among people so no single person controls the whole process.',
		1,
		'1.2'
	),
	term(
		'Honeypot',
		'Decoy system or service designed to attract attackers and reveal their techniques.',
		1,
		'1.2',
		['honey pot']
	),
	term(
		'Salting',
		'Adding unique random data to each password before hashing to defeat precomputed attacks.',
		1,
		'1.4',
		['password salt']
	),
	term(
		'Key stretching',
		'Repeatedly hashing or deriving a password to slow brute-force guessing.',
		1,
		'1.4'
	),
	term(
		'Digital signature',
		'Cryptographic proof of a message origin and integrity using a private key.',
		1,
		'1.4'
	),
	term(
		'Non-repudiation',
		'Assurance that a party cannot credibly deny an action, usually through signatures and audit records.',
		1,
		'1.2'
	),
	term(
		'Screened subnet',
		'Segmented network between the internet and internal systems that hosts public-facing services.',
		3,
		'3.2',
		['DMZ', 'demilitarized zone']
	),
	term('Air gap', 'Physical isolation of a system from untrusted networks.', 3, '3.1'),
	term(
		'Chain of custody',
		'Documented record of who handled evidence, when, and how it was preserved.',
		4,
		'4.8'
	)
];

export const TERMINOLOGY_BANK: TerminologyEntry[] = seeds.map((seed, index) => ({
	...seed,
	id: `terminology-${String(index + 1).padStart(3, '0')}`
}));

/** Content floors enforced by the unit test and printed by the coverage report. */
export const TERMINOLOGY_FLOORS = {
	totalMin: 150,
	totalMax: 200,
	protocol: 40,
	port: 20,
	acronym: 100,
	term: 10,
	domain: 15
} as const;

/**
 * Acronyms named in the SY0-701 objectives themselves (the parenthetical
 * expansions and spelled-out terms in the five domains). The unit test fails
 * when any of these cannot be drilled from the bank.
 */
export const OBJECTIVE_ACRONYMS = [
	'802.1X',
	'AAA',
	'ACL',
	'ALE',
	'API',
	'ARO',
	'AUP',
	'BPA',
	'BYOD',
	'CIA',
	'COPE',
	'CRL',
	'CSR',
	'CVE',
	'CVSS',
	'CYOD',
	'DDoS',
	'DKIM',
	'DLP',
	'DMARC',
	'DNS',
	'EAP',
	'EDR',
	'HIPS',
	'HSM',
	'IaC',
	'ICS',
	'IDS',
	'IM',
	'IPsec',
	'IoT',
	'IPS',
	'LDAP',
	'MDM',
	'MFA',
	'MOA',
	'MOU',
	'MSP',
	'MSA',
	'MTBF',
	'MTTR',
	'NAC',
	'NDA',
	'NGFW',
	'OAuth',
	'OCSP',
	'OS',
	'OSINT',
	'OT',
	'PKI',
	'RADIUS',
	'RFID',
	'RPO',
	'RTO',
	'RTOS',
	'SAML',
	'SASE',
	'SCADA',
	'SCAP',
	'SD-WAN',
	'SDLC',
	'SDN',
	'SELinux',
	'SIEM',
	'SLA',
	'SLE',
	'SMS',
	'SNMP',
	'SOW',
	'SPF',
	'SQLi',
	'SSO',
	'TLS',
	'TOC',
	'TOU',
	'TPM',
	'UPS',
	'URL',
	'UTM',
	'VM',
	'VPN',
	'WAF',
	'WO',
	'WPA3',
	'XDR',
	'XSS'
] as const;
