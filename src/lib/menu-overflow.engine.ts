// Calculates the number of visible points of the horizontal Menu and builds the navigational paths
// of the points in the substitution of overflow.
import type { MenuEntry } from './menu.engine';
import type { MenuSubMenu } from './menu.types';

const moreKey = 'rc-menu-more';

/** Reserves an indicator only with an actual lack of space. */
export function getMenuVisibleCount(widths: readonly number[], available: number, more: number) {
  const total = widths.reduce((sum, width) => sum + width, 0);
  if (total <= available) {
    return widths.length;
  }

  let used = more;
  for (let index = 0; index < widths.length; index++) {
    used += widths[index];
    if (used > available) {
      return index;
    }
  }
  return widths.length;
}

/** Retains the built-in More key and avoids a key already used by the consumer. */
export function getMenuMoreKey(entries: ReadonlyMap<string, MenuEntry>) {
  let key = moreKey;
  while (entries.has(key)) {
    key += '-';
  }
  return key;
}

/** Creates a submenu and an index of visible entries in it with paths from More. */
export function buildMenuMore(item: MenuSubMenu, omitted: readonly MenuEntry[]) {
  const key = String(item.key);
  const root: MenuEntry = {
    key,
    item,
    kind: 'submenu',
    overflow: true,
    path: [key],
    level: 1,
    children: []
  };
  const entries = new Map([[key, root]]);
  root.children = omitted.map(entry => reparent(entry, root));

  return { root, entries };

  // The group retains the registration, but its key is not included in the way of action.
  function reparent(entry: MenuEntry, parent: MenuEntry): MenuEntry {
    const nested = {
      ...entry,
      parent,
      level: parent.level + 1,
      path: [...parent.path, entry.key]
    };
    if (entry.kind === 'item' || entry.kind === 'submenu') {
      entries.set(nested.key, nested);
    }

    const childParent = entry.kind === 'group' ? parent : nested;
    nested.children = entry.children.map(child => reparent(child, childParent));
    return nested;
  }
}
