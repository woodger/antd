import { expect, it } from 'vitest';
import { readSelectComponentsHydrationOwnershipSource, readSelectComponentsHydrationOwnershipCase,
  readSelectComponentsHydrationOwnershipManifest, readHydrationOwnershipSourcePhase, validateHydrationOwnershipSource } from '../browser/select-components-hydration-ownership-reference';
import type { HydrationOwnershipNode } from '../browser/select-components-hydration-ownership-metrics.mjs';

const source = readSelectComponentsHydrationOwnershipSource();
it('retains all independent Source roots, complete phases and both byte-equal raw captures', () => {
  const manifest = readSelectComponentsHydrationOwnershipManifest();

  expect(source.cases).toHaveLength(12);
  expect(source.cases.reduce((sum, entry) => sum + entry.scenario.environment.owners.length, 0)).toBe(16);
  expect(source.cases.reduce((sum, entry) => sum + entry.completedActions, 0)).toBe(60);
  expect(source.cases.reduce((sum, entry) => sum + entry.trace.length, 0)).toBe(204);
  expect(source.cases.reduce((sum, entry) => sum + entry.peerCleanups, 0)).toBe(4);
  expect(readSelectComponentsHydrationOwnershipSource('repeat')).toEqual(source);
  expect(manifest.repeatProof.wholePairByteEqual).toBe(true);
  expect(manifest.serialization.normalizedFields).toEqual([]);
  expect(manifest.serialization.fieldsDropped).toEqual([]);
  expect(manifest.preservation).toEqual({
    inputFiles: 10,
    references: 881,
    priorProductionStandTrees: 6,
    verifiedBeforeAndAfter: true
  });
});
it('keeps default caller UID diagnostics independent from unique supplied public field IDs', () => {
  for (const entry of source.cases) {
    for (const state of Object.values(entry.server.serializations)) {
      expect(state.domFree).toBe(true);
      expect(state.fatal).toBeNull();
      expect(state.resources).toEqual({
        timers: 0,
        frames: 0,
        measurements: 0,
        microtasks: 0,
        ports: 0
      });
      expect(state.messageChannelEnvironment).toEqual({
        availableDuringUMDLoad: false,
        forbiddenDuringRender: true
      });
      if (entry.scenario.environment.owners.includes('A')) {
        expect(state.callerUIDs.A).toBe(state.callerUIDs.B);
        expect(state.documentPairCallerUIDEqual).toBe(true);
        expect(state.owners.A!.sample.publicId).not.toBe(state.owners.B!.sample.publicId);
      }
      for (const key of entry.scenario.environment.owners) {
        const owner = state.owners[key]!;
        expect(owner.state.alive).toBe(true);
        expect(owner.state.callerUID).toBe(state.callerUIDs[key]);
        expect(Object.values(owner.refs).every(Boolean)).toBe(true);
        const committed = readHydrationOwnershipSourcePhase(entry, key + '-settled').roots[key]!;
        expect(committed.ownerState!.callerUID).toBe(owner.state.callerUID);
      }
    }
  }
});
it('protects the measured clean and dirty initial authored-ref value/selection split', () => {
  for (const entry of source.cases) {
    const root = readHydrationOwnershipSourcePhase(entry, 'B-first-owner-commit').roots.B!;
    const rows = root.ownerState!.lifecycle as Array<{
      event: string;
      observation: HydrationOwnershipNode | null
    }>;
    const first = rows.find(row => row.event === 'attach')!.observation!;
    const dirtyInput = entry.scenario.prehydrate.dirty && entry.scenario.control.initialTag === 'input';
    expect(first.value).toBe(dirtyInput ? 'Draft before hydration' : 'a');
    expect(first.defaultValue).toBe('a');
    expect(first.selection).toEqual(dirtyInput ? [2, 8, 'backward'] : entry.scenario.prehydrate.dirty ? [1, 1, 'forward'] : [0, 0, 'forward']);
    expect(first.identity).toBe(root.parsed.editor!.identity);
    expect(first.scopeFocused).toBe(true);
    const settled = readHydrationOwnershipSourcePhase(entry, 'B-settled').roots.B!;
    expect(settled.physical.editor!.value).toBe('a');
    expect(settled.physical.editor!.selection).toEqual(entry.scenario.prehydrate.dirty ? [1, 1, 'forward'] : [0, 0, 'forward']);
    expect(settled.identity.editorSameAsParsed).toBe(true);
  }
});
it('uses the saved closed ShadowRoot for deep focus and every real public editor ref', () => {
  for (const entry of source.cases) {
    const root = readHydrationOwnershipSourcePhase(entry, 'B-settled').roots.B!, shadow = entry.scenario.environment.kind !== 'document';
    expect(root.refs.editorInsideTarget).toBe(true);
    expect(root.refs.rootInsideTarget).toBe(true);
    expect(root.refs.editorMatchesPhysical).toBe(true);
    expect(root.refs.rootMatchesPhysical).toBe(true);
    expect(root.refs.editorOwnerKey).toBe('B');
    expect(root.focus.editorIsScopeActive).toBe(true);
    expect(root.focus.editorIsDocumentActive).toBe(!shadow);
    expect(root.focus.hostIsDocumentActive).toBe(shadow ? true : null);
    if (shadow) expect(root.target.hostExposesSavedRoot).toBe(entry.scenario.environment.kind === 'shadow-open');
  }
});
it('changes only the target editor at replacement and keeps its peer mounted through quiet disposal', () => {
  for (const entry of source.cases) {
    const before = readHydrationOwnershipSourcePhase(entry, 'B-settled'), replaced = readHydrationOwnershipSourcePhase(
      entry,
      'action-3-settled'
    );
    expect(replaced.roots.B!.physical.editor!.name).toBe(entry.scenario.control.replacementTag.toUpperCase());
    expect(replaced.roots.B!.physical.editor!.identity).not.toBe(before.roots.B!.physical.editor!.identity);
    expect(replaced.roots.B!.parsed.editor!.connected).toBe(false);
    const late = readHydrationOwnershipSourcePhase(entry, 'target-late'), disposed = readHydrationOwnershipSourcePhase(
      entry,
      'action-4-settled'
    );
    expect(late.roots.B!.ownerState).toEqual(disposed.roots.B!.ownerState);
    expect(late.roots.B!.physical.editor).toBeNull();
    expect(late.roots.B!.ownerState!.alive).toBe(false);
    expect(late.roots.B!.retainedOwnedConnections.every(node => !node.connected)).toBe(true);
    if (entry.scenario.environment.owners.includes('A')) {
      expect(late.roots.A!.ownerState!.alive).toBe(true);
      expect(late.roots.A!.ownerState!.query).toBe('a');
      expect(late.roots.A!.physical.editor!.value).toBe('a');
      expect(late.roots.A!.refs.editorMatchesPhysical).toBe(true);
      expect(readHydrationOwnershipSourcePhase(entry, 'peer-late').roots.A!.ownerState!.alive).toBe(false);
    }
  }
});
it('rejects unmeasured scenarios, variants, incomplete phases, nonzero SSR resources and changed SSR HTML', () => {
  expect(() => readSelectComponentsHydrationOwnershipCase('unmeasured')).toThrow();
  // @ts-expect-error JavaScript callers must not select an unmeasured variant.
  expect(() => readSelectComponentsHydrationOwnershipSource('other')).toThrow();
  const entry = source.cases[0], resources = entry.server.serializations.renderToString.resources;
  const original = resources.timers;
  resources.timers = 1;
  try {
    expect(() => validateHydrationOwnershipSource(source, source.reference)).toThrow();
  } finally {
    resources.timers = original;
  }
  const trace = entry.trace;
  entry.trace = trace.slice(1);
  try {
    expect(() => validateHydrationOwnershipSource(source, source.reference)).toThrow();
  } finally {
    entry.trace = trace;
  }
  const owner = entry.server.serializations.renderToString.owners.A!, html = owner.rawHtml;
  owner.rawHtml += 'changed';
  try {
    expect(() => validateHydrationOwnershipSource(source, source.reference)).toThrow();
  } finally {
    owner.rawHtml = html;
  }
  expect(() => validateHydrationOwnershipSource(source, source.reference)).not.toThrow();
});
