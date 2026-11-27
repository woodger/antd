export type SelectSurfaceStylePhase = 'red' | 'green' | 'unset';
export const selectSurfaceStyleHistorySamples = [
  { id: 'select-surface-style-history-select', control: 'select' },
  { id: 'select-surface-style-history-autocomplete', control: 'autocomplete' },
] as const;
export const selectSurfaceStyleHistoryActions = [
  { type: 'click' }, { type: 'color', phase: 'green' }, { type: 'color', phase: 'unset' },
  { type: 'color', phase: 'red' }, { type: 'outside' },
] as const;

/** Ordered valid CSS props; source history is observed, never computed here. */
export function selectSurfaceStyleHistoryMaps(phase: SelectSurfaceStylePhase) {
  const borderColor = phase === 'unset' ? undefined : phase === 'green' ? 'rgb(31, 171, 61)' : 'rgb(231, 41, 51)';
  const pair = () => ({ borderColor, border: '1px solid rgb(21,31,41)' });
  return { style: { ...pair(), width: '100%' },
    styles: { root: pair(), input: pair(), popup: { root: pair() } } };
}
