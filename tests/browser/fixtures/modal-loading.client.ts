import './modal-loading.styles.client';
import { mount, tick, unmount, flushSync } from 'svelte';
import Case from './ModalLoadingCase.svelte';
import { modalLoadingSamples, type ModalLoadingUpdate } from '../modal-loading-cases.mjs';
import { initializeModalLoadingProbe } from '../modal-loading-metrics.mjs';
import type { ModalLoadingCapture, ModalLoadingProbe } from '../modal-loading-metrics.mjs';
const sample = modalLoadingSamples.find(sample => sample.id === new URL(location.href).searchParams.get('sample'));
if (!sample) throw Error('Unknown frozen Modal.loading sample');
const capture: ModalLoadingCapture = {};
const api = {
  read: () => capture.read!(),
  readRefs: () => capture.readRefs!(),
  update: (action: ModalLoadingUpdate) => capture.update!(action)
};
const rawState: { current: typeof api; modalLoadingProbe?: ModalLoadingProbe } = { current: api };
Object.assign(window, { raw: rawState });
initializeModalLoadingProbe();
capture.observeRef = node => rawState.modalLoadingProbe!.describe(node);
const target = document.getElementById('root');
if (!target) throw Error('Ordinary Modal consumer target missing');
const app = mount(Case, { target, props: { sample, capture } });
await tick();
window.modalLoadingNative = { ready: true, read: api.read, readRefs: api.readRefs,
  update: action => flushSync(() => capture.update!(action)),
  async dispose() {
    await unmount(app);
    await tick();
  } };
