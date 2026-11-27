import type { Page } from '@playwright/test';

/** As a Source capture: a couple of successive shots after the ResizeObserver/React layout queues. */
export async function settleTreeSelectSuffixLayout<View>(page: Page, read: () => Promise<View>) {
  let previous = '', stable = 0;
  for (let attempt = 0; attempt < 40; attempt++) {
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())))));
    const view = await read(), key = JSON.stringify(view);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 6) {
      return view;
    }
    previous = key;
  }
  throw Error('TreeSelect suffix layout did not settle after 120 frames');
}
