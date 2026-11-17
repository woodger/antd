export type AutocompleteRenderKind = 'rich' | 'array' | 'null' | 'scalar' | 'falsy' | 'omitted' | 'ownundefined';
export type AutocompleteLabelKind = 'rich' | 'zero' | 'null' | 'omitted' | 'ownundefined';
export interface AutocompleteRenderSample {
  id: string;
  dataset: 'flat' | 'mapped' | 'falsy' | 'virtual';
  renderer: AutocompleteRenderKind;
  labelRenderer: AutocompleteLabelKind;
  initialValue: string;
  filter: boolean;
  input?: 'input' | 'textarea';
  componentInput?: 'textarea';
  virtual?: boolean;
  ssrState?: { name: string; open: boolean };
}
export type AutocompleteRenderSettings = AutocompleteRenderSample & { revision: number };
export type AutocompleteRenderAction = { type: 'props'; set: Partial<AutocompleteRenderSettings> }
  | { type: 'value'; value: string } | { type: 'click' | 'outside' }
  | { type: 'fill'; text: string } | { type: 'press'; key: string } | { type: 'scroll'; top: number };
export const autocompleteRenderGeometry: { viewport: { width: number; height: number }; root: { left: number; top: number; width: number } };
export const autocompleteRenderSamples: AutocompleteRenderSample[];
export const autocompleteRenderSSRStates: Array<{ name: string; open: boolean }>;
export function autocompleteRenderActions(sample: AutocompleteRenderSample): AutocompleteRenderAction[];
