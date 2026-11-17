export type SelectSurfaceInputWidthKind = 'omitted' | 'ownundefined' | 'numeric20';
export interface SelectSurfaceInputWidthOwnSample {
  readonly id: string;
  readonly initialWidthKind: SelectSurfaceInputWidthKind;
}
export type SelectSurfaceInputWidthOwnAction =
  | { type: 'width-own'; kind: SelectSurfaceInputWidthKind }
  | { type: 'fill'; text: string };
export const inputWidthOwnSamples: readonly SelectSurfaceInputWidthOwnSample[];
export const inputWidthOwnActions: readonly SelectSurfaceInputWidthOwnAction[];
