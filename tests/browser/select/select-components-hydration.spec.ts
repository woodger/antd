import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createServer as createHttpServer } from 'node:http';
import { createServer, type ViteDevServer } from 'vite';
import { test, expect } from '../test';
import { componentsHydrationHash, selectComponentsHydrationReference } from '../select-components-hydration-reference';
import { initializeSelectComponentsHydrationProbe, readSelectComponentsHydration,
  type ComponentsHydrationPoint } from '../select-components-hydration-metrics.mjs';
import { actSelectComponentsHydration, settleSelectComponentsHydration,
  verifySelectComponentsHydrationPoint, selectComponentsHydrationSSRMarker } from '../select-components-hydration-assertions';
import type { HydrationCapture } from '../fixtures/SelectComponentsHydrationCase.svelte';

interface HydrationChannelCounts { createdChannels: number; createdPorts: number; closedPorts: number; activePorts: number }
declare global {
  interface Window { selectComponentsHydrationChannels: { counts(): HydrationChannelCounts } }
}
function trackNativeHydrationChannels() {
  const NativeMessageChannel = window.MessageChannel;
  const active = new Set<MessagePort>();
  let createdChannels = 0, createdPorts = 0, closedPorts = 0;
  window.MessageChannel = class extends NativeMessageChannel {
    constructor() {
      super();
      createdChannels++;
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
  window.selectComponentsHydrationChannels = {
    counts: () => ({ createdChannels, createdPorts, closedPorts, activePorts: active.size })
  };
}

let server: ViteDevServer;
let cache: string;
test.use({ viewport: { width: 1200, height: 900 } });
test.beforeAll(async () => {
  cache = await mkdtemp(join(
    fileURLToPath(new URL('../../../.upstream/artifacts/', import.meta.url)),
    'select-components-hydration-'
  ));
  server = await createServer({ configFile: fileURLToPath(new URL(
    '../vite.config.ts',
    import.meta.url
  )),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null }, appType: 'custom', cacheDir: cache });
});
test.afterAll(async () => {
  await server?.close();
  if (cache) await rm(cache, { recursive: true, force: true });
});

for (const entry of selectComponentsHydrationReference.cases) test(`${entry.id} actual SSR→hydrate preserves field and refs`, async (
  { page },
  testInfo
) => {
  const trace: unknown[] = [], failures: string[] = [], diagnostics: unknown[] = [];
  page.on(
    'console',
    message => diagnostics.push({ level: message.type(), message: message.text() })
  );
  const module = await server.ssrLoadModule(fileURLToPath(new URL(
    '../fixtures/select-components-hydration.server.ts',
    import.meta.url
  )));
  const rendered = module.renderSelectComponentsHydration(entry.id) as {
    head: string; body: string; state: ReturnType<NonNullable<HydrationCapture['read']>>; domFree: boolean;
  };

  expect(rendered.domFree).toBe(true);
  for (const source of Object.values(entry.server)) expect(rendered.state).toEqual(source.state);
  trace.push({ phase: 'actual-native-DOM-free-SSR', rendered,
    headSha256: componentsHydrationHash(rendered.head), bodySha256: componentsHydrationHash(rendered.body),
    sourceSerializations: Object.fromEntries(Object.entries(entry.server).map(([method, source]) => [method, source.htmlSha256])) });
  const verify = (actual: ComponentsHydrationPoint, source: ComponentsHydrationPoint,
    phase: Parameters<typeof verifySelectComponentsHydrationPoint>[3], label: string) => {
    const result = verifySelectComponentsHydrationPoint(actual, source, entry, phase, label);
    trace.push({ phase: label, actual, source, boundaries: result.boundaries });
    failures.push(...result.failures);
  };
  let clientLoaded = false, disposed = false;
  const inspectMarker = async (phase: string, expected: number) => {
    const marker = await page.evaluate(name => {
      const nodes = [...document.querySelectorAll(`[${name}]`)];
      return { count: nodes.length, owners: nodes.map(node => ({ tag: node.tagName,
        value: node.getAttribute(name), hasControl: Boolean(node.closest('[data-hydration-control]')) })) };
    }, selectComponentsHydrationSSRMarker);
    trace.push({ phase: phase + '/native-private-SSR-marker', actual: marker });
    expect(marker.count, phase + ' marker count').toBe(expected);
    for (const owner of marker.owners) {
      expect(owner).toEqual({
        tag: entry.parsed.root!.tag,
        value: '',
        hasControl: true
      });
    }
  };
  try {
    await page.addInitScript(trackNativeHydrationChannels);
    await page.goto(`/select-components-hydration.html?sample=${entry.id}`);
    await page.addScriptTag({ type: 'module', url: '/select-components-hydration.styles.client.ts' });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(({ head, body }) => {
      document.head.insertAdjacentHTML('beforeend', head);
      document.getElementById('root')!.innerHTML = body;
    }, { head: rendered.head, body: rendered.body });
    await page.evaluate(initializeSelectComponentsHydrationProbe);
    const parsedHtml = await page.locator('#root').innerHTML();
    trace.push({
      phase: 'actual-parsed-native-SSR',
      rawHtml: parsedHtml,
      htmlSha256: componentsHydrationHash(parsedHtml)
    });
    verify(await page.evaluate(readSelectComponentsHydration), entry.parsed, 'parsed', 'parsed-SSR');
    await inspectMarker('parsed-SSR', 1);
    await page.evaluate(settings => {
      const editor = window.componentsHydrationProbe.parsed.editor;
      if (!editor) {
        throw Error('Real parsed SSR editor is required before hydration');
      }
      editor.value = settings.value;
      if (settings.focused) editor.focus();
      editor.setSelectionRange(...settings.selection);
    }, entry.sample.preHydration);
    verify(
      await page.evaluate(readSelectComponentsHydration),
      entry.beforeHydration,
      'dirty',
      'dirty-before-hydration'
    );
    await inspectMarker('dirty-before-hydration', 1);
    await page.addScriptTag({ type: 'module', url: '/select-components-hydration.client.ts' });
    clientLoaded = true;
    await page.waitForFunction(() => window.componentsHydrationProbe.ready === true);
    const phases = await page.evaluate(() => ({ afterCall: window.componentsHydrationProbe.afterCall,
      commit: window.componentsHydrationProbe.commitSnapshot }));
    // hydrateRoot returns before React renders; Svelte hydrate executes its
    // synchronous work before returning. Keep both actual return snapshots.
    trace.push({ phase: 'framework-hydrate-return', actual: phases.afterCall, source: entry.afterCall,
      boundary: 'react-async-hydrateRoot-return-vs-svelte-synchronous-hydrate-return' });
    if (!phases.commit) {
      throw Error('Real Native owner mount must expose its commit snapshot');
    }
    verify(phases.commit, entry.commit, 'commit', 'owner-commit');
    await inspectMarker('owner-commit', 0);
    verify(
      await settleSelectComponentsHydration(page),
      entry.initial,
      'settled',
      'hydrated-settled'
    );
    for (const [index, step] of entry.steps.entries()) {
      const immediate = await actSelectComponentsHydration(page, step.action);
      if (step.immediate) {
        if (!immediate) {
          throw Error('close-dispose must capture removal in the same browser task');
        }
        verify(immediate, step.immediate, 'removed', `${index}/removed-immediate`);
      }
      verify(
        await settleSelectComponentsHydration(page),
        step.settled,
        'settled',
        `${index}/${JSON.stringify(step.action)}`
      );
    }
    const beforeUnmount = await page.evaluate(readSelectComponentsHydration);
    verify(beforeUnmount, entry.beforeUnmount, 'settled', 'before-root-unmount');
    await page.evaluate(() => window.componentsHydrationProbe.dispose!());
    disposed = true;
    const afterUnmount = await page.evaluate(readSelectComponentsHydration);
    verify(afterUnmount, entry.afterUnmount, 'cleanup', 'after-root-unmount');
    const unmountedChannels = await page.evaluate(() => window.selectComponentsHydrationChannels.counts());
    trace.push({ phase: 'native-message-ports-after-unmount', actual: unmountedChannels });
    expect(unmountedChannels.activePorts, 'Every Native MessagePort closes after unmount').toBe(0);
    expect(unmountedChannels.closedPorts).toBe(unmountedChannels.createdPorts);
    const lateCleanup = await settleSelectComponentsHydration(page);
    verify(lateCleanup, entry.lateCleanup, 'cleanup', 'late-cleanup');
    const lateChannels = await page.evaluate(() => window.selectComponentsHydrationChannels.counts());
    trace.push({ phase: 'native-message-ports-after-late-drain', actual: lateChannels });
    expect(lateChannels.activePorts, 'No late orphan Native MessagePort').toBe(0);
    expect(lateChannels.closedPorts).toBe(lateChannels.createdPorts);
    expect(lateCleanup.owner, 'Unmounted owner remains quiescent').toEqual(afterUnmount.owner);
    await inspectMarker('late-cleanup', 0);
    const refChecks = await page.evaluate(() => window.componentsHydrationProbe.readNativeRefChecks!());
    trace.push({ phase: 'actual-public-ref-and-context-marker-checks', actual: refChecks });
    const blurChecks = await page.evaluate(() => window.componentsHydrationProbe.readNativeBlurChecks!());
    trace.push({ phase: 'actual-native-blur-metadata', actual: blurChecks });
    if (entry.id === 'select-components-hydration-ac-replace-close') {
      expect(lateChannels.createdPorts, 'The real pending-close MessageChannel route was exercised').toBeGreaterThanOrEqual(2);
      const sourceRemoved = entry.steps.at(-1)!;
      for (const point of [sourceRemoved.immediate!, sourceRemoved.settled]) {
        expect(
          point.owner!.events.some(event => Array.isArray(event) && event[0] === 'blur'),
          'Original independently has no removal blur'
        ).toBe(false);
      }
      expect(blurChecks, 'Only the existing connected-removal Native blur is retained').toEqual([{
        type: 'focusout', stack: expect.any(String), target: { tag: 'TEXTAREA', connected: true },
        currentTarget: { tag: 'DIV', connected: true }, relatedTarget: null,
        activeElement: { tag: 'BODY', connected: true }, owner: {
          slot: 'input-string',
          alive: false,
          open: true
        },
        currentTargetIsPublicRoot: true, targetIsPublicEditor: true,
        boundRoot: { tag: 'DIV', connected: true }, boundEditor: {
          tag: 'TEXTAREA',
          connected: true
        }
      }]);
      expect(afterUnmount.owner!.events).toEqual(beforeUnmount.owner!.events);
      expect(afterUnmount.owner!.open).toBe(true);
      expect(lateCleanup.owner!.events).toEqual(beforeUnmount.owner!.events);
    }
    expect(refChecks.every(check => !check.markerPresent && !check.contextHasMarker)).toBe(true);
    for (const check of refChecks) {
      if (check.contextKeys) expect(check.contextKeys).toEqual(['attributes', 'register']);
    }
    expect(failures, 'Complete Original hydration sequence').toEqual([]);
  } finally {
    if (clientLoaded && !disposed) await page.evaluate(() => window.componentsHydrationProbe.dispose?.());
    await testInfo.attach('actual-select-components-hydration-complete', {
      body: JSON.stringify({ id: entry.id, trace, failures, diagnostics }, null, 2), contentType: 'application/json'
    });
  }
});
