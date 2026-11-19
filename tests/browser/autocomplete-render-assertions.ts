import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import type { Page } from '@playwright/test';
import { readSelectSurface } from './select-surface-metrics';
import { readAutocompleteRender, type AutocompleteRenderNode } from './autocomplete-render-metrics.mjs';
import { drainSelectSurface } from './select-surface-driver';
import { normalizedSelectSurfaceAuthoredProps, readNativeSurfaceTopology, selectSurfaceEventValue,
  verifySelectSurfaceEventGraph, verifySelectSurfaceNode } from './select-surface-assertions';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';
import type { AutocompleteRenderCase, AutocompleteRenderOwner, AutocompleteRenderPoint } from './autocomplete-render-reference';

export interface NativeAutocompleteRenderOwner extends AutocompleteRenderOwner {
  alive: boolean; events: unknown[]; rawEvents: unknown[]; calls: SelectSurfaceProducerCall[];
  lifecycle: AutocompleteRenderCase['lifecycle']; rawChildSpecification: unknown;
}
export interface NativeAutocompleteRenderPoint {
  dom: ReturnType<typeof readSelectSurface>; nodes: ReturnType<typeof readAutocompleteRender>;
  topology: ReturnType<typeof readNativeSurfaceTopology>; owner: NativeAutocompleteRenderOwner;
}
interface GraphNode { id: number; type: string; array: boolean; authoredRole: unknown;
  ownProperties: Array<Record<string, unknown>>; properties: Array<{
    key: unknown;
    value?: unknown;
    get?: unknown;
    set?: unknown
  }> }
