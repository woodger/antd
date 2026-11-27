import type { Page } from '@playwright/test';
import type { SelectVirtualAction } from './fixtures/select-virtual-cases';
import { actSelectVirtual, drainSelectVirtual } from './select-virtual-driver.ts';

/** Selected-case gesture: finish the locator's public scroll before moving the pointer. */
export async function actSelectVirtualHover(page: Page, action: SelectVirtualAction) {
  if (action.type === 'hover') {
    const option = page.locator('.ant-select-dropdown:visible').first()
      .locator('.ant-select-item-option-content')
      .filter({ hasText: new RegExp(`^${action.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) });
    await option.scrollIntoViewIfNeeded();
    await drainSelectVirtual(page);
  }
  await actSelectVirtual(page, action);
}
