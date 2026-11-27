export type ModalLoadingAction = { type: 'fill'; text: string }
  | { type: 'loading'; value: boolean } | { type: 'cancel-close' };
export type ModalLoadingUpdate = Extract<ModalLoadingAction, { type: 'loading' }>;
export interface ModalLoadingSample {
  id: string;
  prefixCls: string;
  customizePrefix: boolean;
  footer: 'default' | 'custom-node';
  actions: ModalLoadingAction[];
}
export const modalLoadingSamples: ModalLoadingSample[];
export const modalLoadingGeometry: { viewport: { width: number; height: number }; width: number };
