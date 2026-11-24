import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import source from './fixtures/ant-design-table-sorter-reference.json' with { type: 'json' };
import { expect, test } from './test';

let cacheDir: string;
let server: ViteDevServer;

test.beforeAll(async () => {
  cacheDir = await mkdtemp(join(tmpdir(), 'antd-table-sorter-'));
  server = await createServer({
    configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
    appType: 'custom', cacheDir
  });
});

test.afterAll(async () => {
  await server?.close();
  if (cacheDir) {
    await rm(cacheDir, { recursive: true, force: true });
  }
});

test('Table hydrates the focused sort button and sends one controlled keyboard request',
  async ({ page }) => {
    const expected = source.cases.find(entry => entry.profile.id === 'controlled');
    if (!expected) {
      throw new Error('Missing controlled profile');
    }
    const entry = new URL('./fixtures/table-sorter.server.ts', import.meta.url);
    const { renderTableSorter } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderTableSorter();
    await page.goto('/select-components-hydration.html');
    await page.addScriptTag({ type: 'module', url: '/table-sorter.client.ts' });
    const root = page.locator('#root');
    await expect(root).toHaveAttribute('data-hydration-ready', 'true');
    await root.evaluate((node, html) => {
      document.head.insertAdjacentHTML('beforeend', html.head);
      node.innerHTML = html.body;
    }, { body, head });
    const button = root.getByRole('button', { name: 'Score', exact: true });
    const original = await button.elementHandle();
    const heading = root.locator('th.fixture-col-score');
    await button.focus();

    await root.dispatchEvent('hydrate-table-sorter');

    await expect(root).toHaveAttribute('data-hydrated', 'true');
    await expect(button).toBeFocused();
    expect(await button.evaluate((node, before) => node === before, original)).toBe(true);
    await expect(root.locator('[data-sort-events]')).toHaveText('[]');

    await button.press('Space');

    await expect(heading).toHaveAttribute('aria-sort', 'ascending');
    await expect(button).toBeFocused();
    await expect(root.locator('[data-sort-events]')).toHaveText(
      JSON.stringify(expected.states[1].state.events)
    );

    await root.getByRole('button', { name: 'Update', exact: true }).dispatchEvent('click');

    await expect(heading).toHaveAttribute('aria-sort', 'descending');
    await expect(button).toBeFocused();
    expect(await button.evaluate((node, before) => node === before, original)).toBe(true);
  });

test('Table hydrates the controlled sorter tooltip without moving button focus', async ({ page }) => {
  const entry = new URL('./fixtures/table-sorter.server.ts', import.meta.url);
  const { renderTableSorterTooltip } = await server.ssrLoadModule(fileURLToPath(entry));
  const { body, head } = renderTableSorterTooltip();
  await page.goto('/select-components-hydration.html?sorter-tooltip');
  await page.addScriptTag({ type: 'module', url: '/table-sorter.client.ts' });
  const root = page.locator('#root');
  await expect(root).toHaveAttribute('data-hydration-ready', 'true');
  await root.evaluate((node, html) => {
    document.head.insertAdjacentHTML('beforeend', html.head);
    node.innerHTML = html.body;
  }, { body, head });
  const button = root.getByRole('button', { name: 'Score', exact: true });
  const original = await button.elementHandle();
  await button.focus();
  await expect(root.locator('[role="tooltip"]')).toBeHidden();

  await root.dispatchEvent('hydrate-table-sorter');

  await expect(root).toHaveAttribute('data-hydrated', 'true');
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toHaveText('Ascending');
  await expect(button).toBeFocused();
  expect(await button.evaluate((node, before) => node === before, original)).toBe(true);

  await button.press('Enter');

  await expect(tooltip).toHaveText('Descending');
  await expect(button).toBeFocused();
  await expect(root.locator('th')).toHaveAttribute('aria-sort', 'ascending');
});
