import { omissionSamples, type SelectSurfaceOmissionSample } from '../select-surface-omission-cases.mjs';
import { defaultOmissionSamples } from '../select-surface-omission-default-cases.mjs';

export interface NativeSelectSurfaceOmissionSample extends SelectSurfaceOmissionSample {
  readonly initialOpen?: boolean;
  readonly initialPopup?: 'wrapped' | 'omitted';
}
// The precursor's closed-width owner remains in its complete immutable reference.
// Width coverage uses the separate actual open-query Source protocol.
export const selectSurfaceOmissionNativeSamples: readonly NativeSelectSurfaceOmissionSample[] = [
  ...omissionSamples.filter(sample => sample.axis === 'omission'),
  { id: 'select-surface-omission-width-open', control: 'select', axis: 'width', initialValue: [],
    initialOpen: true, initialQuery: 'WWWW', initialFontSize: 12 },
  ...defaultOmissionSamples.map(({ ssrState, ...sample }) => ({ ...sample, initialPopup: ssrState.popup })),
];
