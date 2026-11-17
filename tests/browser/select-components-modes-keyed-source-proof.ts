import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import type { ModesCase } from './select-components-modes-reference';
import type { SelectComponentsModesNode } from './select-components-modes-metrics.mjs';
interface GraphNode { id: number; authoredRole?: unknown; ownProperties?: Array<Record<string, unknown>>;
  properties?: Array<{ key: unknown; value?: unknown }>; [key: string]: unknown }
interface Graph { root: unknown; objects: GraphNode[]; [key: string]: unknown }
/** Source-to-Source proof only. Every field/descriptor/getter/alias is retained;
 * numeric graph allocation IDs are renamed, never compared to Native output. */
function sourceGraph(value: unknown, keyed = false) {
  const graph = structuredClone(value) as Graph;
  if (keyed) {
    const nodes = new Map(graph.objects.map(node => [node.id, node]));
    for (const dataset of graph.objects) if (isDeepStrictEqual(dataset.authoredRole, { dataset: 'select-icons-values' })) {
      for (const [index, optionValue, label, key] of [['1', 1, 'Number one', 'option-number-one'],
        ['2', '1', 'String one', 'option-string-one']] as const) {
        const reference = dataset.properties!.find(property => property.key === index)!.value as { ref: number };
        const option = nodes.get(reference.ref)!;
        assert.deepEqual(option.properties, [{ key: 'value', value: optionValue }, { key: 'label', value: label }, { key: 'key', value: key }]);
        assert.deepEqual(option.ownProperties!.at(-1), { key: 'key', enumerable: true, configurable: true,
          writable: true, kind: 'value', valueType: 'string' });
        option.properties = option.properties!.slice(0, -1); option.ownProperties = option.ownProperties!.slice(0, -1);
      }
    }
  }
  const ids = new Map(graph.objects.map((node, index) => [node.id, index + 1])); assert.equal(ids.size, graph.objects.length);
  function rename(value: unknown): unknown {
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(rename);
    const object = value as Record<string, unknown>;
    if (Object.keys(object).length === 1 && typeof object.ref === 'number') { assert(ids.has(object.ref)); return { ref: ids.get(object.ref) }; }
    return Object.fromEntries(Object.entries(object).map(([key, item]) => [key, rename(item)]));
  }
  return { ...graph, root: rename(graph.root), objects: graph.objects.map(node => ({ ...node, id: ids.get(node.id),
    ...(node.properties ? { properties: rename(node.properties) } : {}) })) };
}
/** Proves the separately measured caller differs only at the declared public
 * option.key fields and its already recorded post-collision rerender counts. */
export function verifySelectComponentsModesKeyedSourcePair(original: ModesCase, keyed: ModesCase) {
  assert.equal(keyed.id, original.id); assert.deepEqual(keyed.steps.map(step => step.action), original.steps.map(step => step.action));
  const left = [original.initial, ...original.steps], right = [keyed.initial, ...keyed.steps];
  const forward = new Map<number, number>(), reverse = new Map<number, number>();
  function node(a: SelectComponentsModesNode, b: SelectComponentsModesNode) {
    assert.equal(forward.get(a.identity) ?? b.identity, b.identity); assert.equal(reverse.get(b.identity) ?? a.identity, a.identity);
    forward.set(a.identity, b.identity); reverse.set(b.identity, a.identity);
    assert.deepEqual(Object.fromEntries(Object.entries(a).filter(([key]) => key !== 'identity')),
      Object.fromEntries(Object.entries(b).filter(([key]) => key !== 'identity')));
  }
  const tags = original.id.includes('-tags-'), prefix = tags ? 3 : left.length;
  for (const [index, point] of left.entries()) {
    const counterpart = right[index];
    if (index < prefix) assert.deepEqual(counterpart.icons, point.icons, 'complete Source UI before the collision is exact');
    for (const key of ['root', 'editor', 'suffix', 'clear'] as const) {
      assert.deepEqual(counterpart.icons.current[key], point.icons.current[key], 'complete control snapshots stay exact');
      if (point.icons.current[key]) node(point.icons.current[key]!, counterpart.icons.current[key]!);
    }
    assert.equal(point.icons.layout.length, counterpart.icons.layout.length);
    for (const [ordinal, value] of point.icons.layout.entries()) node(value, counterpart.icons.layout[ordinal]);
    for (const key of ['model', 'open', 'query', 'settings', 'authoredProps', 'authoredProvider', 'authoredInnerProvider', 'eventCount', 'rawEventCount'] as const)
      assert.deepEqual(counterpart.owner[key], point.owner[key]);
    assert.deepEqual(sourceGraph(counterpart.owner.rawAuthoredProps, true), sourceGraph(point.owner.rawAuthoredProps), 'only the two exact public key additions');
    for (const key of ['rawModel', 'rawAuthoredProvider', 'rawAuthoredInnerProvider'] as const)
      assert.deepEqual(sourceGraph(counterpart.owner[key]), sourceGraph(point.owner[key]));
    assert.deepEqual(counterpart.icons.formData, point.icons.formData);
  }
  assert.deepEqual(keyed.events, original.events); assert.equal(keyed.rawEvents.length, original.rawEvents.length);
  for (const [index, event] of original.rawEvents.entries()) assert.deepEqual(sourceGraph(keyed.rawEvents[index]), sourceGraph(event));
  const call = (value: ModesCase['producerCalls'][number], keyed: boolean) => JSON.stringify(Object.fromEntries(Object.entries(value)
    .filter(([key]) => key !== 'index').map(([key, item]) => [key, key === 'rawArgument' || key === 'rawResult' ? sourceGraph(item, keyed) : item])));
  const ordinary = new Set(original.producerCalls.map(value => call(value, false))), distinct = new Set(keyed.producerCalls.map(value => call(value, true)));
  assert.deepEqual(distinct, ordinary, 'every complete pure invocation is covered both ways; repeated calls remain raw');
  return { id: original.id, controlPoints: left.length, prefixPoints: prefix, descendantIdentityPairs: forward.size,
    originalProducerCalls: original.producerCalls.length, keyedProducerCalls: keyed.producerCalls.length,
    originalLifecycle: original.lifecycle.length, keyedLifecycle: keyed.lifecycle.length };
}
