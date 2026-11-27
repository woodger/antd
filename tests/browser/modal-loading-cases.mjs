/** Ordinary declarative Modal only. No confirm/useModal/footer-function API. */
const actions = [
  { type: 'fill', text: 'Edited body draft' },
  { type: 'loading', value: true },
  { type: 'loading', value: false },
  { type: 'loading', value: true },
  { type: 'cancel-close' },
];
export const modalLoadingSamples = [
  { id: 'default-footer', prefixCls: 'ant-modal', customizePrefix: false, footer: 'default', actions },
  { id: 'custom-footer-local-prefix', prefixCls: 'loading-modal', customizePrefix: true, footer: 'custom-node', actions },
];
export const modalLoadingGeometry = { viewport: { width: 1280, height: 900 }, width: 520 };
