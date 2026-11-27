import { popupOverflowSmokeSamples, type PopupOverflowSmokeSample } from './popup-overflow-cases.ts';

export interface PopupOverflowNestedLayoutSample extends PopupOverflowSmokeSample {
  publicStyle: 'width:max-content';
}

/** Public intrinsic width gives the existing Native pagination list room without changing its wrapping policy. */
export const popupOverflowNestedLayoutSamples: readonly PopupOverflowNestedLayoutSample[] =
  popupOverflowSmokeSamples.filter(sample => sample.family === 'pagination')
    .map(sample => ({ ...sample, publicStyle: 'width:max-content' }));
