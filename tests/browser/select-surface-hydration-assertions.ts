import assert from 'node:assert/strict';
import type { Page } from '@playwright/test';
import { readSelectSurface } from './select-surface-metrics';
import { readSelectSurfaceStyleHistoryHydration } from './select-surface-hydration-metrics.mjs';
import { drainSelectSurface } from './select-surface-driver';
import { normalizedSelectSurfaceAuthoredProps, verifySelectSurfaceCSRCalls,
  verifySelectSurfaceEventGraph } from './select-surface-assertions';
import { verifyBorder, type NativeStyleHistoryOwner, type NativeStyleHistoryPoint } from './select-surface-style-history-native-assertions';
import type { SelectSurfaceHydrationSourceCase } from './select-surface-hydration-reference';
import { selectSurfaceHydrationSemanticSample } from './fixtures/select-surface-hydration-cases';

export async function settleSelectSurfaceHydration(page: Page): Promise<NativeStyleHistoryPoint> {
  let previous = '', stable = 0;
  for (let attempt = 0; attempt < 90; attempt++) {
    await drainSelectSurface(page);
    const dom = await page.evaluate(readSelectSurface);
    const border = await page.evaluate(readSelectSurfaceStyleHistoryHydration);
    const owner = await page.evaluate(() => window.selectSurfaceHydration!.read()) as NativeStyleHistoryOwner;
    const point = { dom, border, owner }, key = JSON.stringify(point);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) {
      return point;
    }
    previous = key;
  }
  throw Error('Hydrated surface styles and public owner did not settle');
}
export function verifySelectSurfaceHydrationPoint(
  actual: NativeStyleHistoryPoint,
  original: SelectSurfaceHydrationSourceCase['initial'] | SelectSurfaceHydrationSourceCase['steps'][number],
  entry: SelectSurfaceHydrationSourceCase,
  label: string
) {
  assert.deepEqual({ phase: actual.owner.phase, open: actual.owner.open, model: actual.owner.model,
    rawModel: actual.owner.rawModel, maps: actual.owner.maps },
  { phase: original.owner.phase, open: original.owner.open, model: original.owner.model,
    rawModel: original.owner.rawModel, maps: original.owner.maps }, `${label} actual owner values and CSS object maps`);
  assert.deepEqual(normalizedSelectSurfaceAuthoredProps(actual.owner.authoredProps),
    normalizedSelectSurfaceAuthoredProps(original.owner.authoredProps), `${label} complete authored public props`);
  assert.deepEqual(
    actual.owner.events,
    entry.events.slice(0, original.owner.eventCount),
    `${label} complete event prefix`
  );
  assert.equal(
    actual.owner.rawEvents.length,
    original.owner.rawEventCount,
    `${label} complete raw event prefix`
  );
  for (const [index, event] of actual.owner.rawEvents.entries()) verifySelectSurfaceEventGraph(
    event,
    entry.rawEvents[index],
    `${label}/rawEvent${index}`
  );
  verifySelectSurfaceCSRCalls(actual.owner.calls, entry.producerCalls.slice(
    0,
    original.owner.callCount
  ),
    selectSurfaceHydrationSemanticSample(entry), label);
  assert.deepEqual(actual.dom.view.leaks, [], `${label} public styling attributes consumed`);
  verifyBorder(actual.border.root, original.border.root, `${label}/root`);
  verifyBorder(actual.border.input, original.border.input, `${label}/input`);
  if (entry.control === 'select' && !entry.producers && !original.owner.open && original.border.popup) {
    // We save the previous default-popup unmount without changing the Source history of root/input or the newly opened popup.
    assert.equal(actual.border.popup, null, `${label} existing Native default popup lifetime`);
  }
  else {
    assert.equal(
      Boolean(actual.border.popup),
      Boolean(original.border.popup),
      `${label} actual popup presence`
    );
    if (original.border.popup) verifyBorder(
      actual.border.popup!,
      original.border.popup,
      `${label}/popup`
    );
  }
}
