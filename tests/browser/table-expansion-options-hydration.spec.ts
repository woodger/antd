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
  cacheDir = await mkdtemp(join(tmpdir(), 'antd-table-expansion-options-'));
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

for (const profileId of ['forced', 'virtual-forced']) {
  test(`Table keeps ${profileId} detail nodes and the active trigger at hydration`, async ({
    page
  }) => {
    const entry = new URL('./fixtures/table-expansion-options.server.ts', import.meta.url);
    const { renderExpansionOptions } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderExpansionOptions(profileId);
    await page.goto(`/select-components-hydration.html?profile=${profileId}`);
    await page.addScriptTag({ type: 'module', url: '/table-expansion-options.client.ts' });
    const container = page.locator('#root');
    await expect(container).toHaveAttribute('data-hydration-ready', 'true');
    await container.evaluate((root, { body, head }) => {
      document.head.insertAdjacentHTML('beforeend', head);
      root.innerHTML = body;
    }, { body, head });
    const edited = container.locator('[data-detail-key="0"] input');
    const trigger = container.getByRole('button', { name: 'Toggle 0', exact: true });
    await expect(edited).toHaveCount(1);
    await expect(edited).toBeHidden();
    const initialEditor = await edited.elementHandle();
    const initialTrigger = await trigger.elementHandle();
    await trigger.focus();

    await container.dispatchEvent('hydrate-table-expansion-options');

    await expect(container).toHaveAttribute('data-hydrated', 'true');
    await expect(trigger).toBeFocused();
    expect(await trigger.evaluate((node, before) => node === before, initialTrigger)).toBe(true);
    await expect(container.locator('#table-expansion-options-events')).toHaveText('[]');

    await trigger.press('Space');

    await expect(edited).toBeVisible();
    expect(await edited.evaluate((node, before) => node === before, initialEditor)).toBe(true);
    await expect(trigger).toBeFocused();
    await expect(container.locator('#table-expansion-options-events')).toHaveText(
      '[["expand",true,0],["keys",[0]]]'
    );
  });
}
