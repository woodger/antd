import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer as createHttpServer } from 'node:http';
import { createServer, type ViteDevServer } from 'vite';
import { test, expect } from './test';
import { selectValueReference as reference, selectValueNativeCase } from './select-value-reference';
import { selectValueSamples } from './fixtures/select-value-cases';
import { actSelectValue, prepareSelectValue } from './select-value-driver';
import { actSelectValueLive } from './select-value-live-driver';
import { settleSelectValue as settle, verifySelectValue } from './select-value-assertions';

type OwnerState = ReturnType<NonNullable<Window['selectValueHydration']>['read']>;
interface DisposeSnapshot {
  state: OwnerState;
  rootConnected: boolean;
  editorConnected: boolean;
  ownerConnected: boolean;
  popupConnected: boolean;
}
interface DisposeTrace {
  phase: 'disposing' | 'disposed';
  before: DisposeSnapshot;
  afterCall: DisposeSnapshot | null;
  afterAwait: DisposeSnapshot | null;
  probes: Array<DisposeSnapshot & { type: string; phase: 'disposing' | 'disposed';
    targetIsEditor: boolean; trusted: boolean; relatedTarget: string | null }>;
}
declare global {
  interface Window {
    selectValueHydrationResources?: {
      observers: () => number; mutations: () => number; frames: () => number; timers: () => number; ports: () => number;
    };
    selectValueHydrationDisposal?: { trace: DisposeTrace; popup: HTMLElement; holder: HTMLElement | null; stop: () => void };
  }
}

// Decode the frozen public model, never a rendered label. Labels may be snippets,
// arrays or false; successful native form controls always submit raw values.
function rawFormValues(model: unknown): string[] {
  if (!model || typeof model !== 'object') throw Error('Expected an encoded Select model');
  const type = Reflect.get(model, 'type');
  if (type === 'undefined' || type === 'null') return [];
  if (type === 'string') return [String(Reflect.get(model, 'value'))];
  if (type === 'number') return [String(Number(Reflect.get(model, 'value')))];
  if (type === 'array') {
    const items: unknown = Reflect.get(model, 'items');
    if (!Array.isArray(items)) throw Error('Expected an encoded Select model array');
    return items.flatMap(rawFormValues);
  }
  if (type === 'object') {
    const entries: unknown = Reflect.get(model, 'entries');
    if (!Array.isArray(entries)) throw Error('Expected an encoded labeled Select model');
    const value: unknown = entries.find(entry => Array.isArray(entry) && entry[0] === 'value');
    if (!Array.isArray(value)) throw Error('A labeled Select model must contain its raw value');
    return rawFormValues(value[1]);
  }
  throw Error(`Unexpected encoded Select model kind: ${String(type)}`);
}

