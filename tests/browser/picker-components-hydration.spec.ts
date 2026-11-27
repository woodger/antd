import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ElementHandle, Page } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from './test';

/** Verifies the preservation of SSR elements and the keyboard transition between the boundaries of the range. */
async function verifyEditorHydration(page: Page, nativeSlot: boolean) {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-picker-editors-'));
  const originals: ElementHandle[] = [];
  let server: ViteDevServer | undefined;

  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom', cacheDir
    });
    const entry = fileURLToPath(new URL('./fixtures/picker-components-hydration.server.ts', import.meta.url));
    const { renderEditorFixture } = await server.ssrLoadModule(entry);
    const { body, head } = renderEditorFixture(nativeSlot);
    await page.clock.setFixedTime(new Date('2024-06-19T16:00:00Z'));
    const route = '/select-components-hydration.html';
    await page.goto(nativeSlot ? `${route}?native-slot` : route);
    await page.evaluate(({ body, head }) => {
      const root = document.getElementById('root');
      if (!root) {
        throw Error('Missing server root');
      }
      document.head.insertAdjacentHTML('beforeend', head);
      root.innerHTML = body;
    }, { body, head });

    const start = page.locator('textarea#start');
    const end = page.locator('textarea#end');
    const popup = page.locator('[data-picker-popup]');
    await expect(start).toHaveCount(1);
    await expect(end).toHaveCount(1);
    originals.push(await start.elementHandle(), await end.elementHandle());
    await start.focus();
    await start.evaluate((field: HTMLTextAreaElement) => field.setSelectionRange(8, 10));
    await expect(start).toHaveValue('2024-06-15');
    await expect(end).toHaveValue('2024-06-23');

    await page.addScriptTag({ type: 'module', url: '/picker-components-hydration.client.ts' });
    await expect(page.locator('#root')).toHaveAttribute('data-hydrated', 'true');
    await expect(start).toBeFocused();
    if (nativeSlot) {
      await expect(start).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    }
    expect(await start.evaluate((input: HTMLTextAreaElement) => [
      input.selectionStart, input.selectionEnd
    ])).toEqual([8, 10]);
    await start.click();
    await expect(popup).toBeVisible();
    await start.press('ArrowLeft');
    await start.press('ArrowLeft');
    await start.press('ArrowRight');
    await start.press('ArrowRight');
    await expect.poll(() => start.evaluate((input: HTMLTextAreaElement) => [
      input.selectionStart, input.selectionEnd
    ])).toEqual([8, 10]);
    await start.press('ArrowUp');
    await expect(start).toHaveValue('2024-06-16');
    await start.press('Enter');
    await expect(end).toBeFocused();
    await expect(end).toHaveValue('2024-06-23');
    const values = await page.getByRole('form', { name: 'Picker form' })
      .evaluate((form: HTMLFormElement) => new FormData(form).getAll('chosen'));
    expect(values).toEqual(['2024-06-16', '2024-06-23']);
    expect(await start.evaluate((current, initial) => current === initial, originals[0])).toBe(true);
    expect(await end.evaluate((current, initial) => current === initial, originals[1])).toBe(true);

    await expect(popup).toBeVisible();
    await page.evaluate(() => Reflect.get(window, 'disposeEditorFixture')());
    await expect(start).toHaveCount(0);
    await expect(end).toHaveCount(0);
    await expect(popup).toHaveCount(0);
  }
  finally {
    for (const original of originals) await original.dispose();
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
}

test('hydrates masked textareas without replacing them and moves focus to the end', ({ page }) =>
  verifyEditorHydration(page, false));

test('hydrates styled built-in textareas and keeps masked range navigation', ({ page }) =>
  verifyEditorHydration(page, true));
