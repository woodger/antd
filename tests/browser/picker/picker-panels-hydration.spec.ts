import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ElementHandle } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from '../test';

test('hydrates both custom panels and retains the editors through a mode change', async ({ page }) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-picker-panels-'));
  const originals: ElementHandle[] = [];
  let server: ViteDevServer | undefined;

  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom', cacheDir
    });
    const entry = fileURLToPath(new URL('../fixtures/picker-panels-hydration.server.ts', import.meta.url));
    const { renderPanelFixture } = await server.ssrLoadModule(entry);
    const { body, head } = renderPanelFixture();
    await page.goto('/select-components-hydration.html');
    await page.evaluate(({ body, head }) => {
      const root = document.getElementById('root');
      if (!root) {
        throw Error('Missing server root');
      }
      document.head.insertAdjacentHTML('beforeend', head);
      root.innerHTML = body;
    }, { body, head });

    const start = page.getByRole('combobox', { name: 'Start' });
    const end = page.getByRole('combobox', { name: 'End' });
    const popup = page.locator('[data-picker-popup]');
    const panels = popup.locator('[data-custom-panel]');
    originals.push(await start.elementHandle(), await end.elementHandle());
    originals.push(await panels.nth(0).elementHandle(), await panels.nth(1).elementHandle());
    await start.focus();
    await start.evaluate((field: HTMLInputElement) => field.setSelectionRange(5, 7));

    await page.addScriptTag({ type: 'module', url: '/picker-panels-hydration.client.ts' });
    await expect(page.locator('#root')).toHaveAttribute('data-hydrated', 'true');
    await expect(popup).toBeVisible();
    await expect(start).toBeFocused();
    expect(await start.evaluate((field: HTMLInputElement) => [field.selectionStart, field.selectionEnd]))
      .toEqual([5, 7]);
    expect(await panels.nth(0).evaluate((node, original) => node === original, originals[2]))
      .toBe(true);
    expect(await panels.nth(1).evaluate((node, original) => node === original, originals[3]))
      .toBe(true);

    await panels.nth(1).getByRole('button', { name: 'Navigate' }).click();
    await expect(panels.nth(1)).toHaveAttribute('data-panel-state', /2024-08-19T/);
    await panels.nth(0).getByRole('button', { name: 'Year' }).click();
    await expect(panels).toHaveCount(1);
    await expect(panels).toHaveAttribute('data-custom-panel', 'year');
    expect(await start.evaluate((node, original) => node === original, originals[0])).toBe(true);
    expect(await end.evaluate((node, original) => node === original, originals[1])).toBe(true);
    const values = await page.getByRole('form', { name: 'Panel form' })
      .evaluate((form: HTMLFormElement) => new FormData(form).getAll('chosen'));
    expect(values).toEqual(['2024-06-15', '2024-06-23']);

    await page.evaluate(() => Reflect.get(window, 'disposePanelFixture')());
    await expect(start).toHaveCount(0);
    await expect(end).toHaveCount(0);
    await expect(popup).toHaveCount(0);
  }
  finally {
    for (const original of originals) await original.dispose();
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
