import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import reference from './fixtures/ant-design-mentions-semantics-reference.json' with { type: 'json' };
import { expect, test } from './test';

type Point = (typeof reference.cases)[number]['initial'];

/** Снимает те же CSS-свойства и классы, что измерены в React. */
function readPoint(page: Page) {
  return page.locator('.local-wrapper').evaluate(root => {
    const editor = root.querySelector('textarea');
    if (!editor) {
      throw new Error('Missing Mentions textarea');
    }
    const suffix = root.querySelector('.compose-suffix');
    const list = document.querySelector('#portal .compose-dropdown');
    const tracked = [
      ...['context', 'local', 'revised'].flatMap(scope =>
        ['root', 'textarea', 'popup', 'suffix'].map(name => scope + '-' + name)),
      'provider-wrapper', 'new-wrapper', 'local-wrapper', 'outer-identity', 'local-popup-name',
      'compose-filled', 'compose-outlined', 'compose-borderless',
      'seen-warning-borderless-false', 'seen-error-none-false'
    ];

    /** Оставляет только классы и свойства, заданные сценарием. */
    function slot(node: Element | null, properties: string[]) {
      if (!node) {
        return null;
      }
      const css = getComputedStyle(node);
      const classes = tracked.filter(name => node.classList.contains(name)).sort();
      const values = Object.fromEntries(properties.map(name => [name, css.getPropertyValue(name)]));
      return { classes, css: values };
    }

    return {
      root: slot(root, ['margin-top', 'padding-bottom']),
      textarea: slot(editor, ['font-family', 'font-size', 'letter-spacing']),
      popup: slot(list, ['background-color', 'padding-top', 'z-index']),
      suffix: slot(suffix, ['opacity']),
      clear: suffix?.querySelector('[data-clear-marker]')?.getAttribute('data-clear-marker') ?? null,
      state: {
        focused: editor === document.activeElement,
        value: editor.value,
        selection: [editor.selectionStart, editor.selectionEnd]
      }
    };
  });
}

/** Переводит CSS-имена эталона и учитывает явный контракт слотов при наличии clear. */
function expectedPoint(point: Point, affix: boolean) {
  const css = (point: { classes: string[]; css: Record<string, string>; } | null) =>
    point && { ...point, css: Object.fromEntries(Object.entries(point.css).map(([property, value]) =>
      [property.replace(/[A-Z]/g, name => '-' + name.toLowerCase()), value]
    )) };
  return {
    ...point,
    // RcMentions 1.12.0 опускает style и styles при передаче в BaseInput.
    root: css(affix ? { ...point.root, css: { marginTop: '9px', paddingBottom: '7px' } } : point.root),
    textarea: css(point.textarea),
    popup: css(point.popup),
    suffix: css(affix && point.suffix
      ? { ...point.suffix, css: { opacity: '0.65' } } : point.suffix)
  };
}

/** Монтирует один профиль из свежей публичной сборки. */
async function openFixture(page: Page, profile: string) {
  await page.goto(`/select-components-hydration.html?mentions-semantics=${profile}`);
  await page.addScriptTag({ type: 'module', url: '/mentions-semantics.client.ts' });
  const editor = page.getByRole('combobox', { name: 'Mention' });
  await expect(editor).toBeVisible();
  return editor;
}

for (const scenario of reference.cases) {
  test(`Mentions renders provider and instance slots for ${scenario.profile}`, async ({ page }) => {
    const editor = await openFixture(page, scenario.profile);
    const popup = page.locator('#portal .compose-dropdown');
    await editor.pressSequentially('@a');
    await expect(popup).toBeVisible();
    const live = scenario.profile === 'live';
    await expect.poll(() => readPoint(page)).toEqual(expectedPoint(scenario.initial, live));
    if (!scenario.updated) {
      return;
    }
    const before = { editor: await editor.elementHandle(), popup: await popup.elementHandle() };

    await page.getByRole('button', { name: 'Update Mentions styles' }).dispatchEvent('click');

    await expect.poll(() => readPoint(page)).toEqual(expectedPoint(scenario.updated, live));
    const identity = {
      editor: await editor.evaluate((node, before) => node === before, before.editor),
      popup: await popup.evaluate((node, before) => node === before, before.popup)
    };
    expect(identity).toEqual(scenario.identity);
    await expect(page.locator('[data-ant-mentions-measure]')).toHaveCSS('letter-spacing', '3px');

    await editor.press('Enter');

    await expect(editor).toHaveValue(scenario.inserted ?? '');
    await expect(editor).toBeFocused();
    await expect(popup).toBeHidden();
    await expect(page.locator('#mention-events')).toHaveText(JSON.stringify(scenario.events));

    await page.locator('[data-clear-marker]').click();

    await expect(editor).toHaveValue('');
    await expect(editor).toBeFocused();
    await expect(page.locator('#mention-events')).toHaveText(
      JSON.stringify([...(scenario.events ?? []), ['change', ''], ['clear']])
    );
  });
}

test('Mentions restores current authored textarea height after autoSize', async ({ page }) => {
  const editor = await openFixture(page, 'autosize');
  await expect(editor).toHaveCSS('resize', 'none');

  await page.getByRole('button', { name: 'Update Mentions styles' }).click();
  await expect(editor).not.toHaveCSS('height', '71px');
  await page.getByRole('button', { name: 'Use authored height' }).click();

  await expect(editor).toHaveCSS('height', '71px');
  await expect(editor).toHaveCSS('resize', 'vertical');
});

test('Mentions hydrates the styled editor and opens a styled popup', async ({ page }) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-mentions-semantics-'));
  let server: ViteDevServer | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom',
      cacheDir
    });
    const entry = new URL('./fixtures/mentions-semantics.server.ts', import.meta.url);
    const { renderMentionsSemantics } = await server.ssrLoadModule(fileURLToPath(entry));
    const { head, body } = renderMentionsSemantics();
    await page.goto('/select-components-hydration.html?mentions-semantics=live&ssr');
    await page.addScriptTag({ type: 'module', url: '/mentions-semantics.client.ts' });
    const root = page.locator('#root');
    await expect(root).toHaveAttribute('data-hydration-ready', 'true');
    await root.evaluate((target, markup) => {
      document.head.insertAdjacentHTML('beforeend', markup.head);
      target.innerHTML = markup.body;
    }, { head, body });
    const editor = root.getByRole('combobox', { name: 'Mention' });
    await editor.focus();
    const original = await editor.elementHandle();
    await expect(editor).toHaveCSS('letter-spacing', '1px');

    await root.dispatchEvent('hydrate-mentions-semantics');

    await expect(root).toHaveAttribute('data-hydrated', 'true');
    expect(await editor.evaluate((node, before) => node === before, original)).toBe(true);
    await expect(editor).toBeFocused();
    await editor.pressSequentially('@a');
    const popup = page.locator('#portal .compose-dropdown');

    await expect(popup).toBeVisible();
    await expect(popup).toHaveCSS('z-index', '0');
    await expect(popup).toHaveCSS('padding-top', '9px');
    await expect(editor).toBeFocused();
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
