// @rc-component/select1.10.1; MIT, vendor/LICENSE.rc-select.
import type { SelectDataCache, SelectDataDisplay, SelectDataFields, SelectDataMaps, SelectDataValue } from './select-data.types';

/** Внутренний labeled item Source; raw option хранится отдельно. */
export interface SelectValueItem<Value extends SelectDataValue> {
  label: unknown;
  value: Value;
  key: Value;
  disabled: boolean | undefined;
  title: unknown;
}

export interface SelectValueCache<Value extends SelectDataValue, Data extends object>
  extends SelectDataCache<Value, Data> {
  values: readonly SelectValueItem<Value>[];
}

export function emptySelectValueCache<Value extends SelectDataValue, Data extends object>(): SelectValueCache<Value, Data> {
  return { labels: new Map(), options: new Map(), display: [], values: [] };
}

/** Объектный label читается независимо от labelInValue; флаг меняет только outgoing payload. */
export function selectValueRaw<Value extends SelectDataValue>(draft: unknown): Value | undefined {
  const value = draft && typeof draft === 'object' ? Reflect.get(draft, 'value') : draft;
  return typeof value === 'string' || typeof value === 'number' ? value as Value : undefined;
}

/** Raw-noop controlled reselect не заменяет supplied labeled record новым option label. */
export function keepSelectSuppliedValue(
  current: unknown,
  provided: unknown,
  next: SelectDataValue | undefined
) {
  return next !== undefined && provided !== null && typeof provided === 'object' && !Array.isArray(provided)
    && selectValueRaw(provided) === next && selectValueRaw(current) === next;
}

/** Новый label API включает Source snapshot; обычные primitive labels сохраняют Native refresh. */
export function hasSelectLabelFeatures(
  labelInValue: boolean | undefined, optionLabelProp: string | undefined, labelRender: unknown,
  drafts: readonly unknown[], items?: readonly { label: unknown }[]
) {
  return labelInValue !== undefined || optionLabelProp !== undefined || labelRender !== undefined
    || drafts.some(item => item !== null && typeof item === 'object')
    || Boolean(items?.some(item => typeof item.label === 'function' || Array.isArray(item.label)));
}

/** Сохраняем прежний Native distinct-values contract, включая различие number/string. */
export function selectValueDrafts(draft: unknown, multiple: boolean): readonly unknown[] {
  const values = multiple ? Array.isArray(draft) ? draft : [] : draft === undefined || draft === null ? [] : [draft];
  const seen = new Set<SelectDataValue>();
  return values.filter(item => {
    const value = selectValueRaw(item);
    if (value === undefined || seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/** Callback conversion не подставляет cached label: cache применяется к display отдельно. */
export function convertSelectValues<Value extends SelectDataValue, Data extends object>(
  drafts: readonly unknown[], maps: SelectDataMaps<Value, Data>, fields: SelectDataFields,
  optionLabelProp?: string
): SelectValueItem<Value>[] {
  return drafts.map(draft => {
    const value = selectValueRaw<Value>(draft)!;
    const option = maps.valueOptions.get(value);
    let label: unknown = draft && typeof draft === 'object' ? Reflect.get(draft, 'label') : undefined;
    if (label === undefined && option) label = Reflect.get(option, optionLabelProp || fields.label);
    return { label, value, key: value,
      disabled: option ? Reflect.get(option, 'disabled') as boolean | undefined : undefined,
      title: option ? Reflect.get(option, 'title') : undefined };
  });
}

function sameMap<Key, Value>(before: ReadonlyMap<Key, Value>, next: ReadonlyMap<Key, Value>) {
  if (before.size !== next.size) {
    return false;
  }
  const previous = before.entries();
  for (const [key, value] of next) {
    const old = previous.next();
    if (old.done || !Object.is(old.value[0], key) || !Object.is(old.value[1], value)) {
      return false;
    }
  }
  return true;
}

function sameItem<Value extends SelectDataValue>(
  before: SelectValueItem<Value> | undefined,
  next: SelectValueItem<Value>
) {
  return before && Object.is(before.value, next.value) && Object.is(before.label, next.label)
    && Object.is(before.disabled, next.disabled) && Object.is(before.title, next.title);
}

export function resolveSelectValueCache<Value extends SelectDataValue, Data extends object>(
  drafts: readonly unknown[], maps: SelectDataMaps<Value, Data>, fields: SelectDataFields,
  previous: SelectValueCache<Value, Data>, optionLabelProp?: string
): SelectValueCache<Value, Data> {
  const labels = new Map<Value, unknown>();
  const options = new Map<Value, Data | undefined>();
  const oldValues = new Map(previous.values.map(item => [item.value, item]));
  const oldDisplay = new Map(previous.display.map(item => [item.value, item]));
  const values: SelectValueItem<Value>[] = [];
  const display: SelectDataDisplay<Value, Data>[] = [];
  for (const item of convertSelectValues(drafts, maps, fields, optionLabelProp)) {
    const current = maps.valueOptions.get(item.value);
    const data = current ?? previous.options.get(item.value);
    const next = {
      ...item,
      label: item.label === undefined ? previous.labels.get(item.value) : item.label
    };
    // Только Native display сохраняет disabled удалённого raw option; renderer metadata остаётся Source.
    const disabled = current ? item.disabled : data ? Reflect.get(data, 'disabled') as boolean | undefined : undefined;
    labels.set(item.value, next.label);
    options.set(item.value, data);
    const before = oldValues.get(item.value);
    values.push(sameItem(before, next) ? before! : next);
    const old = oldDisplay.get(item.value);
    display.push(old && Object.is(old.label, next.label) && old.data === data
      && Object.is(old.title, next.title) && Object.is(old.disabled, disabled) ? old
      : { value: next.value, label: next.label, disabled, title: next.title, data });
  }
  const nextLabels = sameMap(previous.labels, labels) ? previous.labels : labels;
  const nextOptions = sameMap(previous.options, options) ? previous.options : options;
  const nextValues = values.length === previous.values.length && values.every((item, index) => item === previous.values[index])
    ? previous.values : values;
  const nextDisplay = display.length === previous.display.length && display.every((item, index) => item === previous.display[index])
    ? previous.display : display;
  return nextLabels === previous.labels && nextOptions === previous.options && nextValues === previous.values
    && nextDisplay === previous.display ? previous
      : { labels: nextLabels, options: nextOptions, values: nextValues, display: nextDisplay };
}

/** Метаданные dropdown select/deselect читают mapped label, а не optionLabelProp. */
export function selectValueEvent<Value extends SelectDataValue>(
  value: Value, data: object | undefined, fields: SelectDataFields, labelInValue: boolean
) {
  return labelInValue ? { label: data ? Reflect.get(data, fields.label) : undefined, value } : value;
}

export function selectValueOutput<Value extends SelectDataValue>(
  values: readonly SelectValueItem<Value>[], multiple: boolean, labelInValue: boolean
) {
  const result = values.map(item => labelInValue ? { label: item.label, value: item.value } : item.value);
  return multiple ? result : result[0];
}

/** Plain editor/ARIA text не вызывает непрозрачный Svelte Snippet. */
export function selectValueText(label: unknown): string {
  return Array.isArray(label) ? label.map(selectValueText).join('')
    : typeof label === 'string' || typeof label === 'number' ? String(label) : '';
}

export function selectValueTitle(item: { label: unknown; title?: unknown } | undefined) {
  const title = typeof item?.title === 'string' || typeof item?.title === 'number' ? item.title : item?.label;
  return typeof title === 'string' || typeof title === 'number' ? String(title) : undefined;
}
