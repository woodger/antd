import type { SelectSurfaceOmissionAction, SelectSurfaceOmissionSample } from './select-surface-omission-cases.mjs';
export const defaultOmissionSamples: readonly (SelectSurfaceOmissionSample & {
  readonly ssrState: { readonly popup: 'omitted' };
})[];
export const defaultOmissionActions: readonly SelectSurfaceOmissionAction[];
