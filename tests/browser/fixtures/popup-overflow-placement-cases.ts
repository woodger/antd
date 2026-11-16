import {
  popupOverflowActions, popupOverflowSamples,
  type PopupOverflowAction, type PopupOverflowSample, type PopupOverflowSmokeSample
} from './popup-overflow-cases.ts';

export const popupOverflowPlacementSamples: readonly PopupOverflowSample[] = [
  { id: 'select-placement-bottom-right', family: 'select', outer: 'omitted', inner: 'viewport',
    layout: 'edge', placement: 'bottomRight' },
  { id: 'select-placement-top-left', family: 'select', outer: 'omitted', inner: 'viewport',
    layout: 'edge', placement: 'topLeft' },
  { id: 'select-placement-top-right', family: 'select', outer: 'omitted', inner: 'viewport',
    layout: 'edge', placement: 'topRight' }
];

export const popupOverflowAllSamples: readonly PopupOverflowSample[] = [
  ...popupOverflowSamples, ...popupOverflowPlacementSamples
];

/** Both vertical choices fit, so an explicit top placement cannot pass through the default's flip. */
export function popupOverflowAllActions(
  sample: PopupOverflowSample | PopupOverflowSmokeSample
): readonly PopupOverflowAction[] {
  return popupOverflowPlacementSamples.some(entry => entry.id === sample.id)
    ? [{ type: 'viewport', width: 1200, height: 1200 }, { type: 'click' }, { type: 'outside' }]
    : popupOverflowActions(sample);
}
