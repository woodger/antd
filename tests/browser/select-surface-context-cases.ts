export interface SelectSurfaceContextSample {
  id: string;
  control: 'select' | 'autocomplete';
}
export type SelectSurfaceContextAction = { type: 'fields' | 'click' | 'outside' }
  | { type: 'fill'; text: string }
  | { type: 'contexts'; disabled: boolean; variant: 'underlined' | 'borderless' | 'filled' };
export const selectSurfaceContextSamples: readonly SelectSurfaceContextSample[] = [
  { id: 'select-surface-context-select', control: 'select' },
  { id: 'select-surface-context-autocomplete', control: 'autocomplete' }
];
