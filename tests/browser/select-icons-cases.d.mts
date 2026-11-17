export type SelectIconValue = string | number;
export interface SelectIconSettings extends Record<string, unknown> {
  mode?: 'multiple' | 'tags'; value?: SelectIconValue | SelectIconValue[];
  open?: boolean; config?: Record<string, unknown>; inner?: 'omitted' | Record<string, unknown>;
  feedback?: boolean; metadata?: boolean; components?: { slot: string; kind: string };
}
export type SelectIconAction =
  | { type: 'props' | 'context'; set?: Record<string, unknown>; drop?: string[] }
  | { type: 'inner'; value: 'omitted' | Record<string, unknown> }
  | { type: 'model'; value: SelectIconValue | SelectIconValue[] }
  | { type: 'fill'; text: string } | { type: 'choose'; text: string }
  | { type: 'remove'; value: string } | { type: 'clear'; activation: 'pointer' | 'Enter' | 'Space' }
  | { type: 'component-key'; key: string }
  | { type: 'click' | 'outside' | 'suffix-click' | 'focus-method' | 'blur-method' };
export interface SelectIconSample {
  id: string; control: 'select' | 'autocomplete'; settings: SelectIconSettings; actions: SelectIconAction[];
}
export const selectIconSamples: SelectIconSample[];
export const selectComponentSamples: SelectIconSample[];
export const selectIconsGeometry: { viewport: { width: number; height: number }; root: { left: number; top: number; width: number } };
export const selectIconsSSRStates: string[];
