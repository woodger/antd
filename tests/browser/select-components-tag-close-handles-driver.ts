import type { Page } from '@playwright/test';
import { prepareSelectSurface, drainSelectSurface } from './select-surface-driver';
import { readSelectTagCloseHandleDOM } from './select-components-tag-close-handles-metrics.mjs';
import type { SelectTagCloseHandleSample } from './select-components-tag-close-handles-cases.mjs';
import type { NativeOwner, NativePoint, NativeLedger } from './select-components-tag-close-handles-assertions';
export async function openTagCloseHandles(page: Page, sample: SelectTagCloseHandleSample) {
  const cached = sample.id === 'select-close-handles-cached-option';
  await page.goto('/select-components-tag-close-handles.html?sample=' + encodeURIComponent(sample.id));
  await page.addScriptTag({
    type: 'module',
    url: cached ? '/select-components-tag-close-handles-cached-option.client.ts' : '/select-components-tag-close-handles.client.ts'
  });
  await page.waitForFunction(() => window.tagCloseHandlesNative?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  await prepareSelectSurface(page);
}
export async function settleTagCloseHandles(page: Page): Promise<NativePoint> {
  let previous = '', stable = 0, prior: NativePoint | null = null, latest: NativePoint | null = null;
  for (let attempt = 0; attempt < 90; attempt++) {
    await drainSelectSurface(page);
    const dom = await page.evaluate(readSelectTagCloseHandleDOM);
    const owner = await page.evaluate(() => {
      const {
        events,
        rawEvents,
        calls,
        invocations,
        retention,
        lifecycle,
        bodyActivity,
        componentObservations,
        ...state
      } = window.tagCloseHandlesNative.read();
      return { ...state, eventCount: events.length, rawEventCount: rawEvents.length, producerCount: calls.length,
        invocationCount: invocations.length, retentionCount: retention.length, lifecycleCount: lifecycle.length,
        bodyActivityCount: bodyActivity.length, componentObservationCount: componentObservations.length };
    });
    const point = { dom, owner } as unknown as NativePoint, next = JSON.stringify(point);
    stable = previous === next ? stable + 1 : 0;
    if (stable >= 3) {
      return point;
    }
    previous = next;
    prior = latest;
    latest = point;
  }
  throw Object.assign(
    Error('Actual public callback owner did not settle'),
    { observation: { prior, latest } }
  );
}
export async function clickTagCloseHandleButton(page: Page, id: string, index: number) {
  await page.evaluate(
    ({ id, index }) => window.tagCloseHandlesNative.click(id, index),
    { id, index }
  );
}
export async function readTagCloseHandleLedger(page: Page): Promise<NativeLedger> {
  return await page.evaluate(() => {
    const {
      events,
      rawEvents,
      calls,
      invocations,
      retention,
      lifecycle,
      bodyActivity,
      componentObservations
    } = window.tagCloseHandlesNative.read();
    return {
      events,
      rawEvents,
      producerCalls: calls,
      invocations,
      retention,
      lifecycle,
      bodyActivity,
      componentObservations
    };
  }) as unknown as NativeLedger;
}
export interface NativeCleanup {
  owner: NativeOwner; refs: Record<string, boolean>; ownerCount: number; popupCount: number;
  retainedConnected: Array<{
    identity: number;
    connected: boolean;
    ownedAtFirstObservation: boolean
  }>;
  browserOwnedResourceCounters: {
    measured: false;
    observers: null;
    mutations: null;
    frames: null;
    timers: null;
    ports: null
  };
}
export async function readTagCloseHandleCleanup(page: Page): Promise<NativeCleanup> {
  return await page.evaluate(() => {
    const state = window as unknown as { raw: { handlesDOM: {
      retained: Map<number, Node>;
      ownedAtFirstObservation: Map<number, boolean>
    } } };
    const dom = state.raw.handlesDOM;
    return { owner: window.tagCloseHandlesNative.read(),
      refs: Object.fromEntries(Object.entries(window.tagCloseHandlesNative.readRefs()).map(([name, node]) => [name, node == null])),
      retainedConnected: [...dom.retained].map(([identity, node]) => ({
        identity,
        connected: node.isConnected,
        ownedAtFirstObservation: dom.ownedAtFirstObservation.get(identity)!
      })),
      ownerCount: document.querySelectorAll('[data-handles-case]').length, popupCount: document.querySelectorAll('.ant-select-dropdown').length,
      browserOwnedResourceCounters: {
        measured: false,
        observers: null,
        mutations: null,
        frames: null,
        timers: null,
        ports: null
      } };
  }) as unknown as NativeCleanup;
}