interface Graph { root: unknown; objects: GraphNode[] }
function reference(value: unknown): number | undefined {
  return value && typeof value === 'object' && 'ref' in value ? (value as { ref: number }).ref : undefined;
}
function property(node: GraphNode, key: string) {
  const matchingProperty = node.properties.find(p => p.key === key);
  return matchingProperty?.value;
}
function reactNode(node: GraphNode) {
  return node.type === 'object' && node.properties?.some(p => p.key === '$$typeof'
    && p.value && typeof p.value === 'object' && '$' in p.value && p.value.$ === 'symbol'
    && 'symbol' in p.value && p.value.symbol === 'react.element');
}
export function autocompleteSourceChildSpecification(value: unknown): Graph {
  const graph = value as Graph, nodes = new Map(graph.objects.map(n => [n.id, n]));
  const props = nodes.get(reference(graph.root)!)!, child = reference(property(props, 'children'));
  if (child === undefined) {
    return { root: { $: 'undefined' }, objects: [] };
  }
  const node = nodes.get(child)!;
  assert(reactNode(node), 'Original child is the public authored React element');
  const childProps = nodes.get(reference(property(node, 'props'))!)!;
  const caller: GraphNode = { id: -1, type: 'object', array: false, authoredRole: null,
    ownProperties: [node.ownProperties.find(p => p.key === 'ref')!, ...childProps.ownProperties],
    properties: [{ key: 'ref', value: property(node, 'ref') }, ...childProps.properties] };
  return { root: { ref: -1 }, objects: [caller, ...graph.objects] };
}
/** Public React type/key/props are compared to the caller's actual returned Snippet specification. */
export function autocompleteSourceResult(value: unknown): unknown {
  const graph = value as Graph, nodes = new Map(graph.objects.map(n => [n.id, n]));
  function read(v: unknown): unknown {
    const id = reference(v);
    if (id === undefined) {
      return v;
    }
    const n = nodes.get(id)!;
    if (reactNode(n)) {
      return { node: {
        type: read(property(n, 'type')),
        key: read(property(n, 'key')),
        props: read(property(n, 'props'))
      } };
    }
    if (n.authoredRole) {
      return { $: 'authored', role: n.authoredRole };
    }
    if (n.array) {
      return n.properties.filter(p => typeof p.key === 'string' && /^\d+$/.test(p.key))
        .sort((a, b) => Number(a.key) - Number(b.key)).map(p => read(p.value));
    }
    return Object.fromEntries(n.properties.map(p => [String(p.key), read(p.value)]));
  }
  return read(graph.root);
}
/** No source raw data are rewritten. Only known framework node/callback representations differ. */
export function verifyAutocompleteGraph(
  actualValue: unknown,
  originalValue: unknown,
  label: string,
  props = false,
  result = false
) {
  const a = actualValue as Graph, b = originalValue as Graph;
  const actual = new Map(a.objects.map(n => [n.id, n])), source = new Map(b.objects.map(n => [n.id, n]));
  const pairs = new Map<number, number>(), reverse = new Map<number, number>();
  const knownRenderer = (role: unknown) => role && typeof role === 'object' && 'callback' in role
    && typeof role.callback === 'string' && /^autocomplete-render-(?:option-|tag$)/.test(role.callback);
  function walk(left: unknown, right: unknown, root = false) {
    const ai = reference(left), bi = reference(right);
    if (ai === undefined || bi === undefined) {
      assert.deepEqual(left, right, label);
      return;
    }
    if (pairs.has(ai)) {
      assert.equal(pairs.get(ai), bi, label + ' same raw alias');
      return;
    }
    assert(!reverse.has(bi), label + ' distinct raw aliases');
    pairs.set(ai, bi);
    reverse.set(bi, ai);
    const x = actual.get(ai)!, y = source.get(bi)!;
    assert(x && y, label + ' complete graph');
    assert.deepEqual(x.authoredRole, y.authoredRole, label + ' full authored role');
    if (reactNode(y) && x.type === 'function') {
      assert.equal(x.array, false);
      return; // Complete independent raw node graphs remain in every trace.
    }
    assert.equal(x.type, y.type, label + ' raw type');
    assert.equal(x.array, y.array, label + ' raw array');
    if (knownRenderer(x.authoredRole)) {
      return;
    } // Source callback vs compiled Svelte Snippet signature.
    const sourceFields = y.ownProperties.filter(p => !(root && props && p.key === 'ref'));
    const nativeFields = x.ownProperties.map(p => {
      if (root && props && p.key === 'class') {
        return { ...p, key: 'className' };
      }
      if (root && props && p.key === 'children' && p.valueType === 'function') {
        assert.equal(
          sourceFields.find(f => f.key === 'children')?.valueType,
          'object',
          label + ' actual original React child'
        );
        return { ...p, valueType: 'object' }; // Exact public child node vs Snippet descriptor boundary.
      }
      if (result && x.array && y.array && typeof p.key === 'string' && /^\d+$/.test(p.key) && p.valueType === 'function') {
        const nativeNode = actual.get(reference(property(x, p.key))!), sourceNode = source.get(reference(property(
          y,
          p.key
        ))!);
        if (nativeNode?.type === 'function' && sourceNode && reactNode(sourceNode)) {
          assert.equal(
            sourceFields.find(f => f.key === p.key)?.valueType,
            'object',
            label + ' returned React node descriptor'
          );
          assert.deepEqual(
            nativeNode.authoredRole,
            sourceNode.authoredRole,
            label + ' returned node role'
          );
          return { ...p, valueType: 'object' }; // The public result specification and recursive alias walk are checked separately.
        }
      }
      return p;
    });
    assert.deepEqual(nativeFields, sourceFields, label + ' raw descriptors/order');
    const ys = y.properties.filter(p => !(root && props && p.key === 'ref'));
    const xs = x.properties.map(p => root && props && p.key === 'class' ? { ...p, key: 'className' } : p);
    assert.deepEqual(xs.map(p => p.key), ys.map(p => p.key), label + ' full raw key order');
    for (let index = 0; index < xs.length; index++) {
      assert.equal(
        Object.hasOwn(xs[index], 'value'),
        Object.hasOwn(ys[index], 'value'),
        label + ' data/accessor'
      );
      if (Object.hasOwn(xs[index], 'value')) {
        walk(xs[index].value, ys[index].value);
      }
      else {
        walk(xs[index].get, ys[index].get);
        walk(xs[index].set, ys[index].set);
      }
    }
  }
  walk(a.root, b.root, true);
}
function sameCall(a: SelectSurfaceProducerCall, b: SelectSurfaceProducerCall) {
  return a.kind === b.kind && a.side === b.side && a.renderer === b.renderer
    && isDeepStrictEqual(a.argument, b.argument)
    && isDeepStrictEqual(a.resultDescription, autocompleteSourceResult(b.rawResult));
}
export function verifyAutocompleteCalls(
  actual: readonly SelectSurfaceProducerCall[],
  source: readonly SelectSurfaceProducerCall[],
  label: string,
  ssr = false
) {
  if (ssr) {
    assert.deepEqual(
      actual.map(p => [p.kind, p.side]),
      source.map(p => [p.kind, p.side]),
      label + ' exact SSR order/count'
    );
  }
  for (const [index, call] of actual.entries()) {
    assert.equal(call.index, index, label + ' complete actual call ledger');
    const original = ssr ? source[index] : source.find(p => sameCall(call, p));
    assert(
      original && sameCall(call, original),
      label + ' actual pure invocation belongs to whole Source prefix'
    );
    verifySelectSurfaceEventGraph(
      call.rawArgument,
      original.rawArgument,
      label + ' exact raw producer args'
    );
    verifyAutocompleteGraph(
      call.rawResult,
      original.rawResult,
      label + ' raw result roles/aliases',
      false,
      true
    );
    if (call.kind === 'optionRender') {
      assert.equal(call.sameRawAsAuthored, true);
      assert.equal(original.sameRawAsAuthored, true);
      const graph = call.rawArgument as Graph, array = graph.objects.find(n => n.id === reference(graph.root))!;
      const row = graph.objects.find(n => n.id === reference(property(array, '0')))!;
      assert.equal(call.optionIdentity, row.id);
      assert.equal(call.rawOptionIdentity, reference(property(row, 'data')));
    }
  }
  for (const original of source) {
    assert(
      actual.some(p => sameCall(p, original)),
      label + ' every Source invocation executed'
    );
  }
  assert.equal(
    actual.filter(p => p.kind === 'tagRender').length,
    0,
    label + ' forced-combobox tag renderer never called'
  );
}
export async function readNativeAutocompleteRender(page: Page): Promise<NativeAutocompleteRenderPoint> {
  const dom = await page.evaluate(readSelectSurface), nodes = await page.evaluate(readAutocompleteRender);
  const topology = await page.evaluate(readNativeSurfaceTopology);
  const owner = await page.evaluate(() => {
    const detail = {};
    document.querySelector('[data-ac-render-command]')!.dispatchEvent(new CustomEvent(
      'acrenderread',
      { detail }
    ));
    return detail as NativeAutocompleteRenderOwner;
  });
  return { dom, nodes, topology, owner };
}
export async function settleNativeAutocompleteRender(page: Page) {
  let previous = '', stable = 0;
  for (let attempt = 0; attempt < 90; attempt++) {
    await drainSelectSurface(page);
    const actual = await readNativeAutocompleteRender(page), key = JSON.stringify(actual);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) {
      return actual;
    }
    previous = key;
  }
  throw Error('Actual AutoComplete renderer props, complete ledgers, DOM and CSSOM did not settle');
}
export function verifyAutocompleteLifecycle(
  actual: NativeAutocompleteRenderOwner['lifecycle'],
  source: NativeAutocompleteRenderOwner['lifecycle'],
  entry: AutocompleteRenderCase,
  label: string,
  disposed = false
) {
  if (!entry.id.endsWith('child-input') && !entry.id.endsWith('child-textarea')) {
    assert.deepEqual(actual, source, label + ' no custom ref notifications');
    return;
  }
  // React cloneElement composes a fresh callback and notifies null/node without
  // replacing the actual editor. The old Native action attaches once; both full
  // histories remain recorded. This boundary is restricted to the two frozen
  // public child owners, whose physical node identity is checked at every point.
  const first = entry.lifecycle[0];
  assert.deepEqual(first, { kind: 'child-ref', attached: true,
    tag: entry.id.endsWith('child-textarea') ? 'TEXTAREA' : 'INPUT', value: entry.initial.nodes.current.editor!.value });
  for (const [index, notification] of source.entries()) {
    assert.equal(notification.kind, 'child-ref');
    assert.equal(notification.attached, index % 2 === 0);
    if (notification.attached) {
      assert.equal(notification.tag, first.tag);
    }
    else {
      assert.deepEqual(
        notification,
        { kind: 'child-ref', attached: false, tag: null, value: null }
      );
    }
  }
  assert.equal(source.at(-1)?.attached, !disposed, label + ' actual Source ref state');
  const final = { kind: 'child-ref', attached: false, tag: null, value: null };
  assert.deepEqual(
    actual,
    disposed ? [first, final] : [first],
    label + ' exact existing Native mount/disposal lifecycle'
  );
}
function nodeAttributes(node: AutocompleteRenderNode) {
  return node.attributes.map(([key, value]) => [key, key === 'class'
    ? value.split(/\s+/).filter(token => !token.startsWith('svelte-') && !/^s-[A-Za-z0-9]+$/.test(token)).join(' ') : value]);
}
function verifyChildAttributes(
  actual: AutocompleteRenderNode,
  source: AutocompleteRenderNode,
  input: 'input' | 'textarea',
  label: string
) {
  const nativeAttrs = nodeAttributes(actual), sourceAttrs = nodeAttributes(source), original = Object.fromEntries(sourceAttrs);
  assert.equal(original['data-ac-render-child'], input);
  assert.equal(original['aria-label'], 'Surface value');
  assert.equal(original.class, 'ac-render-child');
  assert.equal(original.id, 'autocomplete-render-field');
  assert.equal(original.placeholder, 'AutoComplete render placeholder');
  assert.equal(original.type, 'text');
  assert.equal(original.autocomplete, 'new-password');
  assert.equal(original.role, 'combobox');
  assert.equal(original['aria-haspopup'], 'listbox');
  assert.equal(original['aria-autocomplete'], 'list');
  assert(['true', 'false'].includes(original['aria-expanded']));
  if (input === 'input') {
    assert.equal(
      original.value,
      source.value,
      label + ' React reflected input value'
    );
  }
  else {
    assert.equal(original.rows, '2');
  }
  const expanded = original['aria-expanded'] === 'true';
  if (expanded) {
    assert.equal(original['aria-owns'], original.id + '_list');
    assert.equal(original['aria-controls'], original['aria-owns']);
    assert.match(original['aria-activedescendant'], /^autocomplete-render-field_list_(?:-1|\d+)$/);
  }
  // These are the two frozen callers' complete attribute sequences. React's
  // clone order and Native's spread order differ; no authored or generated key
  // is dropped, and the old Native sequence is asserted in full below.
  assert.deepEqual(sourceAttrs.map(([key]) => key), ['data-ac-render-child', 'aria-label', 'class', ...(input === 'textarea' ? ['rows'] : []),
    'placeholder', 'id', 'type', 'autocomplete', 'role', 'aria-expanded', 'aria-haspopup', 'aria-autocomplete',
    ...(input === 'input' ? ['value'] : []), 'style', ...(expanded ? ['aria-owns', 'aria-controls', 'aria-activedescendant'] : [])], label + ' full Original child attributes');
  const fields = (...keys: string[]) => keys.map(key => [key, original[key]]);
  const expected = [...fields('id', 'placeholder'), ['dir', 'ltr'], ['autocomplete', 'off'],
    ...fields(
      'role',
      'aria-label',
      'aria-expanded',
      'aria-autocomplete',
      'class',
      'data-ac-render-child'
    ),
    ...(input === 'textarea' ? fields('rows') : []), ...fields('style'), ...(expanded ? fields('aria-controls') : []),
    ...(expanded && original['aria-activedescendant'] !== original.id + '_list_-1' ? fields('aria-activedescendant') : [])];
  assert.deepEqual(
    nativeAttrs,
    expected,
    label + ' complete retained Native child attributes/order'
  );
}
function verifyNode(
  actual: AutocompleteRenderNode,
  source: AutocompleteRenderNode,
  label: string,
  content = false,
  child?: 'input' | 'textarea'
) {
  assert.equal(
    actual.tag,
    content && source.tag === 'DIV' ? 'SPAN' : source.tag,
    label + ' actual authored node tag'
  );
  assert.equal(actual.text, source.text, label + '/text');
  for (const key of ['cssText', 'inlineStyle', 'box', 'value', 'caret', 'scrollTop', 'scrollLeft'] as const)
    assert.deepEqual(actual[key], source[key], label + '/' + key);
  assert.deepEqual(actual.css, source.css, label + ' every actual authored CSS property');
  if (child) {
    assert.equal(actual.tag, child === 'textarea' ? 'TEXTAREA' : 'INPUT');
    verifyChildAttributes(actual, source, child, label);
    return;
  }
  const sourceAttrs = nodeAttributes(source), nativeAttrs = nodeAttributes(actual);
  if (actual.tag === 'EM' && source.tag === 'EM'
    && actual.attributes.some(([key, value]) => key === 'data-ac-render-label' && value === '')
    && source.attributes.some(([key, value]) => key === 'data-ac-render-label' && value === '')
    && !sourceAttrs.some(([key]) => key === 'class')) {
    const compiledClass = nativeAttrs.find(([key]) => key === 'class');
    if (compiledClass) {
      assert.equal(compiledClass[1], '', label + ' only the compiled Svelte scope class');
      assert.deepEqual(
        nativeAttrs.filter(([key]) => key !== 'class'),
        sourceAttrs,
        label + ' authored DOM attributes'
      );
      return;
    }
  }
  assert.deepEqual(nativeAttrs, sourceAttrs, label + ' authored DOM attributes');
}
export function verifyAutocompletePoint(
  actual: NativeAutocompleteRenderPoint,
  source: AutocompleteRenderPoint,
  entry: AutocompleteRenderCase,
  label: string
) {
  const failures: string[] = [];
  const check = (name: string, fn: () => void) => {
    try {
    fn();
  }
  catch (e) {
    failures.push(label + '/' + name + ': ' + String(e));
  }
  };
  check('whole-owner', () => {
    assert.equal(actual.owner.alive, true);
    assert.deepEqual(actual.owner.settings, source.owner.settings);
    assert.deepEqual(actual.owner.model, source.owner.model);
    assert.equal(actual.owner.open, source.owner.open);
    assert.deepEqual(
      normalizedSelectSurfaceAuthoredProps(actual.owner.authoredProps),
      normalizedSelectSurfaceAuthoredProps(source.owner.authoredProps)
    );
    assert.deepEqual(actual.owner.authoredProvider, source.owner.authoredProvider);
    verifyAutocompleteGraph(
      actual.owner.rawAuthoredProps,
      source.owner.rawAuthoredProps,
      label + ' full authored props',
      true
    );
    verifySelectSurfaceEventGraph(
      actual.owner.rawAuthoredProvider,
      source.owner.rawAuthoredProvider,
      label + ' full provider'
    );
    verifyAutocompleteGraph(
      actual.owner.rawChildSpecification,
      autocompleteSourceChildSpecification(source.owner.rawAuthoredProps),
      label + ' whole authored child specification'
    );
  });
  check('full-callback-ledger', () => {
    assert.deepEqual(
      actual.owner.events.map(selectSurfaceEventValue),
      entry.events.slice(0, source.owner.eventCount).map(selectSurfaceEventValue)
    );
    assert.equal(actual.owner.rawEvents.length, source.owner.rawEventCount);
    for (const [i, event] of actual.owner.rawEvents.entries()) {
      verifySelectSurfaceEventGraph(
        event,
        entry.rawEvents[i],
        label + '/event' + i
      );
    }
    verifyAutocompleteLifecycle(
      actual.owner.lifecycle,
      entry.lifecycle.slice(0, source.owner.lifecycleCount),
      entry,
      label
    );
  });
  check(
    'complete-producers',
    () => verifyAutocompleteCalls(
      actual.owner.calls,
      entry.producerCalls.slice(0, source.owner.producerCount),
      label
    )
  );
  check('actual-retained-refs', () => {
    assert.deepEqual(actual.nodes.sameAsOriginal, source.nodes.sameAsOriginal);
    assert.equal(actual.nodes.publicRefs.rootMatches, false);
    assert.equal(source.nodes.publicRefs.rootMatches, true);
    assert.equal(actual.nodes.publicRefs.childIsEditor, source.nodes.publicRefs.childIsEditor);
    for (const name of Object.keys(source.nodes.current) as Array<keyof AutocompleteRenderPoint['nodes']['current']>) {
      assert.equal(Boolean(actual.nodes.current[name]), Boolean(source.nodes.current[name]));
      assert.equal(
        actual.nodes.current[name]?.connected ?? null,
        source.nodes.current[name]?.connected ?? null
      );
      assert.equal(
        actual.nodes.original[name]?.connected ?? null,
        source.nodes.original[name]?.connected ?? null
      );
    }
  });
  check('complete-surface-css-boxes', () => {
    assert.deepEqual(Object.keys(actual.dom.view.slots), Object.keys(source.dom.view.slots));
    for (const [slot, nodes] of Object.entries(source.dom.view.slots)) {
      assert.equal(actual.dom.view.slots[slot].length, nodes.length, label + '/' + slot + ' count');
      for (const [i, node] of nodes.entries()) {
        const current = actual.dom.view.slots[slot][i];
        verifySelectSurfaceNode(current, node, slot, { control: 'autocomplete' }, ['surface-control'], label + '/' + i,
          source.dom.raw.slots[slot][i].attributes.find(([k]) => k === 'style')?.[1] ?? '',
          {
            callerLabel: 'Surface value',
            inputLayout: actual.topology.editorLayout,
            raw: actual.dom.raw.slots[slot][i]
          });
      }
    }
    assert.deepEqual(
      actual.dom.view.editor,
      source.dom.view.editor,
      label + ' actual editor/value/caret'
    );
    assert.equal(actual.dom.view.popup.visible, source.dom.view.popup.visible);
    assert.equal(actual.dom.view.popup.present, source.dom.view.popup.present);
    assert.equal(actual.dom.view.popup.extras.length, source.dom.view.popup.extras.length);
    for (const [i, node] of source.dom.view.popup.extras.entries()) {
      verifySelectSurfaceNode(actual.dom.view.popup.extras[i], node, 'extra',
        { control: 'autocomplete' }, [], label + '/extra' + i, source.dom.raw.extras[i].attributes.find(([k]) => k === 'style')?.[1] ?? '',
        { callerLabel: 'Surface value', raw: actual.dom.raw.extras[i] });
    }
    assert.equal(actual.dom.view.focus, source.dom.view.focus);
    assert.deepEqual(actual.dom.view.leaks, []);
  });
  check('authored-renderer-dom', () => {
    assert.equal(actual.nodes.rows.length, source.nodes.rows.length);
    for (const [i, row] of source.nodes.rows.entries()) {
      const current = actual.nodes.rows[i];
      // Default Native content is a span inside its retained option button.
      verifyNode(current.content, row.content, label + '/content' + i, true);
      assert.equal(current.authored.length, row.authored.length);
      for (const [j, node] of row.authored.entries()) {
        verifyNode(
          current.authored[j],
          node,
          label + '/result' + i + '/' + j
        );
      }
    }
    assert.equal(actual.nodes.labels.length, source.nodes.labels.length);
    for (const [i, node] of source.nodes.labels.entries()) {
      verifyNode(
        actual.nodes.labels[i],
        node,
        label + '/label' + i
      );
    }
    assert.equal(actual.nodes.groups.length, source.nodes.groups.length);
    if (actual.nodes.current.child && source.nodes.current.child) {
      assert(
        entry.id === 'autocomplete-render-child-input' || entry.id === 'autocomplete-render-child-textarea',
        label + ' frozen custom child owner'
      );
      verifyNode(actual.nodes.current.child, source.nodes.current.child, label + '/child', false,
        entry.id === 'autocomplete-render-child-textarea' ? 'textarea' : 'input');
    }
  });
  return failures;
}
