import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ElementHandle } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from '../test';

test('multiple hydrates existing form nodes and measures tags without rebuilding the picker', async ({
  page
}) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-date-picker-multiple-'));
  const handles: ElementHandle[] = [];
  let server: ViteDevServer | undefined;

  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom', cacheDir
    });
    const entry = new URL('../fixtures/date-picker-multiple-hydration.server.ts', import.meta.url);
    const { renderMultiplePickerFixture } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderMultiplePickerFixture();
    await page.goto('/select-components-hydration.html');
    await page.evaluate(({ head, body }) => {
      const root = document.getElementById('root');
      if (!root) {
        throw Error('Missing server picker root');
      }
      document.head.insertAdjacentHTML('beforeend', head);
      root.innerHTML = body;
    }, { body, head });

    const selector = page.locator('[data-date-owner] .ant-picker');
    const input = selector.locator('input');
    const tags = selector.locator('[data-picker-selection-tag]:not([inert])');
    handles.push(await selector.elementHandle(), await input.elementHandle());
    await expect(input).toHaveValue('2024-06-15,2024-06-13');
    await expect(tags).toHaveCount(0);

    await page.addScriptTag({ type: 'module', url: '/date-picker-multiple-hydration.client.ts' });
    await expect(page.locator('[data-date-owner]')).toHaveAttribute('data-ref', 'true');
    await page.locator('#owner-width').fill('400');
    await expect(tags).toHaveText(['2024-06-15', '2024-06-13']);
    expect(await selector.evaluate((node, original) => node === original, handles[0])).toBe(true);
    expect(await input.evaluate((node, original) => node === original, handles[1])).toBe(true);

    await input.press('Enter');
    await expect(page.locator('[data-picker-popup]:not([hidden])')).toHaveCount(1);
    await page.evaluate(() => Reflect.get(window, 'disposeMultiplePicker')());
    await expect(selector).toHaveCount(0);
    await expect(page.locator('[data-picker-popup]')).toHaveCount(0);
  }
  finally {
    for (const handle of handles) await handle.dispose();
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
