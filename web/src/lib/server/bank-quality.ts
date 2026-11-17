import type { Domain, ObjectiveId } from '$lib/types';
import type { ChoiceDefinition, CourseBankSpec, QuestionDefinition } from './question-bank';

/**
 * Security+ bank quality gates. These run after the structural validator and
 * reject the failure classes that a structural check cannot see: missing
 * context, answer-neutral-hint violations, acronym direction, answer leakage,
 * duplicate stems/options, stem-template concentration, generic explanation
 * and rationale patterns, and cross-domain distractor fillers.
 */

const CONTEXT_MIN = 100;
const HINT_MIN = 40;
const RATIONALE_MIN = 25;
const TEMPLATE_SHARE = 0.15;

const STOPWORDS = new Set(
	'a an the of to in for on with and or is are was were be been being as by from that this it its which what when where who how not no all any each other than then so such can may will would should could into over under about more most less least best first next using used use within without across after before during between both either neither one two three'.split(
		' '
	)
);

/** Acronym expansions used for the direction gate. Only acronyms that appear as keys need an entry. */
const ACRONYM_EXPANSIONS: Record<string, string> = {
	'802.1X': 'IEEE 802.1X Port-Based Network Access Control',
	BEC: 'Business Email Compromise',
	CAB: 'Change Advisory Board',
	CAP: 'Corrective Action Plan',
	COPE: 'Corporate-Owned, Personally Enabled',
	DHCP: 'Dynamic Host Configuration Protocol',
	'EAP-TLS': 'Extensible Authentication Protocol Transport Layer Security',
	FERPA: 'Family Educational Rights and Privacy Act',
	FTP: 'File Transfer Protocol',
	FTPS: 'File Transfer Protocol over SSL/TLS',
	HTTP: 'Hypertext Transfer Protocol',
	IMAP: 'Internet Message Access Protocol',
	JIT: 'Just-in-Time',
	MSSQL: 'Microsoft SQL Server',
	MTTR: 'Mean Time To Repair',
	PA: 'Policy Administrator',
	PE: 'Policy Engine',
	PEP: 'Policy Enforcement Point',
	POP3: 'Post Office Protocol version 3',
	RACI: 'Responsible, Accountable, Consulted, Informed',
	RAT: 'Remote Access Trojan',
	SIP: 'Session Initiation Protocol',
	SMB: 'Server Message Block',
	SNMP: 'Simple Network Management Protocol',
	SSH: 'Secure Shell',
	SSO: 'Single Sign-On',
	'TACACS+': 'Terminal Access Controller Access-Control System Plus',
	TFTP: 'Trivial File Transfer Protocol',
	VLAN: 'Virtual Local Area Network',
	AAA: 'Authentication, Authorization, and Accounting',
	ABAC: 'Attribute-Based Access Control',
	ALE: 'Annualized Loss Expectancy',
	APT: 'Advanced Persistent Threat',
	ARO: 'Annualized Rate of Occurrence',
	ASLR: 'Address Space Layout Randomization',
	AUP: 'Acceptable Use Policy',
	BCP: 'Business Continuity Plan',
	BIA: 'Business Impact Analysis',
	CA: 'Certificate Authority',
	CASB: 'Cloud Access Security Broker',
	CMMC: 'Cybersecurity Maturity Model Certification',
	COBIT: 'Control Objectives for Information and Related Technologies',
	CRL: 'Certificate Revocation List',
	CSR: 'Certificate Signing Request',
	CSP: 'Content Security Policy',
	CSPM: 'Cloud Security Posture Management',
	CSRF: 'Cross-Site Request Forgery',
	CVE: 'Common Vulnerabilities and Exposures',
	CVSS: 'Common Vulnerability Scoring System',
	CWPP: 'Cloud Workload Protection Platform',
	DAC: 'Discretionary Access Control',
	DAST: 'Dynamic Application Security Testing',
	DEP: 'Data Execution Prevention',
	DLP: 'Data Loss Prevention',
	DMZ: 'Demilitarized Zone',
	DNS: 'Domain Name System',
	DNSSEC: 'Domain Name System Security Extensions',
	DRP: 'Disaster Recovery Plan',
	EDR: 'Endpoint Detection and Response',
	FIDO: 'Fast Identity Online',
	GDPR: 'General Data Protection Regulation',
	HIPAA: 'Health Insurance Portability and Accountability Act',
	HSM: 'Hardware Security Module',
	HTTPS: 'Hypertext Transfer Protocol Secure',
	IaaS: 'Infrastructure as a Service',
	IPsec: 'Internet Protocol Security',
	ISA: 'Interconnection Security Agreement',
	KMS: 'Key Management Service',
	LDAP: 'Lightweight Directory Access Protocol',
	MAC: 'Mandatory Access Control',
	MFA: 'Multi-Factor Authentication',
	MITM: 'Man-in-the-Middle',
	MOU: 'Memorandum of Understanding',
	MTBF: 'Mean Time Between Failures',
	NAC: 'Network Access Control',
	NAT: 'Network Address Translation',
	NGFW: 'Next-Generation Firewall',
	NIDS: 'Network Intrusion Detection System',
	NIPS: 'Network Intrusion Prevention System',
	NTP: 'Network Time Protocol',
	NVD: 'National Vulnerability Database',
	OCSP: 'Online Certificate Status Protocol',
	OIDC: 'OpenID Connect',
	OSINT: 'Open-Source Intelligence',
	OWASP: 'Open Web Application Security Project',
	PaaS: 'Platform as a Service',
	PAM: 'Privileged Access Management',
	PCI: 'Payment Card Industry',
	PHI: 'Protected Health Information',
	PII: 'Personally Identifiable Information',
	PKI: 'Public Key Infrastructure',
	RADIUS: 'Remote Authentication Dial-In User Service',
	RAID: 'Redundant Array of Independent Disks',
	RASP: 'Runtime Application Self-Protection',
	RBAC: 'Role-Based Access Control',
	RDP: 'Remote Desktop Protocol',
	RPO: 'Recovery Point Objective',
	RTO: 'Recovery Time Objective',
	SAML: 'Security Assertion Markup Language',
	SAST: 'Static Application Security Testing',
	SBOM: 'Software Bill of Materials',
	SDLC: 'System Development Life Cycle',
	SFTP: 'SSH File Transfer Protocol',
	SIEM: 'Security Information and Event Management',
	SLA: 'Service Level Agreement',
	SLE: 'Single Loss Expectancy',
	SMTP: 'Simple Mail Transfer Protocol',
	SOAR: 'Security Orchestration, Automation, and Response',
	SOX: 'Sarbanes-Oxley Act',
	SSL: 'Secure Sockets Layer',
	TACACS: 'Terminal Access Controller Access-Control System',
	TLS: 'Transport Layer Security',
	TPM: 'Trusted Platform Module',
	TTP: 'Tactics, Techniques, and Procedures',
	UEBA: 'User and Entity Behavior Analytics',
	UTM: 'Unified Threat Management',
	VPN: 'Virtual Private Network',
	WAF: 'Web Application Firewall',
	WPA2: 'Wi-Fi Protected Access 2',
	WPA3: 'Wi-Fi Protected Access 3',
	XDR: 'Extended Detection and Response',
	XSS: 'Cross-Site Scripting',
	ZTNA: 'Zero Trust Network Access'
};

