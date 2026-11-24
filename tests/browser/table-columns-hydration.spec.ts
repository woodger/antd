import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from './test';

test('Table hydrates nested columns and keeps the editor while applying media queries', async ({ page }) => {
  await page.setViewportSize({ width: 950, height: 950 });
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-table-columns-'));
  let server: ViteDevServer | undefined;

  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom', cacheDir
    });
    const entry = fileURLToPath(new URL('./fixtures/table-columns-hydration.server.ts', import.meta.url));
    const { renderTableColumnsFixture } = await server.ssrLoadModule(entry);
    const { body, head } = renderTableColumnsFixture();
    await page.goto('/select-components-hydration.html');
    await page.addScriptTag({ type: 'module', url: '/table-columns-hydration.client.ts' });
    const container = page.locator('#root');
    await expect(container).toHaveAttribute('data-hydration-ready', 'true');
    await page.evaluate(({ body, head }) => {
      const root = document.getElementById('root');
      if (!root) {
        throw new Error('Missing column fixture container');
      }
      document.head.insertAdjacentHTML('beforeend', head);
      root.innerHTML = body;
    }, { body, head });
    const table = container.getByRole('table');
    const row = table.locator('tr[data-row-key="4"]');
    const editor = row.getByRole('textbox', { name: 'Draft 4' });
    const originalRow = await row.elementHandle();
    const originalEditor = await editor.elementHandle();
    await editor.fill('Typed before hydration');
    await editor.evaluate((node: HTMLInputElement) => node.setSelectionRange(3, 9));
    await expect(table.getByRole('columnheader', { name: 'Measurements' })).toHaveCount(0);
    await expect(editor).toBeFocused();

    await container.dispatchEvent('hydrate-table-columns');

    await expect(container).toHaveAttribute('data-hydrated', 'true');
    await expect(table.getByRole('columnheader', { name: 'Measurements' })).toHaveAttribute(
      'colspan', '2'
    );
    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue('Typed before hydration');
    expect(await editor.evaluate((node, before) => node === before, originalEditor)).toBe(true);
    expect(await row.evaluate((node, before) => node === before, originalRow)).toBe(true);
    expect(await editor.evaluate((node: HTMLInputElement) => [
      node.selectionStart, node.selectionEnd
    ])).toEqual([3, 9]);
    await expect(page.locator('#table-columns-events')).toHaveText('[]');
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
