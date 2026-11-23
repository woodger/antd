import { createServer as createHttpServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
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

test('hydrates composed popup rows in place and keeps their keyboard and ref owners', async ({
  page
}) => {
  if (!server) {
    throw new Error('SSR fixture server did not start');
  }
  const fixture = fileURLToPath(new URL('./fixtures/menu-popup-render-hydration.server.ts',
    import.meta.url));
  const { renderMenuPopup } = await server.ssrLoadModule(fixture);
  const { head, body } = renderMenuPopup();

  await page.goto('/menu-popup-render-hydration.html');
  await page.evaluate(({ head, body }) => {
    const root = document.getElementById('root');
    if (!root) {
      throw new Error('Missing Menu popup render fixture root');
    }

    document.head.insertAdjacentHTML('beforeend', head);
    root.innerHTML = body;
  }, { head, body });
  const outside = page.getByRole('button', { name: 'Outside', exact: true });
  await outside.focus();
  await page.addScriptTag({ type: 'module', url: '/menu-popup-render-hydration.client.ts' });
  await page.waitForFunction(() => window.menuPopupRenderHydration);

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
