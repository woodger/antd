// Converts filter options to Menu items and nodes Tree. The representation keys are separated from
// the filter values, including 0, '0' and false.
import type { MenuItemType } from './menu/menu.types';
import type { TableFilterOption } from './table.types';

export interface TableFilterNode {
  key: string;
  title: TableFilterOption['text'];
  option: TableFilterOption;
  children?: TableFilterNode[];
}

/** Bypasses the branches and leaves in the order of the announcement, including the values of the branches themselves. */
export function* walkTableFilterOptions(
  options: readonly TableFilterOption[]
): Generator<TableFilterOption> {
  for (const option of options) {
    yield option;
    if (option.children) {
      yield* walkTableFilterOptions(option.children);
    }
  }
}

/** Records every nested array position and retains snippet references. */
function snapshotLabel(text: TableFilterOption['text']): TableFilterOption['text'] {
  return Array.isArray(text) ? Array.from(text, snapshotLabel) : text;
}

/** Remembers the structure, meanings, and labels of an open list, including empty branches. */
export function snapshotTableFilterOptions(options: readonly TableFilterOption[]) {
  return Array.from(walkTableFilterOptions(options), option => ({
    value: option.value,
    text: snapshotLabel(option.text),
    children: option.children?.length
  }));
}

/** Compares the contents of the label array without calling nested snippets. */
function sameLabel(left: TableFilterOption['text'], right: TableFilterOption['text']): boolean {
  if (!Array.isArray(left) || !Array.isArray(right)) {
    return Object.is(left, right);
  }

  return left.length === right.length && left.every((child, index) => sameLabel(child, right[index]));
}

type OptionSnapshot = ReturnType<typeof snapshotTableFilterOptions>;

/** Verifies whether the open panel is suitable for current values, labels, and list depth. */
export function areTableFilterOptionsEqual(current: OptionSnapshot, opened: OptionSnapshot) {
  return current.length === opened.length && current.every((item, index) => {
    const previous = opened[index];
    return Object.is(item.value, previous.value)
      && sameLabel(item.text, previous.text)
      && item.children === previous.children;
  });
}

/** Built-in search compares only text and numerical labels Source. */
export function matchesTableFilterText(text: TableFilterOption['text'], query: string) {
  if (typeof text !== 'string' && typeof text !== 'number') {
    return false;
  }

  return String(text).toLowerCase().includes(query);
}

/** Connects interface nodes with the original options. The keys are built on the way inside the column. */
export function getTableFilterNodes(
  options: readonly TableFilterOption[], parentKey = ''
): TableFilterNode[] {
  return options.map((option, index) => {
    const key = `${parentKey}/${index}`;
    const children = option.children ? getTableFilterNodes(option.children, key) : undefined;
    return { key, title: option.text, option, children };
  });
}

/** Bypasses prepared nodes in the same order in which Table takes options. */
export function* walkTableFilterNodes(
  nodes: readonly TableFilterNode[]
): Generator<TableFilterNode> {
  for (const node of nodes) {
    yield node;
    if (node.children) {
      yield* walkTableFilterNodes(node.children);
    }
  }
}

/** When searching, retains group headlines, hiding unsuitable leaves. */
export function getTableFilterMenu(
  nodes: readonly TableFilterNode[],
  matches: (option: TableFilterOption) => boolean,
  popupClassName: string
): MenuItemType[] {
  return nodes.map(node => {
    if (node.children) {
      return {
        key: node.key,
        label: node.title,
        popupClassName,
        children: getTableFilterMenu(node.children, matches, popupClassName)
      };
    }

    return matches(node.option) ? { key: node.key, label: node.title } : null;
  });
}
