import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer as createHttpServer } from 'node:http';
import { createServer, type ViteDevServer } from 'vite';
import type { Page } from '@playwright/test';
import { test, expect } from './test';
import reference from './fixtures/ant-design-tree-select-align-reference.json' with { type: 'json' };
import type { TreeSelectAlignAction } from './fixtures/tree-select-align-cases';
import { readTreeSelectAlign } from './tree-select-align-metrics';

interface AlignDisposeSnapshot { ledger: unknown[][]; rootConnected: boolean; editorConnected: boolean; }
interface AlignDisposeTrace {
  phase: 'disposing' | 'disposed'; before: AlignDisposeSnapshot;
  afterCall: AlignDisposeSnapshot | null; afterAwait: AlignDisposeSnapshot | null;
  probes: Array<AlignDisposeSnapshot & { type: string; phase: 'disposing' | 'disposed';
    targetIsEditor: boolean; trusted: boolean; relatedTarget: string | null }>;
}
declare global {
  interface Window {
    alignHydrationResources?: { observers: () => number; frames: () => number };
    alignHydrationDisposal?: { trace: AlignDisposeTrace; stop: () => void };
  }
}

let server: ViteDevServer;
let cache: string;
test.use({ viewport: reference.reference.viewport });
test.beforeAll(async () => {
  cache = await mkdtemp(join(
    fileURLToPath(new URL('../../.upstream/artifacts/', import.meta.url)),
    'tree-select-align-hydration-'
  ));
  server = await createServer({ configFile: fileURLToPath(new URL(
    './vite.config.ts',
    import.meta.url
  )),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null }, appType: 'custom', cacheDir: cache });
});
test.afterAll(async () => {
  await server?.close();
  if (cache) await rm(cache, { recursive: true, force: true });
});

async function settle(page: Page) {
  let previous = '', stable = 0;
  for (let attempt = 0; attempt < 50; attempt++) {
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())))));
    const view = (await page.evaluate(readTreeSelectAlign)).view, key = JSON.stringify(view);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 6) {
      return view;
    }
    previous = key;
  }
  throw Error('Hydrated alignment did not settle after 150 frames');
}

async function act(page: Page, action: TreeSelectAlignAction) {
  const editor = page.locator('[data-align-case] [data-align-editor], [data-align-case] input[role="combobox"]');
  if (action.type === 'click') {
    await editor.click();
  }
  else if (action.type === 'fill') {
    await editor.fill(action.text);
  }
  else if (action.type === 'caret') {
    await editor.evaluate((node, range) => {
      if (!(node instanceof HTMLInputElement)) {
        throw Error('Expected native align editor');
      }
      node.setSelectionRange(range.start, range.end);
    }, action);
  }
  else if (action.type === 'props' || action.type === 'host') {
    await page.evaluate(action =>
      window.treeSelectAlignHydration!.update(action), action);
  }
  else if (action.type === 'viewport') {
    await page.setViewportSize({
      width: action.width,
      height: action.height
    });
  }
  else if (action.type === 'scroll') {
    await page.locator('[data-align-scroller]').evaluate((
      node,
      action
    ) => {
      node.scrollTop = action.top;
      node.scrollLeft = action.left;
    }, action);
  }
  else {
    throw Error(`Unexpected strict hydration action: ${action.type}`);
  }
}

