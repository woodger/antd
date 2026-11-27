// Indicates Menu points and computes navigation commands. Groups affect the design, the keys of
// action belong to the items and the substitution.
import type { MenuItemType, MenuItem, MenuSubMenu, MenuMode } from './menu.types';

export interface MenuEntry {
  key: string;
  item: Exclude<MenuItemType, null>;
  kind: 'item' | 'submenu' | 'group' | 'divider';
  overflow?: true;
  parent?: MenuEntry;
  path: string[];
  level: number;
  children: MenuEntry[];
}

// Builds a tree and a map of action keys for events and finding parents.
export function buildMenuEntries(items: readonly MenuItemType[]) {
  const entries = new Map<string, MenuEntry>();

  // Deploys the path of the point, excluding the group from the chain of parents of its elements.
  function build(list: readonly MenuItemType[], parent?: MenuEntry): MenuEntry[] {
    return list.flatMap(createEntry);

    // Records the key available to events before traversing descendants.
    function createEntry(item: MenuItemType, index: number): MenuEntry[] {
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
      if (kind === 'item' || kind === 'submenu') {
        entries.set(key, entry);
      }
      if ('children' in item) {
        const childParent = kind === 'group' ? parent : entry;
        entry.children = build(item.children ?? [], childParent);
      }

      return [entry];
    }
  }

  const roots = build(items);
  return { roots, entries };
}

// Collects one level of navigation, deploying groups and skipping dividers.
export function menuLevel(items: readonly MenuEntry[]): MenuEntry[] {
  return items.flatMap(
    entry => entry.kind === 'group'
      ? menuLevel(entry.children)
      : entry.kind === 'divider' ? [] : [entry]
  );
}

// Includes descendants of open inline branches in the order of the keyboard.
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

// Removes child popup keys when the branch is closed outside inline.
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
  // More is included in the path of events, and the list of his descendants is closed by its trigger.
  else if (mode !== 'inline' && !entry.overflow) {
    return next.filter(key => !isMenuDescendant(key, entry));
  }
  return next;
}

// Verifies the ownership of the key to one of the nested substitutions.
function isMenuDescendant(key: string, entry: MenuEntry): boolean {
  return entry.children.some(
    child => (child.key === key && child.kind === 'submenu') || isMenuDescendant(key, child)
  );
}

// Selects a new set of keys and notes the re-action above the selected item.
export function menuSelection(keys: readonly string[], key: string, multiple: boolean) {
  const existing = keys.includes(key);
  return {
    keys: multiple ? existing ? keys.filter(item => item !== key) : [...keys, key] : [key],
    deselect: existing
  };
}

// Matches the key with the action of the Menu mode taking into account the direction RTL.
export function menuKeyboardAction(
  mode: MenuMode,
  root: boolean,
  rtl: boolean,
  key: string
): 'previous' | 'next' | 'children' | 'parent' | 'toggle' | null {
  if (mode === 'horizontal' && root) {
    switch (key) {
      case 'ArrowLeft': return rtl ? 'next' : 'previous';
      case 'ArrowRight': return rtl ? 'previous' : 'next';
      case 'ArrowDown':
      case 'Enter': return 'children';
      default: return null;
    }
  }

  if (key === 'ArrowUp') {
    return 'previous';
  }
  if (key === 'ArrowDown') {
    return 'next';
  }
  if (mode === 'inline') {
    return key === 'Enter' ? 'toggle' : null;
  }

  switch (key) {
    case 'ArrowLeft': return rtl ? 'children' : 'parent';
    case 'ArrowRight': return rtl ? 'parent' : 'children';
    case 'Enter': return 'children';
    case 'Escape': return 'parent';
    default: return null;
  }
}

// Translates the indexed kind=item record into the element contract.
export function menuItem(entry: MenuEntry): MenuItem {
  return entry.item as MenuItem;
}
// Translate the indexed kind=submenu entry into the submenu contract.
export function menuSubMenu(entry: MenuEntry): MenuSubMenu {
  return entry.item as MenuSubMenu;
}
