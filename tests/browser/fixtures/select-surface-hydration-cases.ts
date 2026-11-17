import { selectSurfaceStyleHistorySamples, selectSurfaceStyleHistoryActions } from './select-surface-style-history-cases';
import type { SelectSurfaceSample } from './select-surface-cases';

export interface SelectSurfaceHydrationSample {
  id: string;
  control: 'select' | 'autocomplete';
  producers: boolean;
}
export const selectSurfaceHydrationSamples: readonly SelectSurfaceHydrationSample[] = selectSurfaceStyleHistorySamples.flatMap(sample => [
  { ...sample, id: sample.id.replace('style-history-', 'style-history-hydration-'), producers: false },
  { ...sample, id: sample.id.replace('style-history-', 'style-history-hydration-') + '-producers', producers: true }
]);
export const selectSurfaceHydrationActions = [...selectSurfaceStyleHistoryActions,
  { type: 'click' as const }, { type: 'outside' as const }];
export type SelectSurfaceHydrationAction = typeof selectSurfaceHydrationActions[number];

export function selectSurfaceHydrationSemanticSample(sample: SelectSurfaceHydrationSample): SelectSurfaceSample {
  return { id: sample.id, control: sample.control, value: 'a', valueOwner: 'controlled', openOwner: 'controlled',
    popup: sample.producers ? 'wrap' : 'omitted', classes: sample.producers ? 'function' : 'omitted',
    styles: sample.producers ? 'function' : 'object', config: {}, dataset: 'basic', search: 'object', scenario: 'menu' };
}
