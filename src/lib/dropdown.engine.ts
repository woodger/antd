// Prepares Dropdown inputs and slots for Menu and performs command text searches.
import type {
  DropdownConfig, DropdownMenuClickInfo, DropdownMenuEntry, DropdownPlacement, DropdownProps,
  DropdownSemantic, DropdownSlots
} from './dropdown.types';
import { serializeInlineStyleLayers } from './inline-style.engine';
import type { MenuClickInfo, MenuItem, MenuItemType } from './menu.types';

const dropdownSlots = ['root', 'item', 'itemTitle', 'itemIcon', 'itemContent'] as const;

// The first item with this key remains in the rendering list.
export function normalizeDropdownItems<T extends DropdownMenuEntry>(items: readonly T[]): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (item === null || item.key === undefined) {
      return true;
    }

    const key = String(item.key);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

/** Dropdown commands are activated via click even when working with a keyboard. */
export function isDropdownClick(info: MenuClickInfo): info is DropdownMenuClickInfo {
  return 'button' in info.domEvent;
}

/** Leaves system keyboard shortcuts and IME to the current focus holder. */
export function isDropdownMenuKey(event: KeyboardEvent) {
  return !event.defaultPrevented && !event.isComposing
    && !event.ctrlKey && !event.altKey && !event.metaKey;
}

/** The phase name follows the requested party; CSS takes into account the actual flip. */
export function getDropdownMotionName(prefix: string, placement: DropdownPlacement) {
  if (placement.startsWith('top')) return `${prefix}-slide-down`;
  if (placement.startsWith('left')) return `${prefix}-slide-right`;
  if (placement.startsWith('right')) return `${prefix}-slide-left`;
  return `${prefix}-slide-up`;
}

/** Prepares Menu parameters, saving the keys and the initial data of the items. */
export function toDropdownMenuItems(items: readonly DropdownMenuEntry[]): MenuItemType[] {
  return normalizeDropdownItems(items).map(toMenuItem);
}

/** Narrows the events of the teams and recursively connects them to the common Menu tree. */
function toMenuItem(item: DropdownMenuEntry): MenuItemType {
  if (!item || item.type === 'divider') {
    return item;
  }
  if (item.type === 'group') {
    return { ...item, children: item.children && toDropdownMenuItems(item.children) };
  }

  const handler = item.onClick;
  const onClick = handler && ((info: MenuClickInfo) => {
    if (isDropdownClick(info)) handler(info);
  });
  if ('children' in item) {
    return { ...item, onClick, children: toDropdownMenuItems(item.children) };
  }
  return { ...item, onClick };
}

/** The native attributes of the commands belong to Dropdown and pass through Menu data. */
export function getDropdownCommandAttributes(item: MenuItem) {
  return {
    href: 'href' in item && typeof item.href === 'string' ? item.href : undefined,
    target: 'target' in item && typeof item.target === 'string' ? item.target : undefined,
    rel: 'rel' in item && typeof item.rel === 'string' ? item.rel : undefined,
    textValue: 'textValue' in item && typeof item.textValue === 'string' ? item.textValue : undefined
  };
}

/** Root slots belong to the panels, the rest are applied to all Menu levels. */
export function dropdownSemantics(
  config: DropdownConfig | undefined,
  props: DropdownProps,
  providerProps: DropdownProps
) {
  const providerClasses = resolveDropdownSlots(config?.classNames, providerProps);
  const localClasses = resolveDropdownSlots(props.classNames, props);
  const { root: providerRootStyle, ...providerStyles } =
    resolveDropdownSlots(config?.styles, providerProps) ?? {};
  const { root: localRootStyle, ...localStyles } = resolveDropdownSlots(props.styles, props) ?? {};

  const { root: rootClass, ...classes } = mergeDropdownSlots(providerClasses, localClasses, ' ');
  const styles = mergeDropdownSlots(providerStyles, localStyles, ';');
  const rootStyle = serializeInlineStyleLayers([providerRootStyle, config?.style, localRootStyle]);

  return {
    rootClass,
    rootStyle,
    classNames: { ...classes, subMenu: classes },
    styles: { ...styles, subMenu: styles }
  };
}

/** Transfers callback props instances, including the parameters of the nested Menu. */
function resolveDropdownSlots(value: DropdownSemantic | undefined, props: DropdownProps) {
  return typeof value === 'function' ? value({ props }) : value;
}

/** Combines explicit slots, leaving missing keys to Menu settings. */
function mergeDropdownSlots(
  inherited: DropdownSlots | undefined,
  local: DropdownSlots | undefined,
  separator: ' ' | ';'
): DropdownSlots {
  const merged = { ...inherited, ...local };
  if (!inherited || !local) return merged;

  for (const slot of dropdownSlots) {
    const inheritedValue = inherited[slot];
    if (inheritedValue && Object.hasOwn(local, slot)) {
      merged[slot] = [inheritedValue, local[slot]].filter(Boolean).join(separator);
    }
  }
  return merged;
}

// A single letter is looking after the current paragraph, so that the re-input will cross the matches.
export function getDropdownMatch(
  commands: readonly { key: string; text: string; }[],
  current: string | null,
  query: string
): string | null {
  const search = query.trim().toLocaleLowerCase();
  if (!search || !commands.length) {
    return null;
  }

  const currentIndex = commands.findIndex((item) => item.key === current);
  const start = currentIndex < 0 ? 0 : currentIndex + (Array.from(search).length === 1 ? 1 : 0);

  for (let offset = 0; offset < commands.length; offset++) {
    const item = commands[(start + offset) % commands.length];
    if (item.text.trim().toLocaleLowerCase().startsWith(search)) {
      return item.key;
    }
  }
  return null;
}
