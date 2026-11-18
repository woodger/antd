import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import OwnStyleCase from './SelectComponentsOwnStyleCase.svelte';
import { selectOwnStyleInitSamples } from '../select-components-own-style-init-cases.mjs';

type Capture = NonNullable<ComponentProps<typeof OwnStyleCase>['capture']>;
export function renderSelectComponentsOwnStyle(id: string) {
  if (typeof window !== 'undefined' || typeof document !== 'undefined') throw Error('Own style SSR requires no DOM');
  const sample = selectOwnStyleInitSamples.find(sample => sample.id === id);
  if (!sample) throw Error('Unknown own-style owner');
  const capture: Capture = {};
  const rendered = render(OwnStyleCase, { props: { sample: { ...sample, profile: 'same' }, capture } });
  return { head: rendered.head, body: rendered.body, state: capture.read!(),
    refs: Object.fromEntries(Object.entries(capture.readRefs!()).map(([key, ref]) => [key, ref == null])), domFree: true };
}
