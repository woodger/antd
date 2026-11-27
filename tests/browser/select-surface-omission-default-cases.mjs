/** Default-origin public owners and actions fixed before Original measurement. */
export const defaultOmissionSamples = [
  { id: 'select-surface-omission-default-select', control: 'select', axis: 'omission', initialValue: 'a', ssrState: { popup: 'omitted' } },
  { id: 'select-surface-omission-default-autocomplete', control: 'autocomplete', axis: 'omission', initialValue: 'a', ssrState: { popup: 'omitted' } },
];
export const defaultOmissionActions = [
  { type: 'click' },
  { type: 'outside' },
  { type: 'popup-restore' },
  { type: 'click' },
  { type: 'footer-fill', text: 'Default-origin footer' },
  { type: 'outside' },
  { type: 'popup-omit' },
  { type: 'click' },
  { type: 'outside' },
];
