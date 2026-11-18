import { expect, it } from 'vitest';
import { readSelectComponentsResponsiveTagPrefixCase } from '../browser/select-components-responsive-tag-prefix-reference';
import { selectComponentsFocusEvent } from '../browser/select-components-assertions';
import { createSelectSurfaceRecorder } from '../browser/select-surface-producers.mjs';
import { verifyResponsiveTagPrefixDisposal, type ResponsiveTagPrefixDisposalOwner,
  type ResponsiveTagPrefixDisposalCleanup } from '../browser/select-components-responsive-tag-prefix-disposal-assertions';
import proof from '../browser/fixtures/select-components-responsive-tag-prefix-disposal-probe.json';
const source = readSelectComponentsResponsiveTagPrefixCase('select-responsive-custom-tag-prefix-multiple');
function fixture() {
  const recorder = createSelectSurfaceRecorder(), events = source.ledger.events.map(selectComponentsFocusEvent), state = source.steps.at(-1)!.owner;
  const before: ResponsiveTagPrefixDisposalOwner = { alive: true, open: false, query: '', model: state.model, settings: state.settings, context: state.context,
    events: events.map(event => recorder.encode(event)), rawEvents: events.map(event => recorder.raw(event)),
    calls: [], bodyActivity: [], lifecycle: [{ slot: 'input', event: 'attach', tag: 'INPUT' }] };
  const blur = ['public-blur', { type: 'focusout', key: undefined, defaultPrevented: false, propagationStopped: false, target: 'INPUT', currentTarget: 'DIV' }];
  const cleanup: ResponsiveTagPrefixDisposalCleanup = { owner: { ...before, alive: false,
    events: [...before.events, recorder.encode(blur)], rawEvents: [...before.rawEvents, recorder.raw(blur)],
    lifecycle: [...before.lifecycle, { slot: 'input', event: 'detach', tag: null }] },
    ownerCount: 0, popupCount: 0, refs: { control: true, root: true, editor: true, authoredRoot: true, authoredInput: true },
    retainedConnected: [{ identity: 1, connected: false }], resourceTiming: [],
    browserOwnedResourceCounters: { measured: false, observers: null, mutations: null, frames: null, timers: null, ports: null } };
  return { before, cleanup, late: structuredClone(cleanup), probe: structuredClone(proof.observations) };
}
it('accepts only the exact observed connected removal blur after the complete Source event prefix', () => {
  const f = fixture(), applied = new Set<string>();
  expect(() => verifyResponsiveTagPrefixDisposal(f.before, f.cleanup, f.late, f.probe, source, 'actual-proof', applied)).not.toThrow();
  expect([...applied]).toEqual(['existing-native-connected-input-removal-blur-after-nine-source-events']);
});
it('rejects missing/duplicate removal events and any changed projected payload', () => {
  const missing = fixture(); missing.cleanup.owner.events.pop(); missing.cleanup.owner.rawEvents.pop();
  expect(() => verifyResponsiveTagPrefixDisposal(missing.before, missing.cleanup, missing.late, missing.probe, source, 'missing')).toThrow();
  const duplicate = fixture(); duplicate.cleanup.owner.events.push(duplicate.cleanup.owner.events[9]); duplicate.cleanup.owner.rawEvents.push(duplicate.cleanup.owner.rawEvents[9]);
  expect(() => verifyResponsiveTagPrefixDisposal(duplicate.before, duplicate.cleanup, duplicate.late, duplicate.probe, source, 'duplicate')).toThrow();
  const changed = fixture(); changed.cleanup.owner.events[9] = createSelectSurfaceRecorder().encode(['public-blur', { type: 'focusout', key: undefined,
    defaultPrevented: true, propagationStopped: false, target: 'INPUT', currentTarget: 'DIV' }]);
  expect(() => verifyResponsiveTagPrefixDisposal(changed.before, changed.cleanup, changed.late, changed.probe, source, 'payload')).toThrow();
});
it('rejects disconnected targets, absent actual public bindings, or a different owner phase', () => {
  const disconnected = fixture(); disconnected.probe[0].target.connected = false;
  expect(() => verifyResponsiveTagPrefixDisposal(disconnected.before, disconnected.cleanup, disconnected.late, disconnected.probe, source, 'disconnected')).toThrow();
  const ref = fixture(); ref.probe[0].actualRefs.root.connected = false;
  expect(() => verifyResponsiveTagPrefixDisposal(ref.before, ref.cleanup, ref.late, ref.probe, source, 'public-ref')).toThrow();
  const owner = fixture(); owner.probe[0].owner.alive = false;
  expect(() => verifyResponsiveTagPrefixDisposal(owner.before, owner.cleanup, owner.late, owner.probe, source, 'phase')).toThrow();
});
it('rejects extra ref churn, incomplete removal, and any late public activity', () => {
  const refs = fixture(); refs.cleanup.owner.lifecycle.push({ slot: 'input', event: 'attach', tag: 'INPUT' });
  expect(() => verifyResponsiveTagPrefixDisposal(refs.before, refs.cleanup, refs.late, refs.probe, source, 'ref-churn')).toThrow();
  const connected = fixture(); connected.cleanup.retainedConnected[0].connected = true;
  expect(() => verifyResponsiveTagPrefixDisposal(connected.before, connected.cleanup, connected.late, connected.probe, source, 'retained')).toThrow();
  const late = fixture(); late.late.owner.open = true;
  expect(() => verifyResponsiveTagPrefixDisposal(late.before, late.cleanup, late.late, late.probe, source, 'late')).toThrow();
});
