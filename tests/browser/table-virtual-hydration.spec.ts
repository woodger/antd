import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from './test';

test('virtual Table hydrates the focused editor before changing the visible window', async ({ page }) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-table-virtual-'));
  let server: ViteDevServer | undefined;

  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom', cacheDir
    });
    const url = new URL('./fixtures/table-virtual-hydration.server.ts', import.meta.url);
    const { renderVirtualTableFixture } = await server.ssrLoadModule(fileURLToPath(url));
    const { body, head } = renderVirtualTableFixture();
    await page.goto('/select-components-hydration.html');
    await page.addScriptTag({ type: 'module', url: '/table-virtual-hydration.client.ts' });
    const container = page.locator('#root');
    await expect(container).toHaveAttribute('data-hydration-ready', 'true');
    await page.evaluate(({ body, head }) => {
      const root = document.getElementById('root');
      if (!root) {
        throw new Error('Missing virtual table fixture container');
      }
      document.head.insertAdjacentHTML('beforeend', head);
      root.innerHTML = body;
    }, { body, head });
    const row = page.locator('tr[data-row-key="0"]');
    const input = row.getByRole('textbox', { name: 'Virtual draft' });
    const originalRow = await row.elementHandle();
    const originalEditor = await input.elementHandle();
    await input.fill('Draft before hydration');
    await input.evaluate((field: HTMLInputElement) => field.setSelectionRange(2, 7));
    await expect(input).toBeFocused();

    await container.dispatchEvent('hydrate-table-virtual');

    await expect(container).toHaveAttribute('data-hydrated', 'true');
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('Draft before hydration');
    expect(await row.evaluate((node, original) => node === original, originalRow)).toBe(true);
    expect(await input.evaluate((node, original) => node === original, originalEditor)).toBe(true);
    expect(await input.evaluate((field: HTMLInputElement) => [
      field.selectionStart, field.selectionEnd
    ])).toEqual([2, 7]);

    await page.getByTestId('scroll-2').click();

    await expect(row).toHaveCount(0);
    await expect(page.locator('tr[data-row-key="28"]')).toHaveAttribute('aria-rowindex', '30');
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
