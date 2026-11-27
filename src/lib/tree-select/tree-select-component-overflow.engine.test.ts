import { describe, expect, it } from 'vitest';
import { treeSelectComponentOverflow } from './tree-select-component-overflow.engine';

describe('treeSelectComponentOverflow', () => {
  const baseline = { containerWidth: 200, dataCount: 4, widths: [64, 64, 64, 64],
    suffixWidth: 4, restWidth: 64, previousRestWidth: 0 };

  it('positions the suffix after visible items and the current summary', () => {
    expect(treeSelectComponentOverflow(baseline)).toEqual({ renderCount: 4, visibleCount: 2,
      omittedStart: 2, restReady: true, offset: 192 });
  });

  it('clears positioning when the final two items fit exactly', () => {
    expect(treeSelectComponentOverflow({ ...baseline, containerWidth: 260 })).toMatchObject({
      visibleCount: 4, restReady: false, offset: null });
  });

  it('keeps a suffix in flow when it and the first item exceed the container', () => {
    expect(treeSelectComponentOverflow({ ...baseline, suffixWidth: 173 })).toMatchObject({
      visibleCount: 0, offset: null });
  });

  it('retains Source reservation of a large rest before reaching the final pair', () => {
    expect(treeSelectComponentOverflow({ containerWidth: 100, dataCount: 3, widths: [20, 20, 20],
      suffixWidth: 10, restWidth: 90, previousRestWidth: 0 })).toMatchObject({
        visibleCount: 0,
        offset: 90
      });
  });

  it('reserves the previous rest size but positions with its current size', () => {
    const state = { containerWidth: 160, dataCount: 4, widths: [40, 40, 40, 40],
      suffixWidth: 10, restWidth: 20, previousRestWidth: 100 };

    expect(treeSelectComponentOverflow(state)).toMatchObject({ visibleCount: 1, offset: 60 });
    expect(treeSelectComponentOverflow({ ...state, previousRestWidth: 20 })).toMatchObject({
      visibleCount: 3, offset: 140 });
  });

  it('includes an Overflow prefix before tags and the rest', () => {
    expect(treeSelectComponentOverflow({ ...baseline, prefixWidth: 20 })).toMatchObject({
      visibleCount: 1, offset: 148 });
  });

  it('preserves fractional wrapper measurements in the logical offset', () => {
    expect(treeSelectComponentOverflow({
      ...baseline,
      widths: [59.25, 59.25, 70, 66],
      restWidth: 86
    }))
      .toMatchObject({ visibleCount: 1, offset: 145.25 });
  });

  it('preserves positioning and rest readiness while a newly rendered item is unmeasured', () => {
    const previous = treeSelectComponentOverflow(baseline);

    expect(treeSelectComponentOverflow({ ...baseline, widths: [64, undefined], previous })).toEqual({
      ...previous, visibleCount: 1, omittedStart: 1 });
  });

  it('keeps the previous omission and offset when a hidden host reports zero width', () => {
    const previous = treeSelectComponentOverflow(baseline);

    expect(treeSelectComponentOverflow({ ...baseline, containerWidth: 0, previous })).toEqual({
      ...previous, renderCount: 0, visibleCount: 0 });
  });

  it('retains Source omission of the first data item below its ten pixel render threshold', () => {
    expect(treeSelectComponentOverflow({ ...baseline, containerWidth: 5 })).toEqual({
      renderCount: 0, visibleCount: 0, omittedStart: 1, restReady: true, offset: null });
  });

  it.each([1, 2])('preserves initial rest readiness for unchanged narrow layout starting with %i values', initial => {
    let previous = treeSelectComponentOverflow({
      ...baseline,
      containerWidth: 9,
      dataCount: initial
    });
    for (const dataCount of [1, 2, 3, 1, 2]) {
      previous = treeSelectComponentOverflow({ ...baseline, containerWidth: 9, dataCount, previous });
      expect(previous).toMatchObject({ renderCount: 0, visibleCount: 0, omittedStart: 1,
        restReady: initial > 1, offset: null });
    }
  });

  it('clears the rest and offset when no values remain', () => {
    expect(treeSelectComponentOverflow({ ...baseline, dataCount: 0,
      previous: treeSelectComponentOverflow(baseline) })).toEqual({
      renderCount: 0, visibleCount: 0, omittedStart: 1, restReady: false, offset: null });
  });
});
