import type { Locator, Page } from '@playwright/test';

/** Физические строки отделены от виртуального srlist и не зависят от prefixCls. */
export function physicalSelectOption(
  scope: Page | Locator,
  options: { name?: string | RegExp; exact?: boolean } = {}
) {
  const rows = scope.locator('[data-ant-select-item]:visible,[data-ant-auto-complete-item-option]:visible');
  const name = options.name;
  if (name === undefined) return rows;
  const text = typeof name === 'string' && options.exact
    ? new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) : name;
  return rows.filter({ hasText: text });
}

/** Имя остаётся у действующего listbox; размеры и controller styles принадлежат popup. */
export function physicalSelectPopup(scope: Page | Locator, name?: string) {
  const popups = scope.locator('[popover][data-ant-select-prefix]:visible');
  return name === undefined ? popups : popups.filter({
    has: popups.page().getByRole('listbox', { name, exact: true })
  });
}