/**
 * Official SY0-701 objectives overlap in a few places (for example, hashing
 * belongs to 1.4 but is also a data-protection method in 3.3; honeypots are
 * deception technology in 1.2 as well as malicious-activity indicators in 2.4).
 * These reviewed overlaps keep a plausible same-domain term from being flagged
 * as a cross-domain filler.
 */
const EXTRA_TERM_OBJECTIVES: Record<string, ObjectiveId[]> = {
	'access control': ['1.2', '2.5', '4.6'],
	accounting: ['1.1', '1.2', '4.6'],
	'actions on objectives': ['2.4'],
	authorization: ['1.1', '1.2', '4.6'],
	'blind spot': ['1.2'],
	'buffer overflow': ['2.3'],
	casb: ['3.4', '4.6'],
	'chain of custody': ['4.8', '4.9'],
	crl: ['3.3'],
	'cross-site request forgery': ['2.3'],
	'cross-site scripting': ['2.3'],
	dast: ['3.4', '5.5'],
	'data minimization': ['3.3', '5.3', '5.4'],
	'defense in depth': ['1.2', '3.1'],
	dnssec: ['1.4'],
	downloader: ['2.4'],
	edr: ['2.4', '4.5', '4.7'],
	encryption: ['1.4', '3.3', '3.4', '4.2', '4.5', '5.1'],
	exploitation: ['2.4'],
	federation: ['3.3', '4.6'],
	fido: ['4.6'],
	'full backup': ['5.2'],
	hashing: ['1.4', '3.3', '3.4', '4.9'],
	honeynet: ['1.2', '3.2'],
	honeypot: ['1.2', '3.2'],
	hsm: ['3.3'],
	identification: ['4.1'],
	isolation: ['2.5', '3.1', '4.4'],
	jamming: ['2.2', '2.3', '4.3'],
	ldap: ['4.6'],
	'least privilege': ['1.2', '1.3', '2.5', '4.6'],
	mfa: ['3.3'],
	monitoring: ['1.1', '4.4'],
	mttr: ['3.4'],
	'non-repudiation': ['1.1', '1.2', '4.6'],
	ocsp: ['3.3'],
	patching: ['2.5', '4.1', '4.3'],
	'penetration test': ['2.5', '4.3', '5.5'],
	preparation: ['4.1'],
	radius: ['4.6'],
	reconnaissance: ['2.4'],
	'risk avoidance': ['5.1'],
	rpo: ['3.4'],
	rto: ['3.4'],
	'security awareness training': ['1.1', '5.6'],
	segmentation: ['2.5', '3.1', '3.2', '3.3', '4.4'],
	shellcode: ['2.4'],
	'single pane of glass': ['4.4'],
	'social engineering': ['2.2', '5.6'],
	'sql injection': ['2.3'],
	'tacacs+': ['4.6'],
	tokenization: ['1.4', '3.3', '3.4'],
	utm: ['3.2'],
	'vulnerability scan': ['2.5', '4.3', '5.6'],
	waf: ['2.4'],
	'zero trust': ['1.2', '3.1']
};

