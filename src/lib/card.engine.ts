import type { CardContent, CardProps } from './card.types';
import type { TabsItem } from './tabs/tabs.types';

// Keeps 0 as Card content and drops empty values.
export function cardHasContent(value: CardContent | undefined): boolean {
  return value !== undefined && value !== null && value !== false && value !== '';
}
// Prepares Tabs entries. A missing label becomes an empty string. An explicitly empty label stays
// null.
export function cardTabItems(items: CardProps['tabList']): TabsItem[] {
  return (items ?? []).map(item => {
    return { ...item, label: Object.hasOwn(item, 'label') ? item.label ?? null : '' };
  });
}
