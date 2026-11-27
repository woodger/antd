import { createServer as createHttpServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from '../test';

test('hydrates the native Dropdown Menu in place and keeps keyboard and link behavior', async ({
  page
}) => {
  const artifacts = new URL('../../../.upstream/artifacts/dropdown-menu-hydration-', import.meta.url);
  const cache = await mkdtemp(fileURLToPath(artifacts));
  let server: ViteDevServer | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom', cacheDir: cache
    });
    const fixture = new URL('../fixtures/dropdown-menu-hydration.server.ts', import.meta.url);
    const { renderDropdownMenu } = await server.ssrLoadModule(fileURLToPath(fixture));
    const { head, body } = renderDropdownMenu();

    await page.goto('/dropdown-menu-hydration.html');
    await page.evaluate(({ head, body }) => {
      const root = document.getElementById('root');
      if (!root) throw new Error('Missing Dropdown hydration root');

      document.head.insertAdjacentHTML('beforeend', head);
      root.innerHTML = body;
    }, { head, body });
    await page.locator('#outside').focus();
    await page.addScriptTag({ type: 'module', url: '/dropdown-menu-hydration.client.ts' });
    await page.waitForFunction(() => window.dropdownMenuHydration);

    expect(await page.evaluate(() => window.dropdownMenuHydration?.reused)).toBe(true);
    await expect(page.locator('#outside')).toBeFocused();
    const menu = page.getByRole('menu', { name: 'Commands menu' });
    await expect(menu).toBeVisible();
    await menu.getByRole('menuitem', { name: 'Branch' }).press('ArrowRight');

    const link = page.getByRole('menuitem', { name: 'Leaf' });
    await expect(link).toBeFocused();
    await link.press('Enter');

    await expect(menu).toBeHidden();
    await expect(page.getByRole('button', { name: 'Link destination' })).toBeFocused();
    await page.evaluate(() => window.dropdownMenuHydration?.dispose());
    await expect(page.locator('[popover]')).toHaveCount(0);
  }
  finally {
    await server?.close();
    await rm(cache, { recursive: true });
  }
});
