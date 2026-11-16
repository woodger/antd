import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer as createHttpServer } from 'node:http';
import { createServer, type ViteDevServer } from 'vite';
import { test, expect } from './test';
import reference from './fixtures/ant-design-popup-overflow-reference.json' with { type: 'json' };
import { popupOverflowSamples, type PopupOverflowAction } from './fixtures/popup-overflow-cases';
import { actPopupOverflow, drainPopupOverflow, preparePopupOverflow } from './popup-overflow-driver';
import { readPopupOverflow } from './popup-overflow-metrics';
import { popupOverflowNativeView } from './popup-overflow-native';

interface DisposeSnapshot {
  events: unknown[][]; rootConnected: boolean; editorConnected: boolean; ownerConnected: boolean;
}
interface DisposeTrace {
  phase: 'disposing' | 'disposed'; before: DisposeSnapshot;
  afterCall: DisposeSnapshot | null; afterAwait: DisposeSnapshot | null;
  probes: Array<DisposeSnapshot & { type: string; phase: 'disposing' | 'disposed';
    targetIsEditor: boolean; trusted: boolean; relatedTarget: string | null }>;
}
declare global {
  interface Window {
    popupOverflowHydrationResources?: {
      observers: () => number; mutations: () => number; frames: () => number; timers: () => number;
    };
    popupOverflowHydrationDisposal?: { trace: DisposeTrace; stop: () => void };
  }
}

