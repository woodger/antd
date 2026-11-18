import fs from 'node:fs';
import { expect, it } from 'vitest';
import {
  projectRenderHooksSourceFacts,
  readRenderHooksSourceManifest,
  readRenderHooksSourceFacts,
  readRenderHooksSourcePart,
  verifyRenderHooksSourceStoredParts
} from '../browser/date-picker-render-hooks-reference.mjs';

it('preserves complete independent renderer captures and every original stored gzip', () => {
  expect(verifyRenderHooksSourceStoredParts()).toEqual({
    sourceOnly: true, captures: 4, originalParts: 584, blobs: 414
  });
  for (const variant of ['first', 'repeat'] as const) {
    const csr = readRenderHooksSourceManifest('csr', variant);
    expect(csr.cases).toHaveLength(4);
    expect(csr.actualCounts).toEqual({ owners: 4, actions: 122, logicalPoints: 126,
      closedAfter1000: 4, hookInvocations: 15285, keyboardEvents: 16 });
    expect(csr.errors).toEqual([]);
    expect(csr.diagnostics).toEqual([]);
    expect(csr.terminalInputVerification.unchanged).toBe(true);
    for (const row of csr.cases) {
      expect(row.failure).toBeNull();
      expect(row.observationErrors).toEqual([]);
      expect(row.steps).toHaveLength(row.sample.actions.length);
    }
    const ssr = readRenderHooksSourceManifest('ssr', variant);
    expect(ssr.counts).toEqual({ owners: 4, serializations: 8 });
    expect(ssr.diagnostics).toEqual([]);
    expect(ssr.failures).toBe(0);
    for (const part of ssr.cases) {
      const actual = readRenderHooksSourcePart<{
        fatal: unknown; domFree: boolean; callerInitialHooksEnabled: boolean;
        refs: Record<string, boolean>; resources: Record<string, number>;
        state: { owner: { enabled: boolean }; hooks: { rows: unknown[] } };
      }>(part);
      expect(actual.fatal).toBeNull();
      expect(actual.domFree).toBe(true);
      expect(actual.callerInitialHooksEnabled).toBe(true);
      expect(actual.state.owner.enabled).toBe(true);
      expect(actual.state.hooks.rows).toEqual([]);
      expect(Object.values(actual.refs).every(value => value)).toBe(true);
      expect(Object.values(actual.resources).every(value => value === 0)).toBe(true);
    }
  }
});

it('derives bounded public metadata and layout facts from full actual Source parts', () => {
  for (const variant of ['first', 'repeat'] as const) {
    for (const row of readRenderHooksSourceManifest('csr', variant).cases) {
      const first = readRenderHooksSourceFacts(row.id, 'firstwrap', variant);
      expect(first.cells.length).toBeGreaterThan(0);
      expect(first.cells.every(cell => cell.materializedMarker)).toBe(true);
      expect(first.cells.every(cell => cell.returnedChildIsOrigin)).toBe(true);
      expect(first.locales[0].ownKeys).toEqual(Object.keys(first.locales[0].plain));
      for (const cell of first.cells) {
        expect(cell.ownKeys).toEqual(cell.own.map(property => (property as { key: string }).key));
        expect(cell.rangeOwn).toBe(true);
        expect(cell.origin.type).toBe('div');
        if (cell.current.kind === 'dayjs') expect(cell.current.temporal?.fields).toHaveLength(7);
      }
      expect(first.todayGroups.every(group => group.types.length === 1)).toBe(true);
      expect(first.layout.footer.every(node => !node.insidePanel)).toBe(true);
      expect(first.layout.extraFooter.every(node => node.parentIsFooter)).toBe(true);
      const replacement = readRenderHooksSourceFacts(row.id, 'panel-replace', variant);
      expect(replacement.hookKinds.cell).toBe(0);
      expect(replacement.hookKinds.footer).toBe(0);
      const empty = readRenderHooksSourceFacts(row.id, 'panel-empty', variant);
      expect(empty.hookKinds.cell).toBe(0);
      expect(empty.hookKinds.footer).toBe(0);
      if (row.sample.datetime) {
        const format = readRenderHooksSourceFacts(row.id, 'format-only', variant);
        expect(format.locales.length).toBeGreaterThan(0);
        expect(format.locales[0].plain.fieldTimeFormat).toBe('HH:mm:ss');
        expect(format.locales[0].plain.fieldDateTimeFormat).toBe('YYYY-MM-DD HH:mm:ss');
      }
    }
  }
}, 60000);

it('derives the bounded plain fixture from actual materialized Source cells in DOM order', () => {
  const file = new URL('../browser/fixtures/ant-design-date-picker-render-hooks-facts.json', import.meta.url);
  const snapshot = JSON.parse(fs.readFileSync(file, 'utf8'));
  expect(snapshot.sourceOnly).toBe(true);
  expect(snapshot.NativeDataUsed).toBe(false);
  expect(snapshot.sourceProtocolSHA256).toBe(
    '3cd5f9c3b2131ce68fbd8ca0a79f30b48952609c0a4a0d4d1965f5614c1424a3'
  );
  expect(snapshot.cases).toHaveLength(4);
  for (const variant of ['first', 'repeat'] as const) {
    for (const row of snapshot.cases) {
      const phases = [
        ['firstwrap', 'firstwrap'], ['month', 'mode-month'],
        ['year', 'mode-year'], ['decade', 'mode-decade']
      ];
      if (row.datetime) phases.push(['formatOnly', 'format-only']);
      for (const [key, phase] of phases) {
        const actual = readRenderHooksSourceFacts(row.id, phase, variant);
        const projected = projectRenderHooksSourceFacts(actual);
        expect(projected.cells.map(cell => cell.sequence)).toEqual(actual.materializedCellSequences);
        expect(row[variant][key]).toEqual(projected);
      }
      const clock = readRenderHooksSourceFacts(row.id, 'clock-repaint', variant);
      expect(row[variant].clockRepaint).toEqual({
        pointPart: clock.pointPart,
        hooksPart: clock.hooksPart,
        todayTitles: clock.todayTitles,
        todayGroups: clock.todayGroups.map(group => ({
          identity: group.identity, temporal: group.temporal,
          types: group.types, subTypes: group.subTypes
        }))
      });
      if (row.kind === 'range') {
        const end = readRenderHooksSourceFacts(row.id, 'end-field', variant);
        expect(row[variant].declaredEndField).toEqual({
          pointPart: end.pointPart,
          hooksPart: end.hooksPart,
          focusedField: end.focusedField,
          renderedRangeValues: end.renderedRangeValues
        });
      }
    }
  }
}, 60000);
