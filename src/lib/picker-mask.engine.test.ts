import { describe, expect, it } from 'vitest';
import {
  createPickerMask, editPickerMask, normalizePickerFieldFormat,
  pickerMaskIndexAt, pickerMaskMatches, pickerMaskSelection
} from './picker-mask.engine';
import type { PickerMaskState } from './picker-mask.engine';

describe('picker numeric mask', () => {
  it('selects numeric segments and keeps literals outside the selection', () => {
    const mask = createPickerMask('YYYY-MM-DD HH:mm:ss.SSS');

    expect(mask.segments.map(cell => [cell.text, cell.start, cell.end])).toEqual([
      ['YYYY', 0, 4], ['MM', 5, 7], ['DD', 8, 10], ['HH', 11, 13],
      ['mm', 14, 16], ['ss', 17, 19], ['SSS', 20, 23]
    ]);
    expect(pickerMaskSelection(mask, 6)).toEqual([20, 23]);
    expect(pickerMaskSelection(mask, null)).toEqual([0, 0]);
    expect(pickerMaskSelection(mask, 2, true)).toEqual([0, 0]);
    expect(pickerMaskIndexAt(mask, 4)).toBe(0);
    expect(pickerMaskIndexAt(mask, 5)).toBe(1);
    expect(pickerMaskIndexAt(mask, 99)).toBe(6);
  });

  it('checks separators independently of calendar parsing and trailing text', () => {
    const mask = createPickerMask('YYYY-MM-DD');

    expect(pickerMaskMatches(mask, '2024-02-29')).toBe(true);
    expect(pickerMaskMatches(mask, 'YYYY-MM-DD')).toBe(true);
    expect(pickerMaskMatches(mask, 'aaaa-bb-cc trailing')).toBe(true);
    expect(pickerMaskMatches(mask, '2024/02/29')).toBe(false);
    expect(pickerMaskMatches(mask, '2024-02-2')).toBe(false);
  });

  it('wraps numeric arrows within each unit without clamping other fields', () => {
    const mask = createPickerMask('YYYY-MM-DD HH:mm:ss.SSS');
    const state = { text: '2024-12-31 23:59:59.999', index: 1, cache: '1' };

    expect(editPickerMask(mask, state, 'ArrowUp', 2024)).toMatchObject({
      text: '2024-01-31 23:59:59.999', index: 1, cache: '', filled: true
    });
    expect(editPickerMask(mask, { ...state, index: 6 }, 'ArrowUp', 2024).text)
      .toBe('2024-12-31 23:59:59.000');
    expect(editPickerMask(mask, { ...state, text: mask.format, index: 0 }, 'ArrowDown', 2024).text)
      .toBe('2024-MM-DD HH:mm:ss.SSS');
  });

  it('buffers digits and advances only after a complete segment', () => {
    const mask = createPickerMask('YYYY-MM-DD');
    let state: PickerMaskState = { text: mask.format, index: 0, cache: '' };

    for (const key of '2024') state = editPickerMask(mask, state, key, 2024);
    expect(state).toMatchObject({ text: '2024-MM-DD', index: 1, cache: '' });
    state = editPickerMask(mask, state, '1', 2024);

    expect(state).toMatchObject({ text: '2024-01-DD', index: 1, cache: '1' });
    state = editPickerMask(mask, state, '2', 2024);

    expect(state).toMatchObject({ text: '2024-12-DD', index: 2, cache: '' });
  });

  it('restores token text on deletion and keeps navigation within the mask', () => {
    const mask = createPickerMask('YYYY-MM-DD');
    const state = { text: '2024-02-29', index: 0, cache: '202' };

    expect(editPickerMask(mask, state, 'Backspace', 2024)).toMatchObject({
      text: 'YYYY-02-29', index: 0, cache: '', filled: true
    });
    expect(editPickerMask(mask, state, 'ArrowLeft', 2024)).toMatchObject({
      text: state.text, index: 0, cache: '', filled: false
    });
    expect(editPickerMask(mask, { ...state, index: 2 }, 'ArrowRight', 2024).index).toBe(2);
  });

  it('unwraps scalar formats while preserving formatter references', () => {
    const formatter = (value: number) => String(value);

    expect(normalizePickerFieldFormat({ format: 'HH:mm' }, 'HH:mm:ss'))
      .toEqual({ formats: ['HH:mm'], mask: null });
    expect(normalizePickerFieldFormat({ format: 'HH:mm:ss.SSS', type: 'mask' }, 'HH:mm:ss'))
      .toEqual({ formats: ['HH:mm:ss.SSS'], mask: 'HH:mm:ss.SSS' });
    const result = normalizePickerFieldFormat([formatter, 'YYYY-MM-DD'], 'YYYY-MM-DD');

    expect(result.formats[0]).toBe(formatter);
    expect(result.mask).toBeNull();
    expect(normalizePickerFieldFormat(undefined, 'YYYY-MM-DD').formats).toEqual(['YYYY-MM-DD']);
  });
});
