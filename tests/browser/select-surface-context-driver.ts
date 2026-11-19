import type { Page } from '@playwright/test';
import type { SelectSurfaceContextAction } from './select-surface-context-cases';
import { readSelectSurfaceContext } from './select-surface-context-metrics.mjs';
import { drainSelectSurface } from './select-surface-driver';

export async function readNativeSelectSurfaceContext(page: Page) {
  const dom = await page.evaluate(readSelectSurfaceContext);
  const state = await page.evaluate(() => {
    const state: { calls?: unknown[]; events?: unknown[]; open?: boolean; disabled?: boolean; variant?: string;
      fieldErrors?: unknown; fieldWarnings?: unknown; fieldValue?: unknown } = {};
    document.querySelector('[data-surface-context-command]')!
      .dispatchEvent(new CustomEvent('contextread', { detail: state }));
    return state;
  });
  return { dom, state };
}
export async function settleSelectSurfaceContext(page: Page) {
  let previous = '', stable = 0;
  for (let attempt = 0; attempt < 90; attempt++) {
    await drainSelectSurface(page);
    const point = await readNativeSelectSurfaceContext(page);
    const key = JSON.stringify(point);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) return point;
    previous = key;
  }
  throw Error('Native Select context owner did not settle');
}
export async function actSelectSurfaceContext(page: Page, action: SelectSurfaceContextAction) {
  if (action.type === 'click') {
    const root = await page.evaluateHandle(() => {
      const refs: { root?: HTMLElement } = {};
      document.querySelector('[data-surface-context-command]')!
        .dispatchEvent(new CustomEvent('contextrefs', { detail: refs }));
      return refs.root!;
    });
    try { await root.asElement()!.click(); } finally { await root.dispose(); }
  }
  else if (action.type === 'fill') await page.getByLabel('Inside context input', { exact: true }).fill(action.text);
  else if (action.type === 'outside') await page.locator('[data-surface-context-outside]').click();
  else await page.evaluate(action => document.querySelector('[data-surface-context-command]')!
    .dispatchEvent(new CustomEvent('contextupdate', { detail: action })), action);
  await page.mouse.move(0, 0);
}
