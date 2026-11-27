import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from '../test';

test('hydrates a responsive Modal and moves the same editor into its configured portal', async ({ page }) => {
  const cache = new URL('../../../.upstream/artifacts/modal-layout-hydration-', import.meta.url);
  const cacheDir = await mkdtemp(fileURLToPath(cache));
  let server: ViteDevServer | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom',
      cacheDir
    });
    const entry = new URL('../fixtures/modal-layout.server.ts', import.meta.url);
    const { renderModalLayout } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderModalLayout('prefix-breakpoint');

    await page.setViewportSize({ width: 819, height: 720 });
    await page.goto('/modal-layout.html?profile=prefix-breakpoint&hydrate');
    const root = page.locator('#root');
    await expect(root).toHaveAttribute('data-ready', 'true');
    await root.evaluate((node, markup) => {
      document.head.insertAdjacentHTML('beforeend', markup.head);
      node.innerHTML = markup.body;
    }, { body, head });

    const dialog = page.locator('dialog');
    const input = dialog.locator('#layout-editor');
    const original = await input.elementHandle();
    await expect(dialog).not.toHaveAttribute('open');

    await root.dispatchEvent('hydrate-modal-layout');

    await expect(root).toHaveAttribute('data-hydrated', 'true');
    await expect(page.locator('#layout-host dialog')).toBeVisible();
    await expect(dialog).toHaveCSS('width', '300px');
    expect(await input.evaluate((node, before) => node === before, original)).toBe(true);
    await input.fill('Edited');
    await input.evaluate((node: HTMLInputElement) => node.setSelectionRange(1, 4));

    await page.setViewportSize({ width: 820, height: 720 });

    await expect(dialog).toHaveCSS('width', '430px');
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('Edited');
    expect(await input.evaluate((node: HTMLInputElement) => [node.selectionStart, node.selectionEnd]))
      .toEqual([1, 4]);
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