let server: ViteDevServer;
let cache: string;
test.use({ viewport: reference.reference.viewport });
test.beforeAll(async () => {
  cache = await mkdtemp(join(fileURLToPath(new URL('../../.upstream/artifacts/', import.meta.url)), 'popup-overflow-hydration-'));
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

async function settle(page: Parameters<typeof actPopupOverflow>[0]) {
  let previous = '';
  let stable = 0;
  for (let attempt = 0; attempt < 50; attempt++) {
    await drainPopupOverflow(page);
    const actual = await page.evaluate(readPopupOverflow);
    const key = JSON.stringify(actual);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) return actual;
    previous = key;
  }
  throw Error('Hydrated popup overflow state did not settle');
}

for (const sample of popupOverflowSamples.filter(sample => sample.live)) {
  test(`${sample.family} strictly hydrates live popupOverflow and preserves its public controls`, async ({ page }) => {
    const source = reference.cases.find(entry => entry.id === sample.id)!;
    const module = await server.ssrLoadModule(fileURLToPath(new URL('./fixtures/popup-overflow-hydration.server.ts', import.meta.url)));
    const rendered = module.renderPopupOverflow(sample.id);
    await page.goto(`/popup-overflow-hydration.html?sample=${sample.id}`);
    await page.addScriptTag({ type: 'module', url: '/popup-overflow-styles.client.ts' });
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
      window.popupOverflowHydrationResources = {
        observers: () => [...observers].reduce((sum, targets) => sum + targets.size, 0),
        mutations: () => mutations.size, frames: () => frames.size, timers: () => timers.size
      };
      const outside = document.querySelector<HTMLInputElement>('[aria-label="Overflow outside draft"]')!;
      outside.value = 'Outside overflow draft';
      outside.setSelectionRange(2, 9);
    }, { head: rendered.head, body: rendered.body });
    await page.addScriptTag({ type: 'module', url: '/popup-overflow-hydration.client.ts' });
    await page.waitForFunction(() => window.popupOverflowHydration);
    await expect(page.locator('[data-overflow-case]')).toHaveAttribute('data-overflow-bound', 'true');
    await preparePopupOverflow(page, sample);
    const identity = await page.evaluateHandle(() => {
      const state = window.popupOverflowHydration!;
      const refs = state.refs();
      const methods = refs.control as Record<string, unknown> | undefined;
      return { root: state.root, anchor: state.anchor, editor: state.editor, parent: state.parent,
        control: refs.control, publicRoot: refs.publicRoot, publicEditor: refs.publicEditor,
        focus: methods?.focus, blur: methods?.blur, scrollTo: methods?.scrollTo, outside: state.outside };
    });
    const bindings = () => identity.evaluate(old => {
      const state = window.popupOverflowHydration!;
      const refs = state.refs();
      const methods = refs.control as Record<string, unknown> | undefined;
      return { root: old.root === refs.root, anchor: old.anchor === refs.anchor,
        editor: old.editor === refs.editor, parent: old.parent === refs.editor?.parentNode,
        control: old.control === refs.control, publicRoot: old.publicRoot === refs.publicRoot,
        publicEditor: old.publicEditor === refs.publicEditor,
        focus: old.focus === methods?.focus, blur: old.blur === methods?.blur,
        scrollTo: old.scrollTo === methods?.scrollTo,
        formData: [...new FormData(document.querySelector<HTMLFormElement>('[data-overflow-form]')!)],
        outsideValue: old.outside.value, outsideCaret: [old.outside.selectionStart, old.outside.selectionEnd] };
    });
    const expectedBindings = (query: string) => ({ root: true, anchor: true, editor: true, parent: true,
      control: true, publicRoot: true, publicEditor: true, focus: true, blur: true, scrollTo: true,
      formData: sample.family === 'select' ? [['overflow-selection', '']]
        : sample.family === 'auto-complete' ? [['overflow-selection', query]] : [],
      outsideValue: 'Outside overflow draft', outsideCaret: [2, 9] });
    try {
      expect(await page.evaluate(() => window.popupOverflowHydration!.initialCaret)).toEqual([0, 0]);
      expect((await settle(page)).view).toEqual(source.initial.view);
      expect(await bindings()).toEqual(expectedBindings(''));
      for (const step of source.steps) {
        await actPopupOverflow(page, step.action as PopupOverflowAction);
        const expected = popupOverflowNativeView(step.view, sample.id, step.action as PopupOverflowAction);
        expect((await settle(page)).view, JSON.stringify(step.action)).toEqual(expected);
        expect(await bindings()).toEqual(expectedBindings(expected.query));
      }
      const last = source.steps.at(-1)!;
      const events = popupOverflowNativeView(last.view, sample.id, last.action as PopupOverflowAction).events;
      expect(await page.evaluate(() => window.popupOverflowHydration!.events())).toEqual(events);
      expect(await page.evaluate(() => window.popupOverflowHydration!.editor.getAttribute('aria-expanded'))).toBe('true');
      const focused = await page.evaluate(() => document.activeElement === window.popupOverflowHydration!.editor);
      // Exact 1fb Select/AutoComplete CSR baselines: connected blur closes their open owners.
      // Source views/events above stay unchanged; this assertion covers the existing Native disposal.
      const closesOnDispose = focused && (sample.family === 'select' || sample.family === 'auto-complete');
      const disposedEvents = closesOnDispose ? [...events, ['open', false]] : events;
      await page.evaluate(async () => {
        const state = window.popupOverflowHydration!;
        const owner = document.querySelector('[data-overflow-case]')!;
        const snapshot = (): DisposeSnapshot => ({ events: JSON.parse(JSON.stringify(state.events())),
          rootConnected: state.root.isConnected, editorConnected: state.editor.isConnected, ownerConnected: owner.isConnected });
        const trace: DisposeTrace = { phase: 'disposing', before: snapshot(),
          afterCall: null, afterAwait: null, probes: [] };
        const record = (event: FocusEvent) => trace.probes.push({ ...snapshot(), type: event.type,
          phase: trace.phase, targetIsEditor: event.target === state.editor, trusted: event.isTrusted,
          relatedTarget: event.relatedTarget instanceof Element ? event.relatedTarget.tagName : null });
        state.editor.addEventListener('blur', record, true);
        state.editor.addEventListener('focusout', record, true);
        window.popupOverflowHydrationDisposal = { trace, stop() {
          state.editor.removeEventListener('blur', record, true);
          state.editor.removeEventListener('focusout', record, true);
        } };
        const promise = state.dispose();
        trace.afterCall = snapshot();
        await promise;
        trace.afterAwait = snapshot();
        trace.phase = 'disposed';
      });
      await expect(page.locator('[data-overflow-case]')).toHaveCount(0);
      await expect(page.locator('[popover]')).toHaveCount(0);
      const disposed = { events: disposedEvents, rootConnected: false, editorConnected: false, ownerConnected: false };
      expect(await page.evaluate(() => window.popupOverflowHydrationDisposal!.trace)).toEqual({
        phase: 'disposed', before: { events, rootConnected: true, editorConnected: true, ownerConnected: true },
        afterCall: disposed, afterAwait: disposed,
        probes: focused ? ['blur', 'focusout'].map(type => ({
          events: type === 'focusout' ? disposedEvents : events, rootConnected: true,
          editorConnected: true, ownerConnected: true, type, phase: 'disposing', targetIsEditor: true,
          trusted: true, relatedTarget: null })) : []
      });
      await page.setViewportSize({ width: 1120, height: 860 });
      await page.evaluate(() => { window.dispatchEvent(new Event('resize')); window.dispatchEvent(new Event('scroll')); });
      await page.waitForTimeout(1000);
      expect(await page.evaluate(() => ({
        cleaned: window.popupOverflowHydration!.cleaned,
        observers: window.popupOverflowHydrationResources!.observers(), mutations: window.popupOverflowHydrationResources!.mutations(),
        frames: window.popupOverflowHydrationResources!.frames(), timers: window.popupOverflowHydrationResources!.timers(),
        events: window.popupOverflowHydration!.events()
      }))).toEqual({ cleaned: { root: true, anchor: true, editor: true, control: true, publicRoot: true, publicEditor: true },
        observers: 0, mutations: 0, frames: 0, timers: 0, events: disposedEvents });
    } finally {
      await identity.dispose();
      await page.evaluate(() => window.popupOverflowHydrationDisposal?.stop());
    }
  });
}
