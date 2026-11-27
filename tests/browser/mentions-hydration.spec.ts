import { createServer as createHttpServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Locator, Page } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from './test';
import reference from './fixtures/ant-design-mentions-hydration-reference.json' with { type: 'json' };

type Sample = (typeof reference.cases)[number]['before' | 'hydrated' | 'edited'];
type EditorHandle = Awaited<ReturnType<Locator['elementHandle']>>;
type ServerMarkup = { head: string; body: string; };

let cacheDir: string | undefined;
let server: ViteDevServer | undefined;
let renderFixture: (profile: string) => ServerMarkup;

test.use({ viewport: { width: 960, height: 640 } });

test.beforeAll(async () => {
  cacheDir = await mkdtemp(join(tmpdir(), 'antd-mentions-hydration-'));
  server = await createServer({
    configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
    appType: 'custom',
    cacheDir
  });
  const entry = new URL('./fixtures/mentions-hydration.server.ts', import.meta.url);
  const module = await server.ssrLoadModule(fileURLToPath(entry));
  renderFixture = module.renderMentionsHydration;
});

test.afterAll(async () => {
  try {
    await server?.close();
  }
  finally {
    if (cacheDir) await rm(cacheDir, { recursive: true, force: true });
  }
});

/** Sets SSR HTML until the hydration code is downloaded. */
async function prepareFixture(page: Page, profile: string) {
  await page.goto(`/select-components-hydration.html?mentions-hydration=${profile}`);
  const host = page.locator('#root');
  const markup = profile === 'csr' ? { head: '', body: '' } : renderFixture(profile);
  const { head, body } = markup;

  await host.evaluate((host, { head, body, shadow }) => {
    document.head.insertAdjacentHTML('beforeend', head);
    const parent = shadow ? host.attachShadow({ mode: 'open' }) : host;
    const section = document.createElement('section');
    section.innerHTML = body;
    parent.append(section);
  }, { head, body, shadow: profile.endsWith('-shadow') });

  return host;
}

/** Starts a strict connection without restoring the markings. */
async function activateFixture(page: Page, host: Locator) {
  await page.addScriptTag({ type: 'module', url: '/mentions-hydration.client.ts' });
  await expect(host).toHaveAttribute('data-hydration-ready', 'true');
  await host.dispatchEvent('activate-mentions-hydration');
  await expect(host).toHaveAttribute('data-hydrated', 'true');
}

/** Compares the textarea state, including the direction of selection and the order of events. */
async function expectSnapshot(editor: Locator, original: EditorHandle, expected: Sample) {
  const { errors, ...state } = expected;
  expect(errors).toEqual([]);

  await expect.poll(() => editor.evaluate((node: HTMLTextAreaElement, original) => {
    const scope = node.closest('section');
    const tree = node.getRootNode();
    const events: unknown = JSON.parse(scope?.querySelector('#hydration-events')?.textContent ?? '[]');
    return {
      value: node.value,
      sameEditor: node === original,
      focused: 'activeElement' in tree && tree.activeElement === node,
      selection: [node.selectionStart, node.selectionEnd, node.selectionDirection],
      counter: scope?.querySelector('.rc-textarea-data-count')?.textContent ?? null,
      events
    };
  }, original)).toEqual(state);
}

const ordinary = reference.cases.find(sample => sample.profile === 'default-backward');
if (!ordinary) {
  throw new Error('Missing the source hydration case with a stable value');
}
const profiles = [...reference.cases, { ...ordinary, profile: 'default-generated' }];

for (const { profile, before, hydrated, edited } of profiles) {
  test(`Mentions follows the source hydration selection for ${profile}`, async ({ page }) => {
    const host = await prepareFixture(page, profile);
    const editor = page.getByRole('combobox', { name: 'Hydration editor' });
    const original = await editor.elementHandle();
    if (before.focused) await editor.focus();
    if (profile.endsWith('-edited')) await editor.fill(before.value);
    await editor.evaluate((node: HTMLTextAreaElement) => node.setSelectionRange(7, 9, 'backward'));
    await expectSnapshot(editor, original, before);

    await activateFixture(page, host);
    await expectSnapshot(editor, original, hydrated);
    // press() itself focuses the field, including in the scenario without focus at hydration.
    await editor.press('X');

    await expectSnapshot(editor, original, edited);
  });
}

test('a focused textarea in another root with the same id leaves the SSR editor selection intact',
  async ({ page }) => {
    const host = await prepareFixture(page, 'default-backward');
    const editor = page.getByRole('combobox', { name: 'Hydration editor' });
    const original = await editor.elementHandle();
    await editor.evaluate((node: HTMLTextAreaElement) => node.setSelectionRange(7, 9, 'backward'));
    await host.evaluate(node => {
      const otherHost = document.createElement('div');
      node.before(otherHost);
      const otherRoot = otherHost.attachShadow({ mode: 'open' });
      const other = document.createElement('textarea');
      other.id = 'hydrating-mentions';
      other.dataset.antMentionsTextarea = '';
      other.setAttribute('aria-label', 'Shadow editor');
      other.value = 'Draft @ali';
      otherRoot.append(other);
      other.focus();
      other.setSelectionRange(1, 3, 'backward');
    });
    const other = page.getByRole('textbox', { name: 'Shadow editor' });

    await activateFixture(page, host);

    await expectSnapshot(editor, original, { ...ordinary.hydrated, focused: false });
    await expect(other).toBeFocused();
    await expect.poll(() => other.evaluate((node: HTMLTextAreaElement) =>
      [node.selectionStart, node.selectionEnd, node.selectionDirection])).toEqual([1, 3, 'backward']);
  });

test('a CSR editor never adopts selection from a different textarea with the same id',
  async ({ page }) => {
    const host = await prepareFixture(page, 'csr');
    await host.evaluate(node => {
      const unrelated = document.createElement('textarea');
      unrelated.id = 'hydrating-mentions';
      unrelated.dataset.antMentionsTextarea = '';
      unrelated.setAttribute('aria-label', 'Other editor');
      unrelated.value = 'Draft @ali';
      node.before(unrelated);
      unrelated.focus();
      unrelated.setSelectionRange(0, 2, 'backward');
    });
    const other = page.getByRole('textbox', { name: 'Other editor' });

    await activateFixture(page, host);

    const editor = page.getByRole('combobox', { name: 'Hydration editor' });
    await expect(editor).toHaveValue('Draft @ali');
    await expect.poll(() => editor.evaluate((node: HTMLTextAreaElement) =>
      [node.selectionStart, node.selectionEnd])).toEqual([10, 10]);
    await expect(other).toBeFocused();
    await expect.poll(() => other.evaluate((node: HTMLTextAreaElement) =>
      [node.selectionStart, node.selectionEnd, node.selectionDirection])).toEqual([0, 2, 'backward']);
  });
