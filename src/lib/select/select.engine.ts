// Processes the selection, search and transition on the available lines Select. Values retain the
// difference between strings and numbers.
import type { SelectDataFields } from './select-data.types';

// Considers the permissible limit achieved also at maxCount, equal to zero.
export function isSelectCountReached(count: number, maxCount?: number) {
  return maxCount !== undefined && !Number.isNaN(maxCount) && count >= maxCount;
}

/** Limit blocks the addition; the selected available item remains available for removal. */
export function isSelectOptionDisabled(
  disabled: unknown,
  selected: boolean,
  countReached: boolean
) {
  return Boolean(disabled || countReached && !selected);
}

// Normalizes an array of choices to unique values, maintaining order.
export function getSelectValues<Value extends string | number>(
  value: Value | readonly Value[] | undefined
): Value[] {
  return Array.isArray(value) ? [...new Set<Value>(value)] : [];
}

/** Harmonized Native default: label, trim and Unicode folding; fields go separately. */
export function matchesSelectDataLabel(search: string, option: object, fields: SelectDataFields) {
  const text: unknown = Reflect.get(option, fields.label);
  return String(text ?? '').normalize('NFKD').toLowerCase()
    .includes(search.trim().normalize('NFKD').toLowerCase());
}

/** Text Native editor/tags; the original label in raw metadata is saved separately. */
export function getSelectDisplayLabel(label: unknown, value: string | number) {
  const content = label ?? value;
  return typeof content === 'boolean' ? '' : String(content);
}

// Begins bypasses from the current position or the edge of the list according to the direction.
export function getEnabledIndex<Option extends object>(
  options: readonly (Option & { disabled?: boolean; group?: boolean; })[],
  current: number,
  direction: 'next' | 'previous' | 'first' | 'last'
): number {
  const step = direction === 'previous' || direction === 'last' ? -1 : 1;
  const hasCurrent = current >= 0 && current < options.length;
  const start = direction === 'first'
    ? -1
    : direction === 'last' ? options.length : hasCurrent ? current : step > 0 ? -1 : options.length;

  for (let offset = 1; offset <= options.length; offset++) {
    const index = ((start + offset * step) % options.length + options.length) % options.length;

    if (!options[index].group && !options[index].disabled) {
      return index;
    }
  }

  return -1;
}
