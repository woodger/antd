import type { SelectIconSettings } from './select-icons-cases.mjs';
import type { SelectComponentsSample, SelectComponentsAction } from './select-components-flow-cases.mjs';
export interface SelectComponentsModesSettings extends SelectIconSettings {
  componentTag?: 'input' | 'textarea';
  componentProps?: Record<string, unknown>;
}
export type SelectComponentsModesAction = Exclude<SelectComponentsAction, { type: 'props' }>
  | { type: 'props'; set: Partial<SelectComponentsModesSettings>; drop?: Array<keyof SelectComponentsModesSettings> };
export type SelectComponentsModesSample = Omit<SelectComponentsSample, 'settings' | 'actions'>
  & { settings: SelectComponentsModesSettings; actions: SelectComponentsModesAction[] };
export const selectIconSamples: never[];
export const selectComponentSamples: SelectComponentsModesSample[];
export const selectComponentFaultSamples: SelectComponentsModesSample[];
export const selectIconsGeometry: { viewport: { width: number; height: number }; root: { left: number; top: number; width: number } };
