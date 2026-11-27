import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer as createHttpServer } from 'node:http';
import { createServer, type ViteDevServer } from 'vite';
import { test, expect } from '../test';
import { selectVirtualReference as reference, selectVirtualNativeCases } from '../select-virtual-reference';
import { selectVirtualNativeView, readSelectVirtualAriaIntegrity } from '../select-virtual-native';
import { selectVirtualSamples, type SelectVirtualAction } from '../fixtures/select-virtual-cases';
import { actSelectVirtual, drainSelectVirtual, prepareSelectVirtual } from '../select-virtual-driver';
import { actSelectVirtualHover } from '../select-virtual-hover-driver';
import { readSelectVirtual } from '../select-virtual-metrics';

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
    selectVirtualHydrationResources?: {
      observers: () => number; mutations: () => number; frames: () => number; timers: () => number;
    };
    selectVirtualHydrationDisposal?: { trace: DisposeTrace; stop: () => void };
  }
}

let server: ViteDevServer;
let cache: string;
test.use({ viewport: reference.reference.viewport });
test.beforeAll(async () => {
  cache = await mkdtemp(join(
    fileURLToPath(new URL('../../../.upstream/artifacts/', import.meta.url)),
    'select-virtual-hydration-'
  ));
  server = await createServer({
    configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
    appType: 'custom', cacheDir: cache
  });
});
test.afterAll(async () => {
  await server?.close();
  if (cache) await rm(cache, { recursive: true, force: true });
});

async function settle(page: Parameters<typeof actSelectVirtual>[0]) {
  let previous = '';
  let stable = 0;
  for (let attempt = 0; attempt < 60; attempt++) {
    await drainSelectVirtual(page);
    const actual = await page.evaluate(readSelectVirtual);
    const key = JSON.stringify(actual);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) {
      return actual;
    }
    previous = key;
  }
  throw Error('Hydrated Select list window or callback ledger did not settle');
}

