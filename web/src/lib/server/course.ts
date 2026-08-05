import type { Domain, SessionMode, SessionType } from '$lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// Course definition — Security+ SY0-701, structured like a college course.
// The schedule is anchored to the exam date (set in course settings): every
// assignment has a `dueOffsetDays` (negative = days before the exam), so moving
// the exam date reschedules the entire course.
// ─────────────────────────────────────────────────────────────────────────────

export type AssignmentKind = 'quiz' | 'scenario' | 'pbq' | 'full';
export type AssignmentCategory = 'quiz' | 'scenario-pbq' | 'full';
export type AssignmentStatus = 'open' | 'due-soon' | 'overdue' | 'in-progress' | 'submitted';

export interface CourseLesson {
	id: string;
	moduleId: string;
	title: string;
	summary: string;
	content: string;
	position: number;
}

export interface CourseAssignment {
	id: string;
	moduleId: string;
	title: string;
	description: string;
	kind: AssignmentKind;
	category: AssignmentCategory;
	points: number;
	count: number;
	domain: Domain | null;
	mode: SessionMode;
	durationMinutes: number;
	dueOffsetDays: number;
	position: number;
}

export interface CourseModule {
	id: string;
	week: number;
	title: string;
	description: string;
	position: number;
}

export interface CourseDefinition {
	title: string;
	code: string;
	examName: string;
	passingScore: number; // Security+ passing scaled score
	scaleMax: number; // 900
	gradeWeights: Record<AssignmentCategory, number>;
	modules: CourseModule[];
	lessons: CourseLesson[];
	assignments: CourseAssignment[];
}

export interface SubmissionRecord {
	assignmentId: string;
	sessionId: string;
	earned: number;
	percentage: number;
	completedAt: string;
}

// ── Seed data ────────────────────────────────────────────────────────────────

const D1 = 1 as Domain;
const D2 = 2 as Domain;
const D3 = 3 as Domain;
const D4 = 4 as Domain;
const D5 = 5 as Domain;

