import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from './test';

test('Drawer reuses its SSR resize handle and settles after hydration', async ({ page }) => {
  const cache = new URL('../../.upstream/artifacts/drawer-geometry-hydration-', import.meta.url);
  const cacheDir = await mkdtemp(fileURLToPath(cache));
  let server: ViteDevServer | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom',
      cacheDir
    });
    const entry = new URL('./fixtures/drawer-geometry-hydration.server.ts', import.meta.url);
    const { renderHydrationDrawer } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderHydrationDrawer();

    await page.goto('/select-components-hydration.html?drawer-geometry');
    await page.addScriptTag({ type: 'module', url: '/drawer-geometry-hydration.client.ts' });
    const root = page.locator('#root');
    await expect(root).toHaveAttribute('data-hydration-ready', 'true');
    await root.evaluate((target, markup) => {
      document.head.insertAdjacentHTML('beforeend', markup.head);
      target.innerHTML = markup.body;
    }, { body, head });
    const events = page.getByTestId('geometry-events');
    const dialog = page.locator('#geometry-drawer-a');
    const resize = dialog.locator('[data-ant-drawer-dragger]');
    const original = await resize.elementHandle();
    await expect(dialog).toBeHidden();
    await expect(events).toHaveText('[]');

    await root.dispatchEvent('hydrate-drawer-geometry');

    await expect(root).toHaveAttribute('data-hydrated', 'true');
    await expect(dialog).toBeVisible();
    await expect(resize).toBeVisible();
    expect(await resize.evaluate((node, original) => node === original, original)).toBe(true);
    await expect(events).toHaveText(JSON.stringify([['settled', 'a', true, true]]));
    await expect(dialog.getByRole('button', { name: 'Закрыть', exact: true })).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(dialog).toBeHidden();
    await expect(resize).toHaveCount(0);
    await expect(events).toHaveText(JSON.stringify([
      ['settled', 'a', true, true], ['settled', 'a', false, true]
    ]));
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
