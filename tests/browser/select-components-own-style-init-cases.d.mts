import type { SelectStyle } from 'antd-svelte';
export type SelectOwnStyleInitProfile = 'same' | 'mismatch';
export type SelectOwnStyleInitEntryPath = 'csr' | 'hydrate-same' | 'hydrate-mismatch' | 'hydrate-dirty-mismatch';
export type SelectOwnStyleInitPhase = 'initial' | 'top-green' | 'remove-overlap' | 'restore-overlap' | 'left-logical'
  | 'property-null' | 'property-undefined' | 'style-null' | 'style-undefined' | 'style-omitted' | 'restore-object' | 'width-only';
export interface SelectOwnStyleInitProps extends Record<string, unknown> {
  className: string; placeholder: string; style?: SelectStyle;
}
export interface SelectComponentsOwnStyleSettings {
  mode?: 'multiple'; componentOwner: boolean; form: boolean; name: string;
  observeFocus: boolean; open: boolean; showSearch: { filterOption: false };
  components: { slot: 'input'; kind: 'element' }; componentTag: 'input' | 'textarea';
  styles: { input: { color: string } };
}
export type SelectComponentsOwnStyleAction = { type: 'own-style-phase'; phase: SelectOwnStyleInitPhase }
  | { type: 'fill'; text: string };
export interface SelectComponentsOwnStyleSample {
  id: string; control: 'select' | 'autocomplete'; syncWidth: boolean; value: string | string[];
  settings: SelectComponentsOwnStyleSettings; profile?: SelectOwnStyleInitProfile;
  actions: readonly SelectComponentsOwnStyleAction[];
}
export const selectOwnStyleInitEntryPaths: readonly SelectOwnStyleInitEntryPath[];
export const selectOwnStyleInitActions: readonly SelectComponentsOwnStyleAction[];
export const selectOwnStyleInitSamples: readonly SelectComponentsOwnStyleSample[];
export const selectOwnStyleInitOptions: readonly { value: string; label: string }[];
export const selectOwnStyleInitFallback: { input: { color: string } };
export const selectOwnStyleInitGeometry: { viewport: { width: number; height: number }; root: { left: number; top: number; width: number } };
export function selectOwnStyleInitClientProfile(entryPath: SelectOwnStyleInitEntryPath): SelectOwnStyleInitProfile;
export function selectOwnStyleInitPrehydrateSetters(entryPath: SelectOwnStyleInitEntryPath): readonly { property: 'fontSize'; value: string }[];
export function createSelectOwnStyleInitFrames(profile?: SelectOwnStyleInitProfile): {
  profile: SelectOwnStyleInitProfile; get(phase: SelectOwnStyleInitPhase): SelectOwnStyleInitProps;
};
export const selectOwnStyleInitSSR: { profile: 'same'; phase: 'initial'; serializers: readonly string[]; hydrateFrom: 'renderToString'; uniqueStates: number };
