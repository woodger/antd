import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from './test';

test('Modal hydrates its managed panel and backdrop without replacing the editor', async ({ page }) => {
  const cache = new URL('../../.upstream/artifacts/modal-interaction-hydration-', import.meta.url);
  const cacheDir = await mkdtemp(fileURLToPath(cache));
  let server: ViteDevServer | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom',
      cacheDir
    });
    const entry = new URL('./fixtures/modal-interaction-hydration.server.ts', import.meta.url);
    const { renderModalInteraction } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderModalInteraction();
    await page.goto('/select-components-hydration.html?modal-interaction');
    await page.addScriptTag({ type: 'module', url: '/modal-interaction-hydration.client.ts' });
    const root = page.locator('#root');
    await expect(root).toHaveAttribute('data-hydration-ready', 'true');
    await root.evaluate((node, markup) => {
      document.head.insertAdjacentHTML('beforeend', markup.head);
      node.innerHTML = markup.body;
    }, { body, head });
    const dialog = page.locator('dialog.ant-svelte-dialog');
    const editor = dialog.locator('#interaction-editor');
    const backdrop = dialog.locator('[data-ant-modal-backdrop]');
    const original = { editor: await editor.elementHandle(), backdrop: await backdrop.elementHandle() };
    await expect(dialog).toBeHidden();

    await root.dispatchEvent('hydrate-modal-interaction');

    await expect(root).toHaveAttribute('data-hydrated', 'true');
    await expect(dialog).toBeVisible();
    await expect(dialog).toBeFocused();
    await expect(dialog).not.toHaveAttribute('aria-modal', 'true');
    await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
    expect(await editor.evaluate((node, before) => node === before, original.editor)).toBe(true);
    expect(await backdrop.evaluate((node, before) => node === before, original.backdrop)).toBe(true);

    await page.keyboard.press('Escape');

    await expect(dialog).toBeHidden();
    await expect(page.getByLabel('Interaction closed')).toHaveText('1');
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
