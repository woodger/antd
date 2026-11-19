import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer as createHttpServer } from 'node:http';
import { createServer, type ViteDevServer } from 'vite';
import { test, expect } from './test';
import reference from './fixtures/ant-design-tree-select-inert-api-reference.json' with { type: 'json' };
import { treeSelectInertApiSamples, type TreeSelectInertApiMode } from './fixtures/tree-select-inert-api-cases';
import { readTreeSelectInertApi } from './tree-select-inert-api-metrics';
import { treeSelectInertApiNativeExpected } from './tree-select-inert-api-native';

interface InertApiDisposeSnapshot {
  ledger: unknown[][];
  rootConnected: boolean;
  editorConnected: boolean;
}
interface InertApiDisposeTrace {
  phase: 'disposing' | 'disposed';
  before: InertApiDisposeSnapshot;
  afterCall: InertApiDisposeSnapshot | null;
  afterAwait: InertApiDisposeSnapshot | null;
  probes: Array<InertApiDisposeSnapshot & { type: string; phase: 'disposing' | 'disposed';
    targetIsEditor: boolean; trusted: boolean; relatedTarget: string | null }>;
}
declare global {
  interface Window {
    inertApiResources?: { observers: () => number; frames: () => number };
    inertApiDisposal?: { trace: InertApiDisposeTrace; stop: () => void };
  }
}

