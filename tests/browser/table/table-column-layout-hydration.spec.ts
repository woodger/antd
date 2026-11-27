import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from '../test';

let cacheDir: string;
let server: ViteDevServer;

test.beforeAll(async () => {
  cacheDir = await mkdtemp(join(tmpdir(), 'antd-table-column-layout-'));
  server = await createServer({
    configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
    appType: 'custom', cacheDir
  });
});

test.afterAll(async () => {
  await server?.close();
  if (cacheDir) await rm(cacheDir, { recursive: true, force: true });
});

for (const profileId of ['fixed-rtl', 'virtual-min']) {
  test(`Table hydrates the ${profileId} layout without replacing its editor`, async ({ page }) => {
    const entry = new URL('../fixtures/table-column-layout.server.ts', import.meta.url);
    const { renderColumnLayout } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderColumnLayout(profileId);
    await page.goto(`/select-components-hydration.html?profile=${profileId}`);
    await page.addScriptTag({ type: 'module', url: '/table-column-layout.client.ts' });
    const container = page.locator('#root');
    await expect(container).toHaveAttribute('data-hydration-ready', 'true');
    await container.evaluate((root, { body, head }) => {
      document.head.insertAdjacentHTML('beforeend', head);
      root.innerHTML = body;
    }, { body, head });
    const editor = container.getByRole('textbox', { name: 'Column editor' });
    const original = await editor.elementHandle();
    await editor.fill('Typed before measuring');
    await editor.evaluate((node: HTMLInputElement) => node.setSelectionRange(3, 9));

    await container.dispatchEvent('hydrate-table-column-layout');

    await expect(container).toHaveAttribute('data-hydrated', 'true');
    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue('Typed before measuring');
    expect(await editor.evaluate((node, before) => node === before, original)).toBe(true);
    expect(await editor.evaluate((node: HTMLInputElement) => [
      node.selectionStart, node.selectionEnd
    ])).toEqual([3, 9]);

    if (profileId === 'virtual-min') {
      const first = container.locator('thead th.fixture-col-name');
      await expect(first).toHaveCSS('width', '316px');
    }
  });
}

test('Table hydrates inherited column renders and preserves the editor when defaults change',
  async ({ page }) => {
    const entry = new URL('../fixtures/table-column-layout.server.ts', import.meta.url);
    const { renderColumnDefaults } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderColumnDefaults();
    await page.goto('/select-components-hydration.html?defaults');
    await page.addScriptTag({ type: 'module', url: '/table-column-layout.client.ts' });
    const container = page.locator('#root');
    await expect(container).toHaveAttribute('data-hydration-ready', 'true');
    await container.evaluate((root, html) => {
      document.head.insertAdjacentHTML('beforeend', html.head);
      root.innerHTML = html.body;
    }, { body, head });
    const editor = container.getByRole('textbox', { name: 'Column editor' });
    const original = await editor.elementHandle();
    await editor.fill('Draft before hydration');
    await editor.evaluate((node: HTMLInputElement) => node.setSelectionRange(2, 8));

    await container.dispatchEvent('hydrate-table-column-layout');
    await expect(container).toHaveAttribute('data-hydrated', 'true');
    await expect(editor).toHaveValue('Draft before hydration');
    await container.getByRole('button', { name: 'Update defaults' }).dispatchEvent('click');

    await expect(container.locator('thead th.updated-default')).toHaveCount(3);
    await expect(container.locator('[data-column-defaults-changes]')).toHaveText('[]');
    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue('Draft before hydration');
    expect(await editor.evaluate((node, before) => node === before, original)).toBe(true);
    expect(await editor.evaluate((node: HTMLInputElement) => [
      node.selectionStart, node.selectionEnd
    ])).toEqual([2, 8]);
  }
);

