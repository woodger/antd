/** Public width ownership inputs fixed before any Original measurement. */
export const inputWidthOwnSamples = [
  { id: 'select-surface-input-width-own-omitted', initialWidthKind: 'omitted' },
  { id: 'select-surface-input-width-own-undefined', initialWidthKind: 'ownundefined' },
  { id: 'select-surface-input-width-own-numeric20', initialWidthKind: 'numeric20' },
];
export const inputWidthOwnActions = [
  { type: 'width-own', kind: 'numeric20' },
  { type: 'width-own', kind: 'ownundefined' },
  { type: 'width-own', kind: 'omitted' },
  { type: 'fill', text: 'WWWWW' },
  { type: 'width-own', kind: 'numeric20' },
  { type: 'fill', text: 'WWWWWW' },
  { type: 'width-own', kind: 'ownundefined' },
  { type: 'width-own', kind: 'omitted' },
];
