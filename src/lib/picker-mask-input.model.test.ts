import { describe, expect, it } from 'vitest';
import dayjs, { type Dayjs } from 'dayjs';
import { formatPicker, parsePicker } from './date-picker.engine';
import {
  createPickerMaskInput, type PickerMaskInputOptions, type PickerMaskSharedKey
} from './picker-mask-input.model.svelte.js';

function createFrames() {
  let next = 0;
  const pending = new Map<number, FrameRequestCallback>();
  const cancelled: number[] = [];
  const window = {
    requestAnimationFrame(callback: FrameRequestCallback) {
      pending.set(++next, callback);
      return next;
    },
    cancelAnimationFrame(id: number) {
      cancelled.push(id);
      pending.delete(id);
    }
  };
  return { window, pending, cancelled };
}

function keyboardEvent(key: string) {
  let prevented = false;
  return { key, get defaultPrevented() { return prevented; },
    preventDefault() { prevented = true; } } as unknown as KeyboardEvent;
}

function createField(mask: string | null = 'YYYY-MM-DD') {
  const frames = createFrames();
  const selection: Array<[number, number]> = [];
  const acceptedText: string[] = [], acceptedDates: Dayjs[] = [];
  const original = dayjs('2020-12-31T16:37:59.456').locale('en');
  const formats = ['YYYY-MM-DD'];
  let calendar = original, lastValidation: Dayjs | null = null;
  let connected = true, lateNodeReads = 0;
  let options: PickerMaskInputOptions;
  options = {
    text: formatPicker(calendar, 'en_US', formats), mask, active: true,
    readOnly: false, helped: false, preserveInvalidOnBlur: false,
    validateText(text) {
      lastValidation = parsePicker(text, 'en_US', formats);
      return lastValidation !== null;
    },
    acceptInput(text) {
      // The controller owns strings. The real existing parser owns the core Date.
      const candidate = parsePicker(text, 'en_US', formats);
      if (!candidate) {
        throw Error('Controller forwarded an invalid calendar string');
      }
      acceptedText.push(text);
      acceptedDates.push(candidate);
      calendar = candidate;
      options.text = formatPicker(candidate, 'en_US', formats);
    },
    onHelp() {}
  };
  const node = {
    value: options.text, defaultValue: '',
    selectionStart: options.text.length, selectionEnd: options.text.length,
    ownerDocument: { defaultView: frames.window },
    get isConnected() {
      if (!connected) lateNodeReads++;
      return connected;
    },
    setSelectionRange(start: number, end: number) {
      if (!connected) {
        lateNodeReads++;
        throw Error('Selection reached a detached node');
      }
      this.selectionStart = start;
      this.selectionEnd = end;
      selection.push([start, end]);
    }
  };
  const input = node as unknown as HTMLInputElement;
  const model = createPickerMaskInput(() => options), detach = model.attach(input);
  const sync = () => {
    node.value = model.value;
    model.sync();
    node.value = model.value;
  };
  return { frames, selection, acceptedText, acceptedDates, original, options, node, input, model,
    detach, sync, disconnect() { connected = false; },
    get calendar() { return calendar; }, get lastValidation() { return lastValidation; },
    get lateNodeReads() { return lateNodeReads; } };
}

