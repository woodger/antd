import assert from 'node:assert/strict';
import type { Page } from '@playwright/test';
import { drainSelectSurface } from './select-surface-driver';
import { readSelectSurface } from './select-surface-metrics';
import { readSelectSurfaceStyleHistory, type SelectSurfaceStyleHistoryDOM,
  type SelectSurfaceStyleHistoryNode } from './select-surface-style-history-metrics.mjs';
import type { SelectSurfaceStyleHistoryPoint, SelectSurfaceStyleHistorySourceCase } from './select-surface-style-history-native-reference';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';

export interface NativeStyleHistoryOwner {
  phase: string;
  open: boolean;
  model: unknown;
  rawModel: unknown;
  maps: unknown;
  rawMaps: unknown;
  authoredProps: unknown;
  rawAuthoredProps: unknown;
  events: unknown[];
  rawEvents: unknown[];
  calls: SelectSurfaceProducerCall[];
  alive: boolean;
}
export interface NativeStyleHistoryPoint {
  dom: ReturnType<typeof readSelectSurface>;
  border: SelectSurfaceStyleHistoryDOM;
  owner: NativeStyleHistoryOwner;
}
export async function readNativeStyleHistory(page: Page): Promise<NativeStyleHistoryPoint> {
  const dom = await page.evaluate(readSelectSurface);
  const border = await page.evaluate(readSelectSurfaceStyleHistory);
  const owner = await page.evaluate(() => {
    const detail = {};
    document.querySelector('[data-surface-command]')!
      .dispatchEvent(new CustomEvent('historyread', { detail }));
    return detail;
  }) as NativeStyleHistoryOwner;
  return { dom, border, owner };
}
export async function settleNativeStyleHistory(page: Page) {
  let previous = '', stable = 0;
  for (let attempt = 0; attempt < 90; attempt++) {
    await drainSelectSurface(page);
    const point = await readNativeStyleHistory(page);
    const key = JSON.stringify(point);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) return point;
    previous = key;
  }
  throw Error('Native style history did not settle');
}
function borderDeclarations(node: SelectSurfaceStyleHistoryNode) {
  return node.inlineProperties.filter(property => /^border(?:-|$)/.test(property.name));
}
export function verifyBorder(actual: SelectSurfaceStyleHistoryNode, original: SelectSurfaceStyleHistoryNode, label: string) {
  assert.deepEqual(actual.inlineBorder, original.inlineBorder, `${label} actual CSSOM border values`);
  assert.deepEqual(borderDeclarations(actual), borderDeclarations(original), `${label} actual border setter order and priorities`);
  for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
    for (const property of ['Color', 'Style', 'Width']) {
      const key = `border${side}${property}`;
      assert.equal(actual.computed[key], original.computed[key], `${label} actual computed ${key}`);
    }
  }
  assert.deepEqual(actual.box, original.box, `${label} actual control geometry`);
}
export function verifyNativeStyleHistory(actual: NativeStyleHistoryPoint, original: SelectSurfaceStyleHistoryPoint,
  sourceCase: SelectSurfaceStyleHistorySourceCase, control: 'select' | 'autocomplete', label: string) {
  assert.deepEqual({ phase: actual.owner.phase, open: actual.owner.open, model: actual.owner.model,
    rawModel: actual.owner.rawModel, maps: actual.owner.maps },
  { phase: original.owner.phase, open: original.owner.open, model: original.owner.model,
    rawModel: original.owner.rawModel, maps: original.owner.maps }, `${label} actual public CSS maps and state`);
  assert.deepEqual(actual.owner.events, sourceCase.events.slice(0, original.owner.eventCount), `${label} public event prefix`);
  assert.equal(actual.owner.rawEvents.length, original.owner.rawEventCount, `${label} raw event prefix`);
  assert.deepEqual(actual.owner.calls, sourceCase.producerCalls.slice(0, original.owner.callCount), `${label} actual producer prefix`);
  assert.deepEqual(actual.dom.view.leaks, [], `${label} consumed public styling props`);
  verifyBorder(actual.border.root, original.border.root, `${label}/root`);
  verifyBorder(actual.border.input, original.border.input, `${label}/input`);
  if (control === 'select' && !original.owner.open && original.border.popup) {
    // Прежний Native Select снимает default popup при закрытии; root/input сохраняют всю историю.
    assert.equal(actual.border.popup, null, `${label} retained Native default popup lifetime`);
  } else {
    assert.equal(Boolean(actual.border.popup), Boolean(original.border.popup), `${label} popup presence`);
    if (original.border.popup) verifyBorder(actual.border.popup!, original.border.popup, `${label}/popup`);
  }
}

export function readStyleHistorySSRStyles(html: string) {
  const tags = [...html.matchAll(/<(?:div|input)\b[^>]*>/g)].map(match => match[0]);
  function read(className: string) {
    const tag = tags.find(tag => {
      const classes = tag.match(/\bclass="([^"]*)"/)?.[1].split(/\s+/) ?? [];
      return classes.includes(className);
    });
    assert.ok(tag, `SSR ${className} public element`);
    const inline = tag.match(/\bstyle="([^"]*)"/)?.[1] ?? '';
    return inline.split(';').filter(Boolean).map(declaration => {
      const colon = declaration.indexOf(':');
      return [declaration.slice(0, colon).trim(), declaration.slice(colon + 1).trim()];
    }).filter(([property]) => /^border(?:-|$)/.test(property));
  }
  return { root: read('ant-select'), input: read('ant-select-input') };
}
