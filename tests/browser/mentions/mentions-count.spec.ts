import { createServer as createHttpServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Locator, Page } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from '../test';
import reference from '../fixtures/ant-design-mentions-count-reference.json' with { type: 'json' };

type BasicSnapshot = (typeof reference.basic)[number]['states'][number];
type ExtendedSnapshot = (typeof reference.extended)[number]['samples'][number];
type EditorHandle = Awaited<ReturnType<Locator['elementHandle']>>;

test.use({ viewport: { width: 960, height: 640 } });

/** Loads the public package or prepares the page for SSR markup. */
async function openFixture(page: Page, profile: string, ssr = false) {
  const query = new URLSearchParams({ 'mentions-count': profile });
  if (ssr) {
    query.set('ssr', '');
  }
  await page.goto(`/select-components-hydration.html?${query}`);
  await page.addScriptTag({ type: 'module', url: '/mentions-count.client.ts' });
  return page.getByRole('combobox', { name: 'Count editor' });
}

/** Removes the results of the input, DOM meters and the magazine of calls public API. */
function readSnapshot(editor: Locator, extended: boolean, original: EditorHandle | null) {
  return editor.evaluate((node: HTMLTextAreaElement, { extended, original }) => {
    const root = node.closest('[data-ant-mentions-root]');
    const wrapper = node.closest('.rc-textarea-affix-wrapper');
    const counter = wrapper?.querySelector('.rc-textarea-data-count');
    const scope = [...(root?.classList ?? [])].find(name => /^s-(?:\w|-)+$/.test(name));
    // We save authored classes and shoot only scope class Svelte.
    function classes(element: Element | null | undefined) {
      return element ? [...element.classList].filter(name => name !== scope).join(' ') : null;
    }
    const events: unknown = JSON.parse(document.getElementById('count-events')?.textContent ?? '[]');
    const common = {
      value: node.value,
      position: [node.selectionStart, node.selectionEnd],
      maxLength: node.getAttribute('maxlength'),
      counter: counter?.textContent ?? null,
      dataCount: wrapper?.getAttribute('data-count') ?? null,
      events
    };
    if (!extended) {
      return {
        ...common,
        counterParent: classes(counter?.parentElement),
        wrapper: classes(wrapper)
      };
    }

    const style = getComputedStyle(node);
    function measure(element: Element | null | undefined) {
      if (!element) {
        return null;
      }
      const { width, height } = element.getBoundingClientRect();
      return [width, height].map(value => Math.round(value * 100) / 100);
    }

    return {
      ...common,
      outOfRange: (wrapper ?? node).classList.contains('rc-textarea-out-of-range'),
      focused: document.activeElement === node,
      sameEditor: node === original,
      wrapper: wrapper?.tagName ?? null,
      suffix: classes(counter?.parentElement),
      popup: root?.querySelector('[role="listbox"]')?.checkVisibility() ?? false,
      layout: {
        surface: measure(root),
        textarea: measure(node),
        counter: measure(counter),
        border: style.borderTopWidth,
        padding: style.paddingTop,
        fontSize: style.fontSize,
        wrapper: wrapper ? getComputedStyle(wrapper).display : null
      }
    };
  }, { extended, original });
}

/** Compares the browser measurement in its entirety with the corresponding Ant Design profile. */
async function expectSnapshot(
  editor: Locator, state: BasicSnapshot | ExtendedSnapshot, original: EditorHandle | null = null
) {
  const extended = 'sameEditor' in state;
  await expect.poll(() => readSnapshot(editor, extended, original)).toEqual(state);
}

/** Transmits in the browser real CompositionEvent with a payload of IME. */
async function compose(editor: Locator, end = false) {
  await editor.evaluate((node, end) => node.dispatchEvent(new CompositionEvent(
    end ? 'compositionend' : 'compositionstart', { data: end ? 'c' : '', bubbles: true }
  )), end);
}

/** Waiting for the menu to appear and chooses a long mention of the keyboard. */
async function chooseMention(page: Page, editor: Locator) {
  await editor.press('@');
  await expect(page.getByRole('option', { name: 'Long mention' })).toBeVisible();
  await editor.press('Enter');
}

for (const { profile, states } of reference.basic) {
  test(`Mentions matches count for ${profile}`, async ({ page }) => {
    const editor = await openFixture(page, profile);
    await expectSnapshot(editor, states[0]);

    if (profile === 'option') {
      await chooseMention(page, editor);
    }
    else {
      if (profile === 'composition') {
        await compose(editor);
      }
      await editor.fill('a😀bc');
    }
    await expectSnapshot(editor, states[1]);

    if (profile === 'composition') {
      await compose(editor, true);
      await expectSnapshot(editor, states[2]);
    }
  });
}

