import { render } from 'svelte/server';
import Case from './SelectComponentsResponsiveTagPrefixCase.svelte';
import { selectCustomTagPrefixSamples } from '../select-components-responsive-tag-prefix-cases.mjs';
import type { SelectCustomTagPrefixCapture } from '../select-components-responsive-tag-prefix-metrics.mjs';
export function renderSelectComponentsResponsiveTagPrefix(id: string) {
  if (typeof window !== 'undefined' || typeof document !== 'undefined') throw Error('Custom tag/prefix SSR requires no DOM');
  const sample = selectCustomTagPrefixSamples.find(sample => sample.id === id);
  if (!sample) throw Error('Unknown frozen custom-tag/prefix sample');
  const capture: SelectCustomTagPrefixCapture = {}, rendered = render(Case, { props: { sample, capture } });
  const head = rendered.head, body = rendered.body;
  return { head, body, state: capture.read!(), refs: Object.fromEntries(Object.entries(capture.readRefs!())
    .map(([key, value]) => [key, value == null])), domFree: true };
}
