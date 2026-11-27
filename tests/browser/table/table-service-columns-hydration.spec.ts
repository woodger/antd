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
  cacheDir = await mkdtemp(join(tmpdir(), 'antd-table-service-columns-'));
  server = await createServer({
    configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
    appType: 'custom',
    cacheDir
  });
});

test.afterAll(async () => {
  await server?.close();
  if (cacheDir) await rm(cacheDir, { recursive: true, force: true });
});

for (const profileId of ['placed', 'virtual-span']) {
  test(`Table preserves the focused ${profileId} selection control at hydration`, async ({
    page
  }) => {
    const entry = new URL('../fixtures/table-service-columns.server.ts', import.meta.url);
    const { renderServiceColumns } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderServiceColumns(profileId);
    await page.goto(`/select-components-hydration.html?profile=${profileId}`);
    await page.addScriptTag({ type: 'module', url: '/table-service-columns.client.ts' });
    const container = page.locator('#root');
    await expect(container).toHaveAttribute('data-hydration-ready', 'true');
    await container.evaluate((root, markup) => {
      document.head.insertAdjacentHTML('beforeend', markup.head);
      root.innerHTML = markup.body;
    }, { body, head });
    const control = container.getByRole('checkbox', { name: 'Choose 0', exact: true });
    const original = await control.elementHandle();
    await control.focus();

    await container.dispatchEvent('hydrate-table-service-columns');

    await expect(container).toHaveAttribute('data-hydrated', 'true');
    await expect(control).toBeFocused();
    expect(await control.evaluate((node, before) => node === before, original)).toBe(true);
    await expect(container.locator('#table-service-column-events')).toHaveText('[]');

    await control.press('Space');

    await expect(control).toBeChecked();
    await expect(container.locator('[data-choice="0:0"] [data-render]'))
      .toHaveAttribute('data-render', '0:0:1');
    await expect(container.locator('#table-service-column-events')).toHaveText(
      '[["select",0,true],["change","single",[0],[0]]]'
    );
  });
}
