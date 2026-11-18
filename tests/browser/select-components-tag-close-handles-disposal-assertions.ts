import assert from 'node:assert/strict';
import { selectSurfaceEventValue, verifySelectSurfaceEventGraph } from './select-surface-assertions';
import type { SourceCSRCase } from './select-components-tag-close-handles-reference';
import type { NativeCleanup } from './select-components-tag-close-handles-driver';
export function verifyTagCloseHandleDisposal(cleanup: NativeCleanup, late: NativeCleanup, source: SourceCSRCase, label: string) {
  for (const key of ['ownerCount', 'popupCount'] as const) { assert.equal(cleanup[key], 0, label); assert.equal(source.cleanup[key], 0); }
  assert.equal(cleanup.owner.alive, false); assert.equal(source.cleanup.owner.alive, false);
  assert(Object.values(cleanup.refs).every(Boolean)); assert(Object.values(source.cleanup.refs).every(Boolean));
  assert(cleanup.retainedConnected.some(node => node.ownedAtFirstObservation));
  assert(cleanup.retainedConnected.filter(node => node.ownedAtFirstObservation).every(node => !node.connected));
  assert(source.cleanup.retainedConnected.filter(node => node.ownedAtFirstObservation).every(node => !node.connected));
  for (const key of ['model', 'options', 'disabled', 'open', 'invocations', 'retention'] as const) {
    if (key !== 'invocations' && key !== 'retention') assert.deepEqual(cleanup.owner[key], source.cleanup.owner[key]);
    else assert.equal(cleanup.owner[key].length, source.cleanup.owner[key].length);
  }
  assert.deepEqual(cleanup.owner.events.map(selectSurfaceEventValue), source.cleanup.owner.events.map(selectSurfaceEventValue));
  assert.equal(cleanup.owner.rawEvents.length, source.cleanup.owner.rawEvents.length);
  cleanup.owner.rawEvents.forEach((event, index) => verifySelectSurfaceEventGraph(event, source.cleanup.owner.rawEvents[index], label + '/event' + index));
  // These programmatic buttons never focus the editor. No disposal blur waiver.
  assert.deepEqual(cleanup.owner.events, late.owner.events); assert.deepEqual(late, cleanup, label + ' full 1000ms late silence');
  assert.deepEqual(source.late, source.cleanup, label + ' independent Original late silence');
}
