import { describe, it, expect } from 'vitest';
import { tapPremise, tapTarget, removeEdge, isTargetUsed } from '$lib/match-connect';

describe('match-connect state helpers', () => {
	it('selects a premise and toggles off on re-tap', () => {
		let s = tapPremise({ selected: null, matches: {} }, 'p1');
		expect(s.selected).toBe('p1');
		s = tapPremise(s, 'p2');
		expect(s.selected).toBe('p2');
		s = tapPremise(s, 'p2');
		expect(s.selected).toBeNull();
	});

	it('connects the selected premise to a target and clears selection', () => {
		const s = tapTarget(tapPremise({ selected: null, matches: {} }, 'p1'), 't1');
		expect(s.matches).toEqual({ p1: 't1' });
		expect(s.selected).toBeNull();
	});

	it('rejects a target already matched to another premise', () => {
		const base = { selected: 'p2', matches: { p1: 't1' } };
		const s = tapTarget(base, 't1');
		expect(s).toBe(base);
		expect(s.matches).toEqual({ p1: 't1' });
	});

	it('replaces the edge when re-tapping the same target on the same premise', () => {
		const base = { selected: 'p1', matches: { p1: 't1' } };
		const s = tapTarget(base, 't1');
		expect(s.matches).toEqual({ p1: 't1' });
		expect(s.selected).toBeNull();
	});

	it('is a no-op when tapping a target with no premise selected', () => {
		const base = { selected: null, matches: {} };
		const s = tapTarget(base, 't1');
		expect(s).toBe(base);
	});

	it('removes an edge', () => {
		const s = removeEdge({ selected: null, matches: { p1: 't1', p2: 't2' } }, 'p1');
		expect(s.matches).toEqual({ p2: 't2' });
	});

	it('never contains duplicate target ids', () => {
		let s = tapTarget(tapPremise({ selected: null, matches: {} }, 'p1'), 't1');
		s = tapPremise(s, 'p2');
		s = tapTarget(s, 't2');
		const values = Object.values(s.matches);
		expect(new Set(values).size).toBe(values.length);
	});

	it('isTargetUsed reports whether a target is matched', () => {
		const s = { selected: null, matches: { p1: 't1' } };
		expect(isTargetUsed(s, 't1')).toBe(true);
		expect(isTargetUsed(s, 't2')).toBe(false);
	});
});
