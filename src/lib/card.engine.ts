import type { CardContent, CardProps } from './card.types';
import type { TabsItem } from './tabs.types';

// Сохраняет 0 как содержимое Card и отбрасывает пустое значение.
export function cardHasContent(value: CardContent | undefined): boolean {
  return value !== undefined && value !== null && value !== false && value !== '';
}
// Готовит записи для Tabs. Отсутствующий label получает пустую строку, явно пустой label
// сохраняется как null.
export function cardTabItems(items: CardProps['tabList']): TabsItem[] {
  return (items ?? []).map(item => {
    return { ...item, label: Object.hasOwn(item, 'label') ? item.label ?? null : '' };
  });
}
