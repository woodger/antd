import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from '../test';
import source from '../fixtures/ant-design-table-summary-reference.json' with { type: 'json' };

test.use({ viewport: source.reference.viewport });

let cacheDir: string;
let server: ViteDevServer;

test.beforeAll(async () => {
  cacheDir = await mkdtemp(join(tmpdir(), 'antd-table-summary-'));
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

for (const profile of ['fixed-top', 'virtual-fixed-bottom']) {
  test(`Table hydrates the ${profile} summary editor and preserves its focus`, async ({ page }) => {
    const entry = new URL('../fixtures/table-summary.server.ts', import.meta.url);
    const { renderTableSummaryFixture } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderTableSummaryFixture(profile);
    await page.goto(`/select-components-hydration.html?profile=${profile}&hydrate`);
    await page.addScriptTag({ type: 'module', url: '/table-summary.client.ts' });
    const target = page.locator('#root');
    await expect(target).toHaveAttribute('data-hydration-ready', 'true');
    await target.evaluate((root, { body, head }) => {
      document.head.insertAdjacentHTML('beforeend', head);
      root.innerHTML = body;
    }, { body, head });
    const editor = target.getByRole('textbox', { name: 'Summary draft' });
    const original = await editor.elementHandle();
    await editor.fill('Written before hydration');
    await editor.evaluate((input: HTMLInputElement) => input.setSelectionRange(2, 10));
    await expect(editor).toBeFocused();

    await target.dispatchEvent('hydrate-table-summary');

    await expect(target).toHaveAttribute('data-hydrated', 'true');
    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue('Written before hydration');
    expect(await editor.evaluate((input, before) => input === before, original)).toBe(true);
    expect(await editor.evaluate((input: HTMLInputElement) => [
      input.selectionStart, input.selectionEnd
    ])).toEqual([2, 10]);

    const viewport = target.locator('[data-ant-table-part="content"]');
    await viewport.evaluate(node => { node.scrollTop = 500; });

    await expect(editor).toBeInViewport({ ratio: 1 });
    await expect.poll(() => editor.evaluate(input => {
      const rect = input.getBoundingClientRect();
      return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) === input;
    })).toBe(true);
    await expect(editor).toBeFocused();
    expect(await editor.evaluate((input, before) => input === before, original)).toBe(true);
    if (profile === 'virtual-fixed-bottom') {
      await expect(viewport.locator('[data-ant-table-part="row"][data-row-key="0"]')).toHaveCount(0);
    }
  });
}
