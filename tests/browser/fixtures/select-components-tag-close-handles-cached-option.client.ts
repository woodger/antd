import 'antd-svelte/styles.css';
import { mount, tick, unmount, flushSync } from 'svelte';
import Case from './SelectComponentsTagCloseHandlesCase.svelte';
import { cachedOptionSamples } from '../select-components-tag-close-handles-cached-option-cases.mjs';
import type { SelectTagCloseHandleCapture } from '../select-components-tag-close-handles-metrics.mjs';
const sample = cachedOptionSamples.find(value => value.id === new URL(location.href).searchParams.get('sample'));
if (!sample) throw Error('Unknown frozen tag close handle sample');
const capture: SelectTagCloseHandleCapture = {};
const api = {
  read: () => capture.read!(),
  readRefs: () => capture.readRefs!(),
  setActionIndex: (value: number) => capture.setActionIndex!(value)
};
// The frozen Source reader observes actual public control and separate Native binds.
Object.assign(window, { raw: { current: api } });
const target = document.getElementById('root');
if (!target) throw Error('Ordinary consumer target missing');
const app = mount(Case, { target, props: { sample, capture } });
await tick();
window.tagCloseHandlesNative = { ready: true, ...api,
  click(actionId, index) {
    api.setActionIndex(index);
    const button = document.querySelector('[data-handles-action="' + actionId + '"]');
    if (!(button instanceof HTMLButtonElement) || button.disabled || button.type !== 'button') throw Error('Actual enabled ordinary caller button required');
    // DOM .click(), isTrusted=false; no pointer/mousedown/focus injection.
    flushSync(() => button.click());
  },
  async dispose() {
    await unmount(app);
    await tick();
  } };
