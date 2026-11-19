// Индексирует пункты Menu и вычисляет команды навигации. Группы влияют на оформление, ключи
// действий относятся к пунктам и подменю.
import type { MenuItemType, MenuItem, MenuSubMenu, MenuMode } from './menu.types';

export interface MenuEntry {
  key: string;
  item: Exclude<MenuItemType, null>;
  kind: 'item' | 'submenu' | 'group' | 'divider';
  parent?: MenuEntry;
  path: string[];
  level: number;
  children: MenuEntry[];
}

// Строит дерево и карту ключей действий для событий и поиска родителей.
export function buildMenuEntries(items: readonly MenuItemType[]) {
  const entries = new Map<string, MenuEntry>();

  // Разворачивает путь пункта, исключая группу из цепочки родителей её элементов.
  function build(list: readonly MenuItemType[], parent?: MenuEntry): MenuEntry[] {
    return list.flatMap((item, index) => {
      if (!item) {
        return [];
      }

      const kind = item.type === 'group'
        ? 'group'
        : item.type === 'divider' ? 'divider' : 'children' in item ? 'submenu' : 'item';
      const key = String(item.key ?? `tmp-${index}`);
      const entry: MenuEntry = {
        key,
        item: { ...item },
        kind,
        parent,
        path: [...parent?.path ?? [], key],
        level: (parent?.level ?? 0) + 1,
        children: []
      };
      if (kind === 'item' || kind === 'submenu')
        entries.set(key, entry);
      if ('children' in item)
        entry.children = build(item.children ?? [], kind === 'group' ? parent : entry);
      return [entry];
    });
  }

  const roots = build(items);
  return { roots, entries };
}

// Собирает один уровень навигации, разворачивая группы и пропуская разделители.
export function menuLevel(items: readonly MenuEntry[]): MenuEntry[] {
  return items.flatMap(
    entry => entry.kind === 'group'
      ? menuLevel(entry.children)
      : entry.kind === 'divider' ? [] : [entry]
  );
}

// Включает потомков открытых inline веток в порядок клавиатуры.
export function menuVisible(
  items: readonly MenuEntry[],
  open: readonly string[],
  inline: boolean
): MenuEntry[] {
  return menuLevel(items).flatMap(
    entry => [
      entry,
      ...inline && open.includes(entry.key) ? menuVisible(entry.children, open, inline) : []
    ]
  );
}

// Удаляет ключи дочерних popup при закрытии ветки вне inline.
export function menuOpenKeys(
  keys: readonly string[],
  entry: MenuEntry,
  open: boolean,
  mode: MenuMode
): string[] {
  const next = keys.filter(key => key !== entry.key);
  if (open) {
    next.push(entry.key);
  }
  else if (mode !== 'inline') {
    return next.filter(key => !isMenuDescendant(key, entry));
  }
  return next;
}

// Проверяет принадлежность ключа одному из вложенных подменю.
function isMenuDescendant(key: string, entry: MenuEntry): boolean {
  return entry.children.some(
    child => (child.key === key && child.kind === 'submenu') || isMenuDescendant(key, child)
  );
}

// Выбирает новый набор ключей и отмечает повторное действие над выбранным пунктом.
export function menuSelection(keys: readonly string[], key: string, multiple: boolean) {
  const existing = keys.includes(key);
  return {
    keys: multiple ? existing ? keys.filter(item => item !== key) : [...keys, key] : [key],
    deselect: existing
  };
}

// Сопоставляет клавишу с действием режима Menu с учётом направления RTL.
export function menuKeyboardAction(
  mode: MenuMode,
  root: boolean,
  rtl: boolean,
  key: string
):
  'previous'
  | 'next'
  | 'children'
  | 'parent'
  | 'toggle'
  | null {
  if (mode === 'inline') {
    return key === 'ArrowUp'
      ? 'previous'
      : key === 'ArrowDown' ? 'next' : key === 'Enter' ? 'toggle' : null;
  }
  if (mode === 'horizontal' && root) {
    return key === 'ArrowLeft' ? (rtl ? 'next' : 'previous')
      : key === 'ArrowRight'
        ? (rtl ? 'previous' : 'next')
        : key === 'ArrowDown' || key === 'Enter' ? 'children' : null;
  }
  return key === 'ArrowUp'
    ? 'previous'
    : key === 'ArrowDown' ? 'next' : key === 'ArrowLeft' ? (rtl ? 'children' : 'parent')
      : key === 'ArrowRight'
        ? (rtl ? 'parent' : 'children')
        : key === 'Enter' ? 'children' : key === 'Escape' ? 'parent' : null;
}

// Переводит индексированную запись kind=item в контракт элемента.
export function menuItem(entry: MenuEntry): MenuItem {
  return entry.item as MenuItem;
}
// Переводит индексированную запись kind=submenu в контракт подменю.
export function menuSubMenu(entry: MenuEntry): MenuSubMenu {
  return entry.item as MenuSubMenu;
}
