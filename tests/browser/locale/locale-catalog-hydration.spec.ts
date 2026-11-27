import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ElementHandle } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from '../test';

test('hydrates the imported German dictionary with the original focused field', async ({ page }) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-locale-hydration-'));
  let server: ViteDevServer | undefined;
  let original: ElementHandle | undefined;

  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom',
      cacheDir
    });
    const entry = fileURLToPath(new URL('../fixtures/locale-catalog.server.ts', import.meta.url));
    const { renderLocaleFixture } = await server.ssrLoadModule(entry);
    const { body, head } = renderLocaleFixture('de_DE');

    await page.clock.setFixedTime(new Date('2024-06-19T15:14:15Z'));
    await page.goto('/select-components-hydration.html?code=de_DE');
    await page.evaluate(({ body, head }) => {
      const root = document.getElementById('root');
      if (!root) {
        throw new Error('Missing server root');
      }
      document.head.insertAdjacentHTML('beforeend', head);
      root.innerHTML = body;
      root.dataset.ssr = 'true';
    }, { body, head });
    const editor = page.locator('#probe-date');
    original = await editor.elementHandle();
    await editor.focus();
    await editor.evaluate((input: HTMLInputElement) => input.setSelectionRange(3, 5));

    await page.addScriptTag({ type: 'module', url: '/locale-catalog.client.ts' });

    await expect(page.locator('#root')).toHaveAttribute('data-hydrated', 'true');
    await expect(editor).toHaveValue('19.06.2024');
    await expect(editor).toHaveAttribute('placeholder', 'Datum auswählen');
    await expect(editor).toBeFocused();
    expect(await editor.evaluate((node, initial) => node === initial, original)).toBe(true);
    expect(await editor.evaluate((input: HTMLInputElement) => [
      input.selectionStart, input.selectionEnd
    ])).toEqual([3, 5]);
  }
  finally {
    await original?.dispose();
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
