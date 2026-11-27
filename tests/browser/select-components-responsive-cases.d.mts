import type { SelectComponentsModesSettings, SelectComponentsModesSample, SelectComponentsModesAction } from './select-components-modes-cases.mjs';

export interface SelectComponentsResponsiveSettings extends SelectComponentsModesSettings {
  mode: 'multiple' | 'tags';
  maxTagCount: 'responsive';
  value: string[];
  containerWidth: number;
  adornmentWidth?: number;
  componentTag: 'input';
  components: { slot: 'input'; kind: 'function' };
}
export type SelectComponentsResponsiveAction = Exclude<SelectComponentsModesAction, { type: 'props' }>
  | { type: 'props'; set: Partial<SelectComponentsResponsiveSettings>; drop?: Array<keyof SelectComponentsResponsiveSettings> };
export type SelectComponentsResponsiveSample = Omit<SelectComponentsModesSample, 'settings' | 'actions'> & {
  renderer: 'forwardRef-direct-input' | 'forwardRef-fragment-input-adornment';
  settings: SelectComponentsResponsiveSettings;
  actions: SelectComponentsResponsiveAction[];
};
export const selectIconSamples: never[];
export const selectComponentFaultSamples: never[];
export const selectComponentSamples: SelectComponentsResponsiveSample[];
export const selectIconsGeometry: { viewport: { width: number; height: number }; root: { left: number; top: number; width: number } };
