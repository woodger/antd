import type { Page } from '@playwright/test';
import { prepareSelectSurface, drainSelectSurface } from './select-surface-driver';
import { readSelectIcons, readSelectResponsiveOverflow, readSelectCustomTagPrefix,
  type SelectCustomTagPrefixOwner, type SelectCustomTagPrefixNode } from './select-components-responsive-tag-prefix-metrics.mjs';
import type { SelectCustomTagPrefixSample, SelectCustomTagPrefixAction } from './select-components-responsive-tag-prefix-cases.mjs';
export interface ResponsiveTagPrefixNativePoint {
  icons: ReturnType<typeof readSelectIcons>; overflow: ReturnType<typeof readSelectResponsiveOverflow>;
  customTagsPrefix: ReturnType<typeof readSelectCustomTagPrefix>;
  owner: Omit<SelectCustomTagPrefixOwner, 'events' | 'rawEvents' | 'calls' | 'lifecycle' | 'bodyActivity' | 'componentObservations'> & {
    eventCount: number; rawEventCount: number; producerCount: number; lifecycleCount: number; bodyActivityCount: number; componentObservationCount: number;
  };
}
export async function settleNativeResponsiveTagPrefix(page: Page): Promise<ResponsiveTagPrefixNativePoint> {
  let previous = '', stable = 0, prior: ResponsiveTagPrefixNativePoint | null = null, latest: ResponsiveTagPrefixNativePoint | null = null;
  for (let attempt = 0; attempt < 90; attempt++) {
    await drainSelectSurface(page);
    const icons = await page.evaluate(readSelectIcons), overflow = await page.evaluate(readSelectResponsiveOverflow);
    const customTagsPrefix = await page.evaluate(readSelectCustomTagPrefix);
    const owner = await page.evaluate(() => {
      const { events, rawEvents, calls, lifecycle, bodyActivity, componentObservations, ...state } = window.customTagPrefixNative.read();
      return { ...state, eventCount: events.length, rawEventCount: rawEvents.length, producerCount: calls.length,
        lifecycleCount: lifecycle.length, bodyActivityCount: bodyActivity.length, componentObservationCount: componentObservations.length };
    });
    const actual = { icons, overflow, customTagsPrefix, owner }, encoded = JSON.stringify(actual);
    stable = previous === encoded ? stable + 1 : 0;
    if (stable >= 3) {
      return actual;
    }
    previous = encoded;
    prior = latest;
    latest = actual;
  }
  throw Object.assign(
    Error('Actual public custom-tag/prefix consumer did not settle'),
    { observation: { prior, latest } }
  );
}
export async function openNativeResponsiveTagPrefix(
  page: Page,
  sample: SelectCustomTagPrefixSample
) {
  await page.goto('/select-components-responsive-tag-prefix.html?sample=' + encodeURIComponent(sample.id));
  await page.addScriptTag({
    type: 'module',
    url: '/select-components-responsive-tag-prefix.client.ts'
  });
  await page.waitForFunction(() => window.customTagPrefixNative?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  await prepareSelectSurface(page);
}
export async function actNativeResponsiveTagPrefix(
  page: Page,
  sample: SelectCustomTagPrefixSample,
  action: SelectCustomTagPrefixAction,
  index: number
) {
  if (action.type === 'caller-width' || action.type === 'caller-prefix-width' || action.type === 'caller-tag-width' || action.type === 'prefix') {
    await page.evaluate(
      ({ action, index }) => window.customTagPrefixNative.update(action, index),
      { action, index }
    );
  }
  else if (action.type === 'fill') {
    const handle = await page.evaluateHandle(() => window.customTagPrefixNative.readRefs().editor), editor = handle.asElement();
    if (!editor) {
      throw Error('Actual bound/custom editor ref required');
    }
    try { await editor.fill(action.text); } finally { await handle.dispose(); }
  }
  else if (action.type === 'custom-tag-close') {
    if (action.activation !== 'pointer') {
      throw Error('Frozen close action requires an actual pointer');
    }
    await page.locator('[data-surface-case="' + sample.id + '"] [data-custom-tag-close="' + action.value + '"]').click();
  }
  else {
    throw Error('Unknown frozen custom-tag/prefix action');
  }
  await page.mouse.move(0, 0);
}
export function readNativeResponsiveTagPrefixLedger(page: Page) {
  return page.evaluate(() => {
    const { events, rawEvents, calls, lifecycle, bodyActivity, componentObservations } = window.customTagPrefixNative.read();
    return {
      events,
      rawEvents,
      producerCalls: calls,
      lifecycle,
      bodyActivity,
      componentObservations
    };
  });
}
export type ResponsiveTagPrefixNativeLedger = Awaited<ReturnType<typeof readNativeResponsiveTagPrefixLedger>>;
export function readNativeResponsiveTagPrefixCleanup(page: Page) {
  return page.evaluate(() => {
    const observer = (globalThis as unknown as { raw: { iconsObserver: { retained: Map<number, Node> } } }).raw.iconsObserver;
    return { owner: window.customTagPrefixNative.read(),
      retainedConnected: [...observer.retained].map(([identity, node]) => ({
        identity,
        connected: node.isConnected
      })),
      popupCount: document.querySelectorAll('.ant-select-dropdown').length, ownerCount: document.querySelectorAll('[data-surface-case]').length,
      refs: Object.fromEntries(Object.entries(window.customTagPrefixNative.readRefs()).map(([key, value]) => [key, value == null])),
      browserOwnedResourceCounters: {
        measured: false,
        observers: null,
        mutations: null,
        frames: null,
        timers: null,
        ports: null
      },
      resourceTiming: performance.getEntriesByType('resource').map(entry => entry.toJSON()) };
  });
}
export type ResponsiveTagPrefixNativeCleanup = Awaited<ReturnType<typeof readNativeResponsiveTagPrefixCleanup>>;
export type ResponsiveTagPrefixPhysicalNode = SelectCustomTagPrefixNode;
export async function installNativeResponsiveTagPrefixFocusoutProbe(page: Page) {
  await page.evaluate(() => {
    const initial = window.customTagPrefixNative.readRefs();
    if (!initial.root || !initial.editor) {
      throw Error('Readonly focusout probe needs actual initial public bindings');
    }
    const initialRoot = initial.root, initialEditor = initial.editor, events: unknown[] = [];
    const describe = (node: EventTarget | null) => node instanceof Node ? { nodeType: node.nodeType, name: node.nodeName,
      connected: node.isConnected, initialRoot: node === initialRoot, initialEditor: node === initialEditor } : null;
    const listener = (event: FocusEvent) => {
      if (event.target !== initialEditor && !(event.target instanceof Node && initialRoot.contains(event.target))) {
        return;
      }
      const refs = window.customTagPrefixNative.readRefs(), owner = window.customTagPrefixNative.read();
      events.push({ type: event.type, target: describe(event.target), observerCurrentTarget: describe(event.currentTarget),
        relatedTarget: describe(event.relatedTarget), activeElement: describe(document.activeElement),
        initialRoot: describe(initialRoot), initialEditor: describe(initialEditor),
        actualRefs: Object.fromEntries(Object.entries(refs).map(([key, value]) => [key, value instanceof Node ? describe(value) : value == null ? null : typeof value])),
        owner: { alive: owner.alive, open: owner.open, query: owner.query }, defaultPrevented: event.defaultPrevented,
        propagationStopped: event.cancelBubble, eventPhase: event.eventPhase });
    };
    document.addEventListener('focusout', listener, true);
    Object.assign(
      window,
      { responsiveTagPrefixFocusoutProbe: {
        events,
        release: () => document.removeEventListener('focusout', listener, true)
      } }
    );
  });
}
export function readNativeResponsiveTagPrefixFocusoutProbe(page: Page) {
  return page.evaluate(() => (window as unknown as { responsiveTagPrefixFocusoutProbe?: { events: unknown[] } }).responsiveTagPrefixFocusoutProbe?.events ?? []);
}
export function releaseNativeResponsiveTagPrefixFocusoutProbe(page: Page) {
  return page.evaluate(() => (window as unknown as { responsiveTagPrefixFocusoutProbe?: { release(): void } }).responsiveTagPrefixFocusoutProbe?.release());
}
