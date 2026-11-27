import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import type { ElementHandle, Locator } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import {
  readAutoCompleteEditorHeightCase,
  type AutoCompleteEditorState
} from './auto-complete-editor-height-reference';
import { expect, test } from './test';

const route = '/?fixture=auto-complete-editor-height';
const cases = [
  ['standard', 'standard'],
  ['input', 'input-height-counterpart'],
  ['textarea', 'textarea-height-counterpart'],
  ['controlled', 'controlled-height-counterpart'],
  ['initial-value', 'initial-height-counterpart'],
  ['compact-rtl', 'compact-rtl'],
  ['author-height', 'author-height']
] as const;

/** Verifies the dimensions and behavior of the connected DOM after the props update. */
async function expectEditorState(
  editor: Locator,
  original: ElementHandle<Element>,
  state: AutoCompleteEditorState
) {
  const { classes: _classes, events: _events, placeholderDisplay: _placeholderDisplay, ...expected } = state;
  const read = () => editor.evaluate((node, prior) => {
    if (!(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)) {
      throw new Error('Missing AutoComplete editor');
    }
    const content = node.parentElement;
    const surface = content?.parentElement;
    if (!content || !surface) throw new Error('Missing AutoComplete layout');

    /** Measures the box without the coordinates of the test page. */
    function box(element: HTMLElement) {
      const { width, height } = element.getBoundingClientRect();
      return { width, height };
    }

    const contentStyle = getComputedStyle(content);
    return {
      sameEditor: node === prior,
      value: node.value,
      tag: node.tagName,
      focused: document.activeElement === node,
      selection: [node.selectionStart, node.selectionEnd],
      expanded: node.getAttribute('aria-expanded'),
      editor: box(node),
      content: box(content),
      surface: box(surface),
      position: getComputedStyle(node).position,
      lineHeight: contentStyle.lineHeight,
      minHeight: contentStyle.minHeight
    };
  }, original);

  await expect.poll(read).toEqual(expected);
}

test.use({ viewport: { width: 1280, height: 720 } });

for (const [sample, sourceId] of cases) {
  test(`AutoComplete keeps a usable editor through repeated input (${sample})`, async ({ page }) => {
    const source = readAutoCompleteEditorHeightCase(sourceId);
    await page.goto(route);
    await page.getByRole('combobox', { name: 'Editor sample' }).selectOption(sample);
    const editor = page.getByRole('combobox', { name: 'Editor', exact: true });
    const fixture = page.locator('#auto-complete-editor-height-fixture');
    const events = fixture.locator('#editor-height-events');
    await expect(fixture).toHaveAttribute('data-refs-connected', 'true');
    const original = await editor.elementHandle();
    try {
      await expectEditorState(editor, original, source.before);

      await editor.fill('Alpha');

      await expectEditorState(editor, original, source.first.state);
      await expect(events).toHaveText(JSON.stringify(source.first.state.events));

      await page.keyboard.press('Escape');

      await expectEditorState(editor, original, source.closed);
      await expect(events).toHaveText(JSON.stringify(source.closed.events));

      await editor.fill('Beta');

      await expectEditorState(editor, original, source.second.state);
      await expect(events).toHaveText(JSON.stringify(source.second.state.events));
      await expect(fixture).toHaveAttribute('data-refs-connected', 'true');
    }
    finally {
      await original.dispose();
    }
  });
}

test('AutoComplete hydrates an initially filled custom editor at its full height', async ({ page }) => {
  const artifacts = new URL('../../.upstream/artifacts/auto-complete-editor-hydration-', import.meta.url);
  const cache = await mkdtemp(fileURLToPath(artifacts));
  let server: ViteDevServer | undefined;
  let original: ElementHandle<Element> | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom', cacheDir: cache
    });
    const url = new URL('./fixtures/auto-complete-editor-height-hydration.server.ts', import.meta.url);
    const { renderAutoCompleteEditorHeight } = await server.ssrLoadModule(fileURLToPath(url));
    const { head, body } = renderAutoCompleteEditorHeight();
    await page.goto('/select-components-hydration.html');
    await page.evaluate(({ head, body }) => {
      const target = document.getElementById('root');
      if (!target) throw new Error('Missing AutoComplete hydration target');

      document.head.insertAdjacentHTML('beforeend', head);
      target.innerHTML = body;
    }, { head, body });
    const editor = page.getByRole('combobox', { name: 'Editor', exact: true });
    await expect(editor).toHaveValue('Saved draft');
    original = await editor.elementHandle();

    await page.addScriptTag({ type: 'module', url: '/auto-complete-editor-height-hydration.client.ts' });
    await page.waitForFunction(() => Boolean(window.disposeAutoCompleteEditorHeight));

    const source = readAutoCompleteEditorHeightCase('initial-height-counterpart');
    // Prior to the edit, the hydration of the server textarea put the carriage at the end of the value.
    const endOfValue = source.before.value.length;
    await expectEditorState(editor, original, { ...source.before, selection: [endOfValue, endOfValue] });
    await expect(page.locator('#auto-complete-editor-height-fixture'))
      .toHaveAttribute('data-refs-connected', 'true');
    await editor.fill('Alpha');
    await expectEditorState(editor, original, source.first.state);

    await page.evaluate(() => window.disposeAutoCompleteEditorHeight?.());
    await expect(editor).toHaveCount(0);
    expect(await original.evaluate(node => node.isConnected)).toBe(false);
  }
  finally {
    await original?.dispose();
    await server?.close();
    await rm(cache, { recursive: true });
  }
});
