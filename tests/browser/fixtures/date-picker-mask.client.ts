import '@woodger/antd-svelte/styles.css';
import { mount, tick, unmount, flushSync } from 'svelte';
import Case from './DatePickerMaskCase.svelte';
import { samples } from '../date-picker-mask-cases.mjs';
import type { MaskFormatProfile } from '../date-picker-mask-cases.mjs';
import type { MaskCapture, MaskOwner } from '../date-picker-mask-native-types';

const isOwner = (value: string | null): value is MaskOwner => samples.some(sample => sample.id === value);
const isProfile = (value: string): value is MaskFormatProfile => ['string', 'object', 'mask'].includes(value);
const parameters = new URL(location.href).searchParams;
const owner = parameters.get('owner'), profile = parameters.get('profile');
if (!isOwner(owner)) {
  throw Error('Choose one of five authored mask owners');
}
if (profile !== null && !isProfile(profile)) {
  throw Error('Choose an authored initial format profile');
}
const target = document.getElementById('root');
if (!target) {
  throw Error('Actual ordinary Native mount root missing');
}
const capture: MaskCapture = {};
window.nativeMaskObservation = { preMountNodes: new Set(document.querySelectorAll('*')),
  retainedNodes: new Set(), events: [] };
const types = ['pointerdown', 'mousedown', 'mouseup', 'click', 'mouseover', 'mouseout',
  'keydown', 'keyup', 'beforeinput', 'input', 'change', 'selectionchange', 'focusin', 'focusout',
  'paste', 'compositionstart', 'compositionupdate', 'compositionend'];
const listener = (event: Event) => {
  const recorder = capture.recorder;
  if (!recorder || !capture.read) {
    return;
  }
  const state = capture.read();
  const id = (value: object | null) => value == null ? null : recorder.identity(value);
  const mouse = event instanceof MouseEvent ? event : null;
  const keyboard = event instanceof KeyboardEvent ? event : null;
  const focus = event instanceof FocusEvent ? event : null;
  const edit = event instanceof InputEvent ? event : null;
  const composition = event instanceof CompositionEvent ? event : null;
  const modifiers = keyboard ?? mouse;
  const input = event.target instanceof HTMLInputElement ? event.target
    : document.activeElement instanceof HTMLInputElement ? document.activeElement : null;
  window.nativeMaskObservation.events.push({ actionIndex: state.actionIndex, substepIndex: state.substepIndex,
    producerCursorAtCapture: state.producerCount, callbackCountAtCapture: state.callbacks.length,
    type: event.type, isTrusted: event.isTrusted, timeStamp: event.timeStamp,
    phase: 'document-capture-before-target-handler', eventPhase: event.eventPhase,
    bubbles: event.bubbles, cancelable: event.cancelable, defaultPreventedAtCapture: event.defaultPrevented,
    key: keyboard?.key ?? null, code: keyboard?.code ?? null, repeat: keyboard?.repeat ?? null,
    isComposing: keyboard?.isComposing ?? edit?.isComposing ?? null,
    altKey: modifiers?.altKey ?? null, ctrlKey: modifiers?.ctrlKey ?? null,
    metaKey: modifiers?.metaKey ?? null, shiftKey: modifiers?.shiftKey ?? null,
    inputType: edit?.inputType ?? null, data: edit?.data ?? composition?.data ?? null,
    button: mouse?.button ?? null, buttons: mouse?.buttons ?? null,
    clientX: mouse?.clientX ?? null, clientY: mouse?.clientY ?? null,
    targetIdentity: id(event.target), targetTag: event.target instanceof Node ? event.target.nodeName : null,
    currentTargetIdentity: id(event.currentTarget), relatedTargetIdentity: id(focus?.relatedTarget ?? mouse?.relatedTarget ?? null),
    inputAtCapture: input ? { identity: id(input), value: input.value, defaultValue: input.defaultValue,
      selectionStart: input.selectionStart, selectionEnd: input.selectionEnd, selectionDirection: input.selectionDirection,
      focused: input === document.activeElement, attributes: [...input.attributes].map(a => [a.name, a.value]) } : null });
};
for (const type of types) document.addEventListener(type, listener, true);
const app = mount(Case, { target, props: { owner, capture,
  ...(profile === null ? {} : { initialFormatProfile: profile }) } });
await tick();
if (!capture.recorder || !capture.read || !capture.readRefs || !capture.setActionIndex || !capture.setSubstepIndex
  || !capture.readCallbacks || !capture.readProducers) {
  throw Error('Complete authored mask capture unavailable');
}
let disposed = false;
window.nativeMask = {
  ready: true, getRecorder: () => capture.recorder!, read: () => capture.read!(), readRefs: () => capture.readRefs!(),
  setActionIndex: index => capture.setActionIndex!(index), setSubstepIndex: index => capture.setSubstepIndex!(index),
  readCallbacks: cursor => capture.readCallbacks!(cursor), readProducers: cursor => capture.readProducers!(cursor),
  activateControl(value) {
    const button = [...document.querySelectorAll<HTMLButtonElement>('[data-mask-control]')]
      .find(node => node.getAttribute('data-mask-control') === value);
    if (!button) {
      throw Error('Actual authored owner control missing');
    }
    const active = document.activeElement;
    let observed: unknown = null;
    button.addEventListener('click', event => { observed = { type: event.type, isTrusted: event.isTrusted,
      targetMatches: event.target === button, currentTargetMatches: event.currentTarget === button };
    }, { once: true, capture: true });
    flushSync(() => button.click());
    return { click: observed, focusIdentityPreserved: active === document.activeElement };
  },
  async dispose() {
    if (disposed) {
      throw Error('Actual owner is already unmounted');
    }
    disposed = true;
    await unmount(app);
    await tick();
  },
  stopEventObserver() {
    for (const type of types) document.removeEventListener(type, listener, true);
  }
};
