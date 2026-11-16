import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer as createHttpServer } from 'node:http';
import { createServer, type ViteDevServer } from 'vite';
import { test, expect } from './test';
import reference from './fixtures/ant-design-tree-select-checkable-reference.json' with { type: 'json' };
import type { TreeSelectCheckableAction } from './fixtures/tree-select-checkable-cases';
import { actTreeSelectCheckable } from './tree-select-checkable-driver';
import { readTreeSelectCheckable } from './tree-select-checkable-metrics';
import { treeSelectCheckableNativeView } from './tree-select-checkable-native';

interface DisposeSnapshot { ledger: unknown[][]; rootConnected: boolean; editorConnected: boolean; }
interface DisposeTrace {
  phase: 'disposing' | 'disposed';
  before: DisposeSnapshot;
  afterCall: DisposeSnapshot | null;
  afterAwait: DisposeSnapshot | null;
  probes: Array<DisposeSnapshot & {
    type: string; phase: 'disposing' | 'disposed'; targetIsEditor: boolean;
    trusted: boolean; relatedTarget: string | null;
  }>;
}
declare global {
  interface Window {
    checkableHydrationResources?: { observers: () => number; mutations: () => number;
      frames: () => number; timers: () => number };
    checkableHydrationDisposal?: { trace: DisposeTrace; stop: () => void };
  }
}

let server: ViteDevServer;
let cache: string;
test.use({ viewport: reference.reference.viewport });
test.beforeAll(async () => {
  cache = await mkdtemp(join(fileURLToPath(new URL('../../.upstream/artifacts/', import.meta.url)), 'tree-select-checkable-hydration-'));
  server = await createServer({
    configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
    appType: 'custom', cacheDir: cache
  });
});
test.afterAll(async () => {
  await server?.close();
  if (cache) await rm(cache, { recursive: true, force: true });
});

async function settle(page: Parameters<typeof actTreeSelectCheckable>[0]) {
  let previous = '';
  let stable = 0;
  for (let attempt = 0; attempt < 40; attempt++) {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const actual = await page.evaluate(readTreeSelectCheckable);
    const key = JSON.stringify(actual);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 2) return actual;
    previous = key;
  }
  throw Error('Hydrated checkable state did not settle');
}

