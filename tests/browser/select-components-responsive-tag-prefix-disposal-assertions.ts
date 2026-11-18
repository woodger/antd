import assert from 'node:assert/strict';
import { createSelectSurfaceRecorder } from './select-surface-producers.mjs';
import { selectComponentsFocusEvent, selectComponentsSourceFocusGraph } from './select-components-assertions';
import { verifySelectSurfaceEventGraph } from './select-surface-assertions';
import type { SelectCustomTagPrefixOwner } from './select-components-responsive-tag-prefix-metrics.mjs';
import type { ResponsiveTagPrefixCSRCase } from './select-components-responsive-tag-prefix-reference';
import type { ResponsiveTagPrefixNativeCleanup } from './select-components-responsive-tag-prefix-driver';
export type ResponsiveTagPrefixDisposalOwner = Pick<SelectCustomTagPrefixOwner, 'alive' | 'open' | 'query' | 'model' | 'settings' | 'context'
  | 'events' | 'rawEvents' | 'calls' | 'bodyActivity' | 'lifecycle'>;
export type ResponsiveTagPrefixDisposalCleanup = Omit<ResponsiveTagPrefixNativeCleanup, 'owner'> & { owner: ResponsiveTagPrefixDisposalOwner };
export function verifyResponsiveTagPrefixDisposal(before: ResponsiveTagPrefixDisposalOwner, cleanup: ResponsiveTagPrefixDisposalCleanup,
  late: ResponsiveTagPrefixDisposalCleanup, focusoutProbe: unknown[], source: ResponsiveTagPrefixCSRCase, label: string, applied?: Set<string>) {
  assert(['select-responsive-custom-tag-prefix-multiple', 'select-responsive-custom-tag-prefix-tags-fragment'].includes(source.id));
  assert.equal(source.steps.length, 9); assert.equal(source.ledger.events.length, 9); assert.equal(source.ledger.rawEvents.length, 9);
  assert.deepEqual(source.cleanup.owner.events, source.ledger.events, label + ' literal Source has no disposal blur');
  assert.deepEqual(source.cleanup.owner.rawEvents, source.ledger.rawEvents); assert.deepEqual(source.late, source.cleanup);
  assert.equal(before.alive, true); assert.equal(before.open, false); assert.equal(before.query, '');
  const last = source.steps.at(-1)!;
  for (const key of ['model', 'settings', 'context'] as const) assert.deepEqual(before[key], last.owner[key], label + '/' + key);
  assert.equal(before.events.length, 9); assert.equal(before.rawEvents.length, 9);
  assert.deepEqual(before.events.map(selectComponentsFocusEvent), source.ledger.events.map(selectComponentsFocusEvent));
  before.rawEvents.forEach((raw, index) => verifySelectSurfaceEventGraph(raw,
    selectComponentsSourceFocusGraph(source.ledger.rawEvents[index], source.ledger.events[index]), label + '/before-event' + index));
  assert.equal(cleanup.owner.alive, false); assert.equal(cleanup.ownerCount, 0); assert.equal(cleanup.popupCount, 0);
  assert(Object.values(cleanup.refs).every(Boolean)); assert(cleanup.retainedConnected.every(value => !value.connected));
  for (const key of ['model', 'settings', 'context', 'open', 'query', 'calls', 'bodyActivity'] as const)
    assert.deepEqual(cleanup.owner[key], before[key], label + ' disposal changes no ' + key);
  assert.deepEqual(cleanup.owner.lifecycle, [...before.lifecycle, { slot: 'input', event: 'detach', tag: null }],
    label + ' exactly the actual final authored ref detach, no fabricated React ref churn');
  assert.equal(cleanup.owner.events.length, 10); assert.equal(cleanup.owner.rawEvents.length, 10);
  assert.deepEqual(cleanup.owner.events.slice(0, 9), before.events); assert.deepEqual(cleanup.owner.rawEvents.slice(0, 9), before.rawEvents);
  const recorder = createSelectSurfaceRecorder(), expected = ['public-blur', { type: 'focusout', key: undefined,
    defaultPrevented: false, propagationStopped: false, target: 'INPUT', currentTarget: 'DIV' }];
  assert.deepEqual(cleanup.owner.events[9], recorder.encode(expected), label + ' one exact existing Native removal blur');
  verifySelectSurfaceEventGraph(cleanup.owner.rawEvents[9], recorder.raw(expected), label + '/raw-removal-blur');
  const node = (name: string, initialRoot = false, initialEditor = false) => ({ nodeType: name === '#document' ? 9 : 1, name,
    connected: true, initialRoot, initialEditor });
  const root = node('DIV', true), editor = node('INPUT', false, true);
  assert.deepEqual(focusoutProbe, [{ type: 'focusout', target: editor, observerCurrentTarget: node('#document'), relatedTarget: null,
    activeElement: node('BODY'), initialRoot: root, initialEditor: editor,
    actualRefs: { control: 'object', root, editor, authoredRoot: null, authoredInput: editor },
    owner: { alive: true, open: false, query: '' }, defaultPrevented: false, propagationStopped: false, eventPhase: 1 }],
    label + ' exact read-only actual connected-node/live-public-bindings observation');
  assert.deepEqual(late, cleanup, label + ' every actual owner/ref/event/producer/DOM/resource field quiet after1000ms');
  applied?.add('existing-native-connected-input-removal-blur-after-nine-source-events');
}
