// Normalizes keys Tabs and sets the keyboard order. DOM id is equally constructed from the key for
// the header and the corresponding panel.
import type { TabsItem, TabsPlacement } from './tabs.types';
import { encodeDomIdKey } from '../dom-id';

/** ID native header or panel for fully custom navigation Tabs. */
export function getTabsItemId(rootId: string, key: string, kind: 'tab' | 'panel'): string {
  return `${rootId}-${kind}-${encodeDomIdKey(key)}`;
}

// Explicit closable is taken into account separately from the empty icon and disabled.
export function isTabsItemRemovable(
  item: Pick<TabsItem, 'closable' | 'closeIcon' | 'disabled'>,
  editable: boolean
): boolean {
  return editable && !item.disabled && item.closable !== false
    && !(item.closable === undefined && (item.closeIcon === null || item.closeIcon === false));
}

// When the keys match, you save the first title and its contents.
export function normalizeTabsItems(items: readonly TabsItem[]): TabsItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.key)) {
      return false;
    }

    seen.add(item.key);
    return true;
  });
}

// Selects an accorded active tab. Without a match starts with the first available.
export function getTabsActiveKey(
  items: readonly TabsItem[],
  key: string | undefined
): string | undefined {
  const active = items.find(item => item.key === key && !item.disabled);
  const activeKey = active?.key;
  if (activeKey != null) {
    return activeKey;
  }

  const first = items.find(item => !item.disabled);
  return first?.key;
}

// Arrows are cyclical and pass disabled. Home and End choose the appropriate edge.
export function getTabsNavigationKey(
  items: readonly TabsItem[],
  current: string | undefined,
  direction: 'next' | 'previous' | 'first' | 'last'
): string | undefined {
  const available = items.filter((item) => !item.disabled);
  if (!available.length) {
    return undefined;
  }
  if (direction === 'first') {
    return available[0].key;
  }
  if (direction === 'last') {
    return available[available.length - 1].key;
  }

  const index = available.findIndex((item) => item.key === current);
  if (index === -1) {
    const edge = direction === 'next' ? 0 : available.length - 1;
    return available[edge].key;
  }

  const step = direction === 'next' ? 1 : -1;
  const nextIndex = (index + step + available.length) % available.length;
  return available[nextIndex].key;
}

// Translates logical start/end taking into account RTL and mobile location.
export function getTabsPlacement(
  placement: TabsPlacement,
  direction: 'ltr' | 'rtl',
  mobile = false
): 'top' | 'bottom' | 'left' | 'right' {
  if (placement === 'top' || placement === 'bottom') {
    return placement;
  }
  if (mobile) {
    return 'top';
  }

  return (placement === 'start') === (direction === 'ltr') ? 'left' : 'right';
}
