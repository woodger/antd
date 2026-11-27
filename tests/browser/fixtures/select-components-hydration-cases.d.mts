export type SelectComponentsHydrationSlot = 'root-string' | 'root-element' | 'input-string' | 'input-element' | 'input-composite';
export type SelectComponentsHydrationAction = { type: 'rerender' | 'focus' | 'blur' | 'root-click' | 'close-dispose' }
  | { type: 'slot'; value: SelectComponentsHydrationSlot }
  | { type: 'fill' | 'model'; value: string };
export interface SelectComponentsHydrationSample {
  id: string;
  control: 'select' | 'autocomplete';
  initialSlot: SelectComponentsHydrationSlot;
  actions: readonly SelectComponentsHydrationAction[];
  preHydration: { value: string; selection: [number, number]; focused: boolean };
}
export const selectComponentsHydrationSamples: readonly SelectComponentsHydrationSample[];
