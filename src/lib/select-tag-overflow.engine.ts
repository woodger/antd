import type { SelectOmittedTag } from './select.types';

/** Rest не занимает место, когда все tags уже помещаются. */
export function getResponsiveTagCount(widths: readonly number[], available: number, rest: number) {
  if (widths.reduce((sum, width) => sum + width, 0) <= available) {
    return widths.length;
  }

  let used = 0;
  for (let index = 0; index < widths.length; index++) {
    used += widths[index];
    if (used + rest > available) {
      return index;
    }
  }
  return widths.length;
}

/** Source numeric slice сохраняет порядок. NaN не должен скрывать весь выбранный список. */
export function getSelectTagOverflow<Value extends string | number, Label = string>(
  tags: readonly { value: Value; label: Label; disabled?: boolean; title?: unknown }[], maxCount?: number
) {
  const visible = typeof maxCount === 'number' && !Number.isNaN(maxCount)
    ? tags.slice(0, maxCount) : tags;
  const omitted: SelectOmittedTag<Value, Label>[] = tags.slice(visible.length).map(option => ({
    label: option.label, value: option.value, key: option.value, disabled: option.disabled,
    ...(Object.hasOwn(option, 'title') ? { title: option.title } : {})
  }));
  return { visible, omitted };
}
