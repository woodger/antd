import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from './test';

test('hydrates the styled renderer without replacing the editor and binds the native ref', async ({ page }) => {
  const cache = new URL('../../.upstream/artifacts/modal-semantics-hydration-', import.meta.url);
  const cacheDir = await mkdtemp(fileURLToPath(cache));
  let server: ViteDevServer | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom',
      cacheDir
    });
    const entry = new URL('./fixtures/modal-semantics.server.ts', import.meta.url);
    const { renderModalSemantics } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderModalSemantics('render');

    await page.goto('/modal-semantics.html?id=render&hydrate');
    const root = page.locator('#root');
    await expect(root).toHaveAttribute('data-ready', 'true');
    await root.evaluate((node, markup) => {
      document.head.insertAdjacentHTML('beforeend', markup.head);
      node.innerHTML = markup.body;
    }, { body, head });
    const dialog = page.locator('dialog.explicit-root');
    const editor = dialog.locator('[data-custom-render] #modal-semantic-editor');
    const beforeEditor = await editor.elementHandle();
    const beforeDialog = await dialog.elementHandle();
    await expect(dialog).not.toHaveAttribute('open');
    await expect(dialog.locator('[data-ant-modal-body]')).toHaveClass(/\blocal-body\b/);

    await root.dispatchEvent('hydrate-modal-semantics');

    await expect(root).toHaveAttribute('data-hydrated', 'true');
    await expect(dialog).toHaveAttribute('open', '');
    expect(await editor.evaluate((node, before) => node === before, beforeEditor)).toBe(true);
    expect(await dialog.evaluate((node, before) => node === before, beforeDialog)).toBe(true);
    await expect(page.locator('#semantic-ref')).toHaveText(
      '{"attached":true,"role":"dialog","isPanel":true}'
    );
    await editor.focus();
    await expect(editor).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toHaveAttribute('open');
    await expect(page.locator('#semantic-events')).toHaveText('[true,"close",false]');
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
