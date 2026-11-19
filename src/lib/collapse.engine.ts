// Нормализует ключи панелей и выбирает цель клавиатурного фокуса Collapse.
// После нормализации числовые и строковые ключи сравниваются как строки.
import type { CollapseActiveKey, CollapseItem, CollapseTrigger } from './collapse.types';

// Сохраняет первый элемент для каждого ключа. Отсутствующий ключ берётся из позиции.
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

// В accordion оставляет первый уникальный открытый ключ.
export function getCollapseKeys(value: CollapseActiveKey | undefined, accordion = false): string[] {
  const source = typeof value === 'string' || typeof value === 'number' ? [value] : value ?? [];
  const keys = [...new Set(source.map(String))];
  return accordion ? keys.slice(0, 1) : keys;
}

// Скрытая стрелка переносит действие на заголовок, когда выбран trigger icon.
export function getCollapseTrigger(
  item: CollapseItem,
  fallback: CollapseTrigger = 'header'
): CollapseTrigger {
  const trigger = item.collapsible ?? fallback;
  return trigger === 'icon' && item.showArrow === false ? 'header' : trigger;
}

// Переключает одну панель с учётом ограничения accordion.
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

// Выбирает доступный запрошенный ключ, затем открытый пункт, затем начало списка.
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
  if (requestedKey !== undefined) {
    return requestedKey;
  }

  const openItem = available.find((item) => open.includes(item.key));
  return openItem?.key ?? available[0]?.key;
}
