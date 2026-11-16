import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer as createHttpServer } from 'node:http';
import { createServer, type ViteDevServer } from 'vite';
import { test, expect } from './test';
import reference from './fixtures/ant-design-popup-width-reference.json' with { type: 'json' };
import { popupWidthSamples, type PopupWidthAction } from './fixtures/popup-width-cases';
import { actPopupWidth, drainPopupWidth, preparePopupWidth } from './popup-width-driver';
import { readPopupWidth } from './popup-width-metrics';
import { popupWidthNativeView } from './popup-width-native';

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
    popupWidthHydrationResources?: {
      observers: () => number; mutations: () => number; frames: () => number; timers: () => number;
    };
    popupWidthHydrationDisposal?: { trace: DisposeTrace; stop: () => void };
  }
}

let server: ViteDevServer;
let cache: string;
test.use({ viewport: reference.reference.viewport });
test.beforeAll(async () => {
  cache = await mkdtemp(join(fileURLToPath(new URL('../../.upstream/artifacts/', import.meta.url)), 'popup-width-hydration-'));
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

async function settle(page: Parameters<typeof actPopupWidth>[0]) {
  let previous = '';
  let stable = 0;
  for (let attempt = 0; attempt < 50; attempt++) {
    await drainPopupWidth(page);
    const actual = await page.evaluate(readPopupWidth);
    const key = JSON.stringify(actual);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) return actual;
    previous = key;
  }
  throw Error('Hydrated popup width state did not settle');
}

for (const sample of popupWidthSamples.filter(sample => sample.live)) {
  test(`${sample.id} strictly hydrates live popupWidth and preserves its public controls`, async ({ page }) => {
    const source = reference.cases.find(entry => entry.id === sample.id)!;
    const module = await server.ssrLoadModule(fileURLToPath(new URL('./fixtures/popup-width-hydration.server.ts', import.meta.url)));
    const rendered = module.renderPopupWidth(sample.id);
    await page.goto(`/popup-width-hydration.html?sample=${sample.id}`);
    await page.addScriptTag({ type: 'module', url: '/popup-width-styles.client.ts' });
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
      window.popupWidthHydrationResources = {
        observers: () => [...observers].reduce((sum, targets) => sum + targets.size, 0),
        mutations: () => mutations.size, frames: () => frames.size, timers: () => timers.size
      };
      const outside = document.querySelector<HTMLInputElement>('[aria-label="Width outside draft"]')!;
      outside.value = 'Outside width draft';
      outside.setSelectionRange(2, 9);
    }, { head: rendered.head, body: rendered.body });
    await page.addScriptTag({ type: 'module', url: '/popup-width-hydration.client.ts' });
    await page.waitForFunction(() => window.popupWidthHydration);
    await expect(page.locator('[data-width-case]')).toHaveAttribute('data-width-bound', 'true');
    await preparePopupWidth(page);
    const identity = await page.evaluateHandle(() => {
      const state = window.popupWidthHydration!;
      const refs = state.refs();
      const methods = refs.control as Record<string, unknown> | undefined;
      return { root: state.root, editor: state.editor, parent: state.parent,
        control: refs.control, publicRoot: refs.publicRoot, publicEditor: refs.publicEditor,
        focus: methods?.focus, blur: methods?.blur, scrollTo: methods?.scrollTo, outside: state.outside };
    });
    const bindings = () => identity.evaluate(old => {
      const state = window.popupWidthHydration!;
      const refs = state.refs();
      const methods = refs.control as Record<string, unknown> | undefined;
      return { root: old.root === refs.root, editor: old.editor === refs.editor, parent: old.parent === refs.editor?.parentNode,
        control: old.control === refs.control, publicRoot: old.publicRoot === refs.publicRoot,
        publicEditor: old.publicEditor === refs.publicEditor,
        focus: old.focus === methods?.focus, blur: old.blur === methods?.blur,
        scrollTo: old.scrollTo === methods?.scrollTo,
        formData: [...new FormData(document.querySelector<HTMLFormElement>('[data-width-form]')!)],
        outsideValue: old.outside.value, outsideCaret: [old.outside.selectionStart, old.outside.selectionEnd] };
    });
    const expectedBindings = (query: string) => ({ root: true, editor: true, parent: true,
      control: true, publicRoot: true, publicEditor: true, focus: true, blur: true, scrollTo: true,
      formData: sample.family === 'select' ? [['width-selection', '']]
        : sample.family === 'auto-complete' ? [['width-selection', query]] : [],
      outsideValue: 'Outside width draft', outsideCaret: [2, 9] });
    try {
      expect(await page.evaluate(() => window.popupWidthHydration!.initialCaret)).toEqual([0, 0]);
      expect((await settle(page)).view).toEqual(source.initial.view);
      expect(await bindings()).toEqual(expectedBindings(''));
      for (const step of source.steps) {
        await actPopupWidth(page, step.action as PopupWidthAction);
        const expected = popupWidthNativeView(step.view, sample.id, step.action as PopupWidthAction);
        expect((await settle(page)).view, JSON.stringify(step.action)).toEqual(expected);
        expect(await bindings()).toEqual(expectedBindings(expected.query));
      }
      const last = source.steps.at(-1)!;
      expect(source.cleanup.callbacks).toEqual(last.view.events);
      const events = popupWidthNativeView(last.view, sample.id, last.action as PopupWidthAction).events;
      expect(await page.evaluate(() => window.popupWidthHydration!.events())).toEqual(events);
      expect(await page.evaluate(() => window.popupWidthHydration!.editor.getAttribute('aria-expanded'))).toBe('true');
      const focused = await page.evaluate(() => document.activeElement === window.popupWidthHydration!.editor);
      // Exact 1fb Select/AutoComplete CSR baselines: connected blur closes their open owners.
      // Source views/events above stay unchanged; this assertion covers the existing Native disposal.
      const closesOnDispose = focused && (sample.family === 'select' || sample.family === 'auto-complete');
      const disposedEvents = closesOnDispose ? [...events, ['open', false]] : events;
      await page.evaluate(async () => {
        const state = window.popupWidthHydration!;
        const owner = document.querySelector('[data-width-case]')!;
        const snapshot = (): DisposeSnapshot => ({ events: JSON.parse(JSON.stringify(state.events())),
          rootConnected: state.root.isConnected, editorConnected: state.editor.isConnected, ownerConnected: owner.isConnected });
        const trace: DisposeTrace = { phase: 'disposing', before: snapshot(),
          afterCall: null, afterAwait: null, probes: [] };
        const record = (event: FocusEvent) => trace.probes.push({ ...snapshot(), type: event.type,
          phase: trace.phase, targetIsEditor: event.target === state.editor, trusted: event.isTrusted,
          relatedTarget: event.relatedTarget instanceof Element ? event.relatedTarget.tagName : null });
        state.editor.addEventListener('blur', record, true);
        state.editor.addEventListener('focusout', record, true);
        window.popupWidthHydrationDisposal = { trace, stop() {
          state.editor.removeEventListener('blur', record, true);
          state.editor.removeEventListener('focusout', record, true);
        } };
        const promise = state.dispose();
        trace.afterCall = snapshot();
        await promise;
        trace.afterAwait = snapshot();
        trace.phase = 'disposed';
      });
      await expect(page.locator('[data-width-case]')).toHaveCount(0);
      await expect(page.locator('[popover]')).toHaveCount(0);
      const disposed = { events: disposedEvents, rootConnected: false, editorConnected: false, ownerConnected: false };
      expect(await page.evaluate(() => window.popupWidthHydrationDisposal!.trace)).toEqual({
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
        cleaned: window.popupWidthHydration!.cleaned,
        observers: window.popupWidthHydrationResources!.observers(), mutations: window.popupWidthHydrationResources!.mutations(),
        frames: window.popupWidthHydrationResources!.frames(), timers: window.popupWidthHydrationResources!.timers(),
        events: window.popupWidthHydration!.events()
      }))).toEqual({ cleaned: { root: true, editor: true, control: true, publicRoot: true, publicEditor: true },
        observers: 0, mutations: 0, frames: 0, timers: 0, events: disposedEvents });
    } finally {
      await identity.dispose();
      await page.evaluate(() => window.popupWidthHydrationDisposal?.stop());
    }
  });
}