/**
 * Reviewed same-objective term-pool extensions. Each entry is a term that the
 * official objective text covers even when the bank also uses the term under a
 * neighbouring objective (for example, CIA belongs to 1.2, and authorization/
 * accounting/federation are part of the IAM objective 4.6). The validator
 * requires every compact, keyed distractor to be in the item's objective pool.
 */
const EXTRA_OBJECTIVE_TERMS: Partial<Record<ObjectiveId, string[]>> = {
	'1.1': ['security awareness training', 'encryption'],
	'1.2': ['availability', 'confidentiality', 'honeynet', 'honeypot', 'integrity'],
	'1.3': ['defense in depth'],
	'1.4': ['availability', 'key stretching', 'non-repudiation', 'split knowledge', 'tokenization'],
	'2.1': ['supply chain'],
	'2.2': ['ransomware', 'trojan', 'worm'],
	'2.3': ['evil twin', 'phishing', 'smishing', 'vishing'],
	'2.4': [
		'brute force',
		'buffer overflow',
		'dictionary attack',
		'dns poisoning',
		'dns tunneling',
		'session hijacking',
		'sql injection'
	],
	'3.1': ['defense in depth', 'zero trust'],
	'3.2': ['ftp', 'http', 'telnet', 'tftp'],
	'3.3': ['data minimization', 'data sovereignty', 'hashing'],
	'3.4': ['hashing'],
	'4.1': ['penetration testing', 'version control'],
	'4.3': ['jamming', 'bug bounty'],
	'4.6': ['accounting', 'authorization', 'casb', 'federation', 'nac', 'non-repudiation'],
	'4.7': ['dlp', 'edr', 'nac'],
	'4.9': ['hashing', 'legal hold'],
	'5.1': [
		'data controller',
		'risk appetite',
		'separation of duties',
		'iso 27001',
		'cis controls',
		'cobit',
		'soc 2',
		'fedramp',
		'cmmc'
	],
	'5.2': ['risk mitigation'],
	'5.3': ['gdpr'],
	'5.4': ['sox'],
	'5.5': [
		'chain of custody',
		'dast',
		'due care',
		'penetration test',
		'separation of duties',
		'social engineering',
		'tabletop exercise'
	],
	'5.6': ['risk register', 'service-level agreement', 'vulnerability scan']
};

