import { createServer as createHttpServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import { test, expect } from './test';

let server: ViteDevServer | undefined;
let cache: string | undefined;
test.beforeAll(async () => {
  const artifacts = fileURLToPath(new URL('../../.upstream/artifacts/', import.meta.url));
  cache = await mkdtemp(join(artifacts, 'menu-popup-render-hydration-'));
  server = await createServer({
    configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
    appType: 'custom',
    cacheDir: cache
  });
});
test.afterAll(async () => {
  await server?.close();
  if (cache) {
    await rm(cache, { recursive: true });
  }
});

// Вставляет SSR DOM до импорта client entrypoint со строгой гидратацией.
async function hydratePopup(page: Page, enableMotion = false) {
  if (!server) {
    throw new Error('SSR fixture server did not start');
  }
  const fixture = fileURLToPath(new URL('./fixtures/menu-popup-render-hydration.server.ts',
    import.meta.url));
  const { renderMenuPopup } = await server.ssrLoadModule(fixture);
  const { head, body } = renderMenuPopup(enableMotion);

  await page.goto(enableMotion
    ? '/menu-popup-render-hydration.html?motion' : '/menu-popup-render-hydration.html');
  await page.evaluate(({ head, body }) => {
    const root = document.getElementById('root');
    if (!root) {
      throw new Error('Missing Menu popup render fixture root');
    }

    document.head.insertAdjacentHTML('beforeend', head);
    root.innerHTML = body;
    root.addEventListener('animationend', event => {
      const surface = event.target;
      if (surface instanceof HTMLElement && surface.classList.contains('ant-zoom-big-appear-active')) {
        root.dataset.menuAppearEnded = 'true';
      }
    }, { capture: true });
  }, { head, body });
  const outside = page.getByRole('button', { name: 'Outside', exact: true });
  await outside.focus();
  await page.addScriptTag({ type: 'module', url: '/menu-popup-render-hydration.client.ts' });
  await page.waitForFunction(() => window.menuPopupRenderHydration);
  return outside;
}

test('hydrates composed popup rows in place and keeps their keyboard and ref owners', async ({
  page
}) => {
  const outside = await hydratePopup(page);

  expect(await page.evaluate(() => window.menuPopupRenderHydration?.reused)).toBe(true);
  await expect(outside).toBeFocused();
  await expect(page.getByLabel('Popup render mounted')).toHaveText('UL');
  await expect(page.getByRole('menuitem', { name: 'Inner', exact: true })).toBeVisible();
  const child = page.getByRole('menuitem', { name: 'Child', exact: true });
  await page.getByRole('button', { name: 'Focus rendered Child', exact: true }).dispatchEvent('click');

  await expect(child).toBeFocused();
  await child.press('Home');

  await expect(page.getByRole('menuitem', { name: 'Inner', exact: true })).toBeFocused();
  await page.evaluate(() => window.menuPopupRenderHydration?.dispose());

  await expect(page.locator('[popover]')).toHaveCount(0);
  await expect(page.locator('[data-menu-render-owner]')).toHaveCount(0);
});

test('animates the hydrated popup in place and leaves outside focus intact', async ({ page }) => {
  const outside = await hydratePopup(page, true);

  expect(await page.evaluate(() => window.menuPopupRenderHydration?.reused)).toBe(true);
  await expect(page.locator('#root')).toHaveAttribute('data-menu-appear-ended', 'true');
  await expect(page.getByRole('menuitem', { name: 'Child', exact: true })).toBeVisible();
  await expect(outside).toBeFocused();

  await page.evaluate(() => window.menuPopupRenderHydration?.dispose());
  await expect(page.locator('[data-ant-menu-motion]')).toHaveCount(0);
});
