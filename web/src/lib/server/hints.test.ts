import { describe, expect, it } from 'vitest';
import { autoHint } from './hints';
import type {
	ChoiceDefinition,
	ConfigurationDefinition,
	EvidenceDefinition,
	HotspotDefinition,
	MatchingDefinition,
	MemoryDefinition,
	MultiStepPbqDefinition,
	OrderingDefinition,
	SliderDefinition,
	SortDefinition,
	WordBankDefinition
} from './question-bank';

const base = {
	domain: 1 as const,
	objective: '1.1',
	format: 'pbq' as const,
	prompt: 'Synthetic prompt.',
	explanation: 'Synthetic explanation.',
	sourceRefs: [{ source: 'exam-objectives' as const, section: '1.1' }]
};

const choice: ChoiceDefinition = {
	...base,
	id: 'x-choice',
	kind: 'single-choice',
	options: [
		{ id: 'a', text: 'SSH', rationale: 'Correct.' },
		{ id: 'b', text: 'DNS', rationale: 'Wrong.' },
		{ id: 'c', text: 'HTTP', rationale: 'Wrong.' },
		{ id: 'd', text: 'SMTP', rationale: 'Wrong.' }
	],
	correctOptionIds: ['a'],
	selectCount: 1
};

const ordering: OrderingDefinition = {
	...base,
	id: 'x-ordering',
	kind: 'ordering',
	items: [
		{ id: 'i1', text: 'First step' },
		{ id: 'i2', text: 'Second step' },
		{ id: 'i3', text: 'Third step' },
		{ id: 'i4', text: 'Fourth step' },
		{ id: 'i5', text: 'Fifth step' },
		{ id: 'i6', text: 'Sixth step' }
	],
	correctOrder: ['i3', 'i1', 'i5', 'i2', 'i4', 'i6']
};

const matching: MatchingDefinition = {
	...base,
	id: 'x-matching',
	kind: 'matching',
	premises: [
		{ id: 'p1', text: 'Telnet' },
		{ id: 'p2', text: 'FTP' },
		{ id: 'p3', text: 'HTTP' },
		{ id: 'p4', text: 'LDAP' },
		{ id: 'p5', text: 'SNMPv2c' }
	],
	targets: [
		{ id: 't1', text: 'SSH' },
		{ id: 't2', text: 'SFTP' },
		{ id: 't3', text: 'HTTPS' },
		{ id: 't4', text: 'LDAPS' },
		{ id: 't5', text: 'SNMPv3' }
	],
	extraTargets: [
		{ id: 't6', text: 'RDP' },
		{ id: 't7', text: 'IPsec' },
		{ id: 't8', text: 'FTPS' }
	],
	correctMatches: { p1: 't1', p2: 't2', p3: 't3', p4: 't4', p5: 't5' }
};

const configuration: ConfigurationDefinition = {
	...base,
	id: 'x-config',
	kind: 'configuration',
	fields: [
		{
			id: 'f1',
			label: 'TLS minimum version',
			options: [
				{ id: 'o1', text: 'TLS 1.0' },
				{ id: 'o2', text: 'TLS 1.2' },
				{ id: 'o3', text: 'TLS 1.1' },
				{ id: 'o4', text: 'SSL 3.0' }
			]
		},
		{
			id: 'f2',
			label: 'Directory browsing',
			options: [
				{ id: 'o1', text: 'Enabled' },
				{ id: 'o2', text: 'Disabled' },
				{ id: 'o3', text: 'Enabled for /images' },
				{ id: 'o4', text: 'Enabled with robots.txt' }
			]
		},
		{
			id: 'f3',
			label: 'Admin access',
			options: [
				{ id: 'o1', text: 'Any IP' },
				{ id: 'o2', text: 'Management VPN only' },
				{ id: 'o3', text: 'Internet with password' },
				{ id: 'o4', text: 'No authentication' }
			]
		},
		{
			id: 'f4',
			label: 'Default page',
			options: [
				{ id: 'o1', text: 'Vendor welcome page' },
				{ id: 'o2', text: 'Remove and return 404' },
				{ id: 'o3', text: 'Redirect to admin' },
				{ id: 'o4', text: 'Directory listing' }
			]
		}
	],
	correctValues: { f1: 'o2', f2: 'o2', f3: 'o2', f4: 'o2' }
};

const wordBank: WordBankDefinition = {
	...base,
	id: 'x-wordbank',
	kind: 'word-bank',
	prompt: 'The ____ layer handles routing and the ____ layer handles frames.',
	blanks: [
		{ id: 'b1', label: 'First blank' },
		{ id: 'b2', label: 'Second blank' }
	],
	bank: [
		{ id: 'w1', word: 'Network' },
		{ id: 'w2', word: 'Data link' },
		{ id: 'w3', word: 'Transport' },
		{ id: 'w4', word: 'Physical' }
	],
	correctAssignments: { b1: 'w1', b2: 'w2' }
};

