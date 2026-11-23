import '@woodger/antd/styles.css';
import { hydrate, tick, unmount, flushSync } from 'svelte';
import HydrationCase, { type HydrationCapture, type HydrationSample } from './SelectComponentsHydrationCase.svelte';
import { selectComponentsHydrationSamples } from './select-components-hydration-cases.mjs';
import { initializeSelectComponentsHydrationProbe, readSelectComponentsHydration } from '../select-components-hydration-metrics.mjs';

const sample = selectComponentsHydrationSamples.find(sample => sample.id === new URL(location.href).searchParams.get('sample'));
if (!sample) {
  throw Error('Unknown components hydration sample');
}
const target = document.getElementById('root')!;
// The browser driver parses SSR, applies the pre-hydration edit and initializes
// this read-only identity observer before loading the client.
if (!window.componentsHydrationProbe) initializeSelectComponentsHydrationProbe();
const state = window.componentsHydrationProbe;
state.observe = readSelectComponentsHydration;
state.readNativeRefChecks = () => capture.readNativeRefChecks!();
state.readNativeBlurChecks = () => capture.readNativeBlurChecks!();
const capture: HydrationCapture = {};
state.api = { read: () => capture.read!(), readRefs: () => capture.readRefs!(),
  update: (action: Parameters<NonNullable<HydrationCapture['update']>>[0]) => capture.update!(action) };
capture.onCommit = () => {
  state.commitSnapshot = readSelectComponentsHydration();
  state.hydrationCommitted = true;
};
const app = hydrate(
  HydrationCase,
  { target, props: { sample: sample as HydrationSample, capture }, recover: false }
);
state.afterCall = readSelectComponentsHydration();
await tick();
state.flushUpdate = (action: Parameters<NonNullable<HydrationCapture['update']>>[0]) => flushSync(() => capture.update!(action));
state.dispose = async () => {
  await unmount(app);
  await tick();
};
state.ready = true;