for (const { id, events } of [
  { id: 'cache-provided', events: [['focus'], ['open', true], ['search', 'Draft']] },
  { id: 'root-composite', events: [['focus'], ['open', true], ['root-input', 'Root draft']] }
]) {
  test(`TreeSelect ${id} strictly hydrates and preserves its editor and refs through Source alignment updates`, async (
    { page },
    testInfo
  ) => {
    const source = reference.cases.find(entry => entry.id === id)!;
    const module = await server.ssrLoadModule(fileURLToPath(new URL(
      './fixtures/tree-select-align-hydration.server.ts',
      import.meta.url
    )));
    const rendered = module.renderTreeSelectAlign(id);
    await page.clock.install();
    await page.goto(`/tree-select-align-hydration.html?sample=${id}`);
    await page.evaluate(({ head, body }) => {
      document.head.insertAdjacentHTML('beforeend', head);
      document.getElementById('root')!.innerHTML = body;
      const observers = new Set<Set<Element>>(), OriginalObserver = window.ResizeObserver;
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
      window.alignHydrationResources = { observers: () => [...observers].reduce(
        (sum, targets) => sum + targets.size,
        0
      ),
        frames: () => frames.size };
      const outside = document.querySelector<HTMLInputElement>('[aria-label="Align outside draft"]')!;
      outside.value = 'Outside align hydration draft';
      outside.setSelectionRange(1, 10);
    }, { head: rendered.head, body: rendered.body });
    await page.addScriptTag({ type: 'module', url: '/tree-select-align-hydration.client.ts' });
    await page.waitForFunction(() => window.treeSelectAlignHydration);

    await expect(page.locator('[data-align-case]')).toHaveAttribute('data-align-bound', 'true');
    expect(await settle(page)).toEqual(source.initial.view);
    const identity = await page.evaluateHandle(() => {
      const state = window.treeSelectAlignHydration!, refs = state.refs();
      return { control: refs.control, focus: refs.control?.focus, blur: refs.control?.blur,
        scrollTo: refs.control?.scrollTo, popup: null as Element | null };
    });

    expect(await identity.evaluate(old => ({
      focus: typeof old.focus,
      blur: typeof old.blur,
      scrollTo: typeof old.scrollTo
    })))
      .toEqual({ focus: 'function', blur: 'function', scrollTo: 'function' });
    const readIdentity = () => identity.evaluate(old => {
      const state = window.treeSelectAlignHydration!, refs = state.refs();
      const host = document.querySelector('[data-align-case]')!;
      const root = host.querySelector('[data-align-root]') ?? host.querySelector('.ant-select');
      const popup = document.querySelector('.ant-tree-select-dropdown');
      const samePopup = !old.popup || old.popup === popup;
      old.popup ??= popup;
      return { root: refs.root === state.root && root === state.root,
        editor: refs.editor === state.editor && root?.querySelector('[data-align-editor],input[role="combobox"]') === state.editor,
        parent: state.editor.parentNode === state.editorParent,
        control: refs.control === old.control, focus: refs.control?.focus === old.focus,
        blur: refs.control?.blur === old.blur, scrollTo: refs.control?.scrollTo === old.scrollTo,
        popup: samePopup, getters: refs.getterArguments.length,
        outside: state.outside.value, outsideSelection: [state.outside.selectionStart, state.outside.selectionEnd] };
    });
    const expectedIdentity = { root: true, editor: true, parent: true, control: true,
      focus: true, blur: true, scrollTo: true, popup: true, getters: 0,
      outside: 'Outside align hydration draft', outsideSelection: [1, 10] };
    try {
      expect(await readIdentity()).toEqual(expectedIdentity);
      for (const step of source.steps) {
        if (step.action.type === 'outside') break;
        await act(page, step.action as TreeSelectAlignAction);
        expect(await settle(page), JSON.stringify(step.action)).toEqual(step.view);
        expect(await readIdentity()).toEqual(expectedIdentity);
      }
      expect(await page.evaluate(() => window.treeSelectAlignHydration!.events())).toEqual(events);
      await page.evaluate(() => window.treeSelectAlignHydration!.refs().control!.focus({ preventScroll: true }));
      expect(await page.evaluate(() => window.treeSelectAlignHydration!.events())).toEqual(events);
      expect(await readIdentity()).toEqual(expectedIdentity);
      await page.evaluate(async () => {
        const state = window.treeSelectAlignHydration!;
        const snapshot = (): AlignDisposeSnapshot => ({ ledger: JSON.parse(JSON.stringify(state.events())),
          rootConnected: state.root.isConnected, editorConnected: state.editor.isConnected });
        const trace: AlignDisposeTrace = {
          phase: 'disposing',
          before: snapshot(),
          afterCall: null,
          afterAwait: null,
          probes: []
        };
        const record = (event: FocusEvent) => trace.probes.push({ ...snapshot(), type: event.type, phase: trace.phase,
          targetIsEditor: event.target === state.editor, trusted: event.isTrusted,
          relatedTarget: event.relatedTarget instanceof Element ? event.relatedTarget.tagName : null });
        state.editor.addEventListener('blur', record, true);
        state.editor.addEventListener('focusout', record, true);
        window.alignHydrationDisposal = { trace, stop() {
          state.editor.removeEventListener('blur', record, true);
          state.editor.removeEventListener('focusout', record, true);
        } };
        const pending = state.dispose();
        trace.afterCall = snapshot();
        await pending;
        trace.afterAwait = snapshot();
        trace.phase = 'disposed';
      });
      expect(await page.evaluate(() => window.treeSelectAlignHydration!.cleaned))
        .toEqual({ root: true, editor: true, control: true });
      await expect(page.locator('[data-align-case]')).toHaveCount(0);
      await expect(page.locator('[popover]')).toHaveCount(0);
      await page.setViewportSize({ width: 1120, height: 860 });
      await page.evaluate(() => {
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('scroll'));
      });
      await page.clock.runFor(1000);
      const disposal = await page.evaluate(() => window.alignHydrationDisposal!.trace);
      await testInfo.attach(
        'tree-select-align-disposal-timing',
        { body: JSON.stringify({ id, disposal }, null, 2), contentType: 'application/json' }
      );
      console.log('TreeSelect align disposal timing:', JSON.stringify({ id, disposal }));
      const disposed = {
        ledger: [...events, ['blur']], rootConnected: false, editorConnected: false
      };
      // Native unmount emits one synchronous blur while the editor is connected; no callbacks follow await.
      expect(disposal).toEqual({
        phase: 'disposed',
        before: { ledger: events, rootConnected: true, editorConnected: true },
        afterCall: disposed,
        afterAwait: disposed,
        probes: ['blur', 'focusout'].map(type => ({
          ledger: events, rootConnected: true, editorConnected: true,
          type, phase: 'disposing', targetIsEditor: true, trusted: true, relatedTarget: null
        }))
      });
      expect(await page.evaluate(() => ({ observers: window.alignHydrationResources!.observers(),
        frames: window.alignHydrationResources!.frames(), events: window.treeSelectAlignHydration!.events() })))
        .toEqual({ observers: 0, frames: 0, events: disposed.ledger });
    } finally {
      await page.evaluate(() => window.alignHydrationDisposal?.stop());
      await identity.dispose();
    }
  });
}
