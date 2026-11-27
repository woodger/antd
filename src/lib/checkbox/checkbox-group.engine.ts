// Normalizes CheckboxGroup options and constructs values for controlled selection. Option order is
// independent of child registration order.
import type { CheckboxGroupOption, CheckboxGroupValue } from './checkbox-group.types';

// Normalizes primitives into objects and keeps the first option for each value.
export function getCheckboxGroupOptions<Value extends CheckboxGroupValue>(
  options: readonly (Value | CheckboxGroupOption<Value> | null | undefined)[]
): CheckboxGroupOption<Value>[] {
  const seen = new Set<Value>();

  return options.flatMap((option) => {
    if (option === null || option === undefined) {
      return [];
    }

    const item = typeof option === 'object' ? option : { value: option, label: String(option) };

    if (item.value === null || item.value === undefined || seen.has(item.value)) {
      return [];
    }

    seen.add(item.value);
    return [item];
  });
}

/** The upstream Group keeps raw state separate from the filtered callback and does not sort by DOM order. */
export function toggleCheckboxGroupChildren<Value extends CheckboxGroupValue>(
  current: readonly Value[],
  value: Value,
  registered: readonly Value[]
): { value: Value[]; callbackValue: Value[]; } {
  const next = [...current];
  const index = next.indexOf(value);

  if (index === -1) {
    next.push(value);
  }
  else {
    next.splice(index, 1);
  }

  return { value: next, callbackValue: next.filter(item => registered.includes(item)) };
}

// Keeps selected entries in option order.
export function getCheckboxGroupValue<Value extends CheckboxGroupValue>(
  options: readonly CheckboxGroupOption<Value>[],
  value: readonly Value[]
): Value[] {
  const selected = new Set(value);

  return options.filter((option) => selected.has(option.value)).map((option) => option.value);
}
