import { expect, it } from 'vitest';
import proof from '../browser/fixtures/modal-loading-native-skeleton-proof.json';
import { readModalLoadingSourceCSR } from '../browser/modal-loading-reference';
import { verifyModalLoadingPoint, verifyModalLoadingSkeleton, verifyModalLoadingCleanup, verifyModalLoadingDiagnostics } from '../browser/modal-loading-assertions';
import type { ModalLoadingPoint } from '../browser/modal-loading-metrics.mjs';

it('accepts every unmodified full Source point and cleanup without a Native comparison view', () => {
  for (const entry of readModalLoadingSourceCSR().cases) {
    let previous: ModalLoadingPoint | undefined;
    for (const point of [entry.initial, ...entry.steps.map(step => step.actual)]) {
      expect(verifyModalLoadingPoint(point, point, entry.initial, entry.id, previous, undefined, 'source')).toEqual([]); previous = point;
    }
    expect(verifyModalLoadingCleanup(entry.cleanup, entry.late, entry, entry.id)).toEqual([]);
  }
});

it('accepts the literal recorded Native placeholder only with the two exact pre-existing Skeleton CSS pairs', () => {
  const source = readModalLoadingSourceCSR().cases[0].steps[1].actual;
  const actual = proof.actual as unknown as Parameters<typeof verifyModalLoadingSkeleton>[0];
  const applied = new Set<string>();
  expect(() => verifyModalLoadingSkeleton(actual, source, 'recorded Native physical placeholder', applied)).not.toThrow();
  expect([...applied]).toEqual(['existing-skeleton-placeholder-and-li-max-width-containment', 'existing-skeleton-source-hashed-native-canonical-keyframe-name']);
  for (const [role, name, value] of [['skeleton', 'max-width', '90%'], ['row', 'animation-name', 'unknown-ant-skeleton-loading'],
    ['paragraph', 'font-size', '15px'], ['row', 'margin-top', '15px']] as const) {
    const changed = structuredClone(actual);
    const node = role === 'row' ? changed.skeletonRows[0] : role === 'paragraph' ? changed.nodes.skeletonParagraph! : changed.nodes.skeleton!;
    node.computed!.find(([key]) => key === name)![1] = value;
    expect(() => verifyModalLoadingSkeleton(changed, source, name)).toThrow();
  }
});

it('rejects width, row count, margins, alignment, missing children, draft, lifecycle, identity and callback changes', () => {
  const entry = readModalLoadingSourceCSR().cases[0], loading = entry.steps[1].actual;
  const changes: Array<(point: ModalLoadingPoint) => void> = [
    point => { point.nodes.skeleton!.box!.width += 1; }, point => { point.skeletonRows.pop(); },
    point => { point.nodes.skeleton!.computed!.find(([key]) => key === 'margin-top')![1] = '17px'; },
    point => { point.nodes.skeleton!.computed!.find(([key]) => key === 'align-items')![1] = 'start'; },
  ];
  for (const change of changes) {
    const changed = structuredClone(loading); change(changed);
    expect(verifyModalLoadingPoint(changed, loading, entry.initial, 'changed loading', undefined, undefined, 'source').length).toBeGreaterThan(0);
  }
  const initialChanges: Array<(point: ModalLoadingPoint) => void> = [
    point => { point.nodes.authoredBody = null; }, point => { point.nodes.footer = null; },
    point => { point.nodes.editor!.value = 'Wrong draft'; }, point => { point.owner.lifecycle.pop(); },
    point => { point.nodes.title!.identity += 1; }, point => { point.owner.events.push('unexpected'); },
  ];
  for (const change of initialChanges) {
    const changed = structuredClone(entry.initial); change(changed);
    expect(verifyModalLoadingPoint(changed, entry.initial, entry.initial, 'changed initial', undefined, undefined, 'source').length).toBeGreaterThan(0);
  }
});

it('rejects live retained nodes, ref leaks, late changes and browser failures', () => {
  const entry = readModalLoadingSourceCSR().cases[0];
  const refLeak = structuredClone(entry.cleanup); refLeak.refs.editor = false;
  expect(verifyModalLoadingCleanup(refLeak, refLeak, entry, 'ref leak').length).toBeGreaterThan(0);
  const connected = structuredClone(entry.cleanup); connected.retained[0].connected = true;
  expect(verifyModalLoadingCleanup(connected, connected, entry, 'connected').length).toBeGreaterThan(0);
  const late = structuredClone(entry.late); late.owner.events.push('late');
  expect(verifyModalLoadingCleanup(entry.cleanup, late, entry, 'late').length).toBeGreaterThan(0);
  expect(verifyModalLoadingDiagnostics([], [], [], 'quiet')).toEqual([]);
  expect(verifyModalLoadingDiagnostics(['pageerror'], [], [], 'error').length).toBeGreaterThan(0);
  expect(verifyModalLoadingDiagnostics([], [{ type: 'warning' }], [], 'warning').length).toBeGreaterThan(0);
  expect(verifyModalLoadingDiagnostics([], [], ['requestfailed'], 'network').length).toBeGreaterThan(0);
});
