import type { SelectDataFields, SelectDataRow, SelectDataValue } from './select-data.types';

/** Native Snippet group label не участвует в поиске; остальные поля следуют Source matching. */
export function autoCompleteMatchesData(
  search: string,
  option: object,
  fields: SelectDataFields,
  group: boolean
) {
  const field = group ? fields.label === 'children' ? 'label' : fields.label : fields.value;
  const value: unknown = Reflect.get(option, field);
  const text = group && typeof value === 'function' ? ''
    : Array.isArray(value) ? value.join('') : String(value ?? '');
  return text.toUpperCase().includes(search.toUpperCase());
}

export function autoCompleteNext<Value extends SelectDataValue, Data extends object>(
  entries: readonly SelectDataRow<Value, Data>[],
  current: number,
  offset: number
): number {
  for (let step = 1; step <= entries.length; step++) {
    const index = ((current + offset * step) % entries.length + entries.length) % entries.length;
    if (!entries[index].group && !entries[index].data.disabled) {
      return index;
    }
  }
  return -1;
}
