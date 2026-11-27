// Normalizes panel keys and chooses the Collapse keyboard focus target. Numeric and string keys are
// compared as strings after normalization.
import type { CollapseActiveKey, CollapseItem, CollapseTrigger } from './collapse.types';

// Keeps the first item for each key. A missing key defaults to the item's position.
export function normalizeCollapseItems(items: readonly CollapseItem[]) {
  const seen = new Set<string>();

  return items.flatMap((item, index) => {
    const key = String(item.key ?? index);
    if (seen.has(key)) {
      return [];
    }

    seen.add(key);
    return [{ ...item, key }];
  });
}

// Keeps the first distinct open key in accordion mode.
export function getCollapseKeys(value: CollapseActiveKey | undefined, accordion = false): string[] {
  const source = typeof value === 'string' || typeof value === 'number' ? [value] : value ?? [];
  const keys = [...new Set(source.map(String))];
  return accordion ? keys.slice(0, 1) : keys;
}

// Hiding the arrow moves the action to the header in icon trigger mode.
export function getCollapseTrigger(
  item: CollapseItem,
  fallback: CollapseTrigger = 'header'
): CollapseTrigger {
  const trigger = item.collapsible ?? fallback;
  return trigger === 'icon' && item.showArrow === false ? 'header' : trigger;
}

// Toggles a panel while respecting the accordion constraint.
export function toggleCollapseKey(
  value: CollapseActiveKey | undefined,
  key: string,
  accordion = false
): string[] {
  const keys = getCollapseKeys(value, accordion);
  if (accordion) {
    return keys[0] === key ? [] : [key];
  }

  return keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key];
}

// Prefers the requested enabled key, then an open item, then the first item.
export function getCollapseFocusKey(
  items: readonly CollapseItem[],
  requested: string | undefined,
  open: readonly string[],
  collapsible: CollapseTrigger = 'header'
): string | undefined {
  const available = normalizeCollapseItems(items).filter(
    (item) => getCollapseTrigger(item, collapsible) !== 'disabled'
  );

  const requestedItem = available.find((item) => item.key === requested);
  const requestedKey = requestedItem?.key;
  if (requestedKey != null) {
    return requestedKey;
  }

  const openItem = available.find((item) => open.includes(item.key));
  return openItem?.key ?? available[0]?.key;
}
