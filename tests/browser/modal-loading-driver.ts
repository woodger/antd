import type { Page } from '@playwright/test';
import { drainSelectSurface } from './select-surface-driver';
import { readModalLoading, readModalLoadingCleanup } from './modal-loading-metrics.mjs';
import type { ModalLoadingAction, ModalLoadingSample } from './modal-loading-cases.mjs';
export async function openNativeModalLoading(page: Page, sample: ModalLoadingSample) {
  await page.goto('/modal-loading.html?sample=' + encodeURIComponent(sample.id));
  await page.waitForFunction(() => window.modalLoadingNative?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
}
export async function settleNativeModalLoading(page: Page) {
  let previous = '', stable = 0, latest: ReturnType<typeof readModalLoading> | null = null;
  for (let index = 0; index < 90; index++) {
    await drainSelectSurface(page);
    latest = await page.evaluate(readModalLoading);
    const encoded = JSON.stringify(latest);
    stable = previous === encoded ? stable + 1 : 0;
    if (stable >= 3) {
      return latest;
    }
    previous = encoded;
  }
  throw Object.assign(Error('Actual Native Modal.loading did not settle'), { observation: latest });
}
export async function actNativeModalLoading(
  page: Page,
  sample: ModalLoadingSample,
  action: ModalLoadingAction
) {
  if (action.type === 'loading') {
    await page.evaluate(
      action => window.modalLoadingNative.update(action),
      action
    );
  }
  else if (action.type === 'fill') {
    const handle = await page.evaluateHandle(() => window.modalLoadingNative.readRefs().editor), editor = handle.asElement();
    if (!editor) {
      throw Error('Actual authored body input ref required');
    }
    try { await editor.fill(action.text); } finally { await handle.dispose(); }
  }
  else if (action.type === 'cancel-close') await page.locator('[data-modal-loading-owner="' + sample.id + '"] button.' + sample.prefixCls + '-close').click();
  else throw Error('Unknown frozen Modal.loading action');
  await page.mouse.move(0, 0);
}
export const readNativeModalLoadingCleanup = (page: Page) => page.evaluate(readModalLoadingCleanup);
