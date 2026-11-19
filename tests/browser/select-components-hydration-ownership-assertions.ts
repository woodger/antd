import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { decodeSelectSurface } from './select-surface-receipts';
import { verifySelectSurfaceEventGraph } from './select-surface-assertions';
import { verifySelectComponentsDOMAttributes } from './select-components-assertions';
import type { HydrationOwnershipNode, HydrationOwnershipPoint, HydrationOwnershipOwnerState } from './select-components-hydration-ownership-metrics.mjs';
import type { HydrationOwnershipSourceCase } from './select-components-hydration-ownership-reference';

export const ownershipSyntheticEventBoundary = 'react-synthetic-nativeEvent-vs-native-DOM-keydown-and-blur';
export const ownershipEmptyOptionBoundary = 'source-free-AC-option-deprecated-props-getter';
export const ownershipCommitBoundary = 'react-layout-commit-vs-svelte-onMount/exact-settled-value-selection';
export const ownershipInputTypeBoundary = 'existing-Svelte-INPUT-type-first-setter-order';
interface Encoded { $: string; properties: Array<{
  key: unknown;
  value?: unknown;
  accessor?: { get: unknown; set: unknown }
}> }
interface GraphNode { id: number; ownProperties: Array<Record<string, unknown>>; properties: Array<{
  key: unknown;
  value?: unknown
}> }
interface Graph { root: { ref: number }; objects: GraphNode[] }
const encodedField = (value: Encoded, key: string) => {
  const field = value.properties.find(field => field.key === key);
  assert(field);
  return field;
};
const graphNode = (graph: Graph, value: unknown) => {
  assert(value && typeof value === 'object' && 'ref' in value);
  const node = graph.objects.find(node => node.id === value.ref);
  assert(node);
  return node;
};
/** Exact actual 216 keydown /96 blur /54 free-option snapshot positions.
 * Only private comparison clones change; every original encoded/raw graph stays intact. */
