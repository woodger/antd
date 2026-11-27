import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer as createHttpServer } from 'node:http';
import { createServer, type ViteDevServer } from 'vite';
import type { Page } from '@playwright/test';
import { test, expect } from '../test';

declare global {
  interface Window {
    suffixLayoutResources?: { observers: () => number; frames: () => number };
  }
}

let server: ViteDevServer;
let cache: string;
test.beforeAll(async () => {
  cache = await mkdtemp(join(
    fileURLToPath(new URL('../../../.upstream/artifacts/', import.meta.url)),
    'tree-select-suffix-hydration-'
  ));
  server = await createServer({ configFile: fileURLToPath(new URL(
    '../vite.config.ts',
    import.meta.url
  )),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null }, appType: 'custom', cacheDir: cache });
});
test.afterAll(async () => {
  await server?.close();
  if (cache) await rm(cache, { recursive: true, force: true });
});

async function settle(page: Page) {
  return page.evaluate(async () => {
    const state = window.treeSelectSuffixLayoutHydration!;
    let previous = '', stable = 0;
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      const content = state.root.querySelector<HTMLElement>('.ant-select-content')!;
      const rect = (node: Element) => {
        const box = node.getBoundingClientRect();
        return [box.x, box.y, box.width, box.height].map(value => Math.round(value * 1000) / 1000);
      };
      const layout = { root: rect(state.root), editor: rect(state.editor), content: rect(content),
        suffix: state.suffix ? rect(state.suffix) : null, prefix: state.prefix ? rect(state.prefix) : null,
        rootHeight: state.root.offsetHeight, contentWidth: content.clientWidth,
        visibleTags: [...state.root.querySelectorAll<HTMLElement>('[data-tree-choice-tag]')]
          .filter(node => node.getAttribute('aria-hidden') !== 'true').map(node => node.textContent),
        rest: state.root.querySelector('[data-suffix-layout-rest]')?.getAttribute('data-suffix-layout-omitted') };
      const current = JSON.stringify(layout);
      stable = current === previous ? stable + 1 : 0;
      if (stable >= 3) {
        return layout;
      }
      previous = current;
    }
    throw Error('Hydrated suffix layout did not settle after 30 frames');
  });
}

