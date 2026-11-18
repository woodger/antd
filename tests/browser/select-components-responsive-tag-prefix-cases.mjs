const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }, { value: 'c', label: 'Gamma' },
  { value: 'd', label: 'Delta' }, { value: 'e', label: 'Epsilon' }];
const actions = [{ type: 'caller-width', containerWidth: 220 }, { type: 'caller-prefix-width', prefixWidth: 76 },
  { type: 'caller-tag-width', tagWidth: 96 }, { type: 'fill', text: 'WMWMWMWMWMWM' }, { type: 'fill', text: '' },
  { type: 'prefix', value: null }, { type: 'prefix', present: true, prefixWidth: 28 },
  { type: 'caller-width', containerWidth: 440 }, { type: 'custom-tag-close', value: 'a', activation: 'pointer' }];
const settings = { containerWidth: 440, tagWidth: 64, closeWidth: 18, restWidth: 36, prefixWidth: 28, prefixPresent: true };
export const selectCustomTagPrefixSamples = [
  { id: 'select-responsive-custom-tag-prefix-multiple', control: 'select', mode: 'multiple', tagShape: 'single-span-width-includes-close-button',
    value: ['a', 'b', 'c', 'd', 'e'], options, settings, actions },
  { id: 'select-responsive-custom-tag-prefix-tags-fragment', control: 'select', mode: 'tags', tagShape: 'fragment-adjacent-label-span-and-close-button-no-whitespace',
    value: ['a', 'b', 'c', 'd', 'e'], options, settings, actions }
];
export const selectCustomTagPrefixGeometry = { viewport: { width: 2300, height: 1900 }, root: { left: 300, top: 200, width: 440 } };
