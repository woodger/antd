import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ElementHandle } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from '../test';

test('RangePicker mode hydrates both editors and preserves an active draft', async ({ page }) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-date-picker-panel-mode-'));
  const originals: ElementHandle[] = [];
  let server: ViteDevServer | undefined;

  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom', cacheDir
    });
    const entry = new URL('../fixtures/date-picker-panel-mode-hydration.server.ts', import.meta.url);
    const { renderPanelModeFixture } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderPanelModeFixture();
    const fixedTime = new Date('2024-06-19T16:00:00Z');
    await page.clock.setFixedTime(fixedTime);
    await page.goto('/select-components-hydration.html');
    await page.evaluate(({ body, head }) => {
      const root = document.getElementById('root');
      if (!root) {
        throw Error('Missing server root');
      }
      document.head.insertAdjacentHTML('beforeend', head);
      root.innerHTML = body;
    }, { body, head });

    const owner = page.locator('[data-mode-owner] > .ant-picker');
    const start = page.getByRole('combobox', { name: 'Start date' });
    const end = page.getByRole('combobox', { name: 'End date' });
    const popup = page.locator('[data-picker-popup]');
    originals.push(await owner.elementHandle(), await start.elementHandle(), await end.elementHandle());
    await start.focus();
    await expect(start).toHaveValue('2024-06-15');
    await expect(end).toHaveValue('2024-06-23');

    await page.addScriptTag({ type: 'module', url: '/date-picker-panel-mode-hydration.client.ts' });
    await expect(page.locator('#root')).toHaveAttribute('data-hydrated', 'true');
    await expect(start).toBeFocused();
    await start.click();
    await expect(popup.locator('.ant-picker-year-panel')).toBeVisible();
    await start.fill('2024-06-16');
    await start.evaluate((input: HTMLInputElement) => input.setSelectionRange(2, 7));
    await page.locator('#owner-mode').evaluate((control: HTMLInputElement) => {
      control.value = JSON.stringify(['month', 'quarter']);
      control.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(popup.locator('.ant-picker-month-panel')).toBeVisible();
    await expect(start).toBeFocused();
    await expect(start).toHaveValue('2024-06-16');
    expect(await start.evaluate((input: HTMLInputElement) => [
      input.selectionStart, input.selectionEnd
    ])).toEqual([2, 7]);
    await expect(end).toHaveValue('2024-06-23');
    const values = await page.getByRole('form', { name: 'Calendar form' })
      .evaluate((form: HTMLFormElement) => new FormData(form).getAll('mode-dates'));
    expect(values).toEqual(['2024-06-16', '2024-06-23']);
    expect(await owner.evaluate((current, initial) => current === initial, originals[0])).toBe(true);
    expect(await start.evaluate((current, initial) => current === initial, originals[1])).toBe(true);
    expect(await end.evaluate((current, initial) => current === initial, originals[2])).toBe(true);

    await end.click();
    await expect(popup.locator('.ant-picker-quarter-panel')).toBeVisible();
    await page.evaluate(() => Reflect.get(window, 'disposePanelModeFixture')());
    await expect(owner).toHaveCount(0);
    await expect(popup).toHaveCount(0);
  }
  finally {
    for (const original of originals) await original.dispose();
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
