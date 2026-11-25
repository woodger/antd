import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from './test';

test('Drawer hydrating initial open reuses the section for appear', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const cache = new URL('../../.upstream/artifacts/drawer-motion-hydration-', import.meta.url);
  const cacheDir = await mkdtemp(fileURLToPath(cache));
  let server: ViteDevServer | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom',
      cacheDir
    });
    const entry = new URL('./fixtures/drawer-motion-api-hydration.server.ts', import.meta.url);
    const { renderDrawerMotion } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderDrawerMotion();
    await page.goto('/select-components-hydration.html?drawer-motion-api');
    await page.addScriptTag({ type: 'module', url: '/drawer-motion-api-hydration.client.ts' });
    const root = page.locator('#root');
    await expect(root).toHaveAttribute('data-hydration-ready', 'true');
    await root.evaluate((node, markup) => {
      document.head.insertAdjacentHTML('beforeend', markup.head);
      node.innerHTML = markup.body;
    }, { body, head });
    const dialog = page.locator('#motion-root');
    const section = dialog.locator('[data-ant-drawer-section]');
    await expect(dialog).toBeHidden();
    const original = await section.elementHandle();

    await root.dispatchEvent('hydrate-drawer-motion');

    await expect(root).toHaveAttribute('data-hydrated', 'true');
    await expect(dialog).toBeVisible();
    const events = page.locator('#motion-events');
    await expect(events).toContainText('"afterOpen":[true]');
    await expect(events).toContainText('["Appear","prepare",true]');
    await expect(events).toContainText('["Appear","end",true,"deadline"]');
    expect(await section.evaluate((node, before) => node === before, original)).toBe(true);
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
