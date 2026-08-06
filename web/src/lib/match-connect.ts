export interface MatchConnectState {
	selected: string | null;
	matches: Record<string, string>;
}

/** Toggle premise selection. Selecting a different premise replaces the selection. */
export function tapPremise(state: MatchConnectState, premiseId: string): MatchConnectState {
	return { ...state, selected: state.selected === premiseId ? null : premiseId };
}

/**
 * Assign the selected premise to a target. A target already matched to a DIFFERENT
 * premise is rejected; re-tapping a target on the same premise replaces the edge.
 * No-op when no premise is selected.
 */
export function tapTarget(state: MatchConnectState, targetId: string): MatchConnectState {
	if (!state.selected) return state;
	const takenByOther = Object.entries(state.matches).some(
		([premiseId, matchedTarget]) => matchedTarget === targetId && premiseId !== state.selected
	);
	if (takenByOther) return state;
	return {
		selected: null,
		matches: { ...state.matches, [state.selected]: targetId }
	};
}

/** Remove the edge for a premise. */
export function removeEdge(state: MatchConnectState, premiseId: string): MatchConnectState {
	const matches = { ...state.matches };
	delete matches[premiseId];
	return { ...state, selected: null, matches };
}

export function isTargetUsed(state: MatchConnectState, targetId: string): boolean {
	return Object.values(state.matches).includes(targetId);
}
