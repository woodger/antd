import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from './test';
import source from './fixtures/ant-design-z-index-context-reference.json' with { type: 'json' };

test.use({ viewport: { width: 1200, height: 760 }, reducedMotion: 'reduce' });
const fixture = '/?fixture=z-index-context&profile=';
type Observation = (typeof source.cases)[number]['initial'];

/** Снимает inline и computed z-index с указанных поверхностей после переноса в портал. */
function snapshot() {
  const selectors = {
    modal: 'dialog.zi-owner-modal',
    drawer: 'dialog.zi-owner-drawer',
    parentTooltip: '.zi-owner-tooltip',
    parentPopover: '.zi-owner-popover',
    parentPopconfirm: '.zi-owner-popconfirm',
    parentDropdown: '.zi-owner-dropdown',
    tooltip: '.zi-child-tooltip',
    dropdown: '.zi-child-dropdown',
    popover: '.zi-child-popover',
    popconfirm: '.zi-child-popconfirm',
    menu: '.zi-child-menu'
  };

  return Object.fromEntries(Object.entries(selectors).map(([name, selector]) => {
    const node = document.querySelector<HTMLElement>(selector);
    const style = node && {
      inline: node.style.zIndex || null,
      computed: getComputedStyle(node).zIndex
    };
    return [name, style];
  }));
}

/** Применяет локальное решение для Drawer, у которого Source теряет явный ноль. */
function expectedLayers(id: string, observation: Observation) {
  if (id === 'drawer-zero') {
    return { ...observation, drawer: { inline: '0', computed: '0' } };
  }

  return observation;
}

for (const { profile, initial, updated } of source.cases) {
  test(`Overlay layers inherit the Ant Design context in ${profile.id}`, async ({ page }) => {
    await page.goto(fixture + profile.id);

    await expect.poll(() => page.evaluate(snapshot)).toEqual(expectedLayers(profile.id, initial));

    if (updated) {
      const popup = page.locator('.zi-child-dropdown');
      const original = await popup.elementHandle();

      await page.locator('[data-update-layer]').dispatchEvent('click');

      await expect.poll(() => page.evaluate(snapshot)).toEqual(expectedLayers(profile.id, updated));
      expect(await popup.evaluate((node, before) => node === before, original)).toBe(true);
    }
  });
}

test('Dropdown updates its layer through CSS priority, zero and removal', async ({ page }) => {
  const explicit = source.cases.find(sample => sample.profile.id === 'dropdown-explicit');
  const zero = source.cases.find(sample => sample.profile.id === 'dropdown-zero');
  const implicit = source.cases.find(sample => sample.profile.id === 'dropdown');
  if (!explicit || !zero || !implicit) {
    throw new Error('Missing Dropdown z-index references');
  }

  await page.goto(fixture + 'cascade');

  await expect.poll(() => page.evaluate(snapshot))
    .toEqual(expectedLayers(explicit.profile.id, explicit.initial));
  const popup = page.locator('.zi-owner-dropdown');
  const child = page.locator('.zi-child-dropdown');
  const original = await child.elementHandle();
  expect(await popup.evaluate(node => node.style.getPropertyPriority('z-index'))).toBe('important');

  await page.getByRole('button', { name: 'Set zero layer', exact: true }).dispatchEvent('click');

  await expect.poll(() => page.evaluate(snapshot))
    .toEqual(expectedLayers(zero.profile.id, zero.initial));
  expect(await child.evaluate((node, before) => node === before, original)).toBe(true);

  const remove = page.getByRole('button', { name: 'Remove local layer', exact: true });
  await remove.dispatchEvent('click');

  await expect.poll(() => page.evaluate(snapshot))
    .toEqual(expectedLayers(implicit.profile.id, implicit.initial));
  expect(await child.evaluate((node, before) => node === before, original)).toBe(true);
});

test('A hydrated Modal keeps popup ownership, draft and focus while its layer changes', async ({
  page
}) => {
  const cache = new URL('../../.upstream/artifacts/z-index-hydration-', import.meta.url);
  const cacheDir = await mkdtemp(fileURLToPath(cache));
  let server: ViteDevServer | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom',
      cacheDir
    });
    const entry = new URL('./fixtures/z-index-context.server.ts', import.meta.url);
    const { renderZIndexContext } = await server.ssrLoadModule(fileURLToPath(entry));
    const { body, head } = renderZIndexContext();
    await page.goto('/select-components-hydration.html?z-index-context');
    await page.addScriptTag({ type: 'module', url: '/z-index-context.client.ts' });
    const root = page.locator('#root');
    await expect(root).toHaveAttribute('data-hydration-ready', 'true');
    await root.evaluate((node, markup) => {
      document.head.insertAdjacentHTML('beforeend', markup.head);
      node.innerHTML = markup.body;
    }, { body, head });
    const launch = root.getByRole('button', { name: 'Open layer dialog', exact: true });
    const originalTrigger = await launch.elementHandle();
    await launch.focus();

    await root.dispatchEvent('hydrate-z-index-context');

    await expect(root).toHaveAttribute('data-hydrated', 'true');
    await expect(launch).toBeFocused();
    expect(await launch.evaluate((node, before) => node === before, originalTrigger)).toBe(true);
    await launch.press('Enter');
    const dialog = root.getByRole('dialog', { name: 'Layer dialog', exact: true });
    const editor = dialog.getByRole('textbox', { name: 'Layer draft', exact: true });
    await editor.fill('Retained draft');
    const trigger = dialog.getByRole('button', { name: 'Layer commands', exact: true });
    await trigger.press('ArrowDown');
    const popup = dialog.locator('.zi-child-dropdown');
    const command = popup.getByRole('menuitem', { name: 'One', exact: true });
    await expect(command).toBeFocused();
    await expect(popup).toHaveCSS('z-index', '1550');
    const originalCommand = await command.elementHandle();

    await dialog.getByRole('button', { name: 'Raise layer', exact: true }).dispatchEvent('click');

    await expect(dialog).toHaveCSS('z-index', '1700');
    await expect(popup).toHaveCSS('z-index', '1750');
    await expect(command).toBeFocused();
    expect(await command.evaluate((node, before) => node === before, originalCommand)).toBe(true);
    await expect(editor).toHaveValue('Retained draft');
    await command.press('Escape');

    await expect(popup).toBeHidden();
    await expect(dialog).toBeVisible();
    await expect(trigger).toBeFocused();
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
