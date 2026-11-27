// Prepares the contents of tags TreeSelect and preserves hidden records data for summary.
import { getSelectTagText } from '../select/select-tag-text.engine';
import type { TreeSelectLabel, TreeSelectLabeledValue } from './tree-select.types';

/** Matches rc-select MultipleContent. Rich labels remain opaque, and the tooltip retains the full label. */
export function treeSelectTagText(label: TreeSelectLabel, maxLength?: number): TreeSelectLabel {
  return typeof maxLength === 'number' && (typeof label === 'string' || typeof label === 'number')
    && String(label).length > maxLength ? getSelectTagText(String(label), maxLength) : label;
}

/** Omitted records TreeSelect do not receive synthetic key and retain the original labels/state. */
export function treeSelectTagOverflow(tags: readonly TreeSelectLabeledValue[], count?: number) {
  const visible = typeof count === 'number' && !Number.isNaN(count) ? tags.slice(0, count) : tags;
  return { visible, omitted: tags.slice(visible.length) };
}
