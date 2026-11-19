// Numeric mask mechanics from @rc-component/picker 1.12.2, MIT; vendor/LICENSE.rc-picker.
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

/** Normalize only the public scalar object; primitive/function arrays remain supported. */
export function normalizePickerFieldFormat<Value>(
  value: PickerFieldFormat<Value> | PickerFieldFormat<Value>[] | PickerObjectFormat | undefined,
  fallback: PickerFieldFormat<Value>
): { formats: PickerFieldFormat<Value>[]; mask: string | null } {
  const raw = value || fallback;
  const list: Array<PickerFieldFormat<Value> | PickerObjectFormat> = Array.isArray(raw) ? raw : [raw];
  const first = list[0];
  return {
    formats: list.map(item => typeof item === 'string' || typeof item === 'function' ? item : item.format),
    mask: typeof first === 'object' && first.type === 'mask' ? first.format : null
  };
}
export function createPickerMask(format: string): PickerMaskSpec {
  const replace = new RegExp(pickerMaskTokens.map(key => `(${key})`).join('|'), 'g');
  const pattern = format.replace(replace, key => '顧'.repeat(key.length));
  let offset = 0;
  const cells = format.split(new RegExp(`(${pickerMaskTokens.join('|')})`)).filter(Boolean).map(text => {
    const cell = { text, mask: pickerMaskTokens.includes(text as PickerMaskToken),
      start: offset, end: offset + text.length };
    offset = cell.end;
    return cell;
  });
  return { format, pattern, cells, segments: cells.filter(cell => cell.mask) };
}
export function pickerMaskSelection(spec: PickerMaskSpec, index: number | null,
  helped = false): [number, number] {
  const cell = index === null ? undefined : spec.segments[index];
  return helped ? [0, 0] : [cell?.start || 0, cell?.end || 0];
}
/** Source checks literal positions, not digits or exact total length. */
export function pickerMaskMatches(spec: PickerMaskSpec, text: string): boolean {
  for (let index = 0; index < spec.pattern.length; index++) {
    if (!text[index] || spec.pattern[index] !== '顧' && spec.pattern[index] !== text[index]) return false;
  }
  return true;
}
export function pickerMaskIndexAt(spec: PickerMaskSpec, anchor: number): number {
  let distance = Number.MAX_SAFE_INTEGER, selected = 0;
  for (const [index, cell] of spec.segments.entries()) {
    if (anchor >= cell.start && anchor <= cell.end) return index;
    const next = Math.min(Math.abs(anchor - cell.start), Math.abs(anchor - cell.end));
    if (next < distance) {
      distance = next;
      selected = index;
    }
  }
  return selected;
}
export function pickerMaskRange(key: string, year: number): [number, number, number?] | undefined {
  const ranges: Record<PickerMaskToken, [number, number, number?]> = {
    YYYY: [0, 9999, year], MM: [1, 12], DD: [1, 31], HH: [0, 23],
    mm: [0, 59], ss: [0, 59], SSS: [0, 999]
  };
  return ranges[key as PickerMaskToken];
}
/** Mouse lock, parse/submit gates and browser default events belong to the DOM controller. */
export function editPickerMask(spec: PickerMaskSpec, state: PickerMaskState,
  key: string, year: number, helped = false): PickerMaskEdit {
  const [start, end] = pickerMaskSelection(spec, state.index, helped);
  const size = end - start, token = spec.format.slice(start, end);
  let index = state.index, cache = state.cache, text = state.text;
  let nextCache: string | null = null, fill: string | null = null;
  const move = (amount: number) => {
    index = Math.min(Math.max((index ?? 0) + amount, 0), spec.segments.length - 1);
  };
  const offset = (amount: number) => {
    const range = pickerMaskRange(token, year);
    if (!range) throw TypeError('Unsupported Source mask segment range');
    const [first, last, fallback] = range;
    const current = Number(text.slice(start, end));
    if (Number.isNaN(current)) return String(fallback ? fallback : amount > 0 ? first : last);
    return String(first + (last - first + 1 + current + amount - first) % (last - first + 1));
  };
  switch (key) {
    case 'Backspace': case 'Delete':
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
    if (nextCache.length >= size) {
      move(1);
      cache = '';
    }
  }
  if (fill !== null) text = (text.slice(0, start) + fill.padStart(size, '0') + text.slice(end))
    .slice(0, spec.format.length);
  return { text, index, cache, filled: fill !== null, syncSelection: true };
}