for (const { profile, samples: measured } of reference.extended) {
  // Wrapper allowClear in React loses the provider's direction. We check RTL with the measurement
  // of the same public component inside <main dir="rtl">.
  const samples = profile === 'combined' ? reference.rtlHost.samples : measured;
  test(`Mentions matches extended count for ${profile}`, async ({ page }) => {
    const editor = await openFixture(page, profile);
    const original = await editor.elementHandle();
    await expectSnapshot(editor, samples[0], original);

    if (profile === 'accept' || profile === 'reject') {
      await editor.focus();
      await editor.evaluate((node: HTMLTextAreaElement) => node.setSelectionRange(1, 1));
      await editor.press('X');
      await expectSnapshot(editor, samples[1], original);
    }
    else if (profile === 'combined') {
      await expect(editor).toHaveCSS('direction', 'rtl');
      await chooseMention(page, editor);
      await expectSnapshot(editor, samples[1], original);
      await page.locator('button[data-ant-mentions-clear]').click();
      await expectSnapshot(editor, samples[2], original);
    }
    else if (profile === 'switch') {
      const toggle = page.locator('#toggle-count');
      await editor.press('@');
      await expectSnapshot(editor, samples[1], original);
      await toggle.dispatchEvent('click');
      // React keeps the menu when you change textarea. At Svelte the binding to the previous carriage is dropped.
      await expectSnapshot(editor, { ...samples[2], popup: false }, original);
      const counted = await editor.elementHandle();
      await toggle.dispatchEvent('click');
      await expectSnapshot(editor, { ...samples[3], popup: false }, original);
      expect(await editor.evaluate((node, counted) => node === counted, counted)).toBe(false);
    }
    else if (profile === 'composition-same') {
      await compose(editor);
      await editor.fill('ab');
      await expectSnapshot(editor, samples[1], original);
      await compose(editor, true);
      await expectSnapshot(editor, samples[2], original);
    }
    else if (profile !== 'hidden') {
      await editor.fill('a😀bcd');
      await expectSnapshot(editor, samples[1], original);
    }
  });
}

for (const profile of ['plain', 'composition-callbacks']) {
  test(`Mentions forwards native composition events for ${profile}`, async ({ page }) => {
    const editor = await openFixture(page, profile);
    await compose(editor);
    await editor.fill('a😀bc');
    await compose(editor, true);

    const count = profile === 'composition-callbacks';
    const composed = count ? [['exceed', 'a😀bc', 3], ['change', 'a😀b']] : [];
    await expect(editor).toHaveValue(count ? 'a😀b' : 'a😀bc');
    await expect(page.locator('#count-events')).toHaveText(JSON.stringify([
      ['start', ''], ['native-start', ''], ['change', 'a😀bc'], ['input', 'a😀bc'],
      ...composed,
      ['end', 'c'], ['native-end', 'c']
    ]));
  });
}

test('Mentions hydrates a counter snippet without replacing the focused editor', async ({ page }) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-mentions-count-'));
  let server: ViteDevServer | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom',
      cacheDir
    });
    const entry = new URL('../fixtures/mentions-count.server.ts', import.meta.url);
    const { renderMentionsCount } = await server.ssrLoadModule(fileURLToPath(entry));
    const { head, body } = renderMentionsCount('snippet');
    const editor = await openFixture(page, 'snippet', true);
    const root = page.locator('#root');
    const counter = page.locator('#snippet-count');
    await expect(root).toHaveAttribute('data-hydration-ready', 'true');

    await root.evaluate((node, markup) => {
      document.head.insertAdjacentHTML('beforeend', markup.head);
      node.innerHTML = markup.body;
    }, { head, body });
    await expect(counter).toHaveText('ab:2:3');
    await editor.focus();
    const original = await editor.elementHandle();
    const originalCounter = await counter.elementHandle();

    await root.dispatchEvent('hydrate-mentions-count');
    await expect(root).toHaveAttribute('data-hydrated', 'true');
    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue('ab');
    await editor.evaluate((node: HTMLTextAreaElement) => node.setSelectionRange(1, 1));
    await editor.press('X');

    await expect(editor).toHaveValue('aXb');
    await expect(counter).toHaveText('aXb:3:3');
    await expect(page.locator('.rc-textarea-affix-wrapper')).not.toHaveAttribute('data-count');
    expect(await editor.evaluate((node, original) => node === original, original)).toBe(true);
    expect(await counter.evaluate((node, original) => node === original, originalCounter)).toBe(true);
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
