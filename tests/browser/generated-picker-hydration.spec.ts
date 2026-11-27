import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ElementHandle, Page } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import type { GeneratedPickerHydrationProfile } from './fixtures/GeneratedPickerFixtures.svelte';
import { expect, test } from './test';

/** Verifies that open panel hydration preserves SSR nodes and editor status. */
async function verifyGeneratedPickerHydration(page: Page, profile: GeneratedPickerHydrationProfile) {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-generated-picker-'));
  const originals: ElementHandle[] = [];
  const clock = profile !== 'open-range';
  const multiple = profile === 'open-time-selection';
  let server: ViteDevServer | undefined;

  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom', cacheDir
    });
    const entry = fileURLToPath(new URL(
      './fixtures/generated-picker-hydration.server.ts', import.meta.url
    ));
    const { renderGeneratedPickerFixture } = await server.ssrLoadModule(entry);
    const { body, head } = renderGeneratedPickerFixture(profile);
    const route = '/select-components-hydration.html';
    await page.goto(multiple ? `${route}?time-selection` : clock ? `${route}?clock` : route);
    await page.evaluate(({ body, head }) => {
      const root = document.getElementById('root');
      if (!root) {
        throw Error('Missing generated picker server root');
      }

      document.head.insertAdjacentHTML('beforeend', head);
      root.innerHTML = body;
    }, { body, head });

    const start = page.locator('#start');
    const end = page.locator('#end');
    const popup = page.locator('[data-picker-popup]');
    const firstPanel = popup.locator('[data-opaque-panel]').first();
    const hours = popup.locator('.ant-picker-time-panel-column').first();
    const targets = clock ? [start, hours] : [start, end, firstPanel];
    if (multiple) {
      const tags = page.locator('[data-picker-selection-tag]');
      await expect(tags).toHaveCount(2);
      targets.push(tags.first(), tags.last());
    }
    for (const target of targets) {
      await expect(target).toHaveCount(1);
      originals.push(await target.elementHandle());
    }
    await start.focus();
    await start.evaluate((field: HTMLInputElement) => field.setSelectionRange(5, 7));

    await page.addScriptTag({ type: 'module', url: '/generated-picker-hydration.client.ts' });

    await expect(page.locator('#root')).toHaveAttribute('data-hydrated', 'true');
    await expect(popup).toBeVisible();
    await expect(start).toBeFocused();
    await expect(page.locator('#generated-refs'))
      .toHaveText(clock ? '["DIV",null,null]' : '["DIV","start","end"]');
    expect(await start.evaluate((field: HTMLInputElement) => [field.selectionStart, field.selectionEnd]))
      .toEqual([5, 7]);
    for (const [index, target] of targets.entries()) {
      const sameNode = await target.evaluate((node, original) => node === original, originals[index]);
      expect(sameNode, `${profile} hydrated node ${index}`)
        .toBe(true);
    }

    if (multiple) {
      await start.press('ArrowDown');
      await expect(hours.getByRole('button', { name: 'hour 13', exact: true })).toBeFocused();
      await hours.getByText('16', { exact: true }).click();
      await popup.locator('.ant-picker-ok button').click();

      const expected = ['13:10:18', '16:10:18', '14:26:40'];
      await expect(start).toHaveValue(expected.join(','));
      await expect(popup).toHaveCount(0);
      const log = JSON.parse(await page.locator('#generated-events').innerText()) as unknown[][];
      expect(log.find(event => event[0] === 'change')).toEqual([
        'change', [
          { iso: '2024-06-15T13:10:18.000Z', original: 0, selected: false, frozen: true, ownKeys: ['stamp'] },
          { iso: '2024-06-15T16:10:18.000Z', original: -1, selected: false, frozen: true, ownKeys: ['stamp'] },
          { iso: '2024-06-23T14:26:40.000Z', original: 1, selected: false, frozen: true, ownKeys: ['stamp'] }
        ], expected
      ]);
    }
    else if (clock) {
      await hours.getByText('16', { exact: true }).click();
      await popup.locator('.ant-picker-ok button').click();
      await expect(start).toHaveValue('16:10:18');
      await expect(popup).toHaveCount(0);
      const log = JSON.parse(await page.locator('#generated-events').innerText()) as unknown[][];
      expect(log.find(event => event[0] === 'change')).toEqual([
        'change', {
          iso: '2024-06-15T16:10:18.000Z', original: -1, selected: false, frozen: true, ownKeys: ['stamp']
        }, '16:10:18'
      ]);
    }
    else {
      await firstPanel.getByRole('button', { name: 'Pick opaque value' }).click();
      await expect(start).toHaveValue('2024-06-21');
      const log = JSON.parse(await page.locator('#generated-events').innerText()) as unknown[][];
      expect(log.find(event => event[0] === 'calendar')).toEqual([
        'calendar', [
          { iso: '2024-06-21T00:00:00.000Z', original: -1, selected: true, frozen: true, ownKeys: ['stamp'] },
          { iso: '2024-06-23T14:26:40.000Z', original: 1, selected: false, frozen: true, ownKeys: ['stamp'] }
        ],
        ['2024-06-21', '2024-06-23'], { range: 'start' }
      ]);
    }

    await page.locator('#remove-picker').click();
    await expect(start).toHaveCount(0);
    await expect(end).toHaveCount(0);
    await expect(popup).toHaveCount(0);
    await expect(page.locator('#generated-refs')).toHaveText('[null,null,null]');
  }
  finally {
    for (const original of originals) await original.dispose();
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
}

test('hydrates opaque range values, binds the original fields and tears down the custom panel',
  ({ page }) => verifyGeneratedPickerHydration(page, 'open-range'));

test('hydrates an opaque DatePicker clock and confirms with the original editor and panel',
  ({ page }) => verifyGeneratedPickerHydration(page, 'open-clock'));

test('hydrates a generated time selection and keeps the editor, panel and original tags',
  ({ page }) => verifyGeneratedPickerHydration(page, 'open-time-selection'));
