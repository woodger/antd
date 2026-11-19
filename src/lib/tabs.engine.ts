// Нормализует ключи Tabs и задаёт клавиатурный порядок. DOM id одинаково
// строится из ключа для заголовка и соответствующей панели.
import type { TabsItem, TabsPlacement } from './tabs.types';

/** ID native заголовка или панели для полностью пользовательской навигации Tabs. */
export function getTabsItemId(rootId: string, key: string, kind: 'tab' | 'panel'): string {
  // Правило 2: Array.from передаёт каждый code point непустой строкой.
  const encoded = Array.from(key, character => character.codePointAt(0)!.toString(16)).join('-');
  return `${rootId}-${kind}-${encoded || 'empty'}`;
}

// Явный closable учитывается отдельно от пустой иконки и disabled.
export function isTabsItemRemovable(
  item: Pick<TabsItem, 'closable' | 'closeIcon' | 'disabled'>,
  editable: boolean
): boolean {
  return editable && !item.disabled && item.closable !== false
    && !(item.closable === undefined && (item.closeIcon === null || item.closeIcon === false));
}

// При совпадении ключей сохраняет первый заголовок и его содержимое.
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

// Выбирает доступную активную вкладку. Без совпадения начинает с первой доступной.
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

// Стрелки цикличны и пропускают disabled. Home и End выбирают соответствующий край.
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

// Переводит логические start/end с учётом RTL и мобильного расположения.
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
