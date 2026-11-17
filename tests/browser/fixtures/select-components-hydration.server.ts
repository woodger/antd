import { render } from 'svelte/server';
import HydrationCase, { type HydrationCapture, type HydrationSample } from './SelectComponentsHydrationCase.svelte';
import { selectComponentsHydrationSamples } from './select-components-hydration-cases.mjs';

export function renderSelectComponentsHydration(id: string) {
  if (typeof window !== 'undefined' || typeof document !== 'undefined') throw Error('Hydration SSR requires no DOM');
  const sample = selectComponentsHydrationSamples.find(sample => sample.id === id);
  if (!sample) throw Error('Unknown components hydration sample: ' + id);
  const capture: HydrationCapture = {};
  const rendered = render(HydrationCase, { props: { sample: sample as HydrationSample, capture }, idPrefix: 'components-hydration' });
  return { head: rendered.head, body: rendered.body, state: capture.read!(), domFree: true };
}
