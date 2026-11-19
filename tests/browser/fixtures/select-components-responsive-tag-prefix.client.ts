import 'antd-svelte/styles.css';
import { mount, tick, unmount, flushSync } from 'svelte';
import Case from './SelectComponentsResponsiveTagPrefixCase.svelte';
import { selectCustomTagPrefixSamples } from '../select-components-responsive-tag-prefix-cases.mjs';
import type { SelectCustomTagPrefixCapture } from '../select-components-responsive-tag-prefix-metrics.mjs';
const sample = selectCustomTagPrefixSamples.find(sample => sample.id === new URL(location.href).searchParams.get('sample'));
if (!sample) {
  throw Error('Unknown frozen custom-tag/prefix sample');
}
const capture: SelectCustomTagPrefixCapture = {};
const api = {
  read: () => capture.read!(),
  readRefs: () => capture.readRefs!(),
  update: (action: Parameters<NonNullable<typeof capture.update>>[0], index?: number) => capture.update!(
    action,
    index
  )
};
// Actual existing raw/current consumer contract; no Source-shaped ref/property
// is synthesized on the real public Svelte control.
Object.assign(window, { raw: { current: api } });
const target = document.getElementById('root');
if (!target) {
  throw Error('Ordinary consumer target missing');
}
const app = mount(Case, { target, props: { sample, capture } });
await tick();
window.customTagPrefixNative = { ready: true, read: api.read, readRefs: api.readRefs,
  update: (action, index) => flushSync(() => capture.update!(action, index)),
  async dispose() {
    await unmount(app);
    await tick();
  } };
