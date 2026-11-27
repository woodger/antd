import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from '../test';

test('Drawer hydrates ARIA and data on the same nodes through a portal', async ({ page }) => {
  const cache = new URL('../../../.upstream/artifacts/drawer-dom-hydration-', import.meta.url);
  const cacheDir = await mkdtemp(fileURLToPath(cache));
  let server: ViteDevServer | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom',
      cacheDir
    });
    const entry = new URL('../fixtures/drawer-dom-hydration.server.ts', import.meta.url);
    const { renderDrawerDom } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderDrawerDom();
    await page.goto('/select-components-hydration.html?drawer-dom');
    await page.addScriptTag({ type: 'module', url: '/drawer-dom-hydration.client.ts' });
    const root = page.locator('#root');
    await expect(root).toHaveAttribute('data-hydration-ready', 'true');
    await root.evaluate((target, markup) => {
      document.head.insertAdjacentHTML('beforeend', markup.head);
      target.innerHTML = markup.body;
    }, { body, head });
    const dialog = page.locator('#product-dialog');
    const wrapper = dialog.locator('[data-ant-drawer-content-wrapper]');
    await expect(dialog).toHaveAttribute('aria-busy', 'true');
    await expect(wrapper).toHaveAttribute('data-count', '0');
    const originalDialog = await dialog.elementHandle();
    const originalWrapper = await wrapper.elementHandle();

    await root.dispatchEvent('hydrate-drawer-dom');

    await expect(root).toHaveAttribute('data-hydrated', 'true');
    await expect(page.locator('body > #product-dialog[open]')).toBeVisible();
    await page.locator('#dom-next').evaluate(node => {
      if (node instanceof HTMLButtonElement) node.click();
    });
    await expect(dialog).toHaveAttribute('aria-busy', 'false');
    await expect(wrapper).toHaveAttribute('data-count', '1');
    await dialog.locator('#editor').focus();
    await expect(page.locator('#dom-events')).toContainText(
      '"scope":"next","kind":"focus","type":"focusin","target":"editor","current":"section"'
    );
    expect(await dialog.evaluate((node, old) => node === old, originalDialog)).toBe(true);
    expect(await wrapper.evaluate((node, old) => node === old, originalWrapper)).toBe(true);
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
