import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from '../test';

test('hydrates the reordered footer and uses the configured close callbacks', async ({ page }) => {
  const cache = new URL('../../../.upstream/artifacts/modal-actions-hydration-', import.meta.url);
  const cacheDir = await mkdtemp(fileURLToPath(cache));
  let server: ViteDevServer | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom',
      cacheDir
    });
    const entry = new URL('../fixtures/modal-actions.server.ts', import.meta.url);
    const { renderModalActions } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderModalActions();
    await page.goto('/modal-actions.html?kind=ordinary&profile=footer-render&hydrate');
    const root = page.locator('#root');
    await expect(root).toHaveAttribute('data-ready', 'true');
    await root.evaluate((node, markup) => {
      document.head.insertAdjacentHTML('beforeend', markup.head);
      node.innerHTML = markup.body;
    }, { body, head });

    const dialog = page.locator('dialog.actions-probe');
    const ok = dialog.locator('#local-ok');
    const original = await ok.elementHandle();
    await expect(dialog).not.toHaveAttribute('open');
    await expect(ok).toHaveAttribute('title', 'Parent action');
    await expect(dialog.locator('[data-ant-modal-close]')).toHaveAttribute(
      'aria-label', 'Parent dismiss'
    );

    await root.dispatchEvent('hydrate-modal-actions');

    await expect(root).toHaveAttribute('data-hydrated', 'true');
    await expect(dialog).toHaveAttribute('open', '');
    expect(await ok.evaluate((node, before) => node === before, original)).toBe(true);
    await ok.focus();
    await page.keyboard.press('Enter');

    await expect(dialog).not.toHaveAttribute('open');
    await expect(page.locator('#action-events')).toHaveText(JSON.stringify([
      ['afterOpenChange', true], ['ok', 0], ['afterClose'], ['afterOpenChange', false]
    ]));
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
