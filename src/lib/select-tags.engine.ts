import { filterSelectData } from './select-data.engine';
import type {
  SelectDataDisplay, SelectDataFields, SelectDataFilter, SelectDataMaps, SelectDataValue
} from './select-data.types';

/** @rc-component/select 1.10.1 tag options; MIT, см. vendor/LICENSE.rc-select. */
export function getSelectTagOptions<Value extends SelectDataValue, Data extends object>(
  options: readonly Data[],
  selected: readonly SelectDataDisplay<Value, Data>[],
  maps: SelectDataMaps<Value, Data>,
  fields: SelectDataFields,
  search: string,
  config: SelectDataFilter<Data> = {}
): readonly Data[] {
  const create = (value: Value | string, label?: unknown, disabled?: boolean) => ({
    [fields.value]: value, [fields.label]: label ?? value,
    ...(disabled ? { disabled } : {})
  }) as Data;
  const filled = [...options];
  for (const option of [...selected].sort((a, b) => a.value < b.value ? -1 : 1)) {
    if (!maps.valueOptions.has(option.value)) {
      filled.push(create(option.value, option.label, option.disabled));
    }
  }
  const filtered = filterSelectData(filled, search, fields, config);
  const properties = typeof config.optionFilterProp === 'string'
    ? [config.optionFilterProp] : config.optionFilterProp ?? [];
  const exact = filtered.some(option => Reflect.get(option, fields.value) === search
    || (properties.length ? properties.some(field => Object.hasOwn(option, field)
      && Reflect.get(option, field) === search) : Reflect.get(option, 'value') === search));

  // Не создаём Source whitespace-only tag; явный option с таким value остаётся доступным.
  return search.trim() && !exact
    && !Reflect.get(maps.valueOptions.get(search as Value) ?? {}, 'disabled')
    ? [create(search), ...filtered] : filtered;
}
