import assert from 'node:assert/strict';
import type { Page } from '@playwright/test';
import { drainSelectSurface } from './select-surface-driver';
import { readSelectSurface } from './select-surface-metrics';
import { readSelectSurfaceOmission } from './select-surface-omission-metrics.mjs';
import { readInputWidthOwn } from './select-surface-input-width-own-metrics.mjs';
import { readNativeSurfaceTopology, normalizedSelectSurfaceAuthoredProps, selectSurfaceEventValue,
  verifySelectSurfaceEventGraph, verifySelectSurfaceNode } from './select-surface-assertions';
import { decodeSelectSurface } from './select-surface-receipts';
import type { SelectSurfaceInputWidthOwnPoint, SelectSurfaceInputWidthOwnSourceCase,
  SelectSurfaceInputWidthOwnState } from './select-surface-input-width-own-reference';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';

export interface NativeInputWidthOwnOwner extends SelectSurfaceInputWidthOwnState {
  alive: boolean; events: unknown[]; rawEvents: unknown[]; calls: SelectSurfaceProducerCall[];
}
export interface NativeInputWidthOwnPoint {
  dom: ReturnType<typeof readSelectSurface>;
  nodes: ReturnType<typeof readSelectSurfaceOmission>;
  width: ReturnType<typeof readInputWidthOwn>;
  topology: ReturnType<typeof readNativeSurfaceTopology>;
  owner: NativeInputWidthOwnOwner;
  bindings: { root: boolean; editor: boolean; methods: boolean; methodNativeElement: boolean };
}
export async function readNativeInputWidthOwn(page: Page): Promise<NativeInputWidthOwnPoint> {
  const dom = await page.evaluate(readSelectSurface), nodes = await page.evaluate(readSelectSurfaceOmission);
  const width = await page.evaluate(readInputWidthOwn), topology = await page.evaluate(readNativeSurfaceTopology);
  const { owner, bindings } = await page.evaluate(() => {
    const owner = {}, refs: { root?: HTMLElement; editor?: HTMLElement; publicRoot?: HTMLElement; publicEditor?: HTMLElement;
      control?: { focus?: unknown; blur?: unknown; scrollTo?: unknown; nativeElement?: HTMLElement } } = {};
    const command = document.querySelector('[data-surface-command]')!;
    command.dispatchEvent(new CustomEvent('inputwidthownread', { detail: owner }));
    command.dispatchEvent(new CustomEvent('surfacerefs', { detail: refs }));
    return { owner: owner as NativeInputWidthOwnOwner, bindings: { root: refs.root === refs.publicRoot,
      editor: refs.editor === refs.publicEditor, methods: (['focus', 'blur', 'scrollTo'] as const).every(key => typeof refs.control?.[key] === 'function'),
      methodNativeElement: Boolean(refs.control && 'nativeElement' in refs.control) } };
  });
  return { dom, nodes, width, topology, owner, bindings };
}
export async function settleNativeInputWidthOwn(page: Page) {
  let previous = '', stable = 0;
  for (let attempt = 0; attempt < 90; attempt++) {
    await drainSelectSurface(page);
    const actual = await readNativeInputWidthOwn(page), key = JSON.stringify(actual);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) {
      return actual;
    }
    previous = key;
  }
  throw Error('Native input width owner, CSSOM, complete callbacks and actual DOM did not settle');
}
export function verifyNativeInputWidthOwn(
  actual: NativeInputWidthOwnPoint,
  source: SelectSurfaceInputWidthOwnPoint,
  entry: SelectSurfaceInputWidthOwnSourceCase,
  label: string
) {
  const failures: string[] = [];
  const check = (name: string, action: () => void) => {
    try { action(); }
    catch (error) { failures.push(`${label}/${name}: ${String(error)}`); }
  };
  check('public-owner', () => {
    assert.equal(actual.owner.alive, true);
    for (const key of ['widthKind', 'widthOwnKey', 'widthValue', 'inputStyle', 'styleOwnKeys', 'inputStyleDescriptors',
      'fontSize', 'query', 'open', 'model'] as const) assert.deepEqual(
        actual.owner[key],
        source.owner[key],
        `${label} whole public ${key}`
      );
    verifySelectSurfaceEventGraph(
      actual.owner.rawModel,
      source.owner.rawModel,
      `${label} raw model graph`
    );
    verifySelectSurfaceEventGraph(
      actual.owner.rawInputStyle,
      source.owner.rawInputStyle,
      `${label} complete authored style own descriptor/order graph`
    );
    assert.deepEqual(normalizedSelectSurfaceAuthoredProps(actual.owner.authoredProps),
      normalizedSelectSurfaceAuthoredProps(source.owner.authoredProps), `${label} complete authored public props`);
    assert.deepEqual(
      decodeSelectSurface(actual.owner.authoredProvider),
      decodeSelectSurface(source.owner.authoredProvider),
      `${label} complete public provider`
    );
  });
  check('public-callbacks', () => {
    assert.deepEqual(
      actual.owner.events.map(selectSurfaceEventValue),
      entry.events.slice(0, source.owner.eventCount).map(selectSurfaceEventValue),
      `${label} full actual event prefix`
    );
    assert.equal(actual.owner.rawEvents.length, source.owner.rawEventCount);
    for (const [index, event] of actual.owner.rawEvents.entries()) verifySelectSurfaceEventGraph(
      event,
      entry.rawEvents[index],
      `${label}/event${index}`
    );
    assert.deepEqual(
      actual.owner.calls,
      entry.producerCalls.slice(0, source.owner.producerCount),
      `${label} complete producer prefix`
    );
  });
  check('actual-width-cssom', () => {
    for (const key of ['value', 'inlineWidth', 'inlineWidthProperty', 'inlineWidthPriority', 'cssomOwnWidth', 'inlineOrder',
      'inlineProperties', 'styleAttribute', 'cssText', 'inlineVariable', 'computedVariable', 'legacyInlineVariable', 'computedWidth',
      'computedFont', 'computedFontSize', 'computedBoxSizing', 'computedMinWidth', 'computedMaxWidth', 'box', 'scrollWidth',
      'clientWidth', 'offsetWidth'] as const) assert.deepEqual(
        actual.width[key],
        source.width[key],
        `${label} actual input ${key}`
      );
  });
  check('retained-identities', () => {
    assert.deepEqual(actual.nodes.sameAsOriginal, source.nodes.sameAsOriginal);
    assert.equal(actual.nodes.popupCount, source.nodes.popupCount);
    assert.equal(actual.nodes.footerCount, source.nodes.footerCount);
    for (const name of Object.keys(source.nodes.current) as Array<keyof typeof source.nodes.current>) {
      assert.equal(
        Boolean(actual.nodes.current[name]),
        Boolean(source.nodes.current[name]),
        `${label}/${name} actual node presence`
      );
      assert.equal(
        actual.nodes.current[name]?.connected ?? null,
        source.nodes.current[name]?.connected ?? null
      );
      assert.equal(
        actual.nodes.original[name]?.connected ?? null,
        source.nodes.original[name]?.connected ?? null
      );
    }
    assert.deepEqual(
      actual.bindings,
      { root: true, editor: true, methods: true, methodNativeElement: false }
    );
    assert.equal(source.nodes.publicRefs.rootMatches, true);
    assert.equal(
      actual.nodes.publicRefs.rootMatches,
      false,
      `${label} separate Native bound ref / methods object contract`
    );
    assert.equal(actual.nodes.publicRefs.wrapMatches, source.nodes.publicRefs.wrapMatches);
    assert.equal(actual.nodes.publicRefs.footerMatches, source.nodes.publicRefs.footerMatches);
  });
  check('surface-geometry-paint', () => {
    const authored = normalizedSelectSurfaceAuthoredProps(source.owner.authoredProps);
    const legacyClasses = typeof authored.className === 'string' ? authored.className.split(/\s+/).filter(Boolean) : [];
    const sample = { control: 'select' as const, mode: 'multiple' as const };
    assert.equal(actual.topology.publicRootIsInner, true);
    assert.equal(actual.topology.rootHasEditor, true);
    for (const name of legacyClasses) assert(actual.topology.outerClasses.includes(name));
    assert.deepEqual(Object.keys(actual.dom.view.slots), Object.keys(source.dom.view.slots));
    for (const [slot, nodes] of Object.entries(source.dom.view.slots)) {
      assert.equal(
        actual.dom.view.slots[slot].length,
        nodes.length,
        `${label}/${slot} semantic node count`
      );
      for (const [index, node] of nodes.entries()) verifySelectSurfaceNode(actual.dom.view.slots[slot][index], node, slot, sample,
        legacyClasses, `${label}/${index}`, source.dom.raw.slots[slot][index].attributes.find(([name]) => name === 'style')?.[1] ?? '',
        {
          callerLabel: authored['aria-label'],
          inputLayout: actual.topology.editorLayout,
          raw: actual.dom.raw.slots[slot][index]
        });
    }
    assert.equal(actual.topology.rootTextWithoutChildPopup, source.dom.view.slots.root[0].text);
    assert.deepEqual({
      present: actual.dom.view.popup.present,
      visible: actual.dom.view.popup.visible
    },
      { present: source.dom.view.popup.present, visible: source.dom.view.popup.visible });
    assert.equal(actual.dom.view.popup.extras.length, source.dom.view.popup.extras.length);
    for (const [index, node] of source.dom.view.popup.extras.entries()) verifySelectSurfaceNode(actual.dom.view.popup.extras[index], node,
      'extra', sample, [], `${label}/extra${index}`, source.dom.raw.extras[index].attributes.find(([name]) => name === 'style')?.[1] ?? '',
      { callerLabel: authored['aria-label'], raw: actual.dom.raw.extras[index] });
    assert.deepEqual(actual.dom.view.editor, source.dom.view.editor);
    assert.equal(actual.dom.view.focus, source.dom.view.focus);
    assert.deepEqual(actual.dom.view.leaks, []);
  });
  return failures;
}
