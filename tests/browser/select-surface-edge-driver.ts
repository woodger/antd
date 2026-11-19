import type { Page } from '@playwright/test';
import type { SelectSurfaceEdgeAction } from './fixtures/select-surface-edge-cases';
import { actSelectSurface } from './select-surface-driver';

export async function actSelectSurfaceEdge(page: Page, action: SelectSurfaceEdgeAction) {
  if (action.type === 'prefix') {
    await page.locator('[data-surface-case] strong[data-surface-node="edge-prefix"]').click();
    await page.mouse.move(0, 0);
  }
  else await actSelectSurface(page, action);
}
