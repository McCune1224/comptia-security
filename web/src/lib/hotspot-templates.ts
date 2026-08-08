/**
 * Shared diagram templates for the `hotspot` question kind.
 *
 * Every template lives in a 0–100 × 0–100 coordinate space. Item authors
 * position their regions using the exported geometry constants below, so the
 * tap targets line up with the rendered diagram. The client renders the
 * template background and overlays the regions as percentage-positioned
 * tappable rects (≥44px rendered height is the author's responsibility).
 */

export interface HotspotTemplateDef {
	id: string;
	label: string;
	/** Short description shown above the diagram. */
	description: string;
	/** Minimum regions the validator enforces. */
	minRegions: number;
	/** Canonical region count for the layout (e.g. 7 layers); validated when set. */
	expectedRegions?: number;
	/** Upper bound for a region label length (log rows carry real text). */
	maxLabelLength?: number;
}

export const HOTSPOT_TEMPLATES: Record<string, HotspotTemplateDef> = {
	'osi-stack': {
		id: 'osi-stack',
		label: 'OSI model stack',
		description: 'Seven layers, Application (top) through Physical (bottom).',
		minRegions: 2,
		expectedRegions: 7,
		maxLabelLength: 24
	},
	'topology-basic': {
		id: 'topology-basic',
		label: 'Small-office topology',
		description: 'Internet cloud, router, switch, server, and workstations.',
		minRegions: 2,
		maxLabelLength: 24
	},
	'packet-frame': {
		id: 'packet-frame',
		label: 'Packet / frame fields',
		description: 'Header fields laid out left to right inside the frame.',
		minRegions: 2,
		maxLabelLength: 24
	},
	'log-lines': {
		id: 'log-lines',
		label: 'Log excerpt',
		description: 'One row per line — tap a line.',
		minRegions: 2,
		maxLabelLength: 140
	}
};

export function hotspotTemplate(id: string): HotspotTemplateDef | undefined {
	return HOTSPOT_TEMPLATES[id];
}

/** Canonical 7-layer OSI bands (y1/y2 in 0–100), Application at top. */
export const OSI_LAYER_BANDS: { y1: number; y2: number; label: string }[] = [
	{ y1: 0, y2: 14.3, label: 'Application' },
	{ y1: 14.3, y2: 28.6, label: 'Presentation' },
	{ y1: 28.6, y2: 42.9, label: 'Session' },
	{ y1: 42.9, y2: 57.2, label: 'Transport' },
	{ y1: 57.2, y2: 71.5, label: 'Network' },
	{ y1: 71.5, y2: 85.8, label: 'Data Link' },
	{ y1: 85.8, y2: 100, label: 'Physical' }
];

/** Device anchors for the basic topology diagram (all in 0–100 space). */
export const TOPOLOGY_ANCHORS: { id: string; label: string; x1: number; y1: number; x2: number; y2: number }[] = [
	{ id: 'cloud', label: 'Internet', x1: 5, y1: 2, x2: 95, y2: 20 },
	{ id: 'router', label: 'Router', x1: 30, y1: 28, x2: 70, y2: 46 },
	{ id: 'switch', label: 'Switch', x1: 12, y1: 54, x2: 52, y2: 72 },
	{ id: 'server', label: 'Server', x1: 60, y1: 54, x2: 92, y2: 72 },
	{ id: 'pc1', label: 'Workstation 1', x1: 6, y1: 80, x2: 32, y2: 96 },
	{ id: 'pc2', label: 'Workstation 2', x1: 38, y1: 80, x2: 64, y2: 96 },
	{ id: 'pc3', label: 'Workstation 3', x1: 70, y1: 80, x2: 96, y2: 96 }
];

/** Canonical frame bands (x1/x2 in 0–100), left to right. */
export const PACKET_BANDS: { x1: number; x2: number; label: string }[] = [
	{ x1: 0, x2: 8, label: 'Preamble' },
	{ x1: 8, x2: 18, label: 'Dest MAC' },
	{ x1: 18, x2: 28, label: 'Src MAC' },
	{ x1: 28, x2: 34, label: 'Type' },
	{ x1: 34, x2: 76, label: 'Payload' },
	{ x1: 76, x2: 100, label: 'FCS' }
];