const GENERIC_RATIONALE = [
	/addresses a different concern/i,
	/addresses a different part of the problem/i,
	/does not match the definition/i,
	/^correct[:.]/i,
	/^incorrect[:.]/i,
	/is the correct answer/i,
	/is a distractor/i,
	/because it is correct/i,
	/^wrong[.!]?$/i,
	/^no[.!]?$/i
];

const GENERIC_EXPLANATION = [
	/fill each blank/i,
	/the question tests/i,
	/this matches the definition/i,
	/as stated in the prompt/i,
	/the correct response is/i,
	/the correct answer is/i
];

const GENERIC_HINT = [
	/consider the security\+ objective/i,
	/match each blank/i,
	/read the question/i,
	/use the process of elimination/i,
	/think about the options/i,
	/applying? the principle that most directly/i
];

function fail(id: string, message: string): never {
	throw new Error(`Question bank validation failed for ${id}: ${message}`);
}

function normalize(text: string): string {
	return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function tokenize(text: string): Set<string> {
	return new Set(
		text
			.toLowerCase()
			.split(/[^a-z0-9+./-]+/)
			.map((token) => token.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ''))
			.filter((token) => token.length >= 3 && !STOPWORDS.has(token))
	);
}

function acronymOf(text: string): string | undefined {
	const withoutParen = text.replace(/\([^)]*\)/g, '').trim();
	if (/^[A-Z0-9][A-Z0-9+/.-]{1,}$/.test(withoutParen)) return withoutParen;
	const inParen = /\(([A-Z0-9]{2,})\)/.exec(text);
	return inParen?.[1];
}

function answerTexts(node: QuestionDefinition): string[] {
	switch (node.kind) {
		case 'single-choice':
		case 'multiple-choice':
			return node.options
				.filter((option) => node.correctOptionIds.includes(option.id))
				.map((option) => option.text);
		case 'ordering':
			return node.items.map((item) => item.text);
		case 'matching':
			return node.targets.map((target) => target.text);
		case 'word-bank':
			return Object.values(node.correctAssignments).map(
				(id) => node.bank.find((word) => word.id === id)?.word ?? ''
			);
		case 'configuration':
			return node.fields.flatMap((field) =>
				field.options
					.filter((option) => option.id === node.correctValues[field.id])
					.map((option) => option.text)
			);
		case 'evidence':
			return node.correctLineIds.map(
				(id) => node.artifact.lines.find((line) => line.id === id)?.text ?? ''
			);
		case 'multi-step':
			return node.steps.flatMap(answerTexts);
		default:
			return [];
	}
}

function distinctiveAnswers(node: QuestionDefinition): string[] {
	const answers = answerTexts(node);
	switch (node.kind) {
		case 'word-bank':
			return answers.filter((answer) => normalize(answer).length >= 6);
		case 'ordering':
		case 'matching':
			return answers.filter((answer) => normalize(answer).length >= 12);
		case 'configuration':
			return answers.filter((answer) => normalize(answer).length >= 11);
		case 'evidence':
			return answers.filter((answer) => normalize(answer).length >= 20);
		case 'single-choice':
		case 'multiple-choice':
			return answers.filter((answer) => {
				const normalized = normalize(answer);
				return normalized.length >= 11 || normalized.split(' ').length >= 2;
			});
		default:
			return [];
	}
}

function walk(node: QuestionDefinition): QuestionDefinition[] {
	if (node.kind !== 'multi-step') return [node];
	return [node, ...node.steps.flatMap(walk)];
}

function isChoice(node: QuestionDefinition): node is ChoiceDefinition {
	return node.kind === 'single-choice' || node.kind === 'multiple-choice';
}

function choiceNodes(questions: QuestionDefinition[]): ChoiceDefinition[] {
	return questions.flatMap(walk).filter(isChoice);
}

