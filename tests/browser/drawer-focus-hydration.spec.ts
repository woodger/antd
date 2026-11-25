import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from './test';

test('Drawer hydrates and moves its nonmodal panel without taking focus', async ({ page }) => {
  const cache = new URL('../../.upstream/artifacts/drawer-focus-hydration-', import.meta.url);
  const cacheDir = await mkdtemp(fileURLToPath(cache));
  let server: ViteDevServer | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom',
      cacheDir
    });
    const entry = new URL('./fixtures/drawer-focus-hydration.server.ts', import.meta.url);
    const { renderFocusDrawer } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderFocusDrawer();
    await page.goto('/select-components-hydration.html?drawer-focus');
    await page.addScriptTag({ type: 'module', url: '/drawer-focus-hydration.client.ts' });
    const root = page.locator('#root');
    await expect(root).toHaveAttribute('data-hydration-ready', 'true');
    await root.evaluate((target, markup) => {
      document.head.insertAdjacentHTML('beforeend', markup.head);
      target.innerHTML = markup.body;
    }, { body, head });
    const input = page.locator('#a-last');
    const shell = page.locator('#a-root');
    const before = page.locator('#before');
    const original = await input.elementHandle();
    await expect(shell).toBeHidden();
    await before.focus();

    await root.dispatchEvent('hydrate-drawer-focus');

    await expect(root).toHaveAttribute('data-hydrated', 'true');
    await expect(page.locator('body > #a-root[open]')).toBeVisible();
    await expect(before).toBeFocused();
    expect(await input.evaluate((node, previous) => node === previous, original)).toBe(true);
    const events = page.getByTestId('drawer-focus-events');
    await expect(events).toHaveText(JSON.stringify([['settled', 'a', true]]));

    await page.keyboard.press('Escape');

    await expect(shell).toBeHidden();
    await expect(before).toBeFocused();
    await expect(events).toHaveText(JSON.stringify([
      ['settled', 'a', true], ['request', 'a'], ['settled', 'a', false]
    ]));
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
