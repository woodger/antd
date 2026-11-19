import { expect, it } from 'vitest';
import {
  readDatePickerPresetsManifest, readDatePickerPresetsCaseMetadata, readDatePickerPresetsInitial,
  readDatePickerPresetsStep, readDatePickerPresetsClosed, readDatePickerPresetsCleanup, readDatePickerPresetsSSR,
  readDatePickerPresetsPart, verifyDatePickerPresetsSourceHeader, verifyDatePickerPresetsSourceManifest,
  verifyDatePickerPresetsSourcePartBinding, verifyDatePickerPresetsSourceOwner, verifyDatePickerPresetsSourceCleanup
} from '../browser/date-picker-presets-reference';
import type { DatePickerPresetsSourceMode, DatePickerPresetsSourceVariant } from '../browser/date-picker-presets-reference';

it('retains both complete independent CSR captures one whole raw part at a time', () => {
  let logicalPoints = 0, closed = 0;
  for (const variant of ['first', 'repeat'] as const) {
    const manifest = readDatePickerPresetsManifest('csr', variant);
    expect(manifest.cases).toHaveLength(6);
    for (const entry of manifest.cases) {
      const initial = readDatePickerPresetsInitial(entry.id, variant);
      expect(initial.owner.open).toBe(false);
      logicalPoints++;
      for (const [index, action] of entry.sample.actions.entries()) {
        const step = readDatePickerPresetsStep(entry.id, index, variant);
        expect(step.action).toEqual(action);
        logicalPoints++;
      }
      for (let index = 0; index < entry.closed!.length; index++) {
        const transition = readDatePickerPresetsClosed(entry.id, index, variant);
        expect(transition.after1000.owner.open).toBe(false);
        closed++;
      }
      const cleanup = readDatePickerPresetsCleanup(entry.id, 'cleanup', variant);
      const late = readDatePickerPresetsCleanup(entry.id, 'late', variant);
      expect(late).toEqual(cleanup);
      const full = readDatePickerPresetsPart(entry.beforeUnmount!, 'csr', variant) as { owner: { alive: boolean } };
      expect(full.owner.alive).toBe(true);
    }
  }
  expect(logicalPoints).toBe(128);
  expect(closed).toBe(28);
}, 60000);

it('retains all real DOM-free Source serializers without inventing popup SSR or factory calls', () => {
  let states = 0, serializations = 0;
  for (const variant of ['first', 'repeat'] as const) {
    for (const entry of readDatePickerPresetsManifest('ssr', variant).cases) {
      const server = readDatePickerPresetsSSR(entry.id, variant);
      states++;
      for (const state of Object.values(server.serializations)) {
        expect(state.rawHtml).toContain('id="preset-field"');
        expect(state.state.lazyCalls).toEqual([]);
        serializations++;
      }
    }
  }
  expect(states).toBe(12);
  expect(serializations).toBe(24);
});

it('rejects unknown modes, variants and owners instead of selecting another Source capture', () => {
  expect(() => readDatePickerPresetsManifest('unknown' as DatePickerPresetsSourceMode)).toThrow();
  expect(() => readDatePickerPresetsManifest('csr', 'unknown' as DatePickerPresetsSourceVariant)).toThrow();
  expect(() => readDatePickerPresetsCaseMetadata('unknown')).toThrow();
  expect(() => readDatePickerPresetsStep('static-validity', -1)).toThrow();
});

it('rejects a changed Source header, partial action matrix or reordered owner', () => {
  const manifest = readDatePickerPresetsManifest();
  const header = structuredClone(manifest.reference);
  header.version = 'wrong';

  expect(() => verifyDatePickerPresetsSourceHeader(header, 'csr')).toThrow();
  const missing = structuredClone(manifest);
  missing.cases[0].steps!.pop();

  expect(() => verifyDatePickerPresetsSourceManifest(missing, 'csr', 'first')).toThrow();
  const order = structuredClone(manifest);
  [order.cases[0], order.cases[1]] = [order.cases[1], order.cases[0]];

  expect(() => verifyDatePickerPresetsSourceManifest(order, 'csr', 'first')).toThrow();
});

it('binds every complete raw to its exact capture, owner, slot and immutable byte pins', () => {
  const original = readDatePickerPresetsManifest();
  const cross = structuredClone(original);
  cross.cases[0].initial = cross.cases[1].initial;

  expect(() => verifyDatePickerPresetsSourceManifest(cross, 'csr', 'first')).toThrow();
  const initial = original.cases[0].initial!;

  expect(() => verifyDatePickerPresetsSourcePartBinding(initial, 'csr', 'repeat')).toThrow();
  const changed = structuredClone(initial);
  changed.rawJSONPart.sha256 = '0'.repeat(64);

  expect(() => readDatePickerPresetsPart(changed)).toThrow();
  const removed = structuredClone(initial);
  delete (removed.rawJSONPart as Partial<typeof removed.rawJSONPart>).gzipSHA256;

  expect(() => readDatePickerPresetsPart(removed)).toThrow();
  const reordered = structuredClone(original);
  [reordered.cases[0].steps![0], reordered.cases[0].steps![1]] = [reordered.cases[0].steps![1], reordered.cases[0].steps![0]];

  expect(() => verifyDatePickerPresetsSourceManifest(reordered, 'csr', 'first')).toThrow();
});

it('rejects changed actual lazy arity, receiver or strict arguments descriptors', () => {
  const source = readDatePickerPresetsStep('lazy-hover-click', 1).actual.owner;
  for (const change of ['arity', 'receiver', 'descriptors']) {
    const owner = structuredClone(source), call = owner.lazyCalls[0] as Record<string, unknown>;
    if (change === 'arity') call.actualArgumentCount = 1;
    if (change === 'receiver') (call.receiver as Record<string, unknown>).isUndefined = false;
    if (change === 'descriptors') (call.argumentOwnDescriptors as unknown[]).reverse();
    expect(() => verifyDatePickerPresetsSourceOwner(owner)).toThrow();
  }
});

it('rejects replacing Original calendar info with a Native API shape or cloning returned date aliases', () => {
  const source = readDatePickerPresetsStep('lazy-hover-click', 6).actual.owner;
  const changed = structuredClone(source);
  const calendar = changed.callbackDates.find(row => (row as { name: string }).name === 'calendar') as Record<string, unknown>;
  calendar.ownInfo = [{ key: 'source' }];

  expect(() => verifyDatePickerPresetsSourceOwner(changed)).toThrow();
  const cloned = structuredClone(source), call = cloned.lazyCalls[0] as { result: { identity: number } };
  call.result.identity = -1;

  expect(() => verifyDatePickerPresetsSourceOwner(cloned)).toThrow();
  const omitted = structuredClone(source);
  omitted.callbackInvocations.pop();

  expect(() => verifyDatePickerPresetsSourceOwner(omitted)).toThrow();
});

it('rejects incomplete whole-owner cleanup while preserving connected unowned BODY and HTML', () => {
  const original = readDatePickerPresetsCleanup('lazy-hover-click');

  expect(() => verifyDatePickerPresetsSourceCleanup(original)).not.toThrow();
  const connected = structuredClone(original);
  connected.retained.find(node => node.owned)!.connected = true;

  expect(() => verifyDatePickerPresetsSourceCleanup(connected)).toThrow();
  const refs = structuredClone(original);
  refs.refs.control = false;

  expect(() => verifyDatePickerPresetsSourceCleanup(refs)).toThrow();
});
