const resize = containerWidth => ({ type: 'props', set: { containerWidth } });
const adornment = adornmentWidth => ({ type: 'props', set: { adornmentWidth } });
const fill = text => ({ type: 'fill', text });
const query = 'WMWMWMWMWMWM';
const settings = mode => ({ componentOwner: true, mode, maxTagCount: 'responsive',
  value: ['a', 'b', 'c', 'd', 'e'], open: true, showSearch: { filterOption: false },
  metadata: true, form: true, containerWidth: 440, components: { slot: 'input', kind: 'function' }, componentTag: 'input' });
export const selectIconSamples = [];
export const selectComponentFaultSamples = [];
export const selectComponentSamples = [
  { id: 'select-components-responsive-multiple-input', control: 'select', renderer: 'forwardRef-direct-input', settings: settings('multiple'),
    actions: [resize(220), fill(query), fill(''), resize(160), resize(440)] },
  { id: 'select-components-responsive-tags-fragment', control: 'select', renderer: 'forwardRef-fragment-input-adornment',
    settings: { ...settings('tags'), adornmentWidth: 36 },
    actions: [resize(220), adornment(76), fill(query), fill(''), adornment(36), resize(160), resize(440)] }
];
export const selectIconsGeometry = { viewport: { width: 2300, height: 1900 }, root: { left: 300, top: 200, width: 440 } };