const sort: SortDefinition = {
	...base,
	id: 'x-sort',
	kind: 'sort',
	items: [
		{ id: 's1', text: 'Firewall ruleset' },
		{ id: 's2', text: 'Log review' },
		{ id: 's3', text: 'Backup restoration' },
		{ id: 's4', text: 'Vulnerability scan' }
	],
	buckets: [
		{ id: 'b1', label: 'Preventive' },
		{ id: 'b2', label: 'Detective' },
		{ id: 'b3', label: 'Corrective' },
		{ id: 'b4', label: 'Neither' }
	],
	correctBuckets: { s1: 'b1', s2: 'b2', s3: 'b3', s4: 'b2' }
};

const hotspot: HotspotDefinition = {
	...base,
	id: 'x-hotspot',
	kind: 'hotspot',
	template: 'osi-stack',
	regions: [
		{ id: 'r1', label: 'Application', x1: 0, y1: 0, x2: 100, y2: 14.3, correct: false },
		{ id: 'r2', label: 'Presentation', x1: 0, y1: 14.3, x2: 100, y2: 28.6, correct: false },
		{ id: 'r3', label: 'Session', x1: 0, y1: 28.6, x2: 100, y2: 42.9, correct: false },
		{ id: 'r4', label: 'Transport', x1: 0, y1: 42.9, x2: 100, y2: 57.2, correct: true },
		{ id: 'r5', label: 'Network', x1: 0, y1: 57.2, x2: 100, y2: 71.5, correct: false },
		{ id: 'r6', label: 'Data link', x1: 0, y1: 71.5, x2: 100, y2: 85.8, correct: false },
		{ id: 'r7', label: 'Physical', x1: 0, y1: 85.8, x2: 100, y2: 100, correct: false }
	]
};

const memory: MemoryDefinition = {
	...base,
	id: 'x-memory',
	kind: 'memory',
	pairs: [
		{ id: 'm1', a: 'SSH', b: '22' },
		{ id: 'm2', a: 'DNS', b: '53' },
		{ id: 'm3', a: 'HTTP', b: '80' },
		{ id: 'm4', a: 'HTTPS', b: '443' }
	]
};

const evidence: EvidenceDefinition = {
	...base,
	id: 'x-evidence',
	kind: 'evidence',
	artifact: {
		label: 'Log',
		format: 'log',
		lines: [
			{ id: 'l1', text: 'Failed login from 10.0.0.1' },
			{ id: 'l2', text: 'SQL injection attempt detected' },
			{ id: 'l3', text: 'Successful login from 10.0.0.2' }
		]
	},
	selectCount: 2,
	correctLineIds: ['l1', 'l2']
};

const slider: SliderDefinition = {
	...base,
	id: 'x-slider',
	kind: 'slider',
	min: 0,
	max: 100,
	step: 1,
	unit: 'ms',
	correctValue: 42,
	tolerance: 1
};

const multiStep: MultiStepPbqDefinition = {
	...base,
	id: 'x-multistep',
	kind: 'multi-step',
	context: 'Synthetic context.',
	steps: [choice]
};

describe('autoHint', () => {
	it('never names correct options for choice kinds', () => {
		const single = autoHint(choice);
		expect(single).toMatch(/incorrect/);
		expect(single?.toLowerCase()).not.toContain('ssh');
		const multi = autoHint({ ...choice, id: 'x-multi-choice', kind: 'multiple-choice', selectCount: 2, correctOptionIds: ['a', 'b'] } as ChoiceDefinition);
		expect(multi).toMatch(/incorrect/);
		expect(multi?.toLowerCase()).not.toContain('ssh');
	});

	it('reveals exactly one element for structured kinds', () => {
		expect(autoHint(ordering)).toContain('Third step');
		expect(autoHint(matching)).toContain('SSH');
		expect(autoHint(configuration)).toContain('TLS 1.2');
		expect(autoHint(wordBank)).toContain('Network');
		expect(autoHint(sort)).toContain('Preventive');
		expect(autoHint(hotspot)).toContain('Transport');
		expect(autoHint(memory)).toContain('22');
		expect(autoHint(evidence)).toContain('Failed login');
		expect(autoHint(slider)).toMatch(/between \d+ and \d+ ms/);
	});

	it('is deterministic and skips multi-step', () => {
		expect(autoHint(choice)).toBe(autoHint(choice));
		expect(autoHint(multiStep)).toBeUndefined();
	});
});
