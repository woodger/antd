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
  cacheDir = await mkdtemp(join(tmpdir(), 'antd-table-selection-'));
  server = await createServer({
    configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
    appType: 'custom', cacheDir
  });
});

test.afterAll(async () => {
  await server?.close();
  if (cacheDir) await rm(cacheDir, { recursive: true, force: true });
});

for (const profile of ['controlled', 'controlled-radio']) {
  test(`Table hydrates the ${profile} input and respects the owner's decision`, async ({ page }) => {
    const entry = new URL('./fixtures/table-selection-hydration.server.ts', import.meta.url);
    const { renderTableSelectionFixture } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderTableSelectionFixture(profile);
    await page.goto(`/select-components-hydration.html?profile=${profile}`);
    await page.addScriptTag({ type: 'module', url: '/table-selection-hydration.client.ts' });
    const target = page.locator('#root');
    await expect(target).toHaveAttribute('data-hydration-ready', 'true');
    await target.evaluate((root, { body, head }) => {
      document.head.insertAdjacentHTML('beforeend', head);
      root.innerHTML = body;
    }, { body, head });
    const input = target.getByLabel('Choose 0', { exact: true });
    const other = target.getByLabel('Choose 1', { exact: true });
    const before = await input.elementHandle();
    await input.focus();
    await expect(input).not.toBeChecked();
    await expect(other).toBeChecked();

    await target.dispatchEvent('hydrate-table-selection');

    await expect(target).toHaveAttribute('data-hydrated', 'true');
    await expect(input).toBeFocused();
    await expect(target.locator('#table-selection-events')).toHaveText('[]');
    expect(await input.evaluate((node, original) => node === original, before)).toBe(true);

    await page.keyboard.press('Space');
    await expect(input).toBeFocused();
    await expect(input).not.toBeChecked();
    await expect(other).toBeChecked();
    await expect(target.locator('#table-selection-events')).toContainText('["change","single",');

    await target.getByTestId('selection-accept').click();
    await input.press('Space');

    await expect(input).toBeChecked();
    await expect(input).toBeFocused();
    if (profile === 'controlled-radio') await expect(other).not.toBeChecked();
    else await expect(other).toBeChecked();
    expect(await input.evaluate((node, original) => node === original, before)).toBe(true);
  });
}
