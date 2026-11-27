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
  cacheDir = await mkdtemp(join(tmpdir(), 'antd-table-spans-'));
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

for (const profileId of ['normal', 'virtual']) {
  test(`Table hydrates its ${profileId} merged editor without losing focus`, async ({ page }) => {
    const entry = new URL('../fixtures/table-spans-hydration.server.ts', import.meta.url);
    const { renderTableSpansFixture } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderTableSpansFixture(profileId);
    await page.goto(`/select-components-hydration.html?profile=${profileId}`);
    await page.addScriptTag({ type: 'module', url: '/table-spans-hydration.client.ts' });
    const container = page.locator('#root');
    await expect(container).toHaveAttribute('data-hydration-ready', 'true');
    await page.evaluate(({ body, head }) => {
      const root = document.getElementById('root');
      if (!root) {
        throw new Error('Missing Table spans container');
      }
      document.head.insertAdjacentHTML('beforeend', head);
      root.innerHTML = body;
    }, { body, head });
    const editor = container.getByRole('textbox', { name: 'Merged draft' });
    const original = await editor.elementHandle();
    await editor.fill('Written before hydration');
    await editor.evaluate((input: HTMLInputElement) => input.setSelectionRange(2, 10));
    await expect(editor).toBeFocused();

    await container.dispatchEvent('hydrate-table-spans');

    await expect(container).toHaveAttribute('data-hydrated', 'true');
    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue('Written before hydration');
    expect(await editor.evaluate((input, before) => input === before, original)).toBe(true);
    expect(await editor.evaluate((input: HTMLInputElement) => [
      input.selectionStart, input.selectionEnd
    ])).toEqual([2, 10]);

    if (profileId === 'virtual') {
      const viewport = container.locator('[data-ant-table-virtual]');
      await viewport.evaluate(node => { node.scrollTop = 100; });

      await expect(viewport.locator('tr[data-ant-table-part="row"][data-row-key="0"]')).toHaveCount(0);
      await expect(editor).toBeFocused();
      await expect(editor).toHaveValue('Written before hydration');
      expect(await editor.evaluate((input, before) => input === before, original)).toBe(true);
    }
  });
}
