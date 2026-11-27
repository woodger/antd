import assert from 'node:assert/strict';
import { readSelectComponentsSSRFields } from './select-components-ssr-metrics';
import { verifyOwnStyleSSRLayout } from './select-components-own-style-init-ssr-assertions';
import { verifyIconGraph } from './select-icons-assertions';
import type { HydrationOwnershipOwnerState } from './select-components-hydration-ownership-metrics.mjs';
import type { HydrationOwnershipServerOwner } from './select-components-hydration-ownership-reference';
export interface HydrationOwnershipNativeSSR { head: string; body: string; state: HydrationOwnershipOwnerState; refs: Record<string, boolean>; domFree: boolean }
/** Reuse the already measured nonresponsive Select/AC content/field boundaries.
 * The new owner has no new SSR markup adapter or generated-ID lookup. */
export function verifyHydrationOwnershipSSR(
  actual: HydrationOwnershipNativeSSR,
  source: HydrationOwnershipServerOwner,
  label: string
) {
  assert.equal(actual.domFree, true);
  assert(actual.body.length > 0);
  const current = readSelectComponentsSSRFields(actual.body);
  const original = readSelectComponentsSSRFields(source.rawHtml);
  assert.equal(original.fields.length, 1);
  assert.deepEqual(
    current.fields,
    original.fields,
    label + ' exact intrinsic field/value/ordered attrs'
  );
  assert.equal(current.fields[0].tag, source.sample.initialTag);
  assert.equal(
    current.fields[0].attributes.find(([key]) => key === 'id')?.[1],
    source.sample.publicId
  );
  verifyOwnStyleSSRLayout(
    actual.body,
    source.rawHtml,
    source.sample.control,
    label + '/existing-content-layout'
  );
  for (const key of ['ownerKey', 'controlKey', 'publicId', 'query', 'model', 'tag', 'open', 'alive', 'events', 'rawEvents', 'lifecycle', 'calls'] as const)
    assert.deepEqual(actual.state[key], source.state[key], label + '/state/' + key);
  assert.equal(actual.state.alive, true, label + ' client cleanup does not run during SSR');
  assert.equal(typeof actual.state.callerUID, 'string');
  assert(actual.state.callerUID.length > 0);
  // Generated caller IDs are the actual public framework diagnostics. They do
  // not become a cross-framework spelling expectation or a DOM selector.
  assert.deepEqual(actual.refs, source.refs, label + ' actual null SSR refs');
  for (const key of ['rawModel', 'rawAuthoredSample', 'rawAuthoredProvider'] as const)
    verifyIconGraph(actual.state[key], source.state[key], label + '/' + key);
}
