import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer as createHttpServer } from 'node:http';
import { createServer, type ViteDevServer } from 'vite';
import { test, expect } from './test';
import { selectOwnStyleInitSamples, selectOwnStyleInitEntryPaths, selectOwnStyleInitGeometry,
  selectOwnStyleInitPrehydrateSetters } from './select-components-own-style-init-cases.mjs';
import { readSelectComponentsOwnStyleInitCase } from './select-components-own-style-init-reference';
import { initializeSelectOwnStyleProbe, readSelectIcons, readSelectOwnStyleDetails } from './select-components-own-style-init-metrics.mjs';
import { actNativeOwnStyle, readNativeOwnStylePoint, settleNativeOwnStylePoint, verifyOwnStylePoint,
  verifyOwnStyleParsed, ownStyleSSRMarker, ownStyleThemeBoundary, ownStyleNativePrivateBoundary, ownStyleParsedBoundary, ownStylePopupBoundary, ownStyleHydratedWrapperBoundary, type NativeOwnStyleOwner } from './select-components-own-style-init-assertions';
import { verifyOwnStyleSSR } from './select-components-own-style-init-ssr-assertions';
import { prepareSelectSurface, drainSelectSurface } from './select-surface-driver';
import { createSelectSurfaceRecorder } from './select-surface-producers.mjs';
import { verifySelectSurfaceEventGraph } from './select-surface-assertions';
interface Counts { createdPorts: number; closedPorts: number; activePorts: number }
declare global {
  interface Window { ownStyleNativeChecks: { counts(): Counts; focusouts: unknown[] } }
}
function trackOwnStyleNative() {
  const NativeMessageChannel = window.MessageChannel, active = new Set<MessagePort>();
  let createdPorts = 0, closedPorts = 0;
  window.MessageChannel = class extends NativeMessageChannel {
    constructor() {
      super();
      for (const port of [this.port1, this.port2]) {
      createdPorts++;
      active.add(port);
      const close = port.close.bind(port);
      port.close = () => {
        close();
        if (active.delete(port)) closedPorts++;
      };
    }
    }
  };
  const focusouts: unknown[] = [];
  document.addEventListener('focusout', event => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || target.getAttribute('data-select-icons-component') !== 'input:element') {
      return;
    }
    const refs = window.raw?.current.readRefs(), owner = window.raw?.current.read() as NativeOwnStyleOwner | undefined;
    focusouts.push({ type: event.type, target: target.tagName, connected: target.isConnected,
      publicEditor: refs?.editor === target, publicRootConnected: refs?.root?.isConnected ?? false,
      relatedTarget: event.relatedTarget instanceof Element ? event.relatedTarget.tagName : null,
      activeElement: document.activeElement?.tagName, alive: owner?.alive, open: owner?.open });
  }, true);
  window.ownStyleNativeChecks = {
    counts: () => ({ createdPorts, closedPorts, activePorts: active.size }),
    focusouts
  };
}
let server: ViteDevServer, cache: string;
test.use({ viewport: selectOwnStyleInitGeometry.viewport });
test.setTimeout(180000);
test.beforeAll(async () => {
  cache = await mkdtemp(join(
    fileURLToPath(new URL('../../.upstream/artifacts/', import.meta.url)),
    'select-own-style-ssr-'
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
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
for (const sample of selectOwnStyleInitSamples) for (const entryPath of selectOwnStyleInitEntryPaths)
  test(`own CSS ${sample.id}/${entryPath}`, async ({ page }, testInfo) => {
    const entry = readSelectComponentsOwnStyleInitCase(sample.id, entryPath);
    const trace: unknown[] = [], failures: string[] = [];
    const diagnostics: unknown[] = [], networkFailures: unknown[] = [];
    page.on('console', message => {
      if (['warning', 'error'].includes(message.type())) {
        diagnostics.push({
          type: message.type(),
          text: message.text()
        });
      }
    });
    page.on(
      'requestfailed',
      request => networkFailures.push({ url: request.url(), failure: request.failure() })
    );
    page.on('response', response => {
      if (response.status() >= 400) {
        networkFailures.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    const verify = (
      actual: Parameters<typeof verifyOwnStylePoint>[0],
      source: Parameters<typeof verifyOwnStylePoint>[1],
      phase: string
    ) => {
      trace.push({
        phase,
        actual,
        source,
        boundaries: [ownStyleThemeBoundary, ownStyleNativePrivateBoundary, ...(actual.details.popup ? [ownStylePopupBoundary] : []), ...(entry.entryPath !== 'csr' && sample.control === 'select' ? [ownStyleHydratedWrapperBoundary] : [])]
      });
      failures.push(...verifyOwnStylePoint(actual, source, entry, phase));
    };
    const physical = async () => ({ details: await page.evaluate(readSelectOwnStyleDetails), icons: await page.evaluate(readSelectIcons),
      owner: await page.evaluate(() => window.raw.current.read() as Record<string, unknown>) });
    const marker = async (phase: string, expected: number) => {
      const value = await page.evaluate(name => [...document.querySelectorAll(`[${name}]`)].map(node => ({
        tag: node.tagName, value: node.getAttribute(name), root: node.matches('.ant-select'),
        editor: node.matches('input,textarea'), owner: Boolean(node.closest('[data-surface-case]')) })), ownStyleSSRMarker);
      trace.push({ phase: phase + '/private-SSR-marker', actual: value });
      expect(value).toEqual(Array.from(
        { length: expected },
        () => ({ tag: 'DIV', value: '', root: true, editor: false, owner: true })
      ));
    };
    let loaded = false, disposed = false;
    try {
      await page.addInitScript(trackOwnStyleNative);
      await page.goto(`/select-components-own-style.html?sample=${sample.id}&entryPath=${entryPath}`);
      await page.addScriptTag({
        type: 'module',
        url: '/select-components-own-style.styles.client.ts'
      });
      await page.evaluate(() => document.fonts.ready);
      if (entryPath !== 'csr') {
        const module = await server.ssrLoadModule(fileURLToPath(new URL(
          './fixtures/select-components-own-style.server.ts',
          import.meta.url
        )));
        const rendered = module.renderSelectComponentsOwnStyle(sample.id);
        expect(rendered.domFree).toBe(true);
        assert(entry.server && entry.parsed && entry.beforeHydration && entry.commit && entry.afterCall);
        for (const [method, source] of Object.entries(entry.server)) verifyOwnStyleSSR(
          rendered.body,
          rendered.state,
          rendered.refs,
          source,
          sample,
          `${sample.id}/${method}`
        );
        trace.push({
          phase: 'actual-public-DOM-free-SSR',
          rendered,
          headSha256: hash(rendered.head),
          bodySha256: hash(rendered.body)
        });
        await page.evaluate(({ head, body }) => {
          document.head.insertAdjacentHTML('beforeend', head);
          document.getElementById('root')!.innerHTML = body;
        }, { head: rendered.head, body: rendered.body });
        await page.evaluate(initializeSelectOwnStyleProbe, entryPath);
        const rawHTML = await page.locator('#root').innerHTML();
        trace.push({ phase: 'actual-parsed-SSR-HTML', rawHTML, sha256: hash(rawHTML) });
        const parsed = await physical();
        trace.push({
          phase: 'parsed',
          actual: parsed,
          source: entry.parsed,
          boundary: ownStyleParsedBoundary
        });
        verifyOwnStyleParsed(parsed, entry.parsed, 'parsed');
        await marker('parsed', 1);
        const edits = selectOwnStyleInitPrehydrateSetters(entryPath);
        expect(edits).toEqual(entry.prehydrateEdits);
        await page.evaluate(edits => {
          const editor = window.ownStyleProbe.parsed.editor;
          if (!editor) {
            throw Error('Parsed real editor absent');
          }
          for (const edit of edits) editor.style[edit.property as 'fontSize'] = edit.value;
        }, edits);
        const dirty = await physical();
        trace.push({
          phase: 'before-hydration',
          actual: dirty,
          source: entry.beforeHydration,
          boundary: ownStyleParsedBoundary
        });
        verifyOwnStyleParsed(dirty, entry.beforeHydration, 'before-hydration');
        await marker('before-hydration', 1);
      }
      await page.addScriptTag({ type: 'module', url: '/select-components-own-style.client.ts' });
      loaded = true;
      await page.waitForFunction(() => window.ownStyleProbe.ready === true);
      if (entryPath !== 'csr') {
        const phases = await page.evaluate(() => ({
          afterCall: window.ownStyleProbe.afterCall,
          commit: window.ownStyleProbe.commit
        }));
        trace.push({ phase: 'raw-hydrate-return', actual: phases.afterCall, source: entry.afterCall,
          boundary: 'react-async-hydrateRoot-return-vs-svelte-synchronous-hydrate-return' });
        assert(phases.commit && entry.commit);
        verify(phases.commit as Parameters<typeof verify>[0], entry.commit, 'commit');
      }
      await marker('client-commit', 0);
      await prepareSelectSurface(page);
      verify(await settleNativeOwnStylePoint(page), entry.initial, 'initial');
      for (const [index, step] of entry.steps.entries()) {
        expect(step.action).toEqual(sample.actions[index]);
        await actNativeOwnStyle(page, step.action);
        verify(
          await settleNativeOwnStylePoint(page),
          step,
          `${index}/${JSON.stringify(step.action)}`
        );
      }
      const before = await readNativeOwnStylePoint(page);
      verify(before, entry.beforeUnmount, 'before-unmount');
      await page.evaluate(() => window.ownStyleProbe.dispose!());
      disposed = true;
      await drainSelectSurface(page);
      const cleanup = async () => page.evaluate(() => {
        const observer = window.raw as unknown as { iconsObserver: { retained: Map<number, Node> } };
        return { owner: window.raw.current.read() as NativeOwnStyleOwner,
          refs: Object.fromEntries(Object.entries(window.raw.current.readRefs()).map(([key, value]) => [key, value == null])),
          retained: [...observer.iconsObserver.retained].map(([id, node]) => ({
            id,
            connected: node.isConnected
          })),
          popupCount: document.querySelectorAll('.ant-select-dropdown').length, ownerCount: document.querySelectorAll('[data-surface-case]').length,
          ports: window.ownStyleNativeChecks.counts(), focusouts: window.ownStyleNativeChecks.focusouts };
      });
      const removed = await cleanup();
      trace.push({ phase: 'cleanup', actual: removed, source: entry.cleanup });
      expect(removed.popupCount).toBe(0);
      expect(removed.ownerCount).toBe(0);
      expect(removed.owner.alive).toBe(false);
      expect(removed.retained.every(node => !node.connected)).toBe(true);
      expect(Object.values(removed.refs).every(Boolean)).toBe(true);
      expect(removed.owner.lifecycle).toEqual([...before.owner.lifecycle, {
        slot: 'input',
        event: 'detach',
        tag: null,
        observation: null
      }]);
      expect(removed.owner.calls).toEqual(before.owner.calls);
      // Source does not cause blur when deleted. Native preserves the previous synchronous focusout
      // yet connected root/editor at both.
      expect(entry.cleanup.events).toEqual(entry.events);
      expect(entry.cleanup.rawEvents).toEqual(entry.rawEvents);
      expect(entry.cleanup.producerCalls).toEqual(entry.producerCalls);
      expect(entry.late.events).toEqual(entry.cleanup.events);
      {
        const target = sample.control === 'autocomplete' ? 'TEXTAREA' : 'INPUT';
        const recorder = createSelectSurfaceRecorder(), payload = { type: 'focusout', key: undefined, defaultPrevented: false,
          propagationStopped: false, target, currentTarget: 'DIV' };
        const args = ['public-blur', payload];
        expect(removed.owner.events).toEqual([...before.owner.events, recorder.encode(args)]);
        expect(removed.owner.rawEvents.slice(0, -1)).toEqual(before.owner.rawEvents);
        verifySelectSurfaceEventGraph(
          removed.owner.rawEvents.at(-1),
          recorder.raw(args),
          'exact connected-removal raw blur'
        );
        expect(removed.focusouts).toEqual([{ type: 'focusout', target, connected: true, publicEditor: true,
          publicRootConnected: true, relatedTarget: null, activeElement: 'BODY', alive: true, open: true }]);
      }
      expect(removed.ports.activePorts).toBe(0);
      expect(removed.ports.closedPorts).toBe(removed.ports.createdPorts);
      await page.waitForTimeout(1000);
      const late = await cleanup();
      trace.push({ phase: 'late', actual: late, source: entry.late });
      expect(late).toEqual(removed);
      await marker('late', 0);
      expect(diagnostics).toEqual([]);
      expect(networkFailures).toEqual([]);
      expect(failures).toEqual([]);
    } finally {
      if (loaded && !disposed) await page.evaluate(() => window.ownStyleProbe.dispose?.());
      await testInfo.attach('actual-own-css-complete-raw.json.gz', {
        body: gzipSync(
          JSON.stringify(
            { sample, entryPath, trace, failures, diagnostics, networkFailures },
            null,
            2
          ),
          { level: 9 }
        ),
        contentType: 'application/gzip'
      });
    }
  });