for (const id of ['search-live-truthy', 'search-live-falsy']) {
  test(`TreeSelect strictly hydrates ${id} and preserves its query, caret and public bindings`, async ({ page }) => {
    const source = reference.cases.find(entry => entry.id === id)!;
    const module = await server.ssrLoadModule(fileURLToPath(new URL('./fixtures/tree-select-checkable-hydration.server.ts', import.meta.url)));
    const rendered = module.renderTreeSelectCheckable(id);
    await page.goto(`/tree-select-checkable-hydration.html?sample=${id}`);
    await page.addScriptTag({ type: 'module', url: '/tree-select-checkable-styles.client.ts' });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(({ head, body }) => {
      document.head.insertAdjacentHTML('beforeend', head);
      document.getElementById('root')!.innerHTML = body;
      const observers = new Set<Set<Element>>();
      const mutations = new Set<MutationObserver>();
      const Resize = window.ResizeObserver;
      const Mutation = window.MutationObserver;
      window.ResizeObserver = class extends Resize {
        targets = new Set<Element>();
        constructor(callback: ResizeObserverCallback) { super(callback); observers.add(this.targets); }
        observe(target: Element, options?: ResizeObserverOptions) { this.targets.add(target); super.observe(target, options); }
        unobserve(target: Element) { this.targets.delete(target); super.unobserve(target); }
        disconnect() { this.targets.clear(); super.disconnect(); }
      };
      window.MutationObserver = class extends Mutation {
        observe(target: Node, options?: MutationObserverInit) { mutations.add(this); super.observe(target, options); }
        disconnect() { mutations.delete(this); super.disconnect(); }
      };
      const frames = new Set<number>();
      const request = window.requestAnimationFrame.bind(window);
      const cancel = window.cancelAnimationFrame.bind(window);
      window.requestAnimationFrame = callback => {
        const frame = request(time => { frames.delete(frame); callback(time); });
        frames.add(frame);
        return frame;
      };
      window.cancelAnimationFrame = frame => { frames.delete(frame); cancel(frame); };
      const timers = new Set<number>();
      const browser: Window = window;
      const schedule = browser.setTimeout.bind(browser);
      const clear = browser.clearTimeout.bind(browser);
      browser.setTimeout = (handler, timeout, ...args) => {
        if (typeof handler !== 'function') throw Error('Expected a function hydration timer');
        const timer = schedule(() => { timers.delete(timer); handler(...args); }, timeout);
        timers.add(timer);
        return timer;
      };
      browser.clearTimeout = timer => { if (timer !== undefined) timers.delete(timer); clear(timer); };
      window.checkableHydrationResources = {
        observers: () => [...observers].reduce((sum, targets) => sum + targets.size, 0),
        mutations: () => mutations.size, frames: () => frames.size, timers: () => timers.size
      };
      const outside = document.querySelector<HTMLInputElement>('[aria-label="Checkable outside draft"]')!;
      outside.value = 'Outside checkable draft';
      outside.setSelectionRange(2, 9);
    }, { head: rendered.head, body: rendered.body });
    await page.addScriptTag({ type: 'module', url: '/tree-select-checkable-hydration.client.ts' });
    await page.waitForFunction(() => window.treeSelectCheckableHydration);
    await expect(page.locator('[data-checkable-case]')).toHaveAttribute('data-checkable-bound', 'true');
    const identity = await page.evaluateHandle(() => {
      const state = window.treeSelectCheckableHydration!;
      const refs = state.refs();
      return { root: state.root, editor: state.editor, parent: state.parent,
        control: refs.control, focus: refs.control?.focus, blur: refs.control?.blur,
        scrollTo: refs.control?.scrollTo, outside: state.outside };
    });
    const bindings = () => identity.evaluate(old => {
      const state = window.treeSelectCheckableHydration!;
      const refs = state.refs();
      return {
        root: old.root === refs.root, editor: old.editor === refs.editor,
        parent: old.parent === state.editor.parentNode, control: old.control === refs.control,
        focus: old.focus === refs.control?.focus, blur: old.blur === refs.control?.blur,
        scrollTo: old.scrollTo === refs.control?.scrollTo,
        formData: [...new FormData(document.querySelector<HTMLFormElement>('[data-checkable-form]')!)],
        outsideValue: old.outside.value, outsideCaret: [old.outside.selectionStart, old.outside.selectionEnd],
        ignored: state.ignored()
      };
    });
    const expectedBindings = {
      root: true, editor: true, parent: true, control: true, focus: true, blur: true, scrollTo: true,
      formData: [['checked', 'a']], outsideValue: 'Outside checkable draft', outsideCaret: [2, 9],
      ignored: { renderCalls: 0, iteratorCalls: 0, thenReads: 0 }
    };
    try {
      expect(await page.evaluate(() => window.treeSelectCheckableHydration!.initialCaret)).toEqual([0, 0]);
      expect((await settle(page)).view).toEqual(treeSelectCheckableNativeView(source.initial.view, id, 'hydrated-initial'));
      expect(await bindings()).toEqual(expectedBindings);
      for (const step of source.steps) {
        await actTreeSelectCheckable(page, step.action as TreeSelectCheckableAction);
        expect((await settle(page)).view, JSON.stringify(step.action)).toEqual(step.view);
        expect(await bindings()).toEqual(expectedBindings);
      }
      const events = source.steps.at(-1)!.view.events;
      expect(await page.evaluate(() => window.treeSelectCheckableHydration!.events())).toEqual(events);
      await page.evaluate(async () => {
        const state = window.treeSelectCheckableHydration!;
        const snapshot = (): DisposeSnapshot => ({ ledger: JSON.parse(JSON.stringify(state.events())),
          rootConnected: state.root.isConnected, editorConnected: state.editor.isConnected });
        const trace: DisposeTrace = { phase: 'disposing', before: snapshot(),
          afterCall: null, afterAwait: null, probes: [] };
        const record = (event: FocusEvent) => trace.probes.push({ ...snapshot(), type: event.type,
          phase: trace.phase, targetIsEditor: event.target === state.editor, trusted: event.isTrusted,
          relatedTarget: event.relatedTarget instanceof Element ? event.relatedTarget.tagName : null });
        state.editor.addEventListener('blur', record, true);
        state.editor.addEventListener('focusout', record, true);
        window.checkableHydrationDisposal = { trace, stop() {
          state.editor.removeEventListener('blur', record, true);
          state.editor.removeEventListener('focusout', record, true);
        } };
        const promise = state.dispose();
        trace.afterCall = snapshot();
        await promise;
        trace.afterAwait = snapshot();
        trace.phase = 'disposed';
      });
      await expect(page.locator('[data-checkable-case]')).toHaveCount(0);
      await expect(page.locator('[popover]')).toHaveCount(0);
      await page.setViewportSize({ width: 1120, height: 860 });
      await page.evaluate(() => { window.dispatchEvent(new Event('resize')); window.dispatchEvent(new Event('scroll')); });
      await page.waitForTimeout(1000);
      const disposed = { ledger: [...events, ['blur']], rootConnected: false, editorConnected: false };
      expect(await page.evaluate(() => window.checkableHydrationDisposal!.trace)).toEqual({
        phase: 'disposed', before: { ledger: events, rootConnected: true, editorConnected: true },
        afterCall: disposed, afterAwait: disposed,
        probes: ['blur', 'focusout'].map(type => ({ ledger: events, rootConnected: true,
          editorConnected: true, type, phase: 'disposing', targetIsEditor: true, trusted: true, relatedTarget: null }))
      });
      expect(await page.evaluate(() => ({
        cleaned: window.treeSelectCheckableHydration!.cleaned,
        observers: window.checkableHydrationResources!.observers(), mutations: window.checkableHydrationResources!.mutations(),
        frames: window.checkableHydrationResources!.frames(), timers: window.checkableHydrationResources!.timers(),
        events: window.treeSelectCheckableHydration!.events(), ignored: window.treeSelectCheckableHydration!.ignored()
      }))).toEqual({ cleaned: { root: true, editor: true, control: true },
        observers: 0, mutations: 0, frames: 0, timers: 0, events: disposed.ledger,
        ignored: { renderCalls: 0, iteratorCalls: 0, thenReads: 0 } });
    } finally {
      await identity.dispose();
      await page.evaluate(() => window.checkableHydrationDisposal?.stop());
    }
  });
}
