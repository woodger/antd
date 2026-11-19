import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer as createHttpServer } from 'node:http';
import { createServer, type ViteDevServer } from 'vite';
import { test, expect } from './test';
import { selectDataReference as reference, selectDataNativeCase } from './select-data-reference';
import { readSelectDataAriaIntegrity } from './select-data-native';
import { selectDataSamples } from './fixtures/select-data-cases';
import { actSelectData, prepareSelectData } from './select-data-driver';
import { settleSelectData as settle, verifySelectData } from './select-data-assertions';

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
    selectDataHydrationResources?: {
      observers: () => number; mutations: () => number; frames: () => number; timers: () => number; ports: () => number;
    };
    selectDataHydrationDisposal?: { trace: DisposeTrace; stop: () => void };
  }
}

let server: ViteDevServer;
let cache: string;
test.use({ viewport: reference.reference.viewport });
test.beforeAll(async () => {
  cache = await mkdtemp(join(
    fileURLToPath(new URL('../../.upstream/artifacts/', import.meta.url)),
    'select-data-hydration-'
  ));
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

for (const sample of selectDataSamples.filter(sample => ['select-keys-and-index', 'select-multiple-callbacks',
  'auto-complete-empty-disabled-groups', 'auto-complete-all-four-mapped'].includes(sample.id))) {
  test(`${sample.id} strictly hydrates raw data, stable refs and cleanup`, async ({ page }) => {
    const act = actSelectData;
    const source = selectDataNativeCase(reference.cases.find(entry => entry.id === sample.id)!);
    const module = await server.ssrLoadModule(fileURLToPath(new URL(
      './fixtures/select-data-hydration.server.ts',
      import.meta.url
    )));
    const rendered = module.renderSelectData(sample.id);
    await page.goto(`/select-data-hydration.html?sample=${sample.id}`);
    await page.addScriptTag({ type: 'module', url: '/select-data-styles.client.ts' });
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
      const ports = new Set<MessagePort>();
      const Channel = window.MessageChannel;
      window.MessageChannel = class extends Channel {
        constructor() {
          super();
          for (const port of [this.port1, this.port2]) {
            ports.add(port);
            const close = port.close.bind(port);
            port.close = () => {
              ports.delete(port);
              close();
            };
          }
        }
      };
      window.selectDataHydrationResources = {
        observers: () => [...observers].reduce((sum, targets) => sum + targets.size, 0),
        mutations: () => mutations.size, frames: () => frames.size, timers: () => timers.size, ports: () => ports.size
      };
      const outside = document.querySelector<HTMLInputElement>('[aria-label="Data outside draft"]')!;
      outside.value = 'Outside data draft';
      outside.setSelectionRange(2, 9);
    }, { head: rendered.head, body: rendered.body });
    await page.addScriptTag({ type: 'module', url: '/select-data-hydration.client.ts' });
    await page.waitForFunction(() => window.selectDataHydration);

    await expect(page.locator('[data-select-data-case]')).toHaveAttribute(
      'data-select-data-bound',
      'true'
    );
    await prepareSelectData(page);
    const identity = await page.evaluateHandle(() => {
      const state = window.selectDataHydration!;
      const refs = state.refs();
      return { outer: state.outer, root: state.root, editor: state.editor, parent: state.parent,
        control: refs.control, publicRoot: refs.publicRoot, publicEditor: refs.publicEditor,
        focus: refs.control?.focus, blur: refs.control?.blur, scrollTo: refs.control?.scrollTo, outside: state.outside };
    });
    const bindings = () => identity.evaluate(old => {
      const state = window.selectDataHydration!;
      const refs = state.refs();
      return { outer: old.outer === document.querySelector('.select-data-control'),
        root: old.root === refs.root, editor: old.editor === refs.editor, parent: old.parent === refs.editor?.parentNode,
        control: old.control === refs.control, publicRoot: old.publicRoot === refs.publicRoot,
        publicEditor: old.publicEditor === refs.publicEditor,
        focus: old.focus === refs.control?.focus, blur: old.blur === refs.control?.blur,
        scrollTo: old.scrollTo === refs.control?.scrollTo,
        formData: [...new FormData(document.querySelector<HTMLFormElement>('[data-select-data-form]')!)],
        outsideValue: old.outside.value, outsideCaret: [old.outside.selectionStart, old.outside.selectionEnd] };
    });
    const expectedBindings = (model: unknown, query: unknown) => {
      const tagged = model as { type: string; value?: string; items?: Array<{ value: string }> };
      const values = sample.family === 'auto-complete' ? [query]
        : tagged.type === 'array' ? tagged.items!.map(item => item.value)
        : [tagged.type === 'string' ? tagged.value : ''];
      return { outer: true, root: true, editor: true, parent: true,
        control: true, publicRoot: true, publicEditor: true, focus: true, blur: true, scrollTo: true,
        formData: values.map(value => ['data-selection', value]),
        outsideValue: 'Outside data draft', outsideCaret: [2, 9] };
    };
    try {
      const initial = await settle(page);
      expect(await page.evaluate(() => window.selectDataHydration!.initialCaret)).toEqual([0, 0]);
      verifySelectData(initial, source.initial, sample, `${sample.id}/hydrated-initial`);
      expect(await page.evaluate(readSelectDataAriaIntegrity)).toBe(true);
      expect(await bindings()).toEqual(expectedBindings(initial.view.model, initial.view.query));
      expect(await page.evaluate(() => ({
        value: window.selectDataHydration!.editor.value,
        caret: [window.selectDataHydration!.editor.selectionStart, window.selectDataHydration!.editor.selectionEnd]
      }))).toEqual(await page.evaluate(() => ({
        value: window.selectDataHydration!.initialValue, caret: window.selectDataHydration!.initialCaret
      })));
      for (const step of source.steps) {
        await act(page, step.action);
        const actual = await settle(page);
        verifySelectData(actual, step, sample, `${sample.id}/${JSON.stringify(step.action)}`);
        expect(await page.evaluate(readSelectDataAriaIntegrity)).toBe(true);
        expect(await bindings()).toEqual(expectedBindings(actual.view.model, actual.view.query));
      }
      expect(source.cleanup.callbacks).toEqual(source.steps.at(-1)!.view.events);
      if (sample.id === 'select-multiple-callbacks') {
        // Дополнительная Native lifecycle boundary: mapped grouped multiple after hydration.
        await act(page, { type: 'props', set: { dataset: 'mapped', mapping: 'mapped' } });
        await act(page, { type: 'click' });
        await act(page, { type: 'choose', text: 'Beta' });
        const mapped = await settle(page);
        expect(mapped.view.model).toEqual({ type: 'array', items: [{ type: 'string', value: 'b' }] });
        expect(mapped.view.selected).toEqual([{
          label: 'Beta',
          title: 'Beta',
          disabled: false,
          remove: true
        }]);
        expect(await bindings()).toEqual(expectedBindings(mapped.view.model, mapped.view.query));
        expect(await page.evaluate(readSelectDataAriaIntegrity)).toBe(true);
        const original = reference.cases.find(entry => entry.id === 'select-all-four-mapped')!;
        const beta = (original.steps[1].raw.eventArguments as unknown[][]).find(event => event[0] === 'select')![2];
        const selected = (mapped.raw.eventArguments as unknown[][]).findLast(event => event[0] === 'select')!;
        // Actual same raw Beta record/descriptors; single vs multiple keeps onSelect scalar.
        expect(selected).toEqual(['select', { type: 'string', value: 'b' },
          { ...(beta as object), ownProperties: (beta as { ownProperties: Array<{ key: string }> }).ownProperties
            .filter(property => property.key !== 'props') }]);
      }

      // Existing Native Select/AC connected blur closes the owner on focused disposal.
      // The Source sequence above is complete before this independent Native lifecycle check.
      await page.evaluate(() => window.selectDataHydration!.refs().control!.focus({ preventScroll: true }));
      await actSelectData(page, { type: 'open', value: true });
      const before = await settle(page);
      const repeatedSelection = (source.steps.at(-1)!.view.events as unknown[][]).findLast(event => event[0] === 'select');
      const events = sample.family === 'auto-complete' ? [...before.view.events, repeatedSelection!] : before.view.events;
      const disposedEvents = [...events, ['open', false]];
      expect(await page.evaluate(() => document.activeElement === window.selectDataHydration!.editor)).toBe(true);
      const queuedPorts = await page.evaluate(async family => {
        const state = window.selectDataHydration!;
        const owner = document.querySelector('[data-select-data-case]')!;
        if (family === 'auto-complete') {
          // Reselect the current raw option and dispose before its queued close can run.
          const row = [...document.querySelectorAll<HTMLButtonElement>('.ant-select-item-option')]
            .find(row => row.dataset.auditOption === state.query());
          if (!row) {
            throw Error('The current mapped selection must have a physical option');
          }
          row.click();
        }
        const queuedPorts = window.selectDataHydrationResources!.ports();
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
        window.selectDataHydrationDisposal = { trace, stop() {
          state.editor.removeEventListener('blur', record, true);
          state.editor.removeEventListener('focusout', record, true);
        } };
        const promise = state.dispose();
        trace.afterCall = snapshot();
        await promise;
        trace.afterAwait = snapshot();
        trace.phase = 'disposed';
        return queuedPorts;
      }, sample.family);
      expect(queuedPorts).toBe(sample.family === 'auto-complete' ? 2 : 0);
      await expect(page.locator('[data-select-data-case]')).toHaveCount(0);
      await expect(page.locator('.ant-select-dropdown')).toHaveCount(0);
      const disposed = {
        events: disposedEvents,
        rootConnected: false,
        editorConnected: false,
        ownerConnected: false
      };
      expect(await page.evaluate(() => window.selectDataHydrationDisposal!.trace)).toEqual({
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
        cleaned: window.selectDataHydration!.cleaned,
        observers: window.selectDataHydrationResources!.observers(), mutations: window.selectDataHydrationResources!.mutations(),
        frames: window.selectDataHydrationResources!.frames(), timers: window.selectDataHydrationResources!.timers(),
        ports: window.selectDataHydrationResources!.ports(),
        events: window.selectDataHydration!.events()
      }));
      const noResources = { cleaned: {
        root: true,
        editor: true,
        control: true,
        publicRoot: true,
        publicEditor: true
      },
        observers: 0, mutations: 0, frames: 0, timers: 0, ports: 0, events: disposedEvents };
      expect(await resources()).toEqual(noResources);
      await page.setViewportSize({ width: 1120, height: 860 });
      await page.evaluate(() => {
        const state = window.selectDataHydration!;
        state.root.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        state.editor.dispatchEvent(new InputEvent('input', { bubbles: true, data: 'late' }));
        state.editor.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' }));
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('scroll'));
      });
      await page.waitForTimeout(0);
      expect(await resources()).toEqual(noResources);
      await page.waitForTimeout(1000);
      expect(await resources()).toEqual(noResources);
    } finally {
      await identity.dispose();
      await page.evaluate(() => window.selectDataHydrationDisposal?.stop());
    }
  });
}
