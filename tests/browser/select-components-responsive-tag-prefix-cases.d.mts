export interface SelectCustomTagPrefixSettings {
  containerWidth: number; tagWidth: number; closeWidth: number; restWidth: number; prefixWidth: number; prefixPresent: boolean;
}
export type SelectCustomTagPrefixAction = { type: 'caller-width'; containerWidth: number }
  | { type: 'caller-prefix-width'; prefixWidth: number } | { type: 'caller-tag-width'; tagWidth: number }
  | { type: 'fill'; text: string } | { type: 'prefix'; value: null; present?: undefined; prefixWidth?: undefined }
  | { type: 'prefix'; present: true; prefixWidth: number; value?: undefined }
  | { type: 'custom-tag-close'; value: string; activation: 'pointer' };
export type SelectCustomTagPrefixUpdate = Extract<SelectCustomTagPrefixAction, { type: 'caller-width' | 'caller-prefix-width' | 'caller-tag-width' | 'prefix' }>;
export interface SelectCustomTagPrefixSample {
  id: string; control: 'select'; mode: 'multiple' | 'tags';
  tagShape: 'single-span-width-includes-close-button' | 'fragment-adjacent-label-span-and-close-button-no-whitespace';
  value: string[]; options: Array<{ value: string; label: string }>;
  settings: SelectCustomTagPrefixSettings; actions: SelectCustomTagPrefixAction[];
}
export const selectCustomTagPrefixSamples: SelectCustomTagPrefixSample[];
export const selectCustomTagPrefixGeometry: { viewport: { width: number; height: number }; root: { left: number; top: number; width: number } };
