import type { SelectDataFields } from './select-data.types';

export function isSelectCountReached(count: number, maxCount?: number) {
  return maxCount !== undefined && !Number.isNaN(maxCount) && count >= maxCount;
}

/** Лимит блокирует добавление; выбранный доступный пункт остаётся доступным для удаления. */
export function isSelectOptionDisabled(
  disabled: unknown,
  selected: boolean,
  countReached: boolean
) {
  return Boolean(disabled || countReached && !selected);
}

export function getSelectValues<Value extends string | number>(
  value: Value | readonly Value[] | undefined
): Value[] {
  return Array.isArray(value) ? [...new Set<Value>(value)] : [];
}

/** Согласованный Native default: label, trim и Unicode folding; explicit fields идут отдельно. */
export function matchesSelectDataLabel(search: string, option: object, fields: SelectDataFields) {
  const text: unknown = Reflect.get(option, fields.label);
  return String(text ?? '').normalize('NFKD').toLowerCase()
    .includes(search.trim().normalize('NFKD').toLowerCase());
}

/** Текст Native editor/tags; исходный label в raw metadata сохраняется отдельно. */
export function getSelectDisplayLabel(label: unknown, value: string | number) {
  const content = label ?? value;
  return typeof content === 'boolean' ? '' : String(content);
}

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
