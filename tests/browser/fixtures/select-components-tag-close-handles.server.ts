import { render } from 'svelte/server';
import Case from './SelectComponentsTagCloseHandlesCase.svelte';
import { selectTagCloseHandleSamples } from '../select-components-tag-close-handles-cases.mjs';
import type { SelectTagCloseHandleCapture } from '../select-components-tag-close-handles-metrics.mjs';
export function renderSelectComponentsTagCloseHandles(id: string) {
  if (typeof window !== 'undefined' || typeof document !== 'undefined') {
    throw Error('Tag close handles SSR requires no DOM');
  }
  const sample = selectTagCloseHandleSamples.find(value => value.id === id);
  if (!sample) {
    throw Error('Unknown frozen tag close handle sample');
  }
  const capture: SelectTagCloseHandleCapture = {}, rendered = render(
    Case,
    { props: { sample, capture } }
  );
  return { head: rendered.head, body: rendered.body, state: capture.read!(), refs: Object.fromEntries(Object.entries(capture.readRefs!())
    .map(([key, value]) => [key, value == null])), domFree: true };
}
