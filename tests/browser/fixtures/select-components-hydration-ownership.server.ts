import { render } from 'svelte/server';
import Owner from './SelectComponentsHydrationOwnershipCase.svelte';
import { ownershipScenarios, ownershipOwnerSample, type HydrationOwnershipOwnerKey } from '../select-components-hydration-ownership-cases.mjs';
import type { HydrationOwnershipCapture } from '../select-components-hydration-ownership-metrics.mjs';

export function renderHydrationOwnership(scenarioId: string, ownerKey: HydrationOwnershipOwnerKey) {
  if (typeof window !== 'undefined' || typeof document !== 'undefined') {
    throw Error('Ownership SSR requires no DOM');
  }
  const scenario = ownershipScenarios.find(sample => sample.id === scenarioId);
  if (!scenario) {
    throw Error('Unknown hydration ownership scenario');
  }
  const sample = ownershipOwnerSample(scenario, ownerKey), capture: HydrationOwnershipCapture = {};
  // Each owner is an independent default public render; no UID/idPrefix workaround.
  const rendered = render(Owner, { props: { sample, capture } });
  const head = rendered.head, body = rendered.body;
  return { head, body, state: capture.read!(), refs: Object.fromEntries(Object.entries(capture.readRefs!())
    .map(([name, value]) => [name, value == null])), domFree: true };
}
