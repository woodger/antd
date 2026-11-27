export interface SelectTagCloseHandleOption { key: string; value: string; label: string; marker: string; disabled?: boolean }
export type SelectTagCloseHandleLookup = { from: 'latest'; value: string; slot?: string }
  | { from: 'retained'; slot: string; value: string };
export type SelectTagCloseHandleRetain = SelectTagCloseHandleLookup & { id: string; type: 'retain'; slot: string; reason: string };
export type SelectTagCloseHandleInvoke = SelectTagCloseHandleLookup & { id: string; type: 'invoke'; reason: string; saveAs?: string };
export type SelectTagCloseHandleAction = SelectTagCloseHandleInvoke
  | { id: string; type: 'model' | 'enable-reset'; value: string[] }
  | { id: string; type: 'options'; phase: 'updated' }
  | { id: string; type: 'disabled'; value: boolean };
export interface SelectTagCloseHandleSample {
  id: string; mode: 'multiple' | 'tags'; initialModel: string[];
  initialOptions: SelectTagCloseHandleOption[]; replacementOptions: SelectTagCloseHandleOption[];
  retentionSetup: SelectTagCloseHandleRetain | null; actions: SelectTagCloseHandleAction[];
}
export const selectTagCloseHandleSamples: SelectTagCloseHandleSample[];
export const selectTagCloseHandleGeometry: {
  viewport: { width: number; height: number }; root: { left: number; top: number; width: number };
  tag: { width: number; height: number }; actions: { left: number; top: number };
};