for (const id of ['input-ltr', 'textarea-rtl', 'wrapped-dom-ref-ltr', 'composite-ref-ltr', 'fragment-rtl']) {
  test(`TreeSelect suffix ${id} strictly hydrates and preserves query, nodes and refs through layout changes`, async ({ page }) => {
    const module = await server.ssrLoadModule(fileURLToPath(new URL(
      '../fixtures/tree-select-suffix-layout-hydration.server.ts',
      import.meta.url
    )));
    const rendered = module.renderTreeSelectSuffixLayout(id);
    await page.goto(`/tree-select-suffix-layout-hydration.html?sample=${id}`);
    await page.evaluate(({ head, body }) => {
      document.head.insertAdjacentHTML('beforeend', head);
      document.getElementById('root')!.innerHTML = body;
      const observers = new Set<Set<Element>>();
      const OriginalObserver = window.ResizeObserver;
      window.ResizeObserver = class extends OriginalObserver {
        targets = new Set<Element>();
        constructor(callback: ResizeObserverCallback) {
          super(callback);
          observers.add(this.targets);
        }
        observe(target: Element, options?: ResizeObserverOptions) {
          this.targets.add(target);
          super.observe(target, options);
        }
        unobserve(target: Element) {
          this.targets.delete(target);
          super.unobserve(target);
        }
        disconnect() {
          this.targets.clear();
          super.disconnect();
        }
      };
      const frames = new Set<number>();
      const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
      window.requestAnimationFrame = callback => {
        const frame = request(time => {
          frames.delete(frame);
          callback(time);
        });
        frames.add(frame);
        return frame;
      };
      window.cancelAnimationFrame = frame => {
        frames.delete(frame);
        cancel(frame);
      };
      window.suffixLayoutResources = { observers: () => [...observers].reduce(
        (count, targets) => count + targets.size,
        0
      ),
        frames: () => frames.size };
      const outside = document.querySelector<HTMLInputElement>('[aria-label="Suffix layout outside draft"]')!;
      outside.value = 'Outside suffix hydration draft';
      outside.setSelectionRange(1, 10);
      const editor = document.querySelector<HTMLInputElement | HTMLTextAreaElement>('[data-suffix-layout-editor]')!;
      editor.value = 'Draft before hydration';
      editor.focus();
      editor.setSelectionRange(2, 9);
    }, { head: rendered.head, body: rendered.body });
    await page.addScriptTag({
      type: 'module',
      url: '/tree-select-suffix-layout-hydration.client.ts'
    });
    await page.waitForFunction(() => window.treeSelectSuffixLayoutHydration);

    await expect(page.locator('[data-suffix-layout-case]')).toHaveAttribute(
      'data-suffix-layout-bound',
      'true'
    );
    await settle(page);
    // Independently captured MULTIPLE Source hydrateRoot clears the dirty editor
    // after client measurement, retaining focus, parent and suffix/editor identity.
    expect(await page.evaluate(() => {
      const state = window.treeSelectSuffixLayoutHydration!;
      return { value: state.editor.value, focused: document.activeElement === state.editor,
        selection: [state.editor.selectionStart, state.editor.selectionEnd],
        editor: state.editor === document.querySelector('[data-suffix-layout-editor]'),
        root: state.root === document.querySelector('[data-ant-tree-choice-control]'),
        parent: state.editor.parentNode === state.editorParent,
        suffix: state.editor.closest('[data-ant-tree-choice-input-suffix]') === state.suffix,
        outside: state.outside.value, outsideSelection: [state.outside.selectionStart, state.outside.selectionEnd] };
    })).toEqual({ value: '', focused: true, selection: [0, 0], editor: true, root: true, parent: true, suffix: true,
      outside: 'Outside suffix hydration draft', outsideSelection: [1, 10] });
    await expect(page.locator('[data-suffix-layout-events]')).toHaveText('[]');
    const editor = page.locator('[data-suffix-layout-editor]');
    await editor.fill('Hydrated suffix query');
    await editor.evaluate(node => {
      if (!(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)) {
        throw Error('Expected native editor');
      }
      node.setSelectionRange(2, 8);
    });
    const events = await page.locator('[data-suffix-layout-events]').textContent();
    const identity = () => page.evaluate(() => {
      const state = window.treeSelectSuffixLayoutHydration!, refs = state.refs();
      return { root: refs.root === state.root, input: refs.input === state.editor, control: Boolean(refs.control),
        editor: state.editor === document.querySelector('[data-suffix-layout-editor]'),
        parent: state.editor.parentNode === state.editorParent,
        suffix: state.editor.closest('[data-ant-tree-choice-input-suffix]') === state.suffix,
        prefix: state.root.querySelector('[data-suffix-layout-prefix]') === state.prefix,
        focused: document.activeElement === state.editor, value: state.editor.value,
        selection: [state.editor.selectionStart, state.editor.selectionEnd] };
    });
    const expected = { root: true, input: true, control: true, editor: true, parent: true, suffix: true, prefix: true,
      focused: true, value: 'Hydrated suffix query', selection: [2, 8] };
    const commands = [
      { width: 148.5 }, { width: 312.25 }, { prefixWidth: 96, restWidth: 120 },
      { size: 'large' }, { direction: id.endsWith('-rtl') ? 'ltr' : 'rtl' },
      { maxTagCount: 1 }, { maxTagCount: 'responsive', width: 200, restWidth: 64 },
      { count: 0 }, { count: 4 }
    ];
    for (const command of commands) {
      await page.locator('[data-suffix-layout-command]').evaluate((node, detail) =>
        node.dispatchEvent(new CustomEvent('suffixlayoutupdate', { detail })), command);
      const layout = await settle(page);
      expect(layout.contentWidth).toBeGreaterThan(0);
      expect(layout.editor[2]).toBeGreaterThan(0);
      expect(layout.rootHeight).toBeGreaterThan(0);
      expect(await identity()).toEqual(expected);
      await expect(page.locator('[data-suffix-layout-events]')).toHaveText(events!);
    }
    await page.setViewportSize({ width: 1050, height: 850 });
    await settle(page);

    expect(await identity()).toEqual(expected);
    await page.evaluate(() => window.treeSelectSuffixLayoutHydration!.focus());

    expect(await identity()).toEqual(expected);
    expect(await page.getByRole('form', { name: 'Suffix layout hydration values', exact: true }).evaluate(node => {
      if (!(node instanceof HTMLFormElement)) {
        throw Error('Expected native form');
      }
      return new FormData(node).getAll('suffix-layout-choice');
    })).toEqual(['a', 'b', 'c', 'd']);
    await page.evaluate(() => window.treeSelectSuffixLayoutHydration!.dispose());

    expect(await page.evaluate(() => window.treeSelectSuffixLayoutHydration!.cleaned))
      .toEqual({ root: true, input: true, control: true });
    await expect(page.locator('[data-suffix-layout-case]')).toHaveCount(0);
    await expect(page.locator('[popover]')).toHaveCount(0);
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));

    expect(await page.evaluate(() => ({ observers: window.suffixLayoutResources!.observers(),
      frames: window.suffixLayoutResources!.frames() }))).toEqual({ observers: 0, frames: 0 });
  });
}
