// Вычисляет число видимых пунктов горизонтального Menu и строит
// навигационные пути пунктов в подменю переполнения.
import type { MenuEntry } from './menu.engine';
import type { MenuSubMenu } from './menu.types';

const moreKey = 'rc-menu-more';

/** Резервирует индикатор только при фактической нехватке места. */
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

/** Сохраняет штатный ключ More и обходит занятый пользователем ключ. */
export function getMenuMoreKey(entries: ReadonlyMap<string, MenuEntry>) {
  let key = moreKey;
  while (entries.has(key)) {
    key += '-';
  }
  return key;
}

/** Создаёт подменю и индекс видимых в нём записей с путями от More. */
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

  // Группа сохраняет оформление, но её ключ не входит в пути действий.
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
