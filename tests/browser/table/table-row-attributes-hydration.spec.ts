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
  cacheDir = await mkdtemp(join(tmpdir(), 'antd-table-row-attributes-'));
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

for (const profileId of ['grouped', 'virtual-spans']) {
  test(`Table hydrates the ${profileId} row attributes and focused editor`, async ({ page }) => {
    const entry = new URL('../fixtures/table-row-attributes.server.ts', import.meta.url);
    const { renderRowAttributes } = await server.ssrLoadModule(fileURLToPath(entry));
    const { head, body } = renderRowAttributes(profileId);
    await page.goto(`/select-components-hydration.html?profile=${profileId}`);
    await page.addScriptTag({ type: 'module', url: '/table-row-attributes.client.ts' });
    const container = page.locator('#root');
    await expect(container).toHaveAttribute('data-hydration-ready', 'true');
    await container.evaluate((root, { head, body }) => {
      document.head.insertAdjacentHTML('beforeend', head);
      root.innerHTML = body;
    }, { head, body });
    const editor = container.getByRole('textbox', { name: 'Row editor' });
    const original = await editor.elementHandle();
    await editor.fill('Typed before hydration');
    await editor.evaluate((node: HTMLInputElement) => node.setSelectionRange(2, 8));

    await container.dispatchEvent('hydrate-table-row-attributes');

    await expect(container).toHaveAttribute('data-hydrated', 'true');
    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue('Typed before hydration');
    expect(await editor.evaluate((node, before) => node === before, original)).toBe(true);
    expect(await editor.evaluate((node: HTMLInputElement) => [
      node.selectionStart, node.selectionEnd
    ])).toEqual([2, 8]);
    await expect(container.locator('#body-0')).toHaveAttribute('data-row-attrs', '0:0');

    await container.locator('thead #head-0').press('F2');

    const signature = profileId === 'grouped'
      ? '$expand|person(name,rank)|$select|tail' : 'name|rank';
    await expect(container.locator('#table-row-attributes-events'))
      .toHaveText(JSON.stringify([['F2', 0, 0, signature, 'head-0']]));
  });
}
