import type { Locator, Page } from '@playwright/test';

/** Physical strings are separated from the virtual srlist and do not depend on prefixCls. */
export function physicalSelectOption(
  scope: Page | Locator,
  options: { name?: string | RegExp; exact?: boolean } = {}
) {
  const rows = scope.locator('[data-ant-select-item]:visible,[data-ant-auto-complete-item-option]:visible');
  const name = options.name;
  if (name === undefined) {
    return rows;
  }
  const text = typeof name === 'string' && options.exact
    ? new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) : name;
  return rows.filter({ hasText: text });
}

/** The name remains with the current listbox; the sizes and controller styles belong to the popup. */
export function physicalSelectPopup(scope: Page | Locator, name?: string) {
  const popups = scope.locator('[popover][data-ant-select-prefix]:visible');
  return name === undefined ? popups : popups.filter({
    has: popups.page().getByRole('listbox', { name, exact: true })
  });
}
