import '@woodger/antd/styles.css';
import { mount, tick, unmount, flushSync } from 'svelte';
import Case from './DatePickerEmptyDatetimeCase.svelte';
import type { EmptyDatetimeCapture, EmptyDatetimeOwner } from '../date-picker-empty-datetime-native-types';
const owner = new URL(location.href).searchParams.get('owner') as EmptyDatetimeOwner | null;
if (owner !== 'single' && owner !== 'range') {
  throw Error('Choose an actual empty-datetime owner');
}
const target = document.getElementById('root');
if (!target) {
  throw Error('Actual ordinary Native mount root missing');
}
const capture: EmptyDatetimeCapture = {};
window.nativeEmptyDatetimeObservation = { preMountNodes: new Set(document.querySelectorAll('*')),
  retainedNodes: new Set(), events: [] };
const types = ['pointerdown', 'click', 'mouseover', 'mouseout', 'keydown', 'focusin', 'focusout'];
const listener = (event: Event) => {
  const recorder = capture.recorder;
  if (!recorder || !capture.read) {
    return;
  }
  const point = event as MouseEvent & KeyboardEvent & FocusEvent;
  const id = (value: unknown) => value == null ? null : recorder.identity(value);
  window.nativeEmptyDatetimeObservation.events.push({
    actionIndex: (capture.read() as { actionIndex: number }).actionIndex,
    type: event.type, isTrusted: event.isTrusted, timeStamp: event.timeStamp,
    phase: 'document-capture-before-target-handler', eventPhase: event.eventPhase,
    bubbles: event.bubbles, cancelable: event.cancelable,
    defaultPreventedAtCapture: event.defaultPrevented, key: point.key ?? null,
    code: point.code ?? null, button: point.button ?? null, buttons: point.buttons ?? null,
    clientX: point.clientX ?? null, clientY: point.clientY ?? null,
    targetIdentity: id(event.target), targetTag: event.target instanceof Node ? event.target.nodeName : null,
    currentTargetIdentity: id(event.currentTarget), relatedTargetIdentity: id(point.relatedTarget)
  });
};
for (const type of types) document.addEventListener(type, listener, true);
const app = mount(Case, { target, props: { owner, capture } });
await tick();
if (!capture.recorder || !capture.read || !capture.readRefs || !capture.setActionIndex) {
  throw Error('Complete authored Native capture unavailable');
}
let disposed = false;
window.nativeEmptyDatetime = {
  ready: true,
  getRecorder: () => capture.recorder!, read: () => capture.read!(),
  readRefs: () => capture.readRefs!(), setActionIndex: index => capture.setActionIndex!(index),
  activateTemplate() {
    const button = document.querySelector<HTMLButtonElement>('[data-empty-datetime-control="template"]');
    if (!button) {
      throw Error('Actual authored template button missing');
    }
    const active = document.activeElement;
    let observed: unknown = null;
    button.addEventListener('click', event => { observed = { type: event.type,
      isTrusted: event.isTrusted, targetMatches: event.target === button,
      currentTargetMatches: event.currentTarget === button }; }, { once: true, capture: true });
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
