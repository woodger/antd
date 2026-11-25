import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from './test';

let cacheDir: string;
let server: ViteDevServer;

test.beforeAll(async () => {
  cacheDir = await mkdtemp(join(tmpdir(), 'antd-table-filter-state-'));
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

test('Table hydrates the focused filter trigger and keeps the owner in control', async ({ page }) => {
  const entry = new URL('./fixtures/table-filter-state.server.ts', import.meta.url);
  const { renderTableFilterState } = await server.ssrLoadModule(fileURLToPath(entry));
  const { body, head } = renderTableFilterState();
  await page.goto('/select-components-hydration.html');
  await page.addScriptTag({ type: 'module', url: '/table-filter-state.client.ts' });
  const root = page.locator('#root');
  await expect(root).toHaveAttribute('data-hydration-ready', 'true');
  await root.evaluate((target, html) => {
    document.head.insertAdjacentHTML('beforeend', html.head);
    target.innerHTML = html.body;
  }, { body, head });
  const trigger = root.getByRole('button', { name: 'Filter: Score', exact: true });
  const menu = root.getByRole('dialog', { name: 'Filter: Score', exact: true });
  const rows = root.locator('tbody tr[data-row-key] > td:last-child');
  const original = await trigger.elementHandle();
  const changes = root.locator('[data-filter-state-changes]');
  await trigger.focus();

  await root.dispatchEvent('hydrate-table-filter-state');

  await expect(root).toHaveAttribute('data-hydrated', 'true');
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveClass(/active/);
  await expect(rows).toHaveText(['Alpha', 'Gamma']);
  await expect(changes).toHaveText('[]');

  await trigger.press('Space');
  const even = menu.getByRole('radio', { name: 'Even', exact: true });
  const odd = menu.getByRole('radio', { name: 'Odd', exact: true });
  await expect(even).toBeFocused();
  await expect(even).toBeChecked();
  await even.press('ArrowDown');
  await expect(odd).toBeChecked();
  await odd.press('Enter');

  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(rows).toHaveText(['Alpha', 'Gamma']);
  await expect(changes).toHaveText('[{"action":"filter","filters":{"score":["odd"]},"rows":[1]}]');

  await trigger.press('Space');
  await expect(even).toBeChecked();
  await root.getByRole('button', { name: 'Update', exact: true }).dispatchEvent('click');

  await expect(menu).toBeHidden();
  await expect(rows).toHaveText(['Beta']);
  await expect(changes).toHaveText('[{"action":"filter","filters":{"score":["odd"]},"rows":[1]}]');
  expect(await trigger.evaluate((node, before) => node === before, original)).toBe(true);
});

test('Table hydrates its filter trigger and checks a branch by keyboard', async ({ page }) => {
  const entry = new URL('./fixtures/table-filter-state.server.ts', import.meta.url);
  const { renderTableFilterOptions } = await server.ssrLoadModule(fileURLToPath(entry));
  const { body, head } = renderTableFilterOptions();
  await page.goto('/select-components-hydration.html?filter-options');
  await page.addScriptTag({ type: 'module', url: '/table-filter-state.client.ts' });
  const root = page.locator('#root');
  await expect(root).toHaveAttribute('data-hydration-ready', 'true');
  await root.evaluate((target, html) => {
    document.head.insertAdjacentHTML('beforeend', html.head);
    target.innerHTML = html.body;
  }, { body, head });
  const trigger = root.getByRole('button', { name: 'Filter: Category', exact: true });
  const rows = root.locator('tbody tr[data-row-key] > td:last-child');
  const original = await trigger.elementHandle();
  await trigger.focus();

  await root.dispatchEvent('hydrate-table-filter-state');
  await expect(root).toHaveAttribute('data-hydrated', 'true');

  await expect(trigger).toBeFocused();
  await expect(rows).toHaveText(['Alpha']);
  await trigger.press('Enter');
  const tree = root.getByRole('tree', { name: 'Filter: Category' });
  await expect(tree).toBeFocused();

  await tree.press('Home');
  await tree.press('Space');
  await expect(tree.getByRole('checkbox', { name: 'Banana', exact: true })).toBeChecked();
  await expect(rows).toHaveText(['Alpha']);
  await root.getByRole('button', { name: 'Apply', exact: true }).press('Enter');

  await expect(trigger).toBeFocused();
  expect(await trigger.evaluate((node, before) => node === before, original)).toBe(true);
  await expect(rows).toHaveText(['Alpha', 'Beta', 'Gamma']);
  const changes = root.locator('[data-filter-options-changes]');
  await expect(changes).toHaveText('[{"filters":{"category":["produce","apple","banana"]},"rows":[0,1,2]}]');
});

test('Table hydrates its custom filter trigger and confirms with the keyboard', async ({ page }) => {
  const entry = new URL('./fixtures/table-filter-state.server.ts', import.meta.url);
  const { renderTableFilterDropdown } = await server.ssrLoadModule(fileURLToPath(entry));
  const { body, head } = renderTableFilterDropdown();
  await page.goto('/select-components-hydration.html?filter-dropdown');
  await page.addScriptTag({ type: 'module', url: '/table-filter-state.client.ts' });
  const root = page.locator('#root');
  await expect(root).toHaveAttribute('data-hydration-ready', 'true');
  await root.evaluate((target, html) => {
    document.head.insertAdjacentHTML('beforeend', html.head);
    target.innerHTML = html.body;
  }, { body, head });
  const trigger = root.getByRole('button', { name: 'Filter: Score', exact: true });
  const original = await trigger.elementHandle();
  await trigger.focus();

  await root.dispatchEvent('hydrate-table-filter-state');
  await expect(root).toHaveAttribute('data-hydrated', 'true');

  await expect(trigger).toBeFocused();
  await trigger.press('Enter');
  const popup = page.getByRole('dialog', { name: 'Filter: Score', exact: true });
  const even = popup.getByRole('button', { name: 'Even score', exact: true });
  await expect(even).toBeFocused();
  await page.keyboard.press('Tab');
  const odd = popup.getByRole('button', { name: 'Odd score', exact: true });
  await expect(odd).toBeFocused();
  await page.keyboard.press('Space');
  await page.keyboard.press('Tab');
  await expect(popup.getByRole('button', { name: 'Apply custom', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(popup).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger.locator('[data-filter-icon]')).toHaveAttribute('data-filter-icon', 'active');
  const changes = root.locator('[data-filter-dropdown-changes]');
  await expect(changes).toHaveText('[{"open":true},{"open":false},{"filters":{"score":["odd"]},"rows":[1]}]');
  expect(await trigger.evaluate((node, before) => node === before, original)).toBe(true);
});
