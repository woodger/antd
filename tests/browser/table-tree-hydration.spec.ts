import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from './test';

test('Table tree hydrates an expanded branch and its focused editor in place', async ({ page }) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-table-tree-'));
  let server: ViteDevServer | undefined;

  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom', cacheDir
    });
    const entry = fileURLToPath(new URL('./fixtures/table-tree-hydration.server.ts', import.meta.url));
    const { renderTableTreeFixture } = await server.ssrLoadModule(entry);
    const { body, head } = renderTableTreeFixture();
    await page.goto('/select-components-hydration.html');
    await page.addScriptTag({ type: 'module', url: '/table-tree-hydration.client.ts' });
    const container = page.locator('#root');
    await expect(container).toHaveAttribute('data-hydration-ready', 'true');
    await page.evaluate(({ body, head }) => {
      const root = document.getElementById('root');
      if (!root) {
        throw new Error('Missing tree fixture container');
      }
      document.head.insertAdjacentHTML('beforeend', head);
      root.innerHTML = body;
    }, { body, head });
    const branch = page.locator('tr[data-row-key="branch"]');
    const input = branch.getByRole('textbox', { name: 'Branch draft' });
    const button = branch.locator('button[aria-expanded]');
    const originalRow = await branch.elementHandle();
    const originalEditor = await input.elementHandle();
    await input.fill('Draft before hydration');
    await input.evaluate((field: HTMLInputElement) => field.setSelectionRange(2, 7));
    await expect(input).toBeFocused();

    await container.dispatchEvent('hydrate-table-tree');

    await expect(container).toHaveAttribute('data-hydrated', 'true');
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('Draft before hydration');
    await expect(page.locator('#tree-events')).toHaveText('[]');
    expect(await input.evaluate((node, original) => node === original, originalEditor)).toBe(true);
    expect(await branch.evaluate((node, original) => node === original, originalRow)).toBe(true);
    expect(await input.evaluate((field: HTMLInputElement) => [
      field.selectionStart, field.selectionEnd
    ])).toEqual([2, 7]);

    await button.press('Enter');

    await expect(button).toBeFocused();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('tr[data-row-key="leaf"]')).toBeVisible();
    await expect(page.locator('#tree-events')).toHaveText(
      '[["expand",true,"branch"],["keys",[0,"branch"]]]'
    );
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
