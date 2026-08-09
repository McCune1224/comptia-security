import type { Component } from 'svelte';
import OsiExplorer from './OsiExplorer.svelte';
import PortFlipCards from './PortFlipCards.svelte';
import SubnetCalculator from './SubnetCalculator.svelte';
import TopologySpotlight from './TopologySpotlight.svelte';

/** In-lesson interactive widgets, keyed by the `::widget <id>::` marker used in lesson bodies. */
export const widgets: Record<string, Component> = {
	'osi-explorer': OsiExplorer,
	'port-flip-cards': PortFlipCards,
	'subnet-calculator': SubnetCalculator,
	'topology-spotlight': TopologySpotlight
};
