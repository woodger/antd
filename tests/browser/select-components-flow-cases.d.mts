import type { SelectIconSample, SelectIconAction } from './select-icons-cases.mjs';
export type SelectComponentsAction = SelectIconAction | { type: 'root-click' }
  | { type: 'focus-method'; options?: FocusOptions };
export type SelectComponentsSample = Omit<SelectIconSample, 'actions'> & { actions: SelectComponentsAction[] };
export const selectIconSamples: SelectComponentsSample[];
export const selectComponentSamples: SelectComponentsSample[];
export const selectIconsGeometry: { viewport: { width: number; height: number }; root: { left: number; top: number; width: number } };