let server: ViteDevServer;
let cache: string;
test.use({ viewport: reference.reference.viewport });
test.beforeAll(async () => {
  cache = await mkdtemp(join(
    fileURLToPath(new URL('../../.upstream/artifacts/', import.meta.url)),
    'tree-select-inert-hydration-'
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

test('TreeSelect strictly hydrates inert props and preserves its focused editor and public refs through live updates', async ({ page }) => {
  const sample = treeSelectInertApiSamples.find(sample => sample.id === 'inert-live-controls')!;
  const source = reference.cases.find(entry => entry.id === sample.id)!;
  const module = await server.ssrLoadModule(fileURLToPath(new URL(
    './fixtures/tree-select-inert-api-hydration.server.ts',
    import.meta.url
  )));
  const rendered = module.renderTreeSelectInertApi();
  await page.clock.install();
  await page.goto('/tree-select-inert-api-hydration.html');
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
    window.inertApiResources = { observers: () => [...observers].reduce(
      (count, targets) => count + targets.size,
      0
    ),
      frames: () => frames.size };
    const outside = document.querySelector<HTMLInputElement>('[aria-label="Inert API outside draft"]')!;
    outside.value = 'Outside inert hydration draft';
    outside.setSelectionRange(1, 10);
  }, { head: rendered.head, body: rendered.body });
  await page.addScriptTag({ type: 'module', url: '/tree-select-inert-api-hydration.client.ts' });
  await page.waitForFunction(() => window.treeSelectInertApiHydration);

  await expect(page.locator('[data-inert-api-case]')).toHaveAttribute(
    'data-inert-api-bound',
    'true'
  );
  const read = () => page.evaluate(readTreeSelectInertApi);

  await expect.poll(read).toEqual(treeSelectInertApiNativeExpected(source.initial, sample));
  expect(await page.evaluate(() => {
    const state = window.treeSelectInertApiHydration!, refs = state.refs();
    return { root: refs.root === state.root, editor: refs.editor === state.editor,
      parent: state.editor.parentNode === state.editorParent,
      sameRoot: document.querySelector('[data-inert-api-case] .ant-select') === state.root,
      sameEditor: state.root.querySelector('input[role="combobox"]') === state.editor,
      outside: state.outside.value, outsideSelection: [state.outside.selectionStart, state.outside.selectionEnd] };
  })).toEqual({ root: true, editor: true, parent: true, sameRoot: true, sameEditor: true,
    outside: 'Outside inert hydration draft', outsideSelection: [1, 10] });

  const editor = page.locator('#inert-api-field');
  await editor.click();
  await editor.fill('Hydrated search');
  await editor.evaluate(node => {
    if (!(node instanceof HTMLInputElement)) {
      throw Error('Expected native TreeSelect editor');
    }
    node.setSelectionRange(1, 4);
  });

  await expect(page.locator('.ant-tree-select-dropdown')).toBeVisible();
  const events = await page.evaluate(() => window.treeSelectInertApiHydration!.events());

  expect(events).toEqual([['focus'], ['open', true], ['search', 'Hydrated search']]);
  const identity = await page.evaluateHandle(() => {
    const state = window.treeSelectInertApiHydration!, refs = state.refs();
    return { control: refs.control, focus: refs.control?.focus, blur: refs.control?.blur,
      scrollTo: refs.control?.scrollTo, popup: document.querySelector('.ant-tree-select-dropdown') };
  });

  expect(await identity.evaluate(old => ({
    focus: typeof old.focus,
    blur: typeof old.blur,
    scrollTo: typeof old.scrollTo
  })))
    .toEqual({ focus: 'function', blur: 'function', scrollTo: 'function' });
  try {
    for (const mode of ['undefined', 'empty', 'omitted', 'live'] satisfies TreeSelectInertApiMode[]) {
      await page.evaluate(mode => window.treeSelectInertApiHydration!.update(mode), mode);
      const sourceStep = source.steps.find(step => step.action.type === 'props' && step.action.mode === mode)!;
      const expected = treeSelectInertApiNativeExpected(sourceStep.view, sample);
      await expect.poll(read, { message: mode }).toEqual({
        ...expected, query: 'Hydrated search', focused: true, caret: [1, 4], events
      });
      expect(await identity.evaluate(old => {
        const state = window.treeSelectInertApiHydration!, refs = state.refs();
        return { root: refs.root === state.root, editor: refs.editor === state.editor,
          parent: state.editor.parentNode === state.editorParent,
          sameRoot: document.querySelector('[data-inert-api-case] .ant-select') === state.root,
          sameEditor: state.root.querySelector('input[role="combobox"]') === state.editor,
          control: refs.control === old.control,
          focus: refs.control?.focus === old.focus, blur: refs.control?.blur === old.blur,
          scrollTo: refs.control?.scrollTo === old.scrollTo,
          popup: document.querySelector('.ant-tree-select-dropdown') === old.popup,
          outside: state.outside.value, outsideSelection: [state.outside.selectionStart, state.outside.selectionEnd] };
      })).toEqual({ root: true, editor: true, parent: true, sameRoot: true, sameEditor: true,
        control: true, focus: true, blur: true, scrollTo: true, popup: true,
        outside: 'Outside inert hydration draft', outsideSelection: [1, 10] });
    }
    await page.evaluate(() => window.treeSelectInertApiHydration!.refs().control!.focus({ preventScroll: true }));
    expect(await page.evaluate(() => window.treeSelectInertApiHydration!.events())).toEqual(events);
    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue('Hydrated search');
    expect(await editor.evaluate(node => {
      if (!(node instanceof HTMLInputElement)) {
        throw Error('Expected native TreeSelect editor');
      }
      return [node.selectionStart, node.selectionEnd];
    })).toEqual([1, 4]);
    await page.evaluate(async () => {
      const state = window.treeSelectInertApiHydration!;
      const snapshot = (): InertApiDisposeSnapshot => ({
        ledger: JSON.parse(JSON.stringify(state.events())),
        rootConnected: state.root.isConnected, editorConnected: state.editor.isConnected
      });
      const trace: InertApiDisposeTrace = { phase: 'disposing', before: snapshot(),
        afterCall: null, afterAwait: null, probes: [] };
      const record = (event: FocusEvent) => trace.probes.push({ ...snapshot(), type: event.type,
        phase: trace.phase, targetIsEditor: event.target === state.editor, trusted: event.isTrusted,
        relatedTarget: event.relatedTarget instanceof Element ? event.relatedTarget.tagName : null });
      state.editor.addEventListener('blur', record, true);
      state.editor.addEventListener('focusout', record, true);
      window.inertApiDisposal = { trace, stop() {
        state.editor.removeEventListener('blur', record, true);
        state.editor.removeEventListener('focusout', record, true);
      } };
      const pending = state.dispose();
      trace.afterCall = snapshot();
      await pending;
      trace.afterAwait = snapshot();
      trace.phase = 'disposed';
    });
    expect(await page.evaluate(() => window.treeSelectInertApiHydration!.cleaned))
      .toEqual({ root: true, editor: true, control: true });
    expect(await page.evaluate(() => {
      const state = window.treeSelectInertApiHydration!;
      return { root: state.root.isConnected, editor: state.editor.isConnected };
    })).toEqual({ root: false, editor: false });
    await expect(page.locator('[data-inert-api-case]')).toHaveCount(0);
    await expect(page.locator('[popover]')).toHaveCount(0);
    await page.setViewportSize({ width: 1080, height: 900 });
    await page.evaluate(() => {
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('scroll'));
    });
    // Продвигаем часы за blur/close timers, чтобы проверить настоящий поздний ledger после unmount.
    await page.clock.runFor(1000);
    const disposal = await page.evaluate(() => window.inertApiDisposal!.trace);
    const disposed = { ledger: [...events, ['blur']], rootConnected: false, editorConnected: false };
    // Native unmount синхронно вызывает один blur, пока editor ещё подключён; после await callbacks отсутствуют.
    expect(disposal).toEqual({
      phase: 'disposed', before: { ledger: events, rootConnected: true, editorConnected: true },
      afterCall: disposed, afterAwait: disposed,
      probes: ['blur', 'focusout'].map(type => ({ ledger: events, rootConnected: true, editorConnected: true,
        type, phase: 'disposing', targetIsEditor: true, trusted: true, relatedTarget: null }))
    });
    expect(await page.evaluate(() => ({ observers: window.inertApiResources!.observers(),
      frames: window.inertApiResources!.frames(), events: window.treeSelectInertApiHydration!.events() })))
      .toEqual({ observers: 0, frames: 0, events: disposal.afterAwait!.ledger });
  } finally {
    await page.evaluate(() => window.inertApiDisposal?.stop());
    await identity.dispose();
  }
});
