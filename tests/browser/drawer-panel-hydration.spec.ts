import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from './test';

test('Drawer hydrates the wrapped Skeleton in place', async ({ page }) => {
  const cache = new URL('../../.upstream/artifacts/drawer-panel-hydration-', import.meta.url);
  const cacheDir = await mkdtemp(fileURLToPath(cache));
  let server: ViteDevServer | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom',
      cacheDir
    });
    const entry = new URL('./fixtures/drawer-panel-hydration.server.ts', import.meta.url);
    const { renderDrawerPanel } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderDrawerPanel();
    await page.goto('/select-components-hydration.html?drawer-panel');
    await page.addScriptTag({ type: 'module', url: '/drawer-panel-hydration.client.ts' });
    const target = page.locator('#root');
    await expect(target).toHaveAttribute('data-hydration-ready', 'true');
    await target.evaluate((node, markup) => {
      document.head.insertAdjacentHTML('beforeend', markup.head);
      node.innerHTML = markup.body;
    }, { body, head });
    const panel = page.locator('#render-host > [data-ant-drawer-section]');
    const skeleton = page.locator('[data-ant-skeleton-main]');
    const originalPanel = await panel.elementHandle();
    const originalSkeleton = await skeleton.elementHandle();

    await target.dispatchEvent('hydrate-drawer-panel');

    await expect(target).toHaveAttribute('data-hydrated', 'true');
    await expect(page.locator('#panel-ref-state')).toHaveText('section');
    await expect(page.locator('#study-root')).toBeHidden();
    expect(await skeleton.evaluate((node, previous) => node === previous, originalSkeleton))
      .toBe(true);
    await page.getByRole('button', { name: 'Ready', exact: true }).click();
    await page.getByRole('button', { name: 'Open', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Study body' })).toBeVisible();
    await expect(skeleton).toHaveCount(0);
    expect(await panel.evaluate((node, previous) => node === previous, originalPanel)).toBe(true);
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
