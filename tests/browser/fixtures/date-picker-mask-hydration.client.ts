import 'antd-svelte/styles.css';
import { hydrate, tick, unmount } from 'svelte';
import Case from './DatePickerMaskCase.svelte';
import { samples } from '../date-picker-mask-cases.mjs';
import type { MaskFormatProfile } from '../date-picker-mask-cases.mjs';
import type { MaskCapture } from '../date-picker-mask-native-types';

const parameters = new URL(location.href).searchParams;
const sample = samples.find(sample => sample.id === parameters.get('owner'));
const profile = parameters.get('profile');
if (!sample || !['string', 'object', 'mask'].includes(profile ?? ''))
  throw Error('Choose an authored mask owner and initial format profile');
const target = document.getElementById('root');
if (!target) throw Error('Mask SSR target missing');
const parsedOwner = target.querySelector('[data-mask-owner]');
const parsedRoot = target.querySelector('.ant-picker');
const parsedInputs = [...target.querySelectorAll('input')];
const fields = () => parsedInputs.map(input => ({
  value: input.value, defaultValue: input.defaultValue, valueAttribute: input.getAttribute('value'),
  caret: [input.selectionStart, input.selectionEnd, input.selectionDirection],
  focused: input === document.activeElement, connected: input.isConnected
}));
const parsed = fields();
const capture: MaskCapture = {};
const app = hydrate(Case, { target, recover: false,
  props: { owner: sample.id, initialFormatProfile: profile as MaskFormatProfile, capture } });
await tick();
const read = () => {
  const state = capture.read?.();
  return {
    parsed, fields: fields(), sameOwner: parsedOwner === target.querySelector('[data-mask-owner]'),
    sameRoot: parsedRoot === target.querySelector('.ant-picker'),
    sameInputs: parsedInputs.map((input, index) => input === target.querySelectorAll('input')[index]),
    inputCount: target.querySelectorAll('input').length,
    alive: state?.alive, callbacks: state?.callbacks.length, producers: state?.producerCount
  };
};
declare global {
  interface Window {
    maskHydrationContract?: { read: typeof read; dispose: () => Promise<ReturnType<typeof read>> };
  }
}
window.maskHydrationContract = {
  read,
  async dispose() { await unmount(app); await tick(); return read(); }
};
