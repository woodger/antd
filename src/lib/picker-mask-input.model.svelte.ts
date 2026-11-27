import { untrack } from 'svelte';
import type { DatePickerEditorElement } from './picker-components.types';
import {
  createPickerMask, editPickerMask, pickerMaskIndexAt, pickerMaskMatches,
  pickerMaskSelection, type PickerMaskSpec, type PickerMaskState
} from './picker-mask.engine';

export interface PickerMaskInputOptions {
  /** Current formatted accepted field text; never the controller's incomplete mask text. */
  text: string;
  mask: string | null | undefined;
  /** Current parse formats live in this callback; validation must not call disabledDate/time. */
  validateText: (text: string) => boolean;
  /** The core parses again and owns its actual candidate/calendar reference. */
  acceptInput: (text: string) => void;
  onHelp: () => void;
  active: boolean | undefined;
  helped?: boolean;
  readOnly?: boolean;
  preserveInvalidOnBlur?: boolean;
}
export interface PickerMaskSharedKey {
  mask: true;
  text: string;
  enterValid: boolean;
}
export type PickerMaskSharedKeyboard = (event: KeyboardEvent, detail: PickerMaskSharedKey)
  => void | boolean;
interface PendingFrame { window: Window; id: number }
interface SelectionVersion {
  input: DatePickerEditorElement | undefined;
  format: string;
  focused: boolean;
  text: string;
  index: number | null;
  start: number;
  end: number;
  mark: number;
}

