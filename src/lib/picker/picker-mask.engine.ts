// Splits the numeric Picker format into ranges and computes the result of a key press. The caller
// owns DOM selection and calendar value parsing.
// @rc-component/picker 1.12.2, MIT, vendor/LICENSE.rc-picker.
export const pickerMaskTokens = ['YYYY', 'MM', 'DD', 'HH', 'mm', 'ss', 'SSS'] as const;
export type PickerMaskToken = typeof pickerMaskTokens[number];
export interface PickerMaskCell { text: string; mask: boolean; start: number; end: number }
export interface PickerMaskSpec {
  format: string;
  pattern: string;
  cells: PickerMaskCell[];
  segments: PickerMaskCell[];
}
export interface PickerMaskState { text: string; index: number | null; cache: string }
export interface PickerMaskEdit extends PickerMaskState { filled: boolean; syncSelection: true }
export type PickerFieldFormat<Value> = string | ((value: Value) => string);
export interface PickerObjectFormat { format: string; type?: 'mask' }

/** The object sets the mode of the mask, arrays of strings and functions retain the previous format. */
export function normalizePickerFieldFormat<Value>(
  value: PickerFieldFormat<Value> | PickerFieldFormat<Value>[] | PickerObjectFormat | undefined,
  fallback: PickerFieldFormat<Value>
): { formats: PickerFieldFormat<Value>[]; mask: string | null } {
  const raw = value || fallback;
  const list: Array<PickerFieldFormat<Value> | PickerObjectFormat> = Array.isArray(raw) ? raw : [raw];
  const first = list[0];
  const formats = list.map(item => typeof item === 'string' || typeof item === 'function'
    ? item : item.format);
  const mask = typeof first === 'object' && first.type === 'mask' ? first.format : null;
  return { formats, mask };
}

// Retains the positions of literals and numerical segments in units UTF-16.
export function createPickerMask(format: string): PickerMaskSpec {
  const replace = new RegExp(pickerMaskTokens.map(key => `(${key})`).join('|'), 'g');
  const pattern = format.replace(replace, key => '顧'.repeat(key.length));
  let offset = 0;

  const separator = new RegExp(`(${pickerMaskTokens.join('|')})`);
  const parts = format.split(separator).filter(Boolean);
  const cells = parts.map(createCell);
  const segments = cells.filter(cell => cell.mask);
  return { format, pattern, cells, segments };

  // The next range begins immediately after the previous literal or token.
  function createCell(text: string): PickerMaskCell {
    const mask = pickerMaskTokens.some(token => token === text);
    const start = offset;
    const end = start + text.length;
    offset = end;
    return { text, mask, start, end };
  }
}

// Prompt mode uses zero selection before selecting the numerical segment.
export function pickerMaskSelection(
  spec: PickerMaskSpec,
  index: number | null,
  helped = false
): [number, number] {
  const cell = index === null ? undefined : spec.segments[index];
  return helped ? [0, 0] : [cell?.start || 0, cell?.end || 0];
}
/** Checking the positions of writers. The selection of the number and the full date is performed separately. */
export function pickerMaskMatches(spec: PickerMaskSpec, text: string): boolean {
  for (let index = 0; index < spec.pattern.length; index++) {
    if (!text[index] || spec.pattern[index] !== '顧' && spec.pattern[index] !== text[index]) {
      return false;
    }
  }
  return true;
}

// The click on the literal selects the nearest numerical segment, with equality the first.
export function pickerMaskIndexAt(spec: PickerMaskSpec, anchor: number): number {
  let distance = Number.MAX_SAFE_INTEGER;
  let selected = 0;
  for (const [index, cell] of spec.segments.entries()) {
    if (anchor >= cell.start && anchor <= cell.end) {
      return index;
    }
    const next = Math.min(Math.abs(anchor - cell.start), Math.abs(anchor - cell.end));
    if (next < distance) {
      distance = next;
      selected = index;
    }
  }
  return selected;
}

// Returning segment boundaries. Current year serves as a reserve value for YYYY.
export function pickerMaskRange(key: string, year: number): [number, number, number?] | undefined {
  const ranges: Record<PickerMaskToken, [number, number, number?]> = {
    YYYY: [0, 9999, year],
    MM: [1, 12],
    DD: [1, 31],
    HH: [0, 23],
    mm: [0, 59],
    ss: [0, 59],
    SSS: [0, 999]
  };
  return ranges[key as PickerMaskToken];
}

/** Changes the current segment. Blocking the mouse, submit and browser events belong to the editor. */
export function editPickerMask(
  spec: PickerMaskSpec,
  state: PickerMaskState,
  key: string,
  year: number,
  helped = false
): PickerMaskEdit {
  const [start, end] = pickerMaskSelection(spec, state.index, helped);
  const segmentSize = end - start;
  const token = spec.format.slice(start, end);
  let { index, cache, text } = state;
  let nextCache: string | null = null;
  let fill: string | null = null;

  // Arrow leaves the cursor within the list of available segments.
  const move = (amount: number) => {
    index = Math.min(Math.max((index ?? 0) + amount, 0), spec.segments.length - 1);
  };

  // Scrolls the number across the token boundaries, including filling an empty segment.
  const offset = (amount: number) => {
    const range = pickerMaskRange(token, year);
    if (!range) {
      throw TypeError('Unsupported Source mask segment range');
    }
    const [first, last, fallback] = range;
    const segment = text.slice(start, end);
    const current = Number(segment);
    if (Number.isNaN(current)) {
      return String(fallback || (amount > 0 ? first : last));
    }

    const rangeSize = last - first + 1;
    return String(first + (rangeSize + current + amount - first) % rangeSize);
  };

  switch (key) {
    case 'Backspace':
    case 'Delete':
      nextCache = '';
      fill = token;
      break;
    case 'ArrowLeft':
      nextCache = '';
      move(-1);
      break;
    case 'ArrowRight':
      nextCache = '';
      move(1);
      break;
    case 'ArrowUp':
      nextCache = '';
      fill = offset(1);
      break;
    case 'ArrowDown':
      nextCache = '';
      fill = offset(-1);
      break;
    default:
      if (!Number.isNaN(Number(key))) {
        nextCache = state.cache + key;
        fill = nextCache;
      }
  }

  if (nextCache !== null) {
    cache = nextCache;
    if (nextCache.length >= segmentSize) {
      move(1);
      cache = '';
    }
  }
  if (fill !== null) {
    const prefix = text.slice(0, start);
    const replacement = fill.padStart(segmentSize, '0');
    const updatedText = prefix + replacement + text.slice(end);
    text = updatedText.slice(0, spec.format.length);
  }

  return { text, index, cache, filled: fill !== null, syncSelection: true };
}