export function verifyOwnershipCallbacks(actual: Pick<HydrationOwnershipOwnerState, 'events' | 'rawEvents' | 'controlKey'>, source: Pick<HydrationOwnershipOwnerState, 'events' | 'rawEvents' | 'controlKey'>,
  label: string, boundaries?: Set<string>) {
  assert.equal(actual.events.length, source.events.length);
  assert.equal(actual.rawEvents.length, source.rawEvents.length);
  assert.equal(actual.events.length, actual.rawEvents.length);
  const keys = ['type', 'key', 'code', 'defaultPrevented', 'propagationStopped', 'target', 'currentTarget', 'relatedTarget', 'nativeType'];
  for (let index = 0; index < source.events.length; index++) {
    const left = actual.events[index], right = source.events[index], nativeRaw = actual.rawEvents[index], sourceRaw = source.rawEvents[index];
    if (isDeepStrictEqual(left, right) && isDeepStrictEqual(nativeRaw, sourceRaw)) continue;
    let expected = right, graph = sourceRaw;
    if (!isDeepStrictEqual(left, right)) {
      const a = decodeSelectSurface(left), b = decodeSelectSurface(right);
      assert(Array.isArray(a) && Array.isArray(b));
      assert.equal(a.length, b.length);
      assert.equal(a[0], b[0], label + ' callback name/order');
      if (b[0] === 'input-keydown' || b[0] === 'blur') {
        assert.equal(b.length, 2);
        assert.deepEqual(Object.keys(a[1]), keys);
        assert.deepEqual(Object.keys(b[1]), keys);
        const sourceType = b[0] === 'blur' ? 'blur' : 'keydown', nativeType = b[0] === 'blur' ? 'focusout' : 'keydown';
        assert.equal(b[1].type, sourceType);
        assert.equal(b[1].nativeType, nativeType);
        assert.equal(a[1].type, nativeType);
        assert.equal(a[1].nativeType, null);
        expected = structuredClone(right);
        graph = structuredClone(sourceRaw);
        const encoded = encodedField(expected as Encoded, '1').value as Encoded;
        encodedField(encoded, 'type').value = nativeType;
        encodedField(encoded, 'nativeType').value = null;
        const raw = graph as Graph, payload = graphNode(
          raw,
          graphNode(raw, raw.root).properties.find(field => field.key === '1')?.value
        );
        for (const [key, value] of [['type', nativeType], ['nativeType', null]] as const) {
          const property = payload.properties.find(field => field.key === key);
          assert(property && Object.hasOwn(property, 'value'));
          assert.equal(property.value, key === 'type' ? sourceType : nativeType);
          property.value = value;
          const descriptor = payload.ownProperties.find(field => field.key === key);
          assert(descriptor);
          assert.deepEqual(
            descriptor,
            {
              key,
              enumerable: true,
              configurable: true,
              writable: true,
              kind: 'value',
              valueType: 'string'
            }
          );
          if (key === 'nativeType') descriptor.valueType = 'object';
        }
        boundaries?.add(ownershipSyntheticEventBoundary);
      }
      else if (b[0] === 'change' && source.controlKey === 'ac-textarea') {
        assert.equal(b.length, 3);
        assert.equal(b[1], 'Owned B');
        assert.equal(a[1], b[1]);
        const encodedSource = encodedField(right as Encoded, '2').value as Encoded;
        const encodedNative = encodedField(left as Encoded, '2').value as Encoded;
        assert.equal(encodedSource.$, 'object');
        assert.equal(encodedNative.$, 'object');
        assert.deepEqual(encodedNative.properties, []);
        assert.equal(encodedSource.properties.length, 1);
        const property = encodedSource.properties[0];
        assert.equal(property.key, 'props');
        assert(property.accessor);
        assert.equal(property.accessor.set, null);
        expected = structuredClone(right);
        (encodedField(expected as Encoded, '2').value as Encoded).properties = [];
        // The existing strict raw graph verifier validates the exact nonenumerable,
        // nonconfigurable Source getter; no other key/descriptor/alias is removed.
        boundaries?.add(ownershipEmptyOptionBoundary);
      }
    }
    assert.deepEqual(left, expected, label + '/encoded/' + index);
    verifySelectSurfaceEventGraph(nativeRaw, graph, label + '/raw/' + index);
  }
}
function exactCommitTuple(actual: HydrationOwnershipNode, source: HydrationOwnershipNode,
  entry: HydrationOwnershipSourceCase, key: string, phase: string, boundaries?: Set<string>) {
  if (actual.value === source.value && isDeepStrictEqual(actual.selection, source.selection)) {
    return false;
  }
  if (phase !== 'B-first-owner-commit' || key !== 'B' || entry.scenario.control.id !== 'select-multiple-input'
    || entry.scenario.prehydrate.id !== 'dirty-focused-backward') {
    return false;
  }
  const commit = entry.trace.find(row => row.phase === 'B-first-owner-commit')!.actual.roots.B!;
  const first = (commit.ownerState!.lifecycle as Array<{
    event: string;
    observation: HydrationOwnershipNode | null
  }>).find(row => row.event === 'attach')!.observation!;
  assert.equal(first.value, 'Draft before hydration');
  assert.deepEqual(first.selection, [2, 8, 'backward']);
  const settled = entry.trace.find(row => row.phase === 'B-settled')!.actual.roots.B!.physical.editor!;
  assert.equal(source.value, 'Draft before hydration');
  assert.deepEqual(source.selection, [2, 8, 'backward']);
  assert.equal(settled.value, 'a');
  assert.deepEqual(settled.selection, [1, 1, 'forward']);
  assert.equal(actual.value, settled.value);
  assert.deepEqual(actual.selection, settled.selection);
  boundaries?.add(ownershipCommitBoundary);
  return true;
}