test('Table hydrates semantic styles and updates them around the existing editor', async ({ page }) => {
  const entry = new URL('../fixtures/table-column-layout.server.ts', import.meta.url);
  const { renderTableSemantic } = await server.ssrLoadModule(fileURLToPath(entry));
  const { body, head } = renderTableSemantic();
  await page.goto('/select-components-hydration.html?semantic');
  await page.addScriptTag({ type: 'module', url: '/table-column-layout.client.ts' });
  const container = page.locator('#root');
  await expect(container).toHaveAttribute('data-hydration-ready', 'true');
  await container.evaluate((root, html) => {
    document.head.insertAdjacentHTML('beforeend', html.head);
    root.innerHTML = html.body;
  }, { body, head });
  const editor = container.getByRole('textbox', { name: 'Name 0', exact: true });
  const original = await editor.elementHandle();
  const cell = editor.locator('..');
  await expect(cell).toHaveClass(/observed-local-body-cell/);
  await editor.fill('Draft from SSR');
  await editor.evaluate((node: HTMLInputElement) => node.setSelectionRange(2, 7));

  await container.dispatchEvent('hydrate-table-column-layout');
  await expect(container).toHaveAttribute('data-hydrated', 'true');
  await container.getByRole('button', { name: 'Update semantics', exact: true })
    .dispatchEvent('click');

  await expect(cell).toHaveClass(/observed-updated-body-cell/);
  await expect(cell).toHaveClass(/observed-caller-cell/);
  await expect(cell).toHaveCSS('--observed-slot', 'updated-body-cell');
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue('Draft from SSR');
  expect(await editor.evaluate((node, before) => node === before, original)).toBe(true);
  expect(await editor.evaluate((node: HTMLInputElement) => [
    node.selectionStart, node.selectionEnd
  ])).toEqual([2, 7]);
});

test('Table hydrates both pagers around the same editor', async ({ page }) => {
  const entry = new URL('../fixtures/table-column-layout.server.ts', import.meta.url);
  const { renderTablePagination } = await server.ssrLoadModule(fileURLToPath(entry));
  const { body, head } = renderTablePagination();
  await page.goto('/select-components-hydration.html?pagination');
  await page.addScriptTag({ type: 'module', url: '/table-column-layout.client.ts' });
  const container = page.locator('#root');
  await expect(container).toHaveAttribute('data-hydration-ready', 'true');
  await container.evaluate((root, html) => {
    document.head.insertAdjacentHTML('beforeend', html.head);
    root.innerHTML = html.body;
  }, { body, head });
  const pagers = container.getByRole('navigation', { name: 'Table pages', exact: true });
  const editor = container.getByRole('textbox', { name: 'Editor 2', exact: true });
  const originalTop = await pagers.first().elementHandle();
  const originalEditor = await editor.elementHandle();
  await expect(pagers).toHaveCount(2);
  await editor.fill('Draft before pager hydration');
  await editor.evaluate((node: HTMLInputElement) => node.setSelectionRange(2, 7));

  await container.dispatchEvent('hydrate-table-column-layout');
  await expect(container).toHaveAttribute('data-hydrated', 'true');
  await container.getByRole('button', { name: 'Center top', exact: true }).dispatchEvent('click');

  await expect(pagers.first().locator('ul')).toHaveCSS('justify-content', 'center');
  expect(await pagers.first().evaluate((node, before) => node === before, originalTop)).toBe(true);
  expect(await editor.evaluate((node, before) => node === before, originalEditor)).toBe(true);
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue('Draft before pager hydration');
  expect(await editor.evaluate((node: HTMLInputElement) => [
    node.selectionStart, node.selectionEnd
  ])).toEqual([2, 7]);
  await expect(container.getByLabel('Pagination events')).toHaveText('[]');

  await pagers.last().getByRole('button', { name: /^next page$/i }).click();

  await expect(pagers.locator('[aria-current="page"]')).toHaveText(['3', '3']);
  await expect(container.getByRole('textbox', { name: 'Editor 4', exact: true })).toBeVisible();
});

test('Table hydrates the editor from locale.emptyText and keeps it through locale updates',
  async ({ page }) => {
    const entry = new URL('../fixtures/table-column-layout.server.ts', import.meta.url);
    const { renderTableLocale } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderTableLocale();
    await page.goto('/select-components-hydration.html?table-locale');
    await page.addScriptTag({ type: 'module', url: '/table-column-layout.client.ts' });
    const container = page.locator('#root');
    await expect(container).toHaveAttribute('data-hydration-ready', 'true');
    await container.evaluate((root, html) => {
      document.head.insertAdjacentHTML('beforeend', html.head);
      root.innerHTML = html.body;
    }, { body, head });
    const editor = container.getByRole('textbox', { name: 'Empty editor', exact: true });
    const original = await editor.elementHandle();
    await editor.fill('Empty draft before hydration');
    await editor.evaluate((input: HTMLInputElement) => input.setSelectionRange(2, 9));

    await container.dispatchEvent('hydrate-table-column-layout');
    await expect(container).toHaveAttribute('data-hydrated', 'true');
    await container.getByRole('button', { name: 'Change table locale', exact: true })
      .dispatchEvent('click');

    await expect(editor).toHaveValue('Empty draft before hydration');
    await expect(editor).toBeFocused();
    expect(await editor.evaluate((node, before) => node === before, original)).toBe(true);
    expect(await editor.evaluate((input: HTMLInputElement) => [
      input.selectionStart, input.selectionEnd
    ])).toEqual([2, 9]);
  }
);