for (const sample of selectVirtualSamples.filter(sample => ['live', 'refs', 'selected'].includes(sample.scenario))) {
  test(`${sample.id} strictly hydrates its measured list and public ref`, async ({ page }) => {
    const act = sample.scenario === 'selected' ? actSelectVirtualHover : actSelectVirtual;
    const source = selectVirtualNativeCases.find(entry => entry.id === sample.id)!;
    const module = await server.ssrLoadModule(fileURLToPath(new URL(
      '../fixtures/select-virtual-hydration.server.ts',
      import.meta.url
    )));
    const rendered = module.renderSelectVirtual(sample.id);
    await page.goto(`/select-virtual-hydration.html?sample=${sample.id}`);
    await page.addScriptTag({ type: 'module', url: '/select-virtual-styles.client.ts' });
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
      window.MutationObserver = class extends Mutation {
        observe(target: Node, options?: MutationObserverInit) {
          mutations.add(this);
          super.observe(target, options);
        }
        disconnect() {
          mutations.delete(this);
          super.disconnect();
        }
      };
      const frames = new Set<number>();
      const request = window.requestAnimationFrame.bind(window);
      const cancel = window.cancelAnimationFrame.bind(window);
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
      const timers = new Set<number>();
      const browser: Window = window;
      const schedule = browser.setTimeout.bind(browser);
      const clear = browser.clearTimeout.bind(browser);
      browser.setTimeout = (handler, timeout, ...args) => {
        if (typeof handler !== 'function') {
          throw Error('Expected a function hydration timer');
        }
        const timer = schedule(() => {
          timers.delete(timer);
          handler(...args);
        }, timeout);
        timers.add(timer);
        return timer;
      };
      browser.clearTimeout = timer => {
        if (timer !== undefined) timers.delete(timer);
        clear(timer);
      };
      window.selectVirtualHydrationResources = {
        observers: () => [...observers].reduce((sum, targets) => sum + targets.size, 0),
        mutations: () => mutations.size, frames: () => frames.size, timers: () => timers.size
      };
      const outside = document.querySelector<HTMLInputElement>('[aria-label="Virtual outside draft"]')!;
      outside.value = 'Outside virtual draft';
      outside.setSelectionRange(2, 9);
    }, { head: rendered.head, body: rendered.body });
    await page.addScriptTag({ type: 'module', url: '/select-virtual-hydration.client.ts' });
    await page.waitForFunction(() => window.selectVirtualHydration);

    await expect(page.locator('[data-select-virtual-case]')).toHaveAttribute(
      'data-select-virtual-bound',
      'true'
    );
    await prepareSelectVirtual(page);
    const identity = await page.evaluateHandle(() => {
      const state = window.selectVirtualHydration!;
      const refs = state.refs();
      return { outer: state.outer, root: state.root, editor: state.editor, parent: state.parent,
        control: refs.control, publicRoot: refs.publicRoot, publicEditor: refs.publicEditor,
        focus: refs.control?.focus, blur: refs.control?.blur, scrollTo: refs.control?.scrollTo, outside: state.outside };
    });
    const bindings = () => identity.evaluate(old => {
      const state = window.selectVirtualHydration!;
      const refs = state.refs();
      return { outer: old.outer === document.querySelector('.select-virtual-control'),
        root: old.root === refs.root, editor: old.editor === refs.editor, parent: old.parent === refs.editor?.parentNode,
        control: old.control === refs.control, publicRoot: old.publicRoot === refs.publicRoot,
        publicEditor: old.publicEditor === refs.publicEditor,
        focus: old.focus === refs.control?.focus, blur: old.blur === refs.control?.blur,
        scrollTo: old.scrollTo === refs.control?.scrollTo,
        formData: [...new FormData(document.querySelector<HTMLFormElement>('[data-select-virtual-form]')!)],
        outsideValue: old.outside.value, outsideCaret: [old.outside.selectionStart, old.outside.selectionEnd] };
    });
    const expectedBindings = (model: unknown, query: string) => ({ outer: true, root: true, editor: true, parent: true,
      control: true, publicRoot: true, publicEditor: true, focus: true, blur: true, scrollTo: true,
      formData: [['virtual-selection', sample.family === 'auto-complete' ? query : typeof model === 'string' ? model : '']],
      outsideValue: 'Outside virtual draft', outsideCaret: [2, 9] });
    try {
      const initial = await settle(page);
      expect(await page.evaluate(() => window.selectVirtualHydration!.initialCaret)).toEqual([0, 0]);
      expect(initial.view).toEqual(selectVirtualNativeView(
        source.initial.view,
        sample.id,
        'hydrated-initial'
      ));
      expect(await page.evaluate(readSelectVirtualAriaIntegrity)).toBe(true);
      expect(await bindings()).toEqual(expectedBindings(initial.view.model, initial.view.query));
      expect(await page.evaluate(() => ({
        value: window.selectVirtualHydration!.editor.value,
        caret: [window.selectVirtualHydration!.editor.selectionStart, window.selectVirtualHydration!.editor.selectionEnd]
      }))).toEqual(await page.evaluate(() => ({
        value: window.selectVirtualHydration!.initialValue, caret: window.selectVirtualHydration!.initialCaret
      })));
      for (const step of source.steps) {
        await act(page, step.action as SelectVirtualAction);
        const actual = await settle(page);
        expect(actual.view, JSON.stringify(step.action)).toEqual(selectVirtualNativeView(
          step.view,
          sample.id,
          'step',
          step.action
        ));
        expect(actual.raw.renders).toEqual(step.raw.renders);
        expect(await page.evaluate(readSelectVirtualAriaIntegrity)).toBe(true);
        expect(await bindings()).toEqual(expectedBindings(actual.view.model, actual.view.query));
      }
      expect(source.cleanup.callbacks).toEqual(source.steps.at(-1)!.view.events);
      // Existing Native Select/AC connected blur closes the owner on focused disposal.
      // The Source sequence above is complete before this independent Native lifecycle check.
      await actSelectVirtual(
        page,
        { type: 'ref', method: 'focus', options: { preventScroll: true } }
      );
      await actSelectVirtual(page, { type: 'open', value: true });
      const before = await settle(page);
      const events = before.view.events;
      const disposedEvents = [...events, ['open', false]];
      expect(await page.evaluate(() => document.activeElement === window.selectVirtualHydration!.editor)).toBe(true);
      await page.evaluate(async () => {
        const state = window.selectVirtualHydration!;
        const owner = document.querySelector('[data-select-virtual-case]')!;
        const snapshot = (): DisposeSnapshot => ({ events: JSON.parse(JSON.stringify(state.events())),
          rootConnected: state.root.isConnected, editorConnected: state.editor.isConnected, ownerConnected: owner.isConnected });
        const trace: DisposeTrace = {
          phase: 'disposing',
          before: snapshot(),
          afterCall: null,
          afterAwait: null,
          probes: []
        };
        const record: EventListener = event => {
          const relatedTarget = (event as FocusEvent).relatedTarget;
          trace.probes.push({ ...snapshot(), type: event.type,
            phase: trace.phase, targetIsEditor: event.target === state.editor, trusted: event.isTrusted,
            relatedTarget: relatedTarget instanceof Element ? relatedTarget.tagName : null });
        };
        state.editor.addEventListener('blur', record, true);
        state.editor.addEventListener('focusout', record, true);
        window.selectVirtualHydrationDisposal = { trace, stop() {
          state.editor.removeEventListener('blur', record, true);
          state.editor.removeEventListener('focusout', record, true);
        } };
        const promise = state.dispose();
        trace.afterCall = snapshot();
        await promise;
        trace.afterAwait = snapshot();
        trace.phase = 'disposed';
      });
      await expect(page.locator('[data-select-virtual-case]')).toHaveCount(0);
      await expect(page.locator('.ant-select-dropdown')).toHaveCount(0);
      const disposed = {
        events: disposedEvents,
        rootConnected: false,
        editorConnected: false,
        ownerConnected: false
      };
      expect(await page.evaluate(() => window.selectVirtualHydrationDisposal!.trace)).toEqual({
        phase: 'disposed', before: {
          events,
          rootConnected: true,
          editorConnected: true,
          ownerConnected: true
        },
        afterCall: disposed, afterAwait: disposed,
        probes: ['blur', 'focusout'].map(type => ({ events: type === 'focusout' ? disposedEvents : events,
          rootConnected: true, editorConnected: true, ownerConnected: true, type,
          phase: 'disposing', targetIsEditor: true, trusted: true, relatedTarget: null }))
      });
      const resources = () => page.evaluate(() => ({
        cleaned: window.selectVirtualHydration!.cleaned,
        observers: window.selectVirtualHydrationResources!.observers(), mutations: window.selectVirtualHydrationResources!.mutations(),
        frames: window.selectVirtualHydrationResources!.frames(), timers: window.selectVirtualHydrationResources!.timers(),
        events: window.selectVirtualHydration!.events()
      }));
      const noResources = { cleaned: {
        root: true,
        editor: true,
        control: true,
        publicRoot: true,
        publicEditor: true
      },
        observers: 0, mutations: 0, frames: 0, timers: 0, events: disposedEvents };
      expect(await resources()).toEqual(noResources);
      await page.setViewportSize({ width: 1120, height: 860 });
      await page.evaluate(() => {
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('scroll'));
      });
      await page.waitForTimeout(0);
      expect(await resources()).toEqual(noResources);
      await page.waitForTimeout(1000);
      expect(await resources()).toEqual(noResources);
    } finally {
      await identity.dispose();
      await page.evaluate(() => window.selectVirtualHydrationDisposal?.stop());
    }
  });
}
