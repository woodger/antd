/** Public inputs fixed before any Original observation. */
export const omissionSamples = [
  { id: 'select-surface-omission-select', control: 'select', axis: 'omission', initialValue: 'a' },
  { id: 'select-surface-omission-autocomplete', control: 'autocomplete', axis: 'omission', initialValue: 'a' },
  { id: 'select-surface-omission-width', control: 'select', axis: 'width', initialValue: [], initialQuery: 'WWWW', initialFontSize: 12 },
];
export const omissionActions = [
  { type: 'click' },
  { type: 'footer-fill', text: 'Original footer draft' },
  { type: 'outside' },
  { type: 'popup-omit' },
  { type: 'popup-restore' },
  { type: 'click' },
  { type: 'outside' },
  { type: 'popup-omit' },
  { type: 'click' },
  { type: 'outside' },
];
export const widthActions = [
  { type: 'font', fontSize: 32 },
  { type: 'unrelated', value: 'parent-revision-1' },
  { type: 'fill', text: 'WWWWW' },
  { type: 'font-query', fontSize: 18, query: 'WWWWWW' },
];
export const omissionSSRStates = [
  { name: 'closed-wrapped', popup: 'wrapped' },
  { name: 'closed-own-key-omitted', popup: 'omitted' },
];
export const widthSSRStates = [
  { name: 'query4-font12', query: 'WWWW', fontSize: 12 },
  { name: 'query4-font32', query: 'WWWW', fontSize: 32 },
  { name: 'query5-font32', query: 'WWWWW', fontSize: 32 },
  { name: 'query6-font18', query: 'WWWWWW', fontSize: 18 },
];
export const omissionGeometry = { viewport: { width: 1200, height: 900 }, root: { left: 300, top: 200, width: 280 } };
