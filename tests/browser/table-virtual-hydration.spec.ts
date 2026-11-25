import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from './test';

for (const stringTag of [false, true]) {
  test(`virtual Table hydrates a replaced cell using a ${stringTag ? 'tag' : 'snippet'}`, async ({
    page
  }) => {
    const artifacts = new URL('../../.upstream/artifacts/table-element-hydration-', import.meta.url);
    const cacheDir = await mkdtemp(fileURLToPath(artifacts));
    let server: ViteDevServer | undefined;
    try {
      server = await createServer({
        configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
        server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
        appType: 'custom', cacheDir
      });
      const entry = new URL('./fixtures/table-virtual-hydration.server.ts', import.meta.url);
      const { renderTableElementsFixture } = await server.ssrLoadModule(fileURLToPath(entry));
      const { body, head } = renderTableElementsFixture(stringTag);
      const query = stringTag ? 'custom-elements&string-tag' : 'custom-elements';
      await page.goto(`/select-components-hydration.html?${query}`);
      await page.addScriptTag({ type: 'module', url: '/table-virtual-hydration.client.ts' });
      const root = page.locator('#root');
      await expect(root).toHaveAttribute('data-hydration-ready', 'true');
      await root.evaluate((node, html) => {
        document.head.insertAdjacentHTML('beforeend', html.head);
        node.innerHTML = html.body;
      }, { body, head });
      const editor = root.getByRole('textbox', { name: 'Row editor', exact: true });
      const initial = await editor.elementHandle();
      await editor.fill('Draft before hydration');
      await editor.evaluate((node: HTMLInputElement) => node.setSelectionRange(3, 8));

      await root.dispatchEvent('hydrate-table-virtual');

      await expect(root).toHaveAttribute('data-hydrated', 'true');
      await expect(editor).toBeFocused();
      await expect(editor).toHaveValue('Draft before hydration');
      expect(await editor.evaluate((node, before) => node === before, initial)).toBe(true);
      expect(await editor.evaluate((node: HTMLInputElement) => [
        node.selectionStart, node.selectionEnd
      ])).toEqual([3, 8]);

      await root.getByRole('button', { name: 'Scroll to 32', exact: true }).dispatchEvent('click');

      await expect(root.locator('tr[data-row-key="32"]')).toHaveCount(1);
      await expect(root.locator('tr[data-row-key="0"]')).toHaveCount(0);
    }
    finally {
      await server?.close();
      await rm(cacheDir, { recursive: true, force: true });
    }
  });
}

test('Table hydrates a custom scroll body and preserves the focused editor', async ({ page }) => {
  const artifacts = new URL('../../.upstream/artifacts/table-custom-body-hydration-', import.meta.url);
  const cacheDir = await mkdtemp(fileURLToPath(artifacts));
  let server: ViteDevServer | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom', cacheDir
    });
    const entry = new URL('./fixtures/table-virtual-hydration.server.ts', import.meta.url);
    const { renderCustomTableBodyFixture } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderCustomTableBodyFixture();
    await page.goto('/select-components-hydration.html?custom-body');
    await page.addScriptTag({ type: 'module', url: '/table-virtual-hydration.client.ts' });
    const root = page.locator('#root');
    await expect(root).toHaveAttribute('data-hydration-ready', 'true');
    await root.evaluate((node, html) => {
      document.head.insertAdjacentHTML('beforeend', html.head);
      node.innerHTML = html.body;
    }, { body, head });
    const holder = root.locator('[data-probe-body]');
    const editor = holder.getByRole('textbox', { name: 'Editor', exact: true });
    const original = await editor.elementHandle();
    await editor.fill('SSR draft');
    await editor.evaluate((node: HTMLInputElement) => node.setSelectionRange(2, 5));
    await editor.focus();

    await root.dispatchEvent('hydrate-table-virtual');

    await expect(root).toHaveAttribute('data-hydrated', 'true');
    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue('SSR draft');
    expect(await editor.evaluate((node, before) => node === before, original)).toBe(true);
    expect(await editor.evaluate((node: HTMLInputElement) => [
      node.selectionStart, node.selectionEnd
    ])).toEqual([2, 5]);

    await root.getByTestId('scroll-0').dispatchEvent('click');

    await expect.poll(() => holder.evaluate(node => node.scrollTop)).toBe(98);
    await expect(editor).toBeFocused();
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});

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
