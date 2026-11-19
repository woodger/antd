import 'antd-svelte/styles.css';
import { mount, tick, unmount, flushSync } from 'svelte';
import Case from './DatePickerDateWeekPrefixCase.svelte';
import type { DateWeekPrefixCapture, DateWeekPrefixOwner } from '../date-picker-date-week-prefix-native-types';

function isOwner(value: string | null): value is DateWeekPrefixOwner {
  return value === 'single-date-week-prefix' || value === 'range-date-week-prefix';
}
const owner = new URL(location.href).searchParams.get('owner');
if (!isOwner(owner)) throw Error('Choose one of two authored date week-prefix owners');
const target = document.getElementById('root');
if (!target) throw Error('Actual ordinary Native mount root missing');
const capture: DateWeekPrefixCapture = {};
window.nativeDateWeekPrefixObservation = { preMountNodes: new Set(document.querySelectorAll('*')),
  retainedNodes: new Set(), events: [] };
const types = ['pointerdown', 'click', 'mouseover', 'mouseout', 'keydown',
  'input', 'change', 'focusin', 'focusout'];
const listener = (event: Event) => {
  const recorder = capture.recorder;
  if (!recorder || !capture.read) return;
  const id = (value: object | null) => value == null ? null : recorder.identity(value);
  const mouse = event instanceof MouseEvent ? event : null;
  const keyboard = event instanceof KeyboardEvent ? event : null;
  const focus = event instanceof FocusEvent ? event : null;
  const actual = capture.read();
  window.nativeDateWeekPrefixObservation.events.push({ actionIndex: actual.actionIndex,
    producerCursorAtCapture: actual.producerCount,
    type: event.type, isTrusted: event.isTrusted, timeStamp: event.timeStamp,
    phase: 'document-capture-before-target-handler', eventPhase: event.eventPhase,
    bubbles: event.bubbles, cancelable: event.cancelable,
    defaultPreventedAtCapture: event.defaultPrevented, key: keyboard?.key ?? null,
    code: keyboard?.code ?? null, button: mouse?.button ?? null, buttons: mouse?.buttons ?? null,
    clientX: mouse?.clientX ?? null, clientY: mouse?.clientY ?? null,
    targetIdentity: id(event.target), targetTag: event.target instanceof Node ? event.target.nodeName : null,
    currentTargetIdentity: id(event.currentTarget), relatedTargetIdentity: id(focus?.relatedTarget ?? mouse?.relatedTarget ?? null)
  });
};
for (const type of types) document.addEventListener(type, listener, true);
const app = mount(Case, { target, props: { owner, capture } });
await tick();
if (!capture.recorder || !capture.read || !capture.readRefs || !capture.setActionIndex
  || !capture.readCallbacks || !capture.readProducers) throw Error('Complete authored date week-prefix capture unavailable');
let disposed = false;
window.nativeDateWeekPrefix = {
  ready: true, getRecorder: () => capture.recorder!, read: () => capture.read!(),
  readRefs: () => capture.readRefs!(), setActionIndex: index => capture.setActionIndex!(index),
  readCallbacks: cursor => capture.readCallbacks!(cursor), readProducers: cursor => capture.readProducers!(cursor),
  activateControl(value) {
    const button = [...document.querySelectorAll<HTMLButtonElement>('[data-week-control]')]
      .find(node => node.getAttribute('data-week-control') === value);
    if (!button) throw Error('Actual authored owner control missing');
    const active = document.activeElement;
    let observed: unknown = null;
    button.addEventListener('click', event => { observed = { type: event.type, isTrusted: event.isTrusted,
      targetMatches: event.target === button, currentTargetMatches: event.currentTarget === button };
    }, { once: true, capture: true });
    flushSync(() => button.click());
    return { click: observed, focusIdentityPreserved: active === document.activeElement };
  },
  async dispose() {
    if (disposed) throw Error('Actual owner is already unmounted');
    disposed = true; await unmount(app); await tick();
  },
  stopEventObserver() { for (const type of types) document.removeEventListener(type, listener, true); }
};
