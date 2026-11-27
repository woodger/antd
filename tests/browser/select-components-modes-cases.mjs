const props = set => ({ type: 'props', set });
const key = key => ({ type: 'component-key', key });
const normalActions = mode => [
  { type: 'focus-method', options: { preventScroll: true } },
  { type: 'fill', text: 'Draft ' + mode }, key('Enter'), { type: 'fill', text: '' }, key('Backspace'),
  { type: 'model', value: ['a', 'locked'] }, { type: 'remove', value: 'Alpha' },
  { type: 'clear', activation: 'pointer' }, props({ disabled: true }),
  props({ disabled: false, showSearch: false }), props({ showSearch: { filterOption: false } })
];
const own = (width, fontSize = 17, color) => ({ className: 'select-modes-own-editor', placeholder: 'Modes editor',
  style: { width, fontSize, paddingInline: 7, ...(color ? { color } : {}) } });
const make = (mode, kind, componentTag) => ({ id: 'select-components-modes-' + mode + '-' + kind + '-' + componentTag,
  control: 'select', settings: { mode, componentOwner: true, form: true, name: 'modes-field', observeFocus: true,
    metadata: true, showSearch: { filterOption: false }, allowClear: { clearIcon: { kind: 'node', token: 'modes-clear' }, label: 'Modes clear' },
    components: { slot: 'input', kind }, componentTag, ...(kind === 'element' ? { componentProps: own(83) } : {}) },
  actions: normalActions(mode) });
export const selectIconSamples = [];
export const selectComponentSamples = [
  make('multiple', 'intrinsic', 'input'), make('multiple', 'function', 'textarea'), make('multiple', 'element', 'input'),
  make('tags', 'intrinsic', 'input'), make('tags', 'function', 'textarea'), make('tags', 'element', 'textarea')
];
// Same authored value between the first four commits: Source width-only,
// font-only and paint-only changes must remain observable before a value change.
selectComponentSamples[2].actions.splice(1, 0,
  props({ componentProps: own(91) }), props({ componentProps: own(133) }),
  props({ componentProps: own(133, 23) }), props({ componentProps: own(133, 23, 'rgb(37,51,73)') }),
  { type: 'fill', text: 'Measure WMWM' }, props({ componentProps: own(177, 23, 'rgb(37,51,73)') })
);
// This ordinary composite intentionally exposes only the established public
// nativeElement/focus/blur handle; it supplies no private DOM style/scrollWidth shim.
export const selectComponentFaultSamples = [{ ...make('multiple', 'composite', 'input'),
  id: 'select-components-modes-composite-ref-probe',
  actions: [{ type: 'focus-method', options: { preventScroll: true } }, key('Backspace')] }];
export const selectIconsGeometry = { viewport: { width: 2300, height: 1900 }, root: { left: 300, top: 200, width: 280 } };
