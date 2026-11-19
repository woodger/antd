import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import type { Page } from '@playwright/test';
import type { SelectSurfaceEdgeSample } from './fixtures/select-surface-edge-cases';
import { drainSelectSurface } from './select-surface-driver';
import { readSelectSurface } from './select-surface-metrics';
import { readSelectSurfaceEdgePaint } from './select-surface-edge-metrics.mjs';
import { nativeSelectPopupUnmounted, normalizedSelectSurfaceAuthoredProps, readNativeSurfaceTopology, selectSurfaceEventValue,
  verifySelectSurfaceEventGraph, verifySelectSurfaceNode } from './select-surface-assertions';
import { decodeSelectSurface } from './select-surface-receipts';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';
import type { SelectSurfaceEdgePoint, SelectSurfaceEdgeSourceCase } from './select-surface-edge-native-reference';

export interface NativeSurfaceEdgeOwner {
  model: unknown;
  rawModel: unknown;
  open: boolean;
  authoredProps: unknown;
  rawAuthoredProps: unknown;
  events: unknown[];
  rawEvents: unknown[];
  calls: SelectSurfaceProducerCall[];
  alive: boolean;
}
export function readNativeSurfaceEdgeOwner() {
  const detail = {};
  document.querySelector('[data-surface-command]')!.dispatchEvent(new CustomEvent(
    'surfaceread',
    { detail }
  ));
  return detail as NativeSurfaceEdgeOwner;
}
export interface NativeSurfaceEdgePoint {
  dom: ReturnType<typeof readSelectSurface>;
  paint: ReturnType<typeof readSelectSurfaceEdgePaint>;
  owner: NativeSurfaceEdgeOwner;
  topology: ReturnType<typeof readNativeSurfaceTopology>;
}
export async function settleSelectSurfaceEdgeNative(page: Page): Promise<NativeSurfaceEdgePoint> {
  let previous = '', stable = 0;
  for (let attempt = 0; attempt < 90; attempt++) {
    await drainSelectSurface(page);
    const dom = await page.evaluate(readSelectSurface), paint = await page.evaluate(readSelectSurfaceEdgePaint);
    const owner = await page.evaluate(readNativeSurfaceEdgeOwner), topology = await page.evaluate(readNativeSurfaceTopology);
    const point = { dom, paint, owner, topology }, key = JSON.stringify(point);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) {
      return point;
    }
    previous = key;
  }
  throw Error('Native Select surface edge actual DOM/paint/model/callbacks did not settle');
}
function sameCall(left: SelectSurfaceProducerCall, right: SelectSurfaceProducerCall) {
  return left.kind === right.kind && left.side === right.side
    && isDeepStrictEqual(left.argument, right.argument) && isDeepStrictEqual(
      left.result,
      right.result
    )
    && left.sameResultAsArgument === right.sameResultAsArgument;
}
export function verifySelectSurfaceEdgeNative(actual: NativeSurfaceEdgePoint, source: SelectSurfaceEdgePoint,
  entry: SelectSurfaceEdgeSourceCase, sample: SelectSurfaceEdgeSample, label: string, _initial: boolean) {
  assert.equal(actual.owner.alive, true, `${label} mounted owner`);
  assert.deepEqual(actual.owner.model, source.owner.model, `${label} actual public owner model`);
  verifySelectSurfaceEventGraph(
    actual.owner.rawModel,
    source.owner.rawModel,
    `${label} raw public model`
  );
  assert.equal(actual.owner.open, source.owner.open, `${label} actual controlled open owner`);
  const authored = normalizedSelectSurfaceAuthoredProps(source.owner.authoredProps);
  const unmountedPopup = nativeSelectPopupUnmounted(
    actual.dom,
    source.dom,
    sample.control,
    authored
  );
  assert.deepEqual(
    normalizedSelectSurfaceAuthoredProps(actual.owner.authoredProps),
    authored,
    `${label} original authored public inputs`
  );
  assert.deepEqual(actual.owner.events.map(selectSurfaceEventValue),
    entry.events.slice(0, source.owner.eventCount).map(selectSurfaceEventValue), `${label} full public callback prefix`);
  assert.equal(
    actual.owner.rawEvents.length,
    source.owner.rawEventCount,
    `${label} all raw callbacks`
  );
  for (const [index, event] of actual.owner.rawEvents.entries())
    verifySelectSurfaceEventGraph(event, entry.rawEvents[index], `${label}/event${index}`);
  const calls = entry.producerCalls.slice(0, source.owner.callCount);
  for (const call of actual.owner.calls) {
    assert(
      calls.some(original => sameCall(call, original)),
      `${label} every actual pure popup invocation matches original`
    );
    assert(
      Object.hasOwn(call, 'rawArgument') && Object.hasOwn(call, 'rawResult'),
      `${label} actual raw producer graphs retained`
    );
  }
  for (const original of calls) assert(actual.owner.calls.some(call => sameCall(call, original)),
    `${label} every original semantic invocation executed, including closed`);
  assert.equal(
    actual.topology.publicRootIsInner,
    sample.control === 'select',
    `${label} Native public/outer root ownership`
  );
  assert(actual.topology.outerClasses.includes('surface-control'), `${label} legacy outer class`);
  assert.equal(actual.topology.rootHasEditor, true, `${label} actual public editor`);
  assert.deepEqual(
    Object.keys(actual.dom.view.slots),
    Object.keys(source.dom.view.slots),
    `${label} semantic slots`
  );
  for (const [slot, nodes] of Object.entries(source.dom.view.slots)) {
    const current = actual.dom.view.slots[slot];
    if (unmountedPopup && slot.startsWith('popup.')) {
      assert.equal(current.length, 0, `${label}/${slot} old default popup unmounted`);
      continue;
    }
    assert.equal(current.length, nodes.length, `${label}/${slot} physical node count`);
    for (const [index, node] of nodes.entries()) verifySelectSurfaceNode(current[index], node, slot, sample,
      ['surface-control'], `${label}/${index}`,
      source.dom.raw.slots[slot][index].attributes.find(([name]) => name === 'style')?.[1] ?? '',
      { callerLabel: Object.hasOwn(authored, 'aria-label') ? authored['aria-label'] : undefined,
        inputLayout: actual.topology.editorLayout, raw: actual.dom.raw.slots[slot][index] });
  }
  assert.equal(actual.topology.rootTextWithoutChildPopup, source.dom.view.slots.root[0].text,
    `${label} control content excluding only retained descendant popup`);
  assert.deepEqual({
    present: actual.dom.view.popup.present,
    visible: actual.dom.view.popup.visible
  },
    {
      present: unmountedPopup ? false : source.dom.view.popup.present,
      visible: source.dom.view.popup.visible
    }, `${label} actual popup lifetime/visibility`);
  assert.equal(
    actual.dom.view.popup.extras.length,
    unmountedPopup ? 0 : source.dom.view.popup.extras.length,
    `${label} every popup extra`
  );
  for (const [index, node] of (unmountedPopup ? [] : source.dom.view.popup.extras).entries()) verifySelectSurfaceNode(actual.dom.view.popup.extras[index],
    node, 'extra', sample, [], `${label}/extra${index}`,
    source.dom.raw.extras[index].attributes.find(([name]) => name === 'style')?.[1] ?? '',
    { callerLabel: Object.hasOwn(authored, 'aria-label') ? authored['aria-label'] : undefined,
      raw: actual.dom.raw.extras[index] });
  assert.deepEqual(actual.dom.view.leaks, [], `${label} no leaked implementation attributes`);
  assert.equal(
    actual.dom.view.focus,
    source.dom.view.focus,
    `${label} real pointer/keyboard/blur focus`
  );
  let editor = source.dom.view.editor;
  if (sample.control === 'select' && (editor.expanded === 'false' || editor.readonly)) {
    assert.equal(editor.value, '', `${label} original closed editor`);
    assert.deepEqual(editor.caret, [0, 0], `${label} original closed caret`);
    const model = decodeSelectSurface(source.owner.model);
    const value = typeof model === 'string' ? source.dom.view.slots.content[0]?.text ?? '' : '';
    editor = { ...editor, value, caret: [value.length, value.length] };
  }
  assert.deepEqual(
    actual.dom.view.editor,
    editor,
    `${label} actual editor with existing closed scalar boundary`
  );
  // Paint is the original computed output, including empty zero-width nodes and
  // current text-fill color. Only the separately declared scalar value differs.
  let paintInput = { ...source.paint.view.input, value: editor.value };
  if (sample.control === 'select' && source.dom.view.editor.value === ''
    && /data-ant-select-value-layer(?:[\s=>])/.test(actual.topology.outerHTML)
    && !/data-ant-select-value-search(?:[\s=>])/.test(actual.topology.outerHTML)
    && !/(?:^|;)\s*-webkit-text-fill-color\s*:/i.test(source.dom.raw.slots.input[0]
      .attributes.find(([name]) => name === 'style')?.[1] ?? '')) {
    // The old label layer masks the Native editor until a query is present.
    // Source keeps an empty editor here; both paint the separately measured label.
    assert.match(actual.topology.outerHTML, /data-ant-select-value(?:[\s=>])/);
    paintInput = { ...paintInput, css: { ...paintInput.css, textFillColor: 'rgba(0, 0, 0, 0)' },
      textFillAlpha: 0, effectiveTextVisible: false };
  }
  assert.deepEqual(
    actual.paint.view,
    { ...source.paint.view, input: paintInput },
    `${label} actual CSS paint and physical boxes`
  );
  assert.deepEqual(actual.paint.raw.cssErrors, [], `${label} all actual matching CSS readable`);
}
