import { render } from 'svelte/server';
import Case from './ModalLoadingCase.svelte';
import { modalLoadingSamples } from '../modal-loading-cases.mjs';
import type { ModalLoadingCapture } from '../modal-loading-metrics.mjs';
/** Existing Native closed-dialog SSR only; the Source loading corpus is CSR. */
export function renderModalLoading(id: string) {
  if (typeof window !== 'undefined' || typeof document !== 'undefined') throw Error('Modal server consumer requires no DOM');
  const sample = modalLoadingSamples.find(sample => sample.id === id);
  if (!sample) throw Error('Unknown frozen Modal.loading sample');
  const capture: ModalLoadingCapture = {}, rendered = render(Case, { props: { sample, capture } });
  const head = rendered.head, body = rendered.body;
  return { head, body, state: capture.read!(), refs: Object.fromEntries(Object.entries(capture.readRefs!())
    .map(([name, node]) => [name, node == null])), domFree: true, sourceSSROracle: false };
}
