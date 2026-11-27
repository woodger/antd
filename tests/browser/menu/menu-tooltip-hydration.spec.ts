import { createServer as createHttpServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { test, expect } from '../test';

let server: ViteDevServer | undefined;
let cache: string | undefined;
test.beforeAll(async () => {
  const artifacts = fileURLToPath(new URL('../../../.upstream/artifacts/', import.meta.url));
  cache = await mkdtemp(join(artifacts, 'menu-tooltip-hydration-'));
  server = await createServer({
    configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
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

test('hydrates the controlled tooltip and preserves both server nodes and focus', async ({ page }) => {
  if (!server) {
    throw new Error('Menu tooltip SSR fixture server did not start');
  }
  const fixture = fileURLToPath(new URL('../fixtures/menu-tooltip-hydration.server.ts', import.meta.url));
  const { renderMenuTooltip } = await server.ssrLoadModule(fixture);
  const { head, body } = renderMenuTooltip();

  await page.goto('/menu-tooltip-hydration.html');
  await page.evaluate(({ head, body }) => {
    const root = document.getElementById('root');
    if (!root) {
      throw new Error('Missing Menu tooltip fixture root');
    }

    document.head.insertAdjacentHTML('beforeend', head);
    root.innerHTML = body;
  }, { head, body });
  const row = page.getByRole('menuitem', { name: 'Warehouse' });
  const originalRow = await row.elementHandle();
  const originalPopup = await row.locator('[role=tooltip]').elementHandle();
  await row.focus();

  await page.addScriptTag({ type: 'module', url: '/menu-tooltip-hydration.client.ts' });
  const popup = page.locator('body > .ant-menu-inline-collapsed-tooltip:popover-open');

  await expect(popup).toHaveText('Controlled');
  expect(await row.evaluate((element, before) => element === before, originalRow)).toBe(true);
  expect(await popup.evaluate((element, before) => element === before, originalPopup)).toBe(true);
  await expect(row).toBeFocused();
  await expect(row).toHaveAttribute('aria-describedby', await popup.getAttribute('id') ?? '');

  await page.evaluate(() => window.menuTooltipHydration?.dispose());

  await expect(popup).toHaveCount(0);
  await expect(page.locator('[role=tooltip]')).toHaveCount(0);
});