function keyedObjectives(questions: QuestionDefinition[]): Map<string, Set<ObjectiveId>> {
	const map = new Map<string, Set<ObjectiveId>>();
	for (const node of choiceNodes(questions)) {
		for (const option of node.options) {
			if (!node.correctOptionIds.includes(option.id)) continue;
			const key = normalize(option.text);
			if (!map.has(key)) map.set(key, new Set());
			map.get(key)?.add(node.objective);
		}
	}
	for (const node of questions.flatMap(walk)) {
		if (node.kind !== 'word-bank') continue;
		for (const wordId of Object.values(node.correctAssignments)) {
			const word = node.bank.find((entry) => entry.id === wordId);
			if (!word) continue;
			const key = normalize(word.word);
			if (!map.has(key)) map.set(key, new Set());
			map.get(key)?.add(node.objective);
		}
	}
	return map;
}

function shortTerm(text: string): boolean {
	const normalized = text.trim();
	return (
		normalized.length <= 60 && normalized.split(/\s+/).length <= 6 && !/[.;:]$/.test(normalized)
	);
}

/** Approximate Jaccard similarity for near-duplicate stems. */
function jaccard(a: Set<string>, b: Set<string>): number {
	if (!a.size || !b.size) return 0;
	let intersection = 0;
	for (const token of a) if (b.has(token)) intersection++;
	return intersection / (a.size + b.size - intersection);
}

const SELECT_COUNT_WORDS: Record<string, number> = { two: 2, three: 3, four: 4 };