let server: ViteDevServer;
let cache: string;
test.use({ viewport: reference.reference.viewport });
test.beforeAll(async () => {
  cache = await mkdtemp(join(fileURLToPath(new URL('../../.upstream/artifacts/', import.meta.url)), 'select-value-hydration-'));
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

const ids = ['select-value-supplied-rich', 'select-value-multiple-rich', 'select-value-rendered-label-remove',
  'select-value-default-label-snapshot', 'select-value-styled', 'select-value-filtered-selected-style'];
for (const id of ids) {
  test(`${id} strictly hydrates selected values, stable refs and complete disposal`, async ({ page }) => {
    const sample = selectValueSamples.find(sample => sample.id === id)!;
    const source = selectValueNativeCase(reference.cases.find(entry => entry.id === id)!);
    const module = await server.ssrLoadModule(fileURLToPath(new URL('./fixtures/select-value-hydration.server.ts', import.meta.url)));
    const rendered = module.renderSelectValue(id);
    expect(rendered.domFree).toBe(true);
    await page.goto(`/select-value-hydration.html?sample=${id}`);
    await page.addScriptTag({ type: 'module', url: '/select-value-hydration.styles.client.ts' });
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
      const ports = new Set<MessagePort>();
      const Channel = window.MessageChannel;
      window.MessageChannel = class extends Channel {
        constructor() {
          super();
          for (const port of [this.port1, this.port2]) {
            ports.add(port);
            const close = port.close.bind(port);
            port.close = () => { ports.delete(port); close(); };
          }
        }
      };
      window.selectValueHydrationResources = {
        observers: () => [...observers].reduce((sum, targets) => sum + targets.size, 0),
        mutations: () => mutations.size, frames: () => frames.size, timers: () => timers.size, ports: () => ports.size
      };
      const outside = document.querySelector<HTMLInputElement>('[aria-label="Value outside draft"]')!;
      outside.value = 'Outside value draft';
      outside.setSelectionRange(2, 9);
    }, { head: rendered.head, body: rendered.body });
    const form = () => page.locator('[data-select-value-form]')
      .evaluate((node: HTMLFormElement) => [...new FormData(node)]);
    const expectedForm = (model: unknown) => {
      const values = rawFormValues(model);
      return (sample.mode ? values : [values[0] ?? '']).map(value => ['value-selection', value]);
    };
    expect(await form()).toEqual(expectedForm(source.initial.view.model));
    await page.addScriptTag({ type: 'module', url: '/select-value-hydration.client.ts' });
    await page.waitForFunction(() => window.selectValueHydration);
    await expect(page.locator('[data-select-value-case]')).toHaveAttribute('data-select-value-bound', 'true');
    await prepareSelectValue(page);
    const identity = await page.evaluateHandle(() => {
      const state = window.selectValueHydration!;
      const refs = state.refs();
      return { owner: state.owner, outer: state.outer, root: state.root, content: state.content, editor: state.editor,
        parent: state.parent, control: refs.control, publicRoot: refs.publicRoot, publicEditor: refs.publicEditor,
        focus: refs.control?.focus, blur: refs.control?.blur, scrollTo: refs.control?.scrollTo, outside: state.outside };
    });
    const bindings = () => identity.evaluate(old => {
      const state = window.selectValueHydration!;
      const refs = state.refs();
      return { owner: old.owner === document.querySelector('[data-select-value-case]'),
        outer: old.outer === document.querySelector('.select-value-control'), root: old.root === refs.root,
        content: old.content === old.root.querySelector('.ant-select-content'),
        editor: old.editor === refs.editor, parent: old.parent === refs.editor?.parentNode,
        control: old.control === refs.control, publicRoot: old.publicRoot === refs.publicRoot,
        publicEditor: old.publicEditor === refs.publicEditor,
        focus: old.focus === refs.control?.focus, blur: old.blur === refs.control?.blur,
        scrollTo: old.scrollTo === refs.control?.scrollTo,
        outside: old.outside === document.querySelector('[aria-label="Value outside draft"]'),
        outsideValue: old.outside.value, outsideCaret: [old.outside.selectionStart, old.outside.selectionEnd] };
    });
    const expectedBindings = { owner: true, outer: true, root: true, content: true, editor: true, parent: true,
      control: true, publicRoot: true, publicEditor: true, focus: true, blur: true, scrollTo: true,
      outside: true, outsideValue: 'Outside value draft', outsideCaret: [2, 9] };
    try {
      expect(await page.evaluate(() => window.selectValueHydration!.initialNodes)).toEqual({
        owner: true, outer: true, root: true, content: true, editor: true, parent: true,
        rich: true, tags: true, fields: true
      });
      // DOM-free SSR supplies markup, not geometry. Compare actual geometry only
      // after strict hydration against the frozen original client-rendered trace.
      // Native's parsed SSR value attribute starts with caret 0; hydration keeps
      // that position instead of the end position produced by a CSR value setter.
      const initial = await settle(page);
      verifySelectValue(initial, source.initial, sample, `${id}/hydrated-initial`, { hydratedInitial: true });
      expect(await bindings()).toEqual(expectedBindings);
      expect(await page.evaluate(() => ({ value: window.selectValueHydration!.editor.value,
        caret: [window.selectValueHydration!.editor.selectionStart, window.selectValueHydration!.editor.selectionEnd] })))
        .toEqual(await page.evaluate(() => ({ value: window.selectValueHydration!.initialValue,
          caret: window.selectValueHydration!.initialCaret })));
      for (const step of source.steps) {
        await actSelectValueLive(page, step.action);
        const actual = await settle(page);
        verifySelectValue(actual, step, sample, `${id}/hydrated/${JSON.stringify(step.action)}`);
        expect(await bindings()).toEqual(expectedBindings);
        expect(await form()).toEqual(expectedForm(step.view.model));
      }
      expect(source.cleanup.callbacks).toEqual(source.steps.at(-1)!.view.events);

      // The complete Source sequence ends above. This independently preserves
      // Native connected-blur disposal while measurement work is pending.
      await page.evaluate(() => window.selectValueHydration!.refs().control!.focus({ preventScroll: true }));
      await actSelectValue(page, { type: 'open', value: true });
      await settle(page);
      expect(await bindings()).toEqual(expectedBindings);
      expect(await page.evaluate(() => document.activeElement === window.selectValueHydration!.editor)).toBe(true);
      const pending = await page.evaluate(async () => {
        const state = window.selectValueHydration!;
        const popup = document.querySelector<HTMLElement>('.ant-select-dropdown')!;
        if (!popup?.isConnected) throw Error('Disposal must interrupt a connected open popup');
        const snapshot = (): DisposeSnapshot => ({ state: JSON.parse(JSON.stringify(state.read())),
          rootConnected: state.root.isConnected, editorConnected: state.editor.isConnected,
          ownerConnected: state.owner.isConnected, popupConnected: popup.isConnected });
        const trace: DisposeTrace = { phase: 'disposing', before: snapshot(), afterCall: null, afterAwait: null, probes: [] };
        const record: EventListener = event => {
          const relatedTarget = (event as FocusEvent).relatedTarget;
          trace.probes.push({ ...snapshot(), type: event.type, phase: trace.phase,
            targetIsEditor: event.target === state.editor, trusted: event.isTrusted,
            relatedTarget: relatedTarget instanceof Element ? relatedTarget.tagName : null });
        };
        state.editor.addEventListener('blur', record, true);
        state.editor.addEventListener('focusout', record, true);
        window.selectValueHydrationDisposal = { trace, popup,
          holder: popup.querySelector('.ant-select-dropdown-list-holder'), stop() {
          state.editor.removeEventListener('blur', record, true);
          state.editor.removeEventListener('focusout', record, true);
        } };
        state.refs().control!.scrollTo({ index: 1, align: 'top' });
        // Both events enqueue alignment microtasks. Unmount runs in the same
        // stack, before those invalidations or the popup's queued frame run.
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('scroll'));
        const pending = { frames: window.selectValueHydrationResources!.frames(),
          observers: window.selectValueHydrationResources!.observers() };
        const promise = state.dispose();
        trace.afterCall = snapshot();
        await promise;
        trace.afterAwait = snapshot();
        trace.phase = 'disposed';
        return pending;
      });
      expect(pending.frames).toBeGreaterThan(0);
      expect(pending.observers).toBeGreaterThan(0);
      const trace = await page.evaluate(() => window.selectValueHydrationDisposal!.trace);
      const before = trace.before;
      expect(before).toMatchObject({ rootConnected: true, editorConnected: true, ownerConnected: true, popupConnected: true });
      const disposedState: OwnerState = { ...before.state, open: false,
        events: [...before.state.events, ['open', false]], rawEvents: [...before.state.rawEvents, ['open', false]] };
      const disposed: DisposeSnapshot = { state: disposedState,
        rootConnected: false, editorConnected: false, ownerConnected: false, popupConnected: false };
      expect(trace).toEqual({ phase: 'disposed', before, afterCall: disposed, afterAwait: disposed,
        probes: ['blur', 'focusout'].map(type => ({ ...before, state: type === 'blur' ? before.state : disposedState,
          type, phase: 'disposing', targetIsEditor: true, trusted: true, relatedTarget: null })) });
      await expect(page.locator('[data-select-value-case]')).toHaveCount(0);
      await expect(page.locator('.ant-select-dropdown')).toHaveCount(0);
      expect(await form()).toEqual([]);
      const resources = () => page.evaluate(() => ({
        cleaned: window.selectValueHydration!.cleaned, state: window.selectValueHydration!.read(),
        observers: window.selectValueHydrationResources!.observers(), mutations: window.selectValueHydrationResources!.mutations(),
        frames: window.selectValueHydrationResources!.frames(), timers: window.selectValueHydrationResources!.timers(),
        ports: window.selectValueHydrationResources!.ports()
      }));
      const noResources = { cleaned: { root: true, editor: true, control: true, publicRoot: true, publicEditor: true },
        state: disposedState, observers: 0, mutations: 0, frames: 0, timers: 0, ports: 0 };
      expect(await resources()).toEqual(noResources);
      await page.setViewportSize({ width: 1120, height: 860 });
      await page.evaluate(() => {
        const state = window.selectValueHydration!;
        state.root.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        state.root.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        state.editor.value = 'Late detached query';
        state.editor.dispatchEvent(new InputEvent('input', { bubbles: true, data: 'late' }));
        state.editor.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' }));
        state.command.dispatchEvent(new CustomEvent('valueupdate', {
          detail: { type: 'props', set: { renderer: 'rich', labelInValue: 'true' } }
        }));
        const disposal = window.selectValueHydrationDisposal!;
        disposal.holder?.dispatchEvent(new Event('scroll'));
        disposal.popup.dispatchEvent(new WheelEvent('wheel', { deltaY: 40, bubbles: true }));
        disposal.popup.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        state.outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        state.outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        state.outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new WheelEvent('wheel', { deltaY: 40, bubbles: true }));
      });
      await page.waitForTimeout(0);
      expect(await resources()).toEqual(noResources);
      await page.waitForTimeout(1000);
      expect(await resources()).toEqual(noResources);
    } finally {
      await page.evaluate(async () => {
        window.selectValueHydrationDisposal?.stop();
        const state = window.selectValueHydration;
        if (state && !state.cleaned) await state.dispose();
      });
      await identity.dispose();
    }
  });
}