export const COURSE_DEFINITION: CourseDefinition = {
	title: 'CompTIA Security+ (SY0-701)',
	code: 'SEC+ 701',
	examName: 'SY0-701 Certification Exam',
	passingScore: 750,
	scaleMax: 900,
	gradeWeights: { quiz: 0.3, 'scenario-pbq': 0.2, full: 0.5 },
	modules: [
		{
			id: 'week-1',
			week: 1,
			title: 'Foundations & Threats',
			description:
				'Domains 1 & 2 — General Security Concepts, Threats, Vulnerabilities, and Mitigations (34% of exam).',
			position: 1
		},
		{
			id: 'week-2',
			week: 2,
			title: 'Architecture & Operations I',
			description:
				'Domains 3 & 4 — Security Architecture and the first half of Security Operations (46% of exam).',
			position: 2
		},
		{
			id: 'week-3',
			week: 3,
			title: 'Operations II & Program Management',
			description:
				'Domain 4 finish, Domain 5 — Security Program Management and Oversight (20% of exam), plus heavy practice.',
			position: 3
		},
		{
			id: 'week-4',
			week: 4,
			title: 'Final Review & Readiness',
			description:
				'Targeted review, full-length timed exams, and a final readiness check before test day.',
			position: 4
		}
	],
	lessons: [
		{
			id: 'lesson-1-1',
			moduleId: 'week-1',
			title: 'Domain 1 — General Security Concepts',
			summary:
				'CIA triad, AAA, security control types, Zero Trust architecture, physical security, deception technology, change management, and cryptography basics.',
			content:
				'**Objectives covered:** 1.1–1.4\n\n- **CIA triad** — Confidentiality (encryption, permissions), Integrity (hashing, digital signatures), Availability (redundancy, patching).\n- **AAA** — Authentication, Authorization, Accounting (auditing/tracking).\n- **Security controls** — Preventive, Detective, Corrective, Deterrent, Directive, Compensating; physical vs technical vs administrative.\n- **Zero Trust** — Never trust, always verify; control plane vs data plane; identity, device, network, application, data as pillars.\n- **Physical security** — Bollards, access control vestibules, biometrics, CCTV, hardware locks.\n- **Deception** — Honeypots, honeynets, honeyfiles, honeytokens, canary devices.\n- **Change management** — Requests, approvals, rollback plans, sandboxing, change windows.\n- **Cryptography basics** — Symmetric vs asymmetric, hashing, salting, key exchange, digital signatures.',
			position: 1
		},
		{
			id: 'lesson-1-2',
			moduleId: 'week-1',
			title: 'Domain 2 — Threats, Vulnerabilities & Mitigations',
			summary:
				'Threat actors and attributes, threat vectors, malware, network/application/cryptographic/physical attacks, vulnerabilities, and mitigation techniques.',
			content:
				'**Objectives covered:** 2.1–2.5\n\n- **Threat actors** — Nation-state, APT, insider, hacktivist, script kiddie, organized crime; motivations (data exfiltration, IP theft, disruption).\n- **Threat vectors** — Email, web, removable media, social engineering (phishing, vishing, smishing, pretexting, tailgating).\n- **Malware** — Ransomware, trojans, worms, spyware, rootkits, keyloggers, botnets, logic bombs.\n- **Attacks** — DoS/DDoS, SQLi, XSS, CSRF, buffer overflow, on-path, replay, birthday, downgrade, brute force, rainbow table.\n- **Vulnerabilities** — Application, OS, web, cloud, supply chain, mobile, misconfiguration, zero-day.\n- **Mitigations** — Segmentation, hardening, patching, least privilege, allow-lists, sandboxing, MFA, EDR.',
			position: 2
		},
		{
			id: 'lesson-2-1',
			moduleId: 'week-2',
			title: 'Domain 3 — Security Architecture',
			summary:
				'Cloud and on-premises architecture, segmentation, virtualization/containerization, IoT and ICS/SCADA, data protection, high availability and disaster recovery.',
			content:
				'**Objectives covered:** 3.1–3.4\n\n- **Architecture models** — Public/private/hybrid cloud, on-premises, IaaS/PaaS/SaaS, shared responsibility, serverless, microservices, IaC.\n- **Segmentation** — VLANs, DMZ, air gaps, SDN, east-west traffic control.\n- **Virtualization & containers** — Hypervisors, VDI, containers, orchestration (Kubernetes).\n- **IoT / ICS / SCADA** — Embedded systems, RTOS, PLCs, air-gapped industrial networks.\n- **Data protection** — Encryption at rest/in transit, masking, tokenization, hashing, DLP, ACLs, data classifications.\n- **HA & DR** — Redundancy, failover, backups (full/incremental/differential), replication, RTO/RPO, hot/warm/cold sites.',
			position: 3
		},
		{
			id: 'lesson-2-2',
			moduleId: 'week-2',
			title: 'Domain 4 — Security Operations (Part I)',
			summary:
				'Secure baselines and hardening, endpoint security, mobile/wireless security, monitoring and logging, and vulnerability management.',
			content:
				'**Objectives covered:** 4.1–4.5\n\n- **Baselines & hardening** — Servers, workstations, network devices, cloud; disable unnecessary services, patch, secure configs.\n- **Endpoint security** — EDR/XDR, host firewalls, application allow-listing, secure boot, TPM, trusted platform module.\n- **Mobile & wireless** — MDM/UEM, BYOD/COPE/CYOD, WPA2/WPA3, RADIUS, 802.1X, captive portals.\n- **Monitoring & logging** — SIEM, log sources, syslog, netflow, baselines, alerting thresholds.\n- **Vulnerability management** — Scanning, CVE/CVSS, remediation prioritization, patch cycles, responsible disclosure.',
			position: 4
		},
		{
			id: 'lesson-3-1',
			moduleId: 'week-3',
			title: 'Domain 4 — Security Operations (Part II)',
			summary:
				'Identity and access management, NAC, DLP, email and DNS security, incident response, and digital forensics.',
			content:
				'**Objectives covered:** 4.6–4.9\n\n- **IAM** — Provisioning/de-provisioning, SSO, federation (SAML, OAuth, OpenID), MFA, PAM, password policies.\n- **NAC & DLP** — Network access control, data loss prevention, web filtering, CASB.\n- **Email & DNS security** — SPF, DKIM, DMARC, DNSSEC, DNS filtering, secure email gateways.\n- **Incident response** — Preparation, detection, containment, eradication, recovery, lessons learned; playbooks, tabletop exercises.\n- **Forensics** — Evidence collection and preservation, chain of custody, acquisition, order of volatility.',
			position: 5
		},
		{
			id: 'lesson-3-2',
			moduleId: 'week-3',
			title: 'Domain 5 — Security Program Management & Oversight',
			summary:
				'Governance and policy, risk management, third-party risk, compliance, audits and assessments, and security awareness.',
			content:
				'**Objectives covered:** 5.1–5.6\n\n- **Governance** — Policies, standards, procedures, guidelines; roles (data owner, controller, processor, custodian).\n- **Risk management** — Qualitative vs quantitative (SLE, ARO, ALE), risk register, risk responses (avoid, mitigate, transfer, accept).\n- **Third-party risk** — Vendor selection, SLAs, NDAs, right-to-audit, supply chain risk.\n- **Compliance** — GDPR, HIPAA, PCI DSS, SOX; privacy, data residency, breach notification.\n- **Audits & assessments** — Internal/external audits, pen testing (black/white/gray box), rules of engagement.\n- **Awareness** — Security training, phishing simulations, gamification, user onboarding/offboarding.',
			position: 6
		},
		{
			id: 'lesson-4-1',
			moduleId: 'week-4',
			title: 'Exam Strategy & Objective Walkthrough',
			summary:
				'Readiness checklist, weak-topic targeting, PBQ strategy, and a line-by-line objectives review before test day.',
			content:
				'**How to use this week**\n\n- Review your gradebook **weak topics** and re-do targeted objective quizzes.\n- Walk the official exam objectives and confirm you can explain every bullet in 1–2 sentences.\n- Take the **final full-length exam** under real conditions: 90 questions, 90 minutes, no distractions.\n- Score **750/900 (83.3%) or higher** on at least one full exam before scheduling the real thing.\n- Rest the day before — no heavy study, light review only.',
			position: 7
		}
	],
	assignments: [
		// Week 1 — Domains 1 & 2
		{
			id: 'a1-1',
			moduleId: 'week-1',
			title: 'Domain 1 Objective Quiz',
			description:
				'20 multiple-choice questions covering objectives 1.1–1.4 (General Security Concepts).',
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
			id: 'a1-2',
			moduleId: 'week-1',
			title: 'Domain 2 Objective Quiz',
			description:
				'20 multiple-choice questions covering objectives 2.1–2.5 (Threats, Vulnerabilities, Mitigations).',
			kind: 'quiz',
			category: 'quiz',
			points: 20,
			count: 20,
			domain: D2,
			mode: 'practice',
			durationMinutes: 25,
			dueOffsetDays: -22,
			position: 2
		},
		{
			id: 'a1-3',
			moduleId: 'week-1',
			title: 'Week 1 Checkpoint Exam',
			description:
				'20-question timed mini-exam mixing Domains 1 & 2. Your first exam-conditions check-in.',
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
		// Week 2 — Domains 3 & 4
		{
			id: 'a2-1',
			moduleId: 'week-2',
			title: 'Domain 3 Objective Quiz',
			description:
				'20 multiple-choice questions covering objectives 3.1–3.4 (Security Architecture).',
			kind: 'quiz',
			category: 'quiz',
			points: 20,
			count: 20,
			domain: D3,
			mode: 'practice',
			durationMinutes: 25,
			dueOffsetDays: -17,
			position: 4
		},
		{
			id: 'a2-2',
			moduleId: 'week-2',
			title: 'Domain 4 Objective Quiz',
			description:
				'20 multiple-choice questions covering objectives 4.1–4.5 (Security Operations I).',
			kind: 'quiz',
			category: 'quiz',
			points: 20,
			count: 20,
			domain: D4,
			mode: 'practice',
			durationMinutes: 25,
			dueOffsetDays: -15,
			position: 5
		},
		{
			id: 'a2-3',
			moduleId: 'week-2',
			title: 'PBQ Practice Set',
			description:
				'5 performance-based questions — hands-on ordering, matching, and configuration tasks.',
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
			id: 'a2-4',
			moduleId: 'week-2',
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
		// Week 3 — Domains 4-5 + heavy practice
		{
			id: 'a3-1',
			moduleId: 'week-3',
			title: 'Domain 5 Objective Quiz',
			description:
				'20 multiple-choice questions covering objectives 5.1–5.6 (Program Management & Oversight).',
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
			id: 'a3-2',
			moduleId: 'week-3',
			title: 'Scenario Practice Set',
			description: '10 applied scenario-based questions testing real-world decision making.',
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
			id: 'a3-3',
			moduleId: 'week-3',
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
			id: 'a4-1',
			moduleId: 'week-4',
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
			id: 'a4-2',
			moduleId: 'week-4',
			title: 'Full Practice Exam #3 (Final)',
			description:
				'Final 90-question, 90-minute exam. Target 750/900 scaled (83.3%) or higher — the real pass mark.',
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

// ── Scheduling helpers ───────────────────────────────────────────────────────

/** Returns the due date (local midnight) for an assignment given the exam date (YYYY-MM-DD). */
export function assignmentDueDate(assignment: CourseAssignment, examDate: string): Date {
	const due = new Date(`${examDate}T00:00:00`);
	due.setDate(due.getDate() + assignment.dueOffsetDays);
	return due;
}

export function formatDate(date: Date | string): string {
	let value: Date;
	if (typeof date === 'string') {
		// Treat YYYY-MM-DD as a local calendar date to avoid UTC timezone shifts.
		const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
		value = match
			? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
			: new Date(date);
	} else {
		value = date;
	}
	return value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function daysUntil(date: Date): number {
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const target = new Date(date);
	target.setHours(0, 0, 0, 0);
	return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

export function assignmentStatus(
	assignment: CourseAssignment,
	examDate: string,
	submissions: SubmissionRecord[],
	activeAssignmentId: string | null
): AssignmentStatus {
	if (submissions.some((s) => s.assignmentId === assignment.id)) return 'submitted';
	if (activeAssignmentId === assignment.id) return 'in-progress';
	const due = assignmentDueDate(assignment, examDate);
	const days = daysUntil(due);
	if (days < 0) return 'overdue';
	if (days <= 2) return 'due-soon';
	return 'open';
}

// ── Gradebook ────────────────────────────────────────────────────────────────

export interface CategoryGrade {
	category: AssignmentCategory;
	label: string;
	weight: number;
	earned: number;
	possible: number;
	percentage: number | null; // null when nothing submitted in category
	submittedCount: number;
	totalCount: number;
}

export interface AssignmentGrade extends SubmissionRecord {
	assignment: CourseAssignment;
	dueDate: Date;
	status: AssignmentStatus;
}

export interface Gradebook {
	weightedPercentage: number | null;
	letterGrade: string;
	categories: CategoryGrade[];
	assignments: AssignmentGrade[];
	submittedAssignments: number;
	totalAssignments: number;
	pointsEarned: number;
	pointsPossible: number;
}

export function letterForPercentage(pct: number): string {
	if (pct >= 90) return 'A';
	if (pct >= 80) return 'B';
	if (pct >= 70) return 'C';
	if (pct >= 60) return 'D';
	return 'F';
}

export function computeGradebook(
	assignments: CourseAssignment[],
	submissions: SubmissionRecord[],
	examDate: string,
	activeAssignmentId: string | null,
	weights = COURSE_DEFINITION.gradeWeights
): Gradebook {
	const bestByAssignment = new Map<string, SubmissionRecord>();
	for (const submission of submissions) {
		const best = bestByAssignment.get(submission.assignmentId);
		if (!best || submission.percentage > best.percentage)
			bestByAssignment.set(submission.assignmentId, submission);
	}

	const categories: CategoryGrade[] = (
		['quiz', 'scenario-pbq', 'full'] as AssignmentCategory[]
	).map((category) => {
		const inCategory = assignments.filter((a) => a.category === category);
		const graded = inCategory.filter((a) => bestByAssignment.has(a.id));
		const earned = graded.reduce(
			(sum, a) => sum + ((bestByAssignment.get(a.id)?.percentage ?? 0) / 100) * a.points,
			0
		);
		const possible = graded.reduce((sum, a) => sum + a.points, 0);
		return {
			category,
			label:
				category === 'quiz'
					? 'Quizzes'
					: category === 'scenario-pbq'
						? 'Scenarios & PBQs'
						: 'Full Exams',
			weight: weights[category],
			earned,
			possible,
			percentage: possible ? Math.round((earned / possible) * 1000) / 10 : null,
			submittedCount: graded.length,
			totalCount: inCategory.length
		};
	});

	const gradedCategories = categories.filter((c) => c.percentage !== null);
	const weightUsed = gradedCategories.reduce((sum, c) => sum + c.weight, 0);
	const weightedPercentage =
		gradedCategories.length === 0
			? null
			: Math.round(
					(gradedCategories.reduce((sum, c) => sum + (c.percentage ?? 0) * c.weight, 0) /
						weightUsed) *
						10
				) / 10;

	const assignmentGrades: AssignmentGrade[] = assignments
		.map((assignment) => {
			const submission = bestByAssignment.get(assignment.id);
			return {
				...submission!,
				assignment,
				dueDate: assignmentDueDate(assignment, examDate),
				status: assignmentStatus(assignment, examDate, submissions, activeAssignmentId)
			};
		})
		.sort((a, b) => a.assignment.position - b.assignment.position);

	return {
		weightedPercentage,
		letterGrade: weightedPercentage === null ? '—' : letterForPercentage(weightedPercentage),
		categories,
		assignments: assignmentGrades,
		submittedAssignments: bestByAssignment.size,
		totalAssignments: assignments.length,
		pointsEarned: bestByAssignment.size
			? [...bestByAssignment.entries()].reduce(
					(sum, [assignmentId, submission]) =>
						sum +
						(submission.percentage / 100) *
							(assignments.find((a) => a.id === assignmentId)?.points ?? 0),
					0
				)
			: 0,
		pointsPossible: assignments.reduce((sum, a) => sum + a.points, 0)
	};
}

// ── Readiness meter ──────────────────────────────────────────────────────────

export interface Readiness {
	score: number; // 0–100
	label: string;
	domainMastery: number | null;
	examAverage: number | null;
	examCount: number;
	passingScale: number; // scaled score projection, 100–900
	ready: boolean;
}

/** Exam domain weightings mirror the real SY0-701 question mix. */
export const EXAM_DOMAIN_QUOTAS: Record<Domain, number> = { 1: 11, 2: 20, 3: 16, 4: 25, 5: 18 };

export function computeReadiness(
	domainProgress: Record<number, { percentage: number; possiblePoints: number }>,
	completedFullExams: { percentage: number }[],
	passingScore = COURSE_DEFINITION.passingScore,
	scaleMax = COURSE_DEFINITION.scaleMax
): Readiness {
	const domainsWithData = ([1, 2, 3, 4, 5] as Domain[]).filter(
		(d) => domainProgress[d]?.possiblePoints > 0
	);
	const domainMastery =
		domainsWithData.length === 0
			? null
			: Math.round(
					(domainsWithData.reduce(
						(sum, d) => sum + domainProgress[d].percentage * EXAM_DOMAIN_QUOTAS[d],
						0
					) /
						domainsWithData.reduce((sum, d) => sum + EXAM_DOMAIN_QUOTAS[d], 0)) *
						10
				) / 10;

	const recentExams = completedFullExams.slice(-2);
	const examAverage = recentExams.length
		? Math.round(
				(recentExams.reduce((sum, e) => sum + e.percentage, 0) / recentExams.length) * 10
			) / 10
		: null;

	let score: number;
	if (domainMastery === null) {
		score = 0;
	} else if (examAverage === null) {
		score = domainMastery * 0.8;
	} else {
		score = Math.round((domainMastery * 0.5 + examAverage * 0.5) * 10) / 10;
	}

	const label =
		score >= 85
			? 'Exam-ready'
			: score >= 75
				? 'Prepared'
				: score >= 60
					? 'Building'
					: score >= 40
						? 'Getting started'
						: 'Not started';

	const scaled = Math.round(100 + (score / 100) * (scaleMax - 100));
	const passingPercent = (passingScore / scaleMax) * 100;

	return {
		score,
		label,
		domainMastery,
		examAverage,
		examCount: completedFullExams.length,
		passingScale: scaled,
		ready: score >= passingPercent
	};
}

// ── Exam date default ────────────────────────────────────────────────────────

export function defaultExamDate(now = new Date()): string {
	const date = new Date(now);
	date.setDate(date.getDate() + 28);
	return date.toISOString().slice(0, 10);
}

export function sessionLaunchFor(assignment: CourseAssignment): {
	type: SessionType;
	mode: SessionMode;
	count: number;
	domain?: number;
} {
	return {
		type:
			assignment.kind === 'full'
				? 'full'
				: assignment.kind === 'pbq'
					? 'pbq'
					: assignment.kind === 'scenario'
						? 'scenario'
						: 'quiz',
		mode: assignment.mode,
		count: assignment.count,
		...(assignment.domain ? { domain: assignment.domain } : {})
	};
}
