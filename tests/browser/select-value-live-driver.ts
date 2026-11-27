import type { Page } from '@playwright/test';
import type { SelectValueLiveAction } from './fixtures/select-value-live-cases';
import { actSelectValue } from './select-value-driver';

export async function actSelectValueLive(page: Page, action: SelectValueLiveAction) {
  if (action.type !== 'transaction') return actSelectValue(page, action);
  await page.evaluate(updates => {
    const command = document.querySelector('[data-select-value-command]')!;
    for (const update of updates) command.dispatchEvent(new CustomEvent('valueupdate', { detail: update }));
  }, action.updates);
  await page.mouse.move(0, 0);
}
