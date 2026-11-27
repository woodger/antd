import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from '../test';
import source from '../fixtures/ant-design-input-z-index-context-reference.json' with { type: 'json' };

test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const fixture = '/?fixture=input-z-index-context&profile=';

/** Reads a layer of each panel including Tooltip inside Select. */
function snapshot() {
  const surfaces = {
    select: '.zi-select',
    nestedTip: '.zi-input-tip',
    autocomplete: '.zi-autocomplete',
    treeSelect: '.zi-tree-select',
    cascader: '.zi-cascader',
    mentions: '.zi-mentions-popup',
    date: '.zi-date',
    range: '.zi-range',
    time: '.zi-time',
    timeRange: '.zi-time-range'
  };

  return Object.fromEntries(Object.entries(surfaces).map(([name, selector]) => {
    const node = document.querySelector<HTMLElement>(selector);
    const layer = node && {
      computed: getComputedStyle(node).zIndex,
      inline: node.style.zIndex || null
    };
    return [name, layer];
  }));
}

for (const { profile, initial, updated } of source.cases) {
  test(`Input popups inherit the Ant Design layer in ${profile.id}`, async ({ page }) => {
    await page.goto(fixture + profile.id);
    const mentions = page.getByRole('combobox', { name: 'Layer mentions', exact: true });
    await mentions.focus();
    await mentions.pressSequentially('@');
    const popup = page.locator('.zi-time-range');
    await expect(popup).toBeVisible();

    await expect.poll(() => page.evaluate(snapshot)).toEqual(initial);

    if (updated) {
      const original = await popup.elementHandle();
      const select = page.locator('.zi-select');
      const originalSelect = await select.elementHandle();

      await page.locator('[data-update-input-layer]').dispatchEvent('click');

      await expect.poll(() => page.evaluate(snapshot)).toEqual(updated);
      expect(await popup.evaluate((node, before) => node === before, original)).toBe(true);
      expect(await select.evaluate((node, before) => node === before, originalSelect)).toBe(true);
    }
  });
}

test('A hydrated time range keeps its editor and panel through layer updates', async ({ page }) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-input-z-index-'));
  let server: ViteDevServer | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom',
      cacheDir
    });
    const entry = new URL('../fixtures/input-z-index-context.server.ts', import.meta.url);
    const { renderInputZIndexContext } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderInputZIndexContext();
    await page.goto('/select-components-hydration.html?input-z-index');
    await page.addScriptTag({ type: 'module', url: '/input-z-index-context.client.ts' });
    const root = page.locator('#root');
    await expect(root).toHaveAttribute('data-hydration-ready', 'true');
    await root.evaluate((node, markup) => {
      document.head.insertAdjacentHTML('beforeend', markup.head);
      node.innerHTML = markup.body;
    }, { body, head });
    const launch = root.getByRole('button', { name: 'Open input layers', exact: true });
    const originalTrigger = await launch.elementHandle();
    await launch.focus();

    await root.dispatchEvent('hydrate-input-layers');

    await expect(root).toHaveAttribute('data-hydrated', 'true');
    await expect(launch).toBeFocused();
    expect(await launch.evaluate((node, before) => node === before, originalTrigger)).toBe(true);
    await launch.press('Enter');
    const dialog = root.getByRole('dialog', { name: 'Input layers', exact: true });
    const editor = dialog.getByPlaceholder('Layer start', { exact: true });
    await editor.fill('08:30');
    await editor.evaluate(node => (node as HTMLInputElement).setSelectionRange(1, 4));
    const popup = dialog.locator('[data-input-layer-portal] .zi-keyboard-time');
    await expect(popup).toBeVisible();
    await expect(popup).toHaveCSS('z-index', '1550');
    const originalPopup = await popup.elementHandle();
    const originalEditor = await editor.elementHandle();

    await dialog.getByRole('button', { name: 'Raise layer', exact: true }).dispatchEvent('click');

    await expect(popup).toHaveCSS('z-index', '1750');
    const toggle = dialog.getByRole('button', { name: 'Toggle local layer', exact: true });
    await toggle.dispatchEvent('click');
    await expect(popup).toHaveCSS('z-index', '0');
    expect(await popup.evaluate(node => node.style.getPropertyPriority('z-index'))).toBe('important');
    await toggle.dispatchEvent('click');

    await expect(popup).toHaveCSS('z-index', '1750');
    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue('08:30');
    expect(await popup.evaluate((node, before) => node === before, originalPopup)).toBe(true);
    expect(await editor.evaluate((node, before) => {
      const input = node as HTMLInputElement;
      return [node === before, input.selectionStart, input.selectionEnd];
    }, originalEditor)).toEqual([true, 1, 4]);
    await editor.press('Escape');

    await expect(popup).toBeHidden();
    await expect(dialog).toBeVisible();
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
