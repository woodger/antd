/** Public counterexample inputs fixed before Original measurement. */
export const labelTitleSamples = [
  { id: 'autocomplete-render-label-title-default', custom: false },
  { id: 'autocomplete-render-label-title-custom', custom: true, title: 'Outer title' },
];
export const labelTitleActions = [
  { type: 'renderer', kind: 'zero' }, { type: 'renderer', kind: 'null' },
  { type: 'renderer', kind: 'undefined' }, { type: 'click' }, { type: 'outside' },
];
export const labelTitleSSRStates = ['string', 'zero', 'null', 'undefined']
  .flatMap(renderer => [false, true].map(open => ({
    name: renderer + '-' + (open ? 'open' : 'closed'),
    renderer,
    open
  })));
export const labelTitleGeometry = {
  viewport: { width: 1200, height: 900 },
  root: { left: 300, top: 200, width: 280 }
};