describe('picker mask input controller', () => {
  it('keeps incomplete text local and gates Enter without replacing the accepted calendar Date', () => {
    const field = createField();
    field.model.focus();
    field.sync();
    let enter: PickerMaskSharedKey | undefined;
    field.model.keydown(keyboardEvent('Enter'), (_event, detail) => { enter = detail; });

    expect(enter?.enterValid).toBe(true);
    expect(field.calendar).toBe(field.original);
    expect(field.calendar.format('HH:mm:ss.SSS')).toBe('16:37:59.456');

    field.model.keydown(keyboardEvent('Delete'), () => {});
    field.sync();
    field.model.keydown(keyboardEvent('Enter'), (_event, detail) => { enter = detail; });

    expect(field.model.value).toBe('YYYY-12-31');
    expect(enter).toMatchObject({ text: 'YYYY-12-31', enterValid: false });
    expect(field.acceptedText).toEqual([]);
    expect(field.calendar).toBe(field.original);

    for (const key of '2021') {
      field.model.keydown(keyboardEvent(key), () => {});
      field.sync();
    }
    const accepted = field.calendar, count = field.acceptedDates.length;
    field.model.keydown(keyboardEvent('Enter'), (_event, detail) => { enter = detail; });

    expect(field.model.value).toBe('2021-12-31');
    expect(enter?.enterValid).toBe(true);
    expect(field.acceptedDates.at(-1)).toBe(accepted);
    expect(field.acceptedDates).toHaveLength(count);
    expect(field.calendar).toBe(accepted);
    expect(field.lastValidation).not.toBe(accepted);
    expect(field.lastValidation?.valueOf()).toBe(accepted.valueOf());
    field.detach();
  });

  it('does not invent format focus or selection when a mask is enabled on an already focused plain input', () => {
    const field = createField(null);
    field.model.focus();
    field.options.mask = 'YYYY-MM-DD';
    field.sync();

    expect(field.selection).toEqual([]);
    expect(field.frames.pending.size).toBe(0);
    expect(field.model.value).toBe('2020-12-31');
    expect(field.calendar).toBe(field.original);

    field.model.focus();
    field.sync();

    expect(field.selection.at(-1)).toEqual([0, 4]);
    expect(field.frames.pending.size).toBe(1);
    expect(field.acceptedText).toEqual([]);
    field.detach();
  });

  it('keeps incomplete text when the same field format loses its mask and accepts ordinary input afterwards', () => {
    const field = createField();
    field.model.focus();
    field.sync();
    field.model.keydown(keyboardEvent('Delete'), () => {});
    field.sync();
    field.options.mask = null;
    field.sync();

    expect(field.model.value).toBe('YYYY-12-31');
    expect(field.calendar).toBe(field.original);
    field.node.value = '2021-12-31';

    expect(field.model.nativeInput({ target: field.input } as unknown as Event)).toBe(false);
    expect(field.model.value).toBe('2021-12-31');
    expect(field.acceptedDates).toEqual([]);
    field.detach();
  });

  it('keeps the reset value equal to local display through incomplete text and plain formats', () => {
    const field = createField();
    field.sync();

    expect(field.node.defaultValue).toBe('2020-12-31');
    field.model.focus();
    field.sync();
    field.model.keydown(keyboardEvent('Delete'), () => {});
    field.sync();

    expect(field.node.defaultValue).toBe('YYYY-12-31');

    field.options.mask = null;
    field.sync();

    expect(field.node.defaultValue).toBe(field.model.value);
    expect(field.node.defaultValue).toBe('YYYY-12-31');

    field.options.text = '2021-02-03';
    field.sync();

    expect(field.node.defaultValue).toBe(field.model.value);
    expect(field.node.defaultValue).toBe('2021-02-03');
    expect(field.acceptedDates).toEqual([]);
    expect(field.calendar).toBe(field.original);
    field.detach();
  });

  it('locks mask keys during mousedown and chooses the real mouseup segment before editing', () => {
    const field = createField();
    field.model.focus();
    field.sync();
    field.model.mousedown();
    const event = keyboardEvent('ArrowUp');
    let sharedCalls = 0;
    field.model.keydown(event, () => { sharedCalls++; });

    expect(event.defaultPrevented).toBe(true);
    expect(sharedCalls).toBe(0);
    expect(field.calendar).toBe(field.original);

    field.node.selectionStart = 6;
    let lockedDuringMouseup = false;
    field.model.mouseup({ target: field.input } as unknown as MouseEvent, () => {
      lockedDuringMouseup = field.model.mouseLocked;
    });
    field.sync();
    const unlocked = keyboardEvent('ArrowUp');
    field.model.keydown(unlocked, () => { sharedCalls++; });
    field.sync();

    expect(lockedDuringMouseup).toBe(true);
    expect(field.model.mouseLocked).toBe(false);
    expect(unlocked.defaultPrevented).toBe(false);
    expect(sharedCalls).toBe(1);
    expect(field.selection.at(-1)).toEqual([5, 7]);
    expect(field.acceptedText).toEqual(['2020-01-31']);
    expect(field.calendar.format('YYYY-MM-DD')).toBe('2020-01-31');
    field.detach();
  });

  it('cancels its selection and inactive frames on attachment cleanup and ignores late callbacks', () => {
    const field = createField();
    field.model.focus();
    field.sync();
    field.model.keydown(keyboardEvent('Delete'), () => {});
    field.sync();
    field.options.active = false;
    field.model.sync();
    const pending = [...field.frames.pending];

    expect(pending).toHaveLength(2);
    expect(field.model.localText).toBe('YYYY-12-31');
    field.detach();
    field.disconnect();

    expect(field.frames.pending.size).toBe(0);
    expect(pending.every(([id]) => field.frames.cancelled.includes(id))).toBe(true);
    // Exercise a cancellation race without pretending these are Source private frame counts.
    for (const [, callback] of pending) callback(0);

    expect(field.lateNodeReads).toBe(0);
    expect(field.model.localText).toBe('YYYY-12-31');
    expect(field.calendar).toBe(field.original);
  });

  it('passes ordinary events through and honors the existing shared keyboard cancellation', () => {
    const field = createField(null);
    let sharedCalls = 0;

    expect(field.model.keydown(keyboardEvent('Enter'), () => { sharedCalls++; })).toBe(false);
    expect(field.model.nativeInput({ target: field.input } as unknown as Event)).toBe(false);
    expect(sharedCalls).toBe(0);
    expect(field.frames.pending.size).toBe(0);

    field.options.mask = 'YYYY-MM-DD';
    field.model.focus();
    field.sync();
    const value = field.model.value;
    const event = keyboardEvent('1');

    expect(field.model.keydown(event, current => {
      sharedCalls++;
      current.preventDefault();
      return false;
    })).toBe(true);

    expect(sharedCalls).toBe(1);
    expect(event.defaultPrevented).toBe(true);
    expect(field.model.value).toBe(value);
    expect(field.acceptedText).toEqual([]);
    expect(field.calendar).toBe(field.original);
    field.detach();
  });
});
