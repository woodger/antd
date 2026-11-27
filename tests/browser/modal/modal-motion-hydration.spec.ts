import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from '../test';

test('hydrates an initially requested named transition on the existing editor and mask', async ({ page }) => {
  const cache = new URL('../../../.upstream/artifacts/modal-motion-hydration-', import.meta.url);
  const cacheDir = await mkdtemp(fileURLToPath(cache));
  let server: ViteDevServer | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom',
      cacheDir
    });
    const entry = new URL('../fixtures/modal-motion.server.ts', import.meta.url);
    const { renderModalMotion } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderModalMotion();
    await page.goto('/modal-motion.html?profile=custom&open&hydrate');
    const root = page.locator('#root');
    await expect(root).toHaveAttribute('data-ready', 'true');
    await root.evaluate((node, markup) => {
      document.head.insertAdjacentHTML('beforeend', markup.head);
      node.innerHTML = markup.body;
    }, { body, head });

    const modal = page.locator('dialog.motion-probe');
    const editor = modal.locator('#motion-editor');
    const mask = modal.locator('[data-ant-modal-mask]');
    const originalEditor = await editor.elementHandle();
    const originalMask = await mask.elementHandle();
    await expect(modal).not.toHaveAttribute('open');

    await root.dispatchEvent('hydrate-modal-motion');

    await expect(root).toHaveAttribute('data-hydrated', 'true');
    await expect(editor).toBeVisible();
    await expect(modal).toHaveAttribute('open', '');
    expect(await editor.evaluate((node, before) => node === before, originalEditor)).toBe(true);
    expect(await mask.evaluate((node, before) => node === before, originalMask)).toBe(true);
    await expect(page.locator('#motion-animations')).toContainText('"panel-slide"');

    await page.locator('#motion-close-request').dispatchEvent('click');
    await expect(modal).not.toHaveAttribute('open');
    await expect(modal.locator('[data-ant-modal-mask]')).toHaveCount(0);
    await expect(modal).not.toHaveAttribute('inert');
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
