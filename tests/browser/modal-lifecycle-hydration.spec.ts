import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from './test';

test('hydrates lazy or initially open Modal and destroys only after a committed close', async ({ page }) => {
  const cache = new URL('../../.upstream/artifacts/modal-lifecycle-hydration-', import.meta.url);
  const cacheDir = await mkdtemp(fileURLToPath(cache));
  let server: ViteDevServer | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom',
      cacheDir
    });
    const entry = new URL('./fixtures/modal-lifecycle.server.ts', import.meta.url);
    const { renderModalLifecycle } = await server.ssrLoadModule(fileURLToPath(entry));

    for (const initiallyOpen of [false, true]) {
      const { body, head } = renderModalLifecycle({ profile: 'destroy', initiallyOpen });
      await page.goto('/modal-lifecycle.html?profile=destroy&hydrate' + (initiallyOpen ? '&open' : ''));
      const root = page.locator('#root');
      await expect(root).toHaveAttribute('data-ready', 'true');
      await root.evaluate((node, markup) => {
        document.head.insertAdjacentHTML('beforeend', markup.head);
        node.innerHTML = markup.body;
      }, { body, head });

      const dialog = page.locator('dialog');
      const editor = page.getByLabel('Lifecycle editor', { exact: true });
      await expect(dialog).toHaveCount(Number(initiallyOpen));
      let original;
      if (initiallyOpen) {
        await expect(dialog).not.toHaveAttribute('open');
        original = await page.locator('#lifecycle-editor').elementHandle();
      }

      await root.dispatchEvent('hydrate-modal-lifecycle');
      await expect(root).toHaveAttribute('data-hydrated', 'true');
      if (!initiallyOpen) {
        await expect(dialog).toHaveCount(0);
        await page.getByRole('button', { name: 'Open lifecycle' }).click();
      }
      await expect(editor).toBeVisible();
      if (original) {
        expect(await editor.evaluate((node, before) => node === before, original)).toBe(true);
      }

      await editor.fill('Edited');
      await page.getByRole('button', { name: 'Close lifecycle' }).click();

      await expect(dialog).toHaveCount(0);
      const events = page.locator('#lifecycle-events');
      await expect(events).toContainText('"destroy",["afterClose",false');
      await expect(events).toContainText('["afterOpenChange",false]');
    }
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
