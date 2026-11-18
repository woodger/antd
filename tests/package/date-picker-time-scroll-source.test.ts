import { expect, it } from 'vitest';
import type { SourceStep } from '../browser/date-picker-time-scroll-reference.mjs';
import { samples } from '../browser/date-picker-time-scroll-cases.mjs';
import {
  readTimeScrollSourceCapture,
  readTimeScrollSourceCase,
  readTimeScrollSourcePart,
  verifyAllTimeScrollSource
} from '../browser/date-picker-time-scroll-reference.mjs';

it('retains both complete independently captured Source scroll owners and every original raw part', () => {
  expect(verifyAllTimeScrollSource()).toEqual({ parts: 54, blobs: 50, sourceOnly: true });
  for (const variant of ['first', 'repeat'] as const) {
    const capture = readTimeScrollSourceCapture(variant);
    expect(capture.cases.map(row => row.id)).toEqual(samples.map(sample => sample.id));
    expect(capture.actualCounts).toEqual({
      owners: 2, actions: 17, logicalPoints: 19, closedAfter1000: 2, trustedWheelActions: 5
    });
    for (const sample of samples) {
      const row = readTimeScrollSourceCase(sample.id, variant);
      expect(row.sample).toEqual(sample);
      expect(row.steps).toHaveLength(sample.actions.length);
      for (const [index, action] of sample.actions.entries()) {
        expect(readTimeScrollSourcePart<SourceStep>(row.steps[index]).action).toEqual(action);
      }
    }
  }
});
