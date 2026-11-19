import './date-picker-presets.styles.client';
import { mount, tick, unmount, flushSync } from 'svelte';
import Case from './DatePickerPresetTransitionsCase.svelte';
import { datePickerPresetTransitionSamples } from '../date-picker-preset-transitions-cases.mjs';
import { readDatePickerPresets, readDatePickerPresetsCleanup } from '../date-picker-preset-transitions-read-core.mjs';
import { readDatePickerPresetTransitions } from '../date-picker-preset-transitions-metrics.mjs';
import type {
  DatePickerPresetTransitionCapture, DatePickerPresetTransitionOwnerAPI,
  DatePickerPresetTransitionOwnerControl, DatePickerPresetTransitionCorePoint,
  DatePickerPresetTransitionPoint, DatePickerPresetTransitionCleanup,
  DatePickerPresetTransitionRaw
} from '../date-picker-preset-transitions-native-types';

const id = new URL(location.href).searchParams.get('sample');
const sample = datePickerPresetTransitionSamples.find(value => value.id === id);
if (!sample) {
  throw Error('Unknown bounded DatePicker preset transition sample');
}
const target = document.getElementById('root');
if (!target) {
  throw Error('Ordinary DatePicker transition target is missing');
}
const capture: DatePickerPresetTransitionCapture = {};
const api: DatePickerPresetTransitionOwnerAPI = {
  read() {
    if (!capture.read) {
      throw Error('Actual DatePicker owner read() is unavailable');
    }
    return capture.read();
  },
  readRefs() {
    if (!capture.readRefs) {
      throw Error('Actual DatePicker owner readRefs() is unavailable');
    }
    return capture.readRefs();
  },
  setActionIndex(index) {
    if (!capture.setActionIndex) {
      throw Error('Actual DatePicker owner action index is unavailable');
    }
    capture.setActionIndex(index);
  }
};
(window as unknown as { raw: DatePickerPresetTransitionRaw }).raw = {
  sample, current: api, preMountElements: new Set(document.querySelectorAll('*'))
};
// The same frozen function object reads the ordinary Native owner. Only its type
// changes at this bridge; its implementation and recorded fields stay unchanged.
window.readPresetTransitionsCore = readDatePickerPresets as unknown as () => DatePickerPresetTransitionCorePoint;
const app = mount(Case, { target, props: { sample, capture } });
await tick();
if (!capture.read || !capture.readRefs || !capture.setActionIndex) {
  throw Error('Actual DatePicker transition caller capture is incomplete');
}

function activateOwnerControl(kind: DatePickerPresetTransitionOwnerControl, value: string | boolean) {
  const button = [...document.querySelectorAll('[data-transition-control]')].find(node =>
    node.getAttribute('data-transition-control') === kind
      && node.getAttribute('data-transition-value') === String(value));
  if (!(button instanceof HTMLButtonElement)) {
    throw Error('Actual authored prop-control button is missing');
  }
  flushSync(() => button.click());
}
window.datePickerPresetTransitionsNative = {
  ready: true, ...api, activateOwnerControl,
  readDOM: readDatePickerPresetTransitions as unknown as () => DatePickerPresetTransitionPoint,
  readCleanup: readDatePickerPresetsCleanup as unknown as () => DatePickerPresetTransitionCleanup,
  async dispose() {
    await unmount(app);
    await tick();
  }
};
