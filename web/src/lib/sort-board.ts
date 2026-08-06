export interface SortBoardState {
	selected: string | null;
	assignments: Record<string, string>; // itemId -> bucketId
}

/**
 * Toggle item selection. Selecting a different item replaces the selection.
 * Tapping an already-placed item moves it back to the tray (and clears selection).
 */
export function tapItem(state: SortBoardState, itemId: string): SortBoardState {
	if (state.assignments[itemId]) {
		const assignments = { ...state.assignments };
		delete assignments[itemId];
		return { selected: null, assignments };
	}
	return { ...state, selected: state.selected === itemId ? null : itemId };
}

/** Assign the selected item to a bucket. No-op when no item is selected. */
export function tapBucket(state: SortBoardState, bucketId: string): SortBoardState {
	if (!state.selected) return state;
	return {
		selected: null,
		assignments: { ...state.assignments, [state.selected]: bucketId }
	};
}

export function isItemAssigned(state: SortBoardState, itemId: string): boolean {
	return Boolean(state.assignments[itemId]);
}