export function verifyHydrationOwnershipPoint(actual: HydrationOwnershipPoint, source: HydrationOwnershipPoint,
  entry: HydrationOwnershipSourceCase, phase: string, boundaries?: Set<string>) {
  const failures: string[] = [];
  const check = (name: string, work: () => void) => {
    try {
    work();
  }
  catch (error) {
    failures.push(phase + '/' + name + ': ' + String(error));
  }
  };
  check('scenario', () => {
    assert.equal(actual.scenarioId, source.scenarioId);
    assert.deepEqual(Object.keys(actual.roots), Object.keys(source.roots));
  });
  for (const key of entry.scenario.environment.owners) {
    const a = actual.roots[key], b = source.roots[key];
    check(key + '/actual-target-and-scope', () => {
      assert(a && b);
      for (const field of ['nodeType', 'name', 'shadowMode', 'hostExposesSavedRoot'] as const) {
        assert.deepEqual(
          a.target[field],
          b.target[field],
          field
        );
      }
      assert.deepEqual(a.identity, b.identity, 'all parsed-node retention flags');
      assert.deepEqual(
        a.focus.editorIsScopeActive,
        b.focus.editorIsScopeActive,
        'deep focus through saved scope'
      );
      assert.deepEqual(a.focus.editorIsDocumentActive, b.focus.editorIsDocumentActive);
      assert.deepEqual(a.focus.hostIsDocumentActive, b.focus.hostIsDocumentActive);
    });
    if (!a || !b) continue;
    check(key + '/all-physical-owner-roles', () => {
      for (const role of ['owner', 'root', 'outside'] as const) {
        const current: HydrationOwnershipNode | null = a.physical[role], original: HydrationOwnershipNode | null = b.physical[role];
        assert.equal(Boolean(current), Boolean(original), role + ' presence');
        if (current && original) {
          for (const field of ['name', 'connected', 'ownerKey', 'namespaceURI'] as const)
            assert.deepEqual(current[field], original[field], role + '/' + field);
        }
      }
    });
    check(key + '/real-public-bound-refs', () => {
      // Source control.nativeElement and Native bind:nativeElement stay distinct
      // actual API observations. Neither gets a fabricated property or fallback.
      for (const field of ['controlPresent', 'rootMatchesPhysical', 'editorMatchesPhysical', 'rootInsideTarget', 'editorInsideTarget', 'editorOwnerKey'] as const)
        assert.deepEqual(a.refs[field], b.refs[field], field);
      if (b.refs.editorIdentity !== null) {
        assert(a.physical.editor);
        assert.equal(a.refs.editorIdentity, a.physical.editor.identity);
      }
      if (b.refs.rootIdentity !== null) {
        assert(a.physical.root);
        assert.equal(a.refs.rootIdentity, a.physical.root.identity);
      }
    });
    check(key + '/physical-editor', () => {
      const current = a.physical.editor, original = b.physical.editor;
      assert.equal(Boolean(current), Boolean(original));
      if (!current || !original) {
        return;
      }
      const commitTuple = exactCommitTuple(current, original, entry, key, phase, boundaries);
      for (const field of ['name', 'connected', 'ownerKey', 'namespaceURI', 'value', 'defaultValue', 'selection', 'documentFocused', 'scopeFocused', 'cssText', 'inlineProperties', 'styleAttribute'] as const) {
        if (!commitTuple || field !== 'value' && field !== 'selection') {
          assert.deepEqual(
            current[field],
            original[field],
            field
          );
        }
      }
      assert(current.attributes && original.attributes);
      const replacementTypeOrder = entry.scenario.control.id === 'ac-textarea' && key === 'B'
        && ['action-3-immediate', 'action-3-settled', 'target-before-dispose'].includes(phase);
      if (replacementTypeOrder && !isDeepStrictEqual(current.attributes, original.attributes)) {
        assert.equal(current.name, 'INPUT');
        assert.equal(original.name, 'INPUT');
        assert.equal(a.identity.editorSameAsParsed, false);
        assert.equal(b.identity.editorSameAsParsed, false);
        verifySelectComponentsDOMAttributes(
          { tag: current.name },
          { tag: original.name },
          current.attributes,
          original.attributes,
          phase + '/' + key + '/editor'
        );
        boundaries?.add(ownershipInputTypeBoundary);
      }
      else {
        assert.deepEqual(
          current.attributes,
          original.attributes,
          'complete own editor attrs and order'
        );
      }
      assert.equal(current.localRoot.nodeType, original.localRoot.nodeType);
      assert.equal(current.localRoot.mode, original.localRoot.mode);
    });
    check(key + '/owner-state-and-callbacks', () => {
      assert.equal(Boolean(a.ownerState), Boolean(b.ownerState));
      if (!a.ownerState || !b.ownerState) {
        return;
      }
      for (const field of ['ownerKey', 'controlKey', 'publicId', 'query', 'model', 'tag', 'open', 'alive', 'calls'] as const)
        assert.deepEqual(a.ownerState[field], b.ownerState[field], field);
      verifyOwnershipCallbacks(
        a.ownerState,
        b.ownerState,
        phase + '/' + key + '/callbacks',
        boundaries
      );
      assert.equal(typeof a.ownerState.callerUID, 'string');
      assert(a.ownerState.callerUID.length > 0);
    });
    check(key + '/quiet-disposal', () => {
      if (!b.ownerState || b.ownerState.alive) {
        return;
      }
      assert(a.ownerState);
      assert.equal(a.ownerState.alive, false);
      assert.equal(
        a.retainedOwnedConnections.every(node => !node.connected),
        true,
        'every actually retained owned DOM node is detached'
      );
      assert.equal(a.refs.controlPresent, false);
      assert.equal(a.refs.rootIdentity, null);
      assert.equal(a.refs.editorIdentity, null);
    });
    check(key + '/first-authored-ref', () => {
      type Row = { event: string; observation: HydrationOwnershipNode | null };
      const first = (point: typeof a) => (point.ownerState?.lifecycle as Row[] | undefined)?.find(row => row.event === 'attach')?.observation;
      const current = first(a), original = first(b);
      assert.equal(Boolean(current), Boolean(original));
      if (!current || !original) {
        return;
      }
      for (const field of ['name', 'connected', 'ownerKey', 'value', 'defaultValue', 'selection', 'documentFocused', 'scopeFocused', 'cssText', 'inlineProperties', 'styleAttribute', 'attributes'] as const)
        assert.deepEqual(current[field], original[field], field);
      assert.equal(current.identity, a.parsed.editor?.identity);
      assert.equal(original.identity, b.parsed.editor?.identity);
    });
  }
  return failures;
}
