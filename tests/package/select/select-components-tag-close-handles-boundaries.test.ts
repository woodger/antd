import { expect, it } from 'vitest';
import { readSelectTagCloseHandlesCase, readTagCloseHandleSourceInfo } from '../../browser/select-components-tag-close-handles-reference';
import { verifyNormalTagCalls, verifyUnusedRestDefinition, verifyTagCloseHandleBodyAliases } from '../../browser/select-components-tag-close-handles-assertions';
import nativeProof from '../../browser/fixtures/select-components-tag-close-handles-native-boundaries.json' with { type: 'json' };
import type { TagCloseHandleRawGraph } from '../../browser/select-components-tag-close-handles-reference';
import type { SelectSurfaceProducerCall } from '../../browser/select-surface-producers.mjs';
const source = readSelectTagCloseHandlesCase('select-close-handles-nonclosable');
const originals = source.ledger.producerCalls.slice(0, source.initial.owner.producerCount);
const recorded = nativeProof.actualInitialNormalCalls as SelectSurfaceProducerCall[];
it('accepts the recorded normal public classes and independently proves unused Source rest without invoking any Snippet', () => {
  expect(() => verifyNormalTagCalls(recorded, originals, 'actual initial')).not.toThrow();
  expect(() => verifyUnusedRestDefinition(source, recorded, [])).not.toThrow();
});
it('rejects losing a normal Source invocation class rather than treating it as a React duplicate', () => {
  expect(() => verifyNormalTagCalls(recorded.slice(1), originals, 'missing')).toThrow();
});
it('rejects changed callback arity or name in the actual raw argument', () => {
  for (const key of ['length', 'name']) {
    const calls = structuredClone(recorded), graph = calls[0].rawArgument as { objects: Array<{
      type: string;
      properties: Array<{ key: string; value: unknown }>
    }> };
    const callback = graph.objects.find(node => node.type === 'function' && node.properties.some(row => row.key === 'name' && row.value === 'onClose'))!;
    callback.properties.find(row => row.key === key)!.value = key === 'length' ? 0 : 'wrong';
    expect(() => verifyNormalTagCalls(calls, originals, 'callback metadata')).toThrow();
  }
});
it('rejects missing own undefined and reordered Native public descriptors', () => {
  const missing = structuredClone(recorded);
  (missing[0].argumentOwnKeys as string[][])[0].splice(3, 1);

  expect(() => verifyNormalTagCalls(missing, originals, 'own undefined')).toThrow();
  const reordered = structuredClone(recorded);
  (reordered[0].argumentDescriptors as unknown[][])[0].reverse();

  expect(() => verifyNormalTagCalls(reordered, originals, 'descriptors')).toThrow();
});
it('rejects a visible Source rest instead of applying the unused ReactNode definition boundary', () => {
  const original = source.initial.dom.tags[0], visible = {
    ...original,
    attributes: original.attributes.map(([name, value]) => [name, name === 'data-handles-tag' ? 'undefined' : value])
  };
  const changed = {
    ...source,
    initial: {
      ...source.initial,
      dom: { ...source.initial.dom, tags: [...source.initial.dom.tags, visible] }
    }
  };

  expect(() => verifyUnusedRestDefinition(changed, recorded, [])).toThrow();
});
it('rejects Source rest body materialization using the exact recorded info alias', () => {
  const call = source.ledger.producerCalls.find(row => row.kind === 'tagRender' && readTagCloseHandleSourceInfo(row).isMaxTag)!;
  const array = call.rawArgument.objects.find(node => node.id === (call.rawArgument.root as { ref: number }).ref)!;
  const reference = array.properties!.find(row => row.key === '0')!.value;
  const body = [...source.ledger.bodyActivity, {
    info: call.argument,
    rawInfo: { ...call.rawArgument, root: reference }
  }];
  const changed = { ...source, ledger: { ...source.ledger, bodyActivity: body } };

  expect(() => verifyUnusedRestDefinition(changed as typeof source, recorded, [])).toThrow();
});
it('rejects a Native fake rest invocation or fake rest body', () => {
  const rest = source.ledger.producerCalls.find(row => row.kind === 'tagRender' && readTagCloseHandleSourceInfo(row).isMaxTag)!;

  expect(() => verifyUnusedRestDefinition(source, [...recorded, rest], [])).toThrow();
  const info = { $: 'object', properties: [{ key: 'isMaxTag', value: true }] };

  expect(() => verifyUnusedRestDefinition(source, recorded, [{ info, rawInfo: rest.rawArgument }])).toThrow();
});
it('rejects a cloned body info or substituted onClose alias even when all scalar fields are unchanged', () => {
  const body = nativeProof.actualInitialBodyActivity as Array<{
    info: unknown;
    rawInfo: TagCloseHandleRawGraph
  }>;

  expect(() => verifyTagCloseHandleBodyAliases(recorded, body, 'actual flow')).not.toThrow();
  const clone = structuredClone(body);
  clone[0].rawInfo.root = { ref: -1 };

  expect(() => verifyTagCloseHandleBodyAliases(recorded, clone, 'cloned info')).toThrow();
  const callback = structuredClone(body), node = callback[0].rawInfo.objects.find(node => node.id === (callback[0].rawInfo.root as { ref: number }).ref)!;
  node.properties!.find(property => property.key === 'onClose')!.value = { ref: -1 };

  expect(() => verifyTagCloseHandleBodyAliases(recorded, callback, 'different callback')).toThrow();
});
