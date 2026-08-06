import { describe, it, expect } from 'vitest';
import { tapItem, tapBucket, isItemAssigned } from '$lib/sort-board';

describe('sort-board state helpers', () => {
	it('selects an item and toggles off on re-tap', () => {
		let s = tapItem({ selected: null, assignments: {} }, 'i1');
		expect(s.selected).toBe('i1');
		s = tapItem(s, 'i2');
		expect(s.selected).toBe('i2');
		s = tapItem(s, 'i2');
		expect(s.selected).toBeNull();
	});

	it('tapping a placed item moves it back to the tray', () => {
		const s = tapItem({ selected: null, assignments: { i1: 'b1' } }, 'i1');
		expect(s.assignments).toEqual({});
		expect(s.selected).toBeNull();
	});

	it('assigns the selected item to a bucket and clears selection', () => {
		const s = tapBucket({ selected: 'i1', assignments: {} }, 'b2');
		expect(s.assignments).toEqual({ i1: 'b2' });
		expect(s.selected).toBeNull();
	});

	it('is a no-op when tapping a bucket with no item selected', () => {
		const base = { selected: null, assignments: {} };
		const s = tapBucket(base, 'b1');
		expect(s).toBe(base);
	});

	it('reassigns a placed item to a different bucket', () => {
		const s = tapBucket({ selected: 'i2', assignments: { i1: 'b1', i2: 'b1' } }, 'b2');
		expect(s.assignments).toEqual({ i1: 'b1', i2: 'b2' });
	});

	it('isItemAssigned reports placements', () => {
		const s = { selected: null, assignments: { i1: 'b1' } };
		expect(isItemAssigned(s, 'i1')).toBe(true);
		expect(isItemAssigned(s, 'i2')).toBe(false);
	});
});