/** Call sync() in the core's post-DOM $effect; attach() owns only its existing input. */
export function createPickerMaskInput(getOptions: () => PickerMaskInputOptions) {
  let previousText = untrack(() => getOptions().text);
  let previousActive = untrack(() => getOptions().active);
  let text = $state(previousText);
  let index = $state<number | null>(null);
  let cache = $state('');
  // Source updates this only on actual format-focus/blur events. A format toggle
  // on an already focused ordinary input does not create a format-focus event.
  let focused = $state(false);
  let mark = $state(0);
  let input = $state.raw<DatePickerEditorElement>();
  let mouseDown = false;
  let specFormat: string | undefined, spec: PickerMaskSpec | undefined;
  let selectionVersion: SelectionVersion | undefined;
  let selectionFrame: PendingFrame | undefined, inactiveFrame: PendingFrame | undefined;

  const cancel = (frame: PendingFrame | undefined) => {
    if (frame) frame.window.cancelAnimationFrame(frame.id);
  };
  function cancelFrames() {
    cancel(selectionFrame);
    cancel(inactiveFrame);
    selectionFrame = undefined;
    inactiveFrame = undefined;
  }
  function getSpec(format: string) {
    if (specFormat !== format) {
      specFormat = format;
      spec = createPickerMask(format);
    }
    return spec!;
  }
  function change(next: string, options = getOptions()) {
    // Keep the current event's prop snapshot through the synchronous core callback.
    const modified = !!next && next !== options.mask && next !== options.text;
    if (options.validateText(next)) options.acceptInput(next);
    text = next;
    if (modified) options.onHelp();
  }
  function sync() {
    const options = getOptions();
    if (options.text !== previousText) {
      previousText = options.text;
      text = options.text;
    }
    if (options.active !== previousActive) {
      previousActive = options.active;
      cancel(inactiveFrame);
      inactiveFrame = undefined;
      const window = input?.ownerDocument.defaultView;
      if (!options.active && window) {
        const node = input;
        inactiveFrame = { window, id: window.requestAnimationFrame(() => {
          inactiveFrame = undefined;
          const latest = getOptions();
          if (input === node && node?.isConnected && !latest.active && !latest.preserveInvalidOnBlur)
            text = latest.text;
        }) };
      }
    }
    if (input && input.defaultValue !== text) input.defaultValue = text;
    const format = options.mask || '';
    const mask = getSpec(format);
    const [start, end] = pickerMaskSelection(mask, index, options.helped);
    const version = { input, format, focused, text, index, start, end, mark };
    if (selectionVersion && Object.keys(version).every(key =>
      version[key as keyof SelectionVersion] === selectionVersion![key as keyof SelectionVersion])) {
      return;
    }
    selectionVersion = version;
    cancel(selectionFrame);
    selectionFrame = undefined;
    if (!input || !format || !focused || mouseDown) {
      return;
    }
    if (!pickerMaskMatches(mask, text)) {
      untrack(() => change(format, options));
      return;
    }
    const node = input, window = node.ownerDocument.defaultView;
    node.setSelectionRange(start, end);
    if (window) {
      selectionFrame = { window, id: window.requestAnimationFrame(() => {
        selectionFrame = undefined;
        if (input === node && node.isConnected) node.setSelectionRange(start, end);
      }) };
    }
  }
  /** The custom field at hydration can already be in focus. */
  function attach(node: DatePickerEditorElement, restoreFocus = false) {
    cancelFrames();
    selectionVersion = undefined;
    input = node;
    if (restoreFocus) {
      const format = node.matches(':focus') ? untrack(() => getOptions().mask) : undefined;
      focused = Boolean(format);
      if (format) {
        index = pickerMaskIndexAt(getSpec(format), node.selectionStart ?? 0);
        cache = '';
      }
    }

    return () => {
      if (input !== node) {
        return;
      }
      cancelFrames();
      input = undefined;
      selectionVersion = undefined;
    };
  }
  function keydown(event: KeyboardEvent, shared: PickerMaskSharedKeyboard): boolean {
    const options = getOptions(), format = options.mask;
    if (!format) {
      return false;
    }
    if (mouseDown) {
      event.preventDefault();
      return true;
    }
    const mask = getSpec(format);
    const before: PickerMaskState = { text, index, cache };
    const enterValid = event.key === 'Enter' && options.validateText(before.text);
    // The core owns its one public native key callback and Tab/Escape/Enter paths.
    // Returning false preserves its existing cancellation/composition/blocked gate.
    if (shared(event, { mask: true, text: before.text, enterValid }) === false) {
      return true;
    }
    const year = new Date().getFullYear();
    const next = editPickerMask(mask, before, event.key, year, options.helped);
    index = next.index;
    cache = next.cache;
    if (next.filled) change(next.text, options);
    mark++;
    return true;
  }
  function focus() {
    if (!getOptions().mask) {
      return;
    }
    focused = true;
    index = 0;
    cache = '';
  }
  function blur() {
    if (getOptions().mask) focused = false;
  }
  function mousedown() {
    if (getOptions().mask) mouseDown = true;
  }
  function mouseup(event: MouseEvent, shared?: (event: MouseEvent) => void) {
    const format = getOptions().mask;
    if (!format) {
      return false;
    }
    const target = event.target as DatePickerEditorElement;
    index = pickerMaskIndexAt(getSpec(format), target.selectionStart ?? 0);
    mark++;
    shared?.(event);
    mouseDown = false;
    return true;
  }
  function nativeInput(event: Event) {
    if (!getOptions().mask) {
      text = (event.target as DatePickerEditorElement).value;
      return false;
    }
    // React restores its controlled value after the otherwise ignored mask input
    // event. Do the same on the real event; never manufacture beforeinput/input.
    const target = event.target as DatePickerEditorElement;
    if (target.value !== text) target.value = text;
    return true;
  }
  function paste(event: ClipboardEvent) {
    const options = getOptions();
    if (!options.mask) {
      return false;
    }
    if (mouseDown) {
      event.preventDefault();
      return true;
    }
    const value = event.clipboardData?.getData('text') ?? '';
    if (options.validateText(value)) change(value, options);
    return true;
  }
  function dispose() {
    cancelFrames();
    input = undefined;
    selectionVersion = undefined;
  }
  return {
    get value() { return text; },
    get masked() { return !!getOptions().mask; },
    get readOnly() { return !!getOptions().readOnly; },
    get localText() { return text; },
    get mouseLocked() { return mouseDown; },
    sync, attach, keydown, focus, blur, mousedown, mouseup, nativeInput, paste, dispose
  };
}
