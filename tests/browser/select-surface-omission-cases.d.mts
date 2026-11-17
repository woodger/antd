export interface SelectSurfaceOmissionSample {
  readonly id: string;
  readonly control: 'select' | 'autocomplete';
  readonly axis: 'omission' | 'width';
  readonly initialValue: string | readonly string[];
  readonly initialQuery?: string;
  readonly initialFontSize?: number;
}
export type SelectSurfaceOmissionAction =
  | { type: 'click' | 'outside' }
  | { type: 'popup-omit' | 'popup-restore' }
  | { type: 'footer-fill' | 'fill'; text: string }
  | { type: 'font'; fontSize: number }
  | { type: 'unrelated'; value: string }
  | { type: 'font-query'; fontSize: number; query: string };
export const omissionSamples: readonly SelectSurfaceOmissionSample[];
export const omissionActions: readonly SelectSurfaceOmissionAction[];
export const widthActions: readonly SelectSurfaceOmissionAction[];
export const omissionSSRStates: readonly { name: string; popup: 'wrapped' | 'omitted' }[];
export const widthSSRStates: readonly { name: string; query: string; fontSize: number }[];
export const omissionGeometry: { viewport: { width: number; height: number }; root: { left: number; top: number; width: number } };
