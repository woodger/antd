import './date-picker-presets.styles.client';
import { mount, tick, unmount, flushSync } from 'svelte';
import Case from './DatePickerPresetsCase.svelte';
import { datePickerPresetSamples } from '../date-picker-presets-cases.mjs';
import type { DatePickerPresetCapture } from '../date-picker-presets-metrics.mjs';
const sample = datePickerPresetSamples.find(sample => sample.id === new URL(location.href).searchParams.get('sample'));
if (!sample) {
  throw Error('Unknown bounded DatePicker presets sample');
}
const capture: DatePickerPresetCapture = {};
const api = {
  read: () => capture.read!(),
  readRefs: () => capture.readRefs!(),
  setActionIndex: (index: number) => capture.setActionIndex!(index)
};
// Тот же DOM-reader; дополнительные поля не добавляются к публичному control.
Object.assign(
  window,
  { raw: { sample, current: api, preMountElements: new Set(document.querySelectorAll('*')) } }
);
const target = document.getElementById('root');
if (!target) {
  throw Error('Ordinary DatePicker target missing');
}
const app = mount(Case, { target, props: { sample, capture } });
await tick();
window.datePickerPresetsNative = { ready: true, read: api.read, readRefs: api.readRefs, setActionIndex: api.setActionIndex,
  setPreview: next => flushSync(() => {
    const button = document.querySelector(`[data-picker-preview="${String(next)}"]`);
    if (!(button instanceof HTMLButtonElement)) {
      throw Error('Authored preview button missing');
    }
    button.click();
  }), async dispose() {
    await unmount(app);
    await tick();
  } };
