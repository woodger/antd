import 'antd-svelte/styles.css';
import { mount, unmount, tick, flushSync } from 'svelte';
import Case from './DatePickerTimeScrollCase.svelte';
import { samples } from '../date-picker-time-scroll-cases.mjs';
import type { OwnerCapture } from '../date-picker-time-scroll-native-types';

const id = new URL(location.href).searchParams.get('sample');
const sample = samples.find(value => value.id === id);
if (!sample) throw Error('Unknown frozen public time-scroll sample');
const target = document.getElementById('root');
if (!target) throw Error('Actual Native owner mount target is absent');
const capture: OwnerCapture = {};
window.nativeTimeScrollObservation = {
  preMountNodes: new Set(document.querySelectorAll('*')), retainedNodes: new Set(), wheels: []
};
const app = mount(Case, { target, props: { sample, capture } });
window.nativeTimeScroll = {
  ready: false,
  getRecorder() {
    if (!capture.recorder) throw Error('Actual Native recorder not available');
    return capture.recorder;
  },
  read() {
    if (!capture.read) throw Error('Actual Native owner read not available');
    return capture.read();
  },
  readRefs() {
    if (!capture.readRefs) throw Error('Actual Native public refs not available');
    return capture.readRefs();
  },
  setActionIndex(index) {
    if (!capture.setActionIndex) throw Error('Actual Native action index not available');
    capture.setActionIndex(index);
  },
  activateOwnerControl(kind, value) {
    const button = [...document.querySelectorAll<HTMLButtonElement>('[data-scroll-control]')]
      .find(node => node.dataset.scrollControl === kind && node.dataset.scrollValue === String(value));
    if (!button) throw Error('Actual authored Native owner control is absent');
    const before = document.activeElement;
    let actual: unknown = null;
    button.addEventListener('click', event => {
      actual = { type: event.type, isTrusted: event.isTrusted,
        targetMatches: event.target === button, currentTargetMatches: event.currentTarget === button };
    }, { once: true, capture: true });
    flushSync(() => button.click());
    return { click: actual, physicalFocusIdentityPreserved: before === document.activeElement,
      activeBefore: before?.tagName ?? null, activeAfter: document.activeElement?.tagName ?? null };
  },
  async dispose() {
    await unmount(app);
    await tick();
  }
};
await tick();
if (!capture.read || !capture.readRefs || !capture.recorder || !capture.setActionIndex) {
  throw Error('Native caller failed to expose its actual observation handles');
}
window.nativeTimeScroll.ready = true;
