import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer as createHttpServer } from 'node:http';
import { createServer, type ViteDevServer } from 'vite';
import { test, expect } from './test';
import { createSelectSurfaceRecorder } from './select-surface-producers.mjs';
import { selectSurfaceHydrationReference } from './select-surface-hydration-reference';
import { selectSurfaceHydrationSemanticSample } from './fixtures/select-surface-hydration-cases';
import { prepareSelectSurface } from './select-surface-driver';
import { settleSelectSurfaceHydration, verifySelectSurfaceHydrationPoint } from './select-surface-hydration-assertions';
import { readSelectSurfaceStyleHistoryHydration } from './select-surface-hydration-metrics.mjs';
import { readStyleHistorySSRStyles, type NativeStyleHistoryOwner } from './select-surface-style-history-native-assertions';
import { verifySelectSurfaceProducerCalls } from './select-surface-receipts';
import { verifySelectSurfaceEventGraph } from './select-surface-assertions';

interface ResourceCounts { observers: number; mutations: number; frames: number; timers: number; ports: number }
interface DisposalSnapshot {
  owner: NativeStyleHistoryOwner;
  rootConnected: boolean;
  editorConnected: boolean;
  ownerConnected: boolean;
  popupConnected: boolean;
}
interface DisposalTrace {
  phase: 'disposing' | 'disposed';
  before: DisposalSnapshot;
  afterCall: DisposalSnapshot | null;
  afterAwait: DisposalSnapshot | null;
  probes: Array<DisposalSnapshot & { type: string; phase: 'disposing' | 'disposed';
    targetIsEditor: boolean; trusted: boolean; relatedTarget: string | null }>;
}
declare global {
  interface Window {
    selectSurfaceHydrationResources?: { counts(): ResourceCounts };
    selectSurfaceHydrationDisposal?: {
      trace: DisposalTrace;
      popup: HTMLElement;
      holder: HTMLElement | null;
      stop(): void
    };
  }
}
function instrumentSurfaceResources() {
  const observers = new Set<Set<Element>>(), mutations = new Set<MutationObserver>();
  const Resize = window.ResizeObserver, Mutation = window.MutationObserver;
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
  const frames = new Set<number>(), request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
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
  const timers = new Set<number>(), browser: Window = window;
  const schedule = browser.setTimeout.bind(browser), clear = browser.clearTimeout.bind(browser);
  browser.setTimeout = (handler, timeout, ...args) => {
    if (typeof handler !== 'function') {
      throw Error('Expected function surface hydration timer');
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
  const ports = new Set<MessagePort>(), Channel = window.MessageChannel;
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
  window.selectSurfaceHydrationResources = { counts: () => ({
    observers: [...observers].reduce((sum, targets) => sum + targets.size, 0), mutations: mutations.size,
    frames: frames.size, timers: timers.size, ports: ports.size
  }) };
}

let server: ViteDevServer;
let cache: string;
test.use({ viewport: { width: 1200, height: 900 } });
test.beforeAll(async () => {
  cache = await mkdtemp(join(
    fileURLToPath(new URL('../../.upstream/artifacts/', import.meta.url)),
    'select-surface-hydration-'
  ));
  server = await createServer({ configFile: fileURLToPath(new URL(
    './vite.config.ts',
    import.meta.url
  )),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
    appType: 'custom', cacheDir: cache });
});
test.afterAll(async () => {
  await server?.close();
  if (cache) await rm(cache, { recursive: true, force: true });
});

for (const entry of selectSurfaceHydrationReference.cases) {
  test(`${entry.id} strictly hydrates surface nodes, CSS history and complete disposal`, async (
    { page },
    testInfo
  ) => {
    const trace: unknown[] = [], failures: string[] = [];
    const module = await server.ssrLoadModule(fileURLToPath(new URL(
      './fixtures/select-surface-hydration.server.ts',
      import.meta.url
    )));
    const rendered = module.renderSelectSurfaceHydration(entry.id) as {
      head: string;
      body: string;
      domFree: boolean;
      state: NativeStyleHistoryOwner
    };

    expect(rendered.domFree).toBe(true);
    for (const source of Object.values(entry.server)) {
      expect({ maps: rendered.state.maps, model: rendered.state.model, open: rendered.state.open,
        events: rendered.state.events, rawEvents: rendered.state.rawEvents })
        .toEqual({ maps: source.state.maps, model: source.state.model, open: source.state.open,
          events: source.state.events, rawEvents: source.state.rawEvents });
      verifySelectSurfaceProducerCalls(
        rendered.state.calls,
        source.state.calls,
        selectSurfaceHydrationSemanticSample(entry)
      );
      expect(readStyleHistorySSRStyles(rendered.body)).toEqual(readStyleHistorySSRStyles(source.rawHtml));
    }
    await page.goto(`/select-surface-hydration.html?sample=${entry.id}`);
    await page.addScriptTag({ type: 'module', url: '/select-surface-hydration.styles.client.ts' });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(({ head, body }) => {
      document.head.insertAdjacentHTML('beforeend', head);
      document.getElementById('root')!.innerHTML = body;
      const outside = document.querySelector<HTMLInputElement>('[aria-label="Surface outside draft"]')!;
      outside.value = 'Outside surface draft';
      outside.setSelectionRange(2, 9);
      const owner = document.querySelector<HTMLElement>('[data-surface-case]')!;
      const root = owner.querySelector<HTMLElement>('.ant-select')!;
      const command = owner.querySelector<HTMLElement>('[data-surface-command]')!;
      // Before hydrate, public refs are not yet attached; the adapter only reads the already disassembled nodes.
      const refs = (event: Event) => Object.assign((event as CustomEvent).detail,
        { root, editor: root.querySelector('input[role="combobox"]') });
      command.addEventListener('surfacerefs', refs);
      command.addEventListener(
        'parsedrefsstop',
        () => command.removeEventListener('surfacerefs', refs),
        { once: true }
      );
    }, { head: rendered.head, body: rendered.body });
    const parsed = await page.evaluate(readSelectSurfaceStyleHistoryHydration);
    trace.push({ label: 'actual-parsed-native-SSR', actual: parsed });
    for (const target of ['root', 'input'] as const) {
      expect(parsed[target].inlineBorder).toEqual(entry.parsed.border[target].inlineBorder);
      expect(parsed[target].inlineProperties.filter(property => /^border(?:-|$)/.test(property.name)))
        .toEqual(entry.parsed.border[target].inlineProperties.filter(property => /^border(?:-|$)/.test(property.name)));
    }
    await page.evaluate(() => document.querySelector('[data-surface-command]')!.dispatchEvent(new Event('parsedrefsstop')));
    await page.evaluate(instrumentSurfaceResources);
    await page.addScriptTag({ type: 'module', url: '/select-surface-hydration.client.ts' });
    await page.waitForFunction(() => window.selectSurfaceHydration);

    await expect(page.locator('[data-surface-case]')).toHaveAttribute('data-surface-bound', 'true');
    await prepareSelectSurface(page);
    const identity = await page.evaluateHandle(() => {
      const state = window.selectSurfaceHydration!, refs = state.refs();
      return { owner: state.owner, outer: state.outer, root: state.root, content: state.content, editor: state.editor,
        parent: state.parent, command: state.command, outside: state.outside, control: refs.control,
        focus: refs.control?.focus, blur: refs.control?.blur, scrollTo: refs.control?.scrollTo };
    });
    const bindings = () => identity.evaluate(before => {
      const state = window.selectSurfaceHydration!, refs = state.refs();
      return { owner: before.owner === document.querySelector('[data-surface-case]'),
        outer: before.outer === document.querySelector('.surface-control'), root: before.root === refs.root,
        content: before.content === refs.root?.querySelector('.ant-select-content'), editor: before.editor === refs.editor,
        parent: before.parent === refs.editor?.parentNode, command: before.command === document.querySelector('[data-surface-command]'),
        control: before.control === refs.control, publicRoot: before.root === refs.publicRoot, publicEditor: before.editor === refs.publicEditor,
        focus: before.focus === refs.control?.focus, blur: before.blur === refs.control?.blur, scrollTo: before.scrollTo === refs.control?.scrollTo,
        outside: before.outside === document.querySelector('[aria-label="Surface outside draft"]'),
        outsideValue: before.outside.value, outsideCaret: [before.outside.selectionStart, before.outside.selectionEnd] };
    });
    const expectedBindings = { owner: true, outer: true, root: true, content: true, editor: true, parent: true,
      command: true, control: true, publicRoot: true, publicEditor: true, focus: true, blur: true, scrollTo: true,
      outside: true, outsideValue: 'Outside surface draft', outsideCaret: [2, 9] };
    const verify = async (source: typeof entry.initial | typeof entry.steps[number], label: string) => {
      const actual = await settleSelectSurfaceHydration(page);
      trace.push({ label, actual });
      try {
        verifySelectSurfaceHydrationPoint(actual, source, entry, label);
      }
      catch (error) {
        failures.push(String(error));
      }
      expect(await bindings(), label).toEqual(expectedBindings);
    };
    try {
      expect(await page.evaluate(() => window.selectSurfaceHydration!.initialNodes)).toEqual({
        owner: true, outer: true, root: true, content: true, editor: true, parent: true, command: true, prefix: true
      });
      expect(await page.evaluate(() => {
        const state = window.selectSurfaceHydration!;
        return {
          value: state.editor.value,
          caret: [state.editor.selectionStart, state.editor.selectionEnd]
        };
      })).toEqual(await page.evaluate(() => {
        const state = window.selectSurfaceHydration!;
        return { value: state.initialValue, caret: state.initialCaret };
      }));
      await verify(entry.initial, 'hydrated-initial');
      for (const [index, step] of entry.steps.entries()) {
        if (step.action.type === 'click') {
          await identity.evaluateHandle(before => before.root)
            .then(async handle => {
              try {
              await handle.asElement()!.click();
            } finally {
              await handle.dispose();
            }
            });
        }
        else if (step.action.type === 'outside') {
          await page.locator('[data-surface-outside]').click();
        }
        else {
          await page.evaluate(action => document.querySelector('[data-surface-command]')!
            .dispatchEvent(new CustomEvent('historyupdate', { detail: action })), step.action);
        }
        await page.mouse.move(0, 0);
        await verify(step, `${index}/${JSON.stringify(step.action)}`);
      }

      // The full Source sequence is finished; below is a separate check of Native connected-blur disposal.
      await page.evaluate(() => window.selectSurfaceHydration!.refs().control!.focus({ preventScroll: true }));
      const root = await identity.evaluateHandle(before => before.root);
      // Checks the click on the original node and frees up the retained DOM handle.
      async function clickAndReleaseRoot() {
        try { await root.asElement()!.click(); } finally { await root.dispose(); }
      }

      await clickAndReleaseRoot();
      await settleSelectSurfaceHydration(page);
      expect(await bindings()).toEqual(expectedBindings);
      expect(await page.evaluate(() => document.activeElement === window.selectSurfaceHydration!.editor)).toBe(true);
      const pending = await page.evaluate(async () => {
        const state = window.selectSurfaceHydration!, popup = document.querySelector<HTMLElement>('.ant-select-dropdown')!;
        if (!popup?.isConnected) {
          throw Error('Disposal must interrupt an actual connected popup');
        }
        const snapshot = (): DisposalSnapshot => ({ owner: JSON.parse(JSON.stringify(state.read())),
          rootConnected: state.root.isConnected, editorConnected: state.editor.isConnected,
          ownerConnected: state.owner.isConnected, popupConnected: popup.isConnected });
        const trace: DisposalTrace = {
          phase: 'disposing',
          before: snapshot(),
          afterCall: null,
          afterAwait: null,
          probes: []
        };
        const record: EventListener = event => {
          const related = (event as FocusEvent).relatedTarget;
          trace.probes.push({ ...snapshot(), type: event.type, phase: trace.phase, targetIsEditor: event.target === state.editor,
            trusted: event.isTrusted, relatedTarget: related instanceof Element ? related.tagName : null });
        };
        state.editor.addEventListener('blur', record, true);
        state.editor.addEventListener('focusout', record, true);
        window.selectSurfaceHydrationDisposal = { trace, popup, holder: popup.querySelector('.ant-select-dropdown-list-holder'),
          stop() {
            state.editor.removeEventListener('blur', record, true);
            state.editor.removeEventListener('focusout', record, true);
          } };
        state.refs().control!.scrollTo({ index: 1, align: 'top' });
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('scroll'));
        const counts = window.selectSurfaceHydrationResources!.counts();
        const promise = state.dispose();
        trace.afterCall = snapshot();
        await promise;
        trace.afterAwait = snapshot();
        trace.phase = 'disposed';
        return counts;
      });
      expect(pending.frames).toBeGreaterThan(0);
      expect(pending.observers).toBeGreaterThan(0);
      const disposal = await page.evaluate(() => window.selectSurfaceHydrationDisposal!.trace);
      trace.push({ label: 'connected-Native-disposal', actual: disposal });
      expect(disposal.before).toMatchObject({
        rootConnected: true,
        editorConnected: true,
        ownerConnected: true,
        popupConnected: true
      });
      expect(disposal.probes.map(probe => ({ type: probe.type, phase: probe.phase, targetIsEditor: probe.targetIsEditor,
        trusted: probe.trusted, relatedTarget: probe.relatedTarget }))).toEqual(['blur', 'focusout'].map(type =>
        ({ type, phase: 'disposing', targetIsEditor: true, trusted: true, relatedTarget: null })));
      const closed = createSelectSurfaceRecorder();
      const expectedEvents = [...disposal.before.owner.events, closed.encode(['open', false])];
      expect(disposal.probes[0].owner.events).toEqual(disposal.before.owner.events);
      expect(disposal.probes[1].owner.events).toEqual(expectedEvents);
      const after = disposal.afterAwait!;
      for (const snapshot of [disposal.afterCall!, after]) {
        expect(snapshot).toMatchObject({
          rootConnected: false,
          editorConnected: false,
          ownerConnected: false,
          popupConnected: false
        });
        expect(snapshot.owner.open).toBe(false);
        expect(snapshot.owner.alive).toBe(false);
        expect(snapshot.owner.events).toEqual(expectedEvents);
        expect(snapshot.owner.rawEvents).toHaveLength(disposal.before.owner.rawEvents.length + 1);
        for (const [index, value] of disposal.before.owner.rawEvents.entries()) expect(snapshot.owner.rawEvents[index]).toEqual(value);
        verifySelectSurfaceEventGraph(
          snapshot.owner.rawEvents.at(-1),
          closed.raw(['open', false]),
          'separate Native connected blur raw event'
        );
        expect(snapshot.owner.calls).toEqual(disposal.before.owner.calls);
        expect(snapshot.owner.maps).toEqual(disposal.before.owner.maps);
        expect(snapshot.owner.model).toEqual(disposal.before.owner.model);
      }
      const readCleaned = () => page.evaluate(() => ({ state: window.selectSurfaceHydration!.read(),
        cleaned: window.selectSurfaceHydration!.cleaned, resources: window.selectSurfaceHydrationResources!.counts() }));
      const expectedCleaned = { state: after.owner,
        cleaned: { root: true, editor: true, control: true, publicRoot: true, publicEditor: true },
        resources: { observers: 0, mutations: 0, frames: 0, timers: 0, ports: 0 } };
      expect(await readCleaned()).toEqual(expectedCleaned);
      await page.evaluate(() => {
        const state = window.selectSurfaceHydration!, disposal = window.selectSurfaceHydrationDisposal!;
        state.root.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        state.editor.dispatchEvent(new InputEvent('input', { bubbles: true, data: 'late' }));
        state.editor.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' }));
        state.command.dispatchEvent(new CustomEvent(
          'historyupdate',
          { detail: { type: 'color', phase: 'green' } }
        ));
        disposal.holder?.dispatchEvent(new Event('scroll'));
        disposal.popup.dispatchEvent(new WheelEvent('wheel', { deltaY: 40, bubbles: true }));
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('scroll'));
      });
      await page.waitForTimeout(0);
      expect(await readCleaned()).toEqual(expectedCleaned);
      await page.waitForTimeout(1000);
      expect(await readCleaned()).toEqual(expectedCleaned);
      expect(failures).toEqual([]);
    } finally {
      await testInfo.attach(
        'actual-select-surface-hydration-raw',
        {
          body: JSON.stringify({ id: entry.id, trace, failures }, null, 2),
          contentType: 'application/json'
        }
      );
      await page.evaluate(async () => {
        window.selectSurfaceHydrationDisposal?.stop();
        const state = window.selectSurfaceHydration;
        if (state && !state.cleaned) await state.dispose();
      });
      await identity.dispose();
    }
  });
}