/** Reads a stated answer count out of the stem, e.g. "(Select TWO.)" or "Choose 3.". */
function statedSelectCount(prompt: string): number | undefined {
	const match = /(?:select|choose)\s+(two|three|four|2|3|4)\b/i.exec(prompt);
	if (!match) return undefined;
	return SELECT_COUNT_WORDS[match[1].toLowerCase()] ?? Number(match[1]);
}

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function validateBankQuality(
	bank: { mcqs: QuestionDefinition[]; pbqs: QuestionDefinition[] },
	spec: CourseBankSpec
): void {
	const all = [...bank.mcqs, ...bank.pbqs];
	const allNodes = all.flatMap(walk);

	// --- Context and hint presence, length, uniqueness -------------------
	const promptSeen = new Map<string, string>();
	const contextSeen = new Map<string, string>();
	const hintSeen = new Map<string, string>();
	for (const question of all) {
		const context = question.context?.trim() ?? '';
		const hint = question.hint?.trim() ?? '';
		// A multiple-choice stem carries its own scenario, the way the exam does it.
		// The separate `context` field is reserved for PBQs, where a multi-part item
		// legitimately needs a shared brief above its steps.
		if (!context && question.format === 'pbq')
			fail(question.id, 'missing scenario context');
		if (context && context.length < CONTEXT_MIN)
			fail(question.id, `context must be at least ${CONTEXT_MIN} characters`);
		if (!hint) fail(question.id, 'missing authored hint');
		if (hint.length < HINT_MIN) fail(question.id, `hint must be at least ${HINT_MIN} characters`);
		if (GENERIC_HINT.some((pattern) => pattern.test(hint)))
			fail(question.id, 'hint uses a generic fallback pattern');
		const promptKey = normalize(question.prompt);
		const contextKey = normalize(context);
		const hintKey = normalize(hint);
		if (promptSeen.has(promptKey))
			fail(question.id, `duplicate prompt also used by ${promptSeen.get(promptKey)}`);
		if (context && contextSeen.has(contextKey))
			fail(question.id, `duplicate context also used by ${contextSeen.get(contextKey)}`);
		if (hintSeen.has(hintKey))
			fail(question.id, `duplicate hint also used by ${hintSeen.get(hintKey)}`);
		promptSeen.set(promptKey, question.id);
		if (context) contextSeen.set(contextKey, question.id);
		hintSeen.set(hintKey, question.id);
		for (const sentence of question.prompt.split(/(?<=[.!?])\s+/)) {
			const clause = normalize(sentence);
			if (clause.length < 25) continue;
			if (normalize(context).includes(clause))
				fail(question.id, 'prompt sentence duplicated in context');
			if (normalize(question.explanation).includes(clause))
				fail(question.id, 'prompt sentence repeated in explanation');
		}
	}

	// --- Near-duplicate stems -------------------------------------------
	for (let i = 0; i < all.length; i++) {
		for (let j = i + 1; j < all.length; j++) {
			if (jaccard(tokenize(all[i].prompt), tokenize(all[j].prompt)) > 0.9)
				fail(all[i].id, `near-duplicate prompt also used by ${all[j].id}`);
		}
	}

	// --- Answer leakage into prompt, context, or hint -------------------
	for (const node of allNodes) {
		const visible = [node.prompt, node.context ?? '', node.hint ?? ''].map(normalize);
		for (const answer of distinctiveAnswers(node)) {
			const key = normalize(answer);
			if (!key) continue;
			if (visible.some((text) => text.includes(key)))
				fail(node.id, `answer text leaks into prompt, context, or hint: ${answer}`);
		}
	}

	// --- Acronym direction ----------------------------------------------
	for (const node of choiceNodes(all)) {
		const key = node.options.find((option) => node.correctOptionIds.includes(option.id));
		if (!key) continue;
		const acronym = acronymOf(key.text);
		if (!acronym) continue;
		const expansion = ACRONYM_EXPANSIONS[acronym];
		if (expansion) {
			const visible = [node.prompt, node.context ?? '', node.hint ?? ''].map(normalize);
			if (visible.some((text) => text.includes(normalize(expansion))))
				fail(node.id, `stem spells out the keyed acronym expansion for ${acronym}`);
		}
		if (/\b(what does|stands for|spell out|the expansion of)\b/i.test(node.prompt)) {
			if (!node.prompt.includes(acronym))
				fail(node.id, 'acronym-definition stem must present the acronym');
			if (normalize(key.text) === normalize(acronym))
				fail(node.id, 'acronym-definition item must require the expansion, not the acronym');
			const expansion = ACRONYM_EXPANSIONS[acronym];
			if (expansion) {
				const words = expansion
					.toLowerCase()
					.split(/[^a-z0-9]+/)
					.filter((word) => word.length > 2);
				if (words.length && !words.some((word) => normalize(key.text).includes(word)))
					fail(node.id, 'acronym-definition item must key the expansion');
			}
		}
	}

	// --- Generic explanations and rationales ----------------------------
	for (const node of allNodes) {
		const explanation = node.explanation?.trim() ?? '';
		if (!explanation) fail(node.id, 'missing explanation');
		if (GENERIC_EXPLANATION.some((pattern) => pattern.test(explanation)))
			fail(node.id, 'explanation uses a generic pattern');
		if (node.kind === 'single-choice' || node.kind === 'multiple-choice') {
			const explanationTokens = tokenize(explanation);
			for (const option of node.options) {
				if (!option.rationale.trim()) fail(node.id, `option ${option.id} is missing a rationale`);
				if (option.rationale.trim().length < RATIONALE_MIN)
					fail(node.id, `option ${option.id} rationale is too short`);
				if (GENERIC_RATIONALE.some((pattern) => pattern.test(option.rationale)))
					fail(node.id, `option ${option.id} rationale uses a generic pattern`);
				if (node.correctOptionIds.includes(option.id)) continue;
				const optionTokens = [...tokenize(option.text)].filter((token) => token.length > 3);
				if (optionTokens.length && !optionTokens.some((token) => explanationTokens.has(token)))
					fail(node.id, `explanation does not address distractor ${option.id}`);
				const keyed = node.options.find((candidate) =>
					node.correctOptionIds.includes(candidate.id)
				);
				const keyedText = keyed ? normalize(keyed.text) : '';
				if (
					keyedText &&
					(keyedText.length >= 11 || keyedText.split(' ').length >= 2) &&
					normalize(option.text).includes(keyedText)
				)
					fail(node.id, `distractor ${option.id} contains the keyed answer text`);
			}
		}
	}

	// --- Distractor term pool / cross-domain fillers --------------------
	const objectives = keyedObjectives(all);
	const domainOf = new Map<ObjectiveId, Domain>();
	for (const domain of spec.domains) {
		for (const objective of spec.objectivesByDomain[domain]) domainOf.set(objective, domain);
	}
	for (const node of choiceNodes(bank.mcqs)) {
		for (const option of node.options) {
			if (!shortTerm(option.text)) continue;
			// The cross-domain filler check targets compact term distractors
			// (Risk, DAC, Quantitative risk). Multi-word phrases are reviewed by
			// the same-objective rewrite of the definition items instead.
			if (option.text.trim().split(/\s+/).length > 2) continue;
			const key = normalize(option.text);
			const known = objectives.get(key);
			if (!known) continue;
			const objectivePool = new Set(EXTRA_OBJECTIVE_TERMS[node.objective] ?? []);
			const allowed =
				known.has(node.objective) ||
				objectivePool.has(key) ||
				(EXTRA_TERM_OBJECTIVES[key] ?? []).includes(node.objective);
			if (!allowed)
				fail(
					node.id,
					`distractor "${option.text}" is not in objective ${node.objective}'s term pool`
				);
		}
	}

	// --- Option-set duplicates and template concentration ---------------
	const optionSets = new Map<string, string>();
	for (const node of choiceNodes(all)) {
		const keyed = node.options
			.filter((option) => node.correctOptionIds.includes(option.id))
			.map((option) => normalize(option.text))
			.sort()
			.join('|');
		const options = node.options
			.map((option) => normalize(option.text))
			.sort()
			.join('|');
		const signature = `${options}::${keyed}`;
		if (optionSets.has(signature))
			fail(node.id, `duplicate option set and key also used by ${optionSets.get(signature)}`);
		optionSets.set(signature, node.id);
	}
	const recall = bank.mcqs.filter((question) => question.style === 'recall');
	if (recall.length) {
		const templates = new Map<string, number>();
		for (const question of recall) {
			const prefix = [...question.prompt.toLowerCase().matchAll(/[a-z0-9']+/g)]
				.slice(0, 4)
				.map((match) => match[0])
				.join(' ');
			templates.set(prefix, (templates.get(prefix) ?? 0) + 1);
		}
		const cap = Math.ceil(recall.length * TEMPLATE_SHARE);
		for (const [prefix, count] of templates) {
			if (count > cap)
				fail('mcq-template', `stem template "${prefix}" appears ${count} times (cap ${cap})`);
		}
		if (/^which security term is defined as/i.test(recall[0]?.prompt ?? '')) {
			const count = recall.filter((question) =>
				/^which security term is defined as/i.test(question.prompt)
			).length;
			if (count > cap)
				fail('mcq-template', `definition template appears ${count} times (cap ${cap})`);
		}
	}


	// --- A multiple-choice stem must stand on its own ----------------------
	// The exam never parks the scenario in a separate field, and it never asks a
	// bare tag question ("Which control is this?") that only makes sense with
	// earlier text on screen.
	const STEM_MIN = 120;
	const TAG_STEM =
		/\b(?:is|are) (?:this|these)\?|\bwhich (?:one )?(?:of these|of the following)? ?(?:one )?is (?:it|this)\?/i;
	for (const node of choiceNodes(bank.mcqs)) {
		const prompt = node.prompt.trim();
		if (prompt.length < STEM_MIN)
			fail(node.id, `stem is ${prompt.length} characters; a scenario stem must be at least ${STEM_MIN}`);
		if (TAG_STEM.test(prompt))
			fail(node.id, 'stem asks a bare tag question; write the scenario into the stem so it stands alone');
	}

	// --- Keyed answer text must not appear in the stem -------------------
	for (const node of choiceNodes(all)) {
		const stem = normalize(node.prompt);
		for (const option of node.options) {
			if (!node.correctOptionIds.includes(option.id)) continue;
			const trimmed = option.text.trim().toLowerCase();
			// Short keys (risk, DAC, RAT) are the leak-prone ones; long keys are
			// already covered by the distinctive-answer gate above.
			if (trimmed.length < 3 || trimmed.length > 60) continue;
			const key = normalize(trimmed);
			if (!key) continue;
			if (new RegExp(`\\b${escapeRegExp(key)}\\b`).test(stem))
				fail(node.id, `keyed answer "${option.text.trim()}" appears in the stem`);
		}
	}

	// --- Stated select count must match the response key -----------------
	for (const node of choiceNodes(all)) {
		const stated = statedSelectCount(node.prompt);
		if (node.selectCount > 1 && stated === undefined)
			fail(
				node.id,
				`selectCount is ${node.selectCount}, so the stem must state how many options to select`
			);
		if (node.selectCount > 1 && stated !== undefined && stated !== node.selectCount)
			fail(node.id, `stem states ${stated} but selectCount is ${node.selectCount}`);
		if (node.selectCount === 1 && stated !== undefined && stated >= 2)
			fail(node.id, `stem states ${stated} but selectCount is ${node.selectCount}`);
	}

	// --- Degenerate "X and X" options ------------------------------------
	for (const node of choiceNodes(all)) {
		for (const option of node.options) {
			const parts = option.text.split(/\s+and\s+/i).map(normalize);
			if (parts.length !== 2) continue;
			const [first, second] = parts;
			if (!first || first !== second) continue;
			fail(
				node.id,
				`option ${option.id} is a degenerate duplicate option: "${option.text.trim()}"`
			);
		}
	}


	// --- Study-guide citations must name a real section --------------------
	// The provenance trail is only worth keeping if it can be checked. Invented
	// chapter titles ("Chapter 3: Symmetric Encryption and AES Key Sizes.") and
	// whole-domain placeholders ("Domain 4 - Security Operations") both used to
	// satisfy every other gate.
	if (spec.studyGuideSections) {
		const known = new Set(spec.studyGuideSections);
		for (const node of allNodes) {
			for (const ref of node.sourceRefs ?? []) {
				if (ref.source !== 'study-guide') continue;
				const section = (ref.section ?? '').trim();
				if (!known.has(section))
					fail(
						node.id,
						`study-guide section "${section}" is not a section of the course study guide`
					);
			}
		}
	}

	// --- PBQ answer positions must not be predictable ----------------------
	// A configuration PBQ whose every field keys the same option position, or a
	// matching PBQ whose display order mirrors the answer order, can be scored
	// without any subject knowledge.
	for (const node of allNodes) {
		if (node.kind === 'configuration') {
			const positions: number[] = [];
			for (const field of node.fields) {
				const keyed = node.correctValues[field.id];
				const index = field.options.findIndex((option) => option.id === keyed);
				if (index >= 0) positions.push(index);
			}
			if (positions.length > 1 && new Set(positions).size === 1)
				fail(
					node.id,
					`every field keys option position ${positions[0] + 1}; shuffle the option order so the answer position varies per field`
				);
		}

		const ordered =
			node.kind === 'matching'
				? { left: node.premises.map((item) => item.id), right: node.targets.map((item) => item.id), map: node.correctMatches }
				: node.kind === 'sort'
					? { left: node.items.map((item) => item.id), right: node.buckets.map((item) => item.id), map: node.correctBuckets }
					: undefined;
		if (!ordered) continue;
		const { left, right, map } = ordered;
		if (left.length < 4) continue;
		const shifts = new Set<number>();
		for (const [premiseId, targetId] of Object.entries(map)) {
			const from = left.indexOf(premiseId);
			const to = right.indexOf(targetId);
			if (from < 0 || to < 0) continue;
			shifts.add((to - from + left.length * 2) % left.length);
		}
		if (shifts.size === 1)
			fail(
				node.id,
				shifts.has(0)
					? 'matching display order mirrors the answer order; shuffle the left column so the mapping cannot be guessed'
					: `matching display order is a uniform shift (${[...shifts][0]}); shuffle so the mapping is not a rotation`
			);
	}

	// --- Evidence artifacts must not label their own findings ----------------
	const INTERPRETIVE_LABEL = [
		/\((?:[^)]*\b(?:beacon|scan|scanning|brute|tunnel|tunnelling|exfil|exfiltration|injection|traversal|xss|malicious|suspicious|normal|attack|probe)\b[^)]*)\)/i,
		/--\s*(?:sql|path|os |reflected|stored|dom|command|directory)/i
	];
	for (const node of allNodes) {
		if (node.kind !== 'evidence') continue;
		for (const line of node.artifact.lines) {
			if (INTERPRETIVE_LABEL.some((pattern) => pattern.test(line.text)))
				fail(
					node.id,
					`artifact line ${line.id} labels its own finding; present the raw log line so the analyst has to interpret it`
				);
		}
	}
}
