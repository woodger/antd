const own = (width, fontSize = 17, color) => ({ className: 'select-ac-style-own-editor', placeholder: 'AC style editor',
  style: { width, fontSize, paddingInline: 7, ...(color ? { color } : {}) } });
const props = componentProps => ({ type: 'props', set: { componentProps } });
export const selectIconSamples = [];
export const selectComponentFaultSamples = [];
export const selectComponentSamples = ['input', 'textarea'].map(componentTag => ({
  id: 'select-components-ac-style-' + componentTag, control: 'autocomplete',
  settings: { componentOwner: true, form: true, name: 'ac-style-field', observeFocus: true, metadata: true,
    showSearch: { filterOption: false }, allowClear: { clearIcon: { kind: 'node', token: 'ac-style-clear' }, label: 'AC style clear' },
    components: { slot: 'input', kind: 'element' }, componentTag, componentProps: own(83) },
  actions: [{ type: 'focus-method', options: { preventScroll: true } },
    props(own(91)), props(own(133)), props(own(133, 23)), props(own(133, 23, 'rgb(37,51,73)')),
    { type: 'fill', text: 'Wide WMWM' }, props(own(177, 23, 'rgb(37,51,73)')),
    { type: 'props', set: { disabled: true } }, { type: 'props', set: { disabled: false } },
    { type: 'clear', activation: 'pointer' }]
}));
export const selectIconsGeometry = { viewport: { width: 2300, height: 1900 }, root: { left: 300, top: 200, width: 280 } };
