const fn = result => ({ kind: 'function', result });
const node = token => ({ kind: 'node', token });
const props = set => ({ type: 'props', set });
const focus = { type: 'focus-method', options: { preventScroll: true } };
const blur = { type: 'blur-method' }, click = { type: 'root-click' }, outside = { type: 'outside' };
const key = key => ({ type: 'component-key', key });
const make = (name, control, slot, kind, extra = {}) => ({ id: 'select-icons-components-flow-' + name, control,
  settings: { componentOwner: true, form: true, name: 'widget-field', observeFocus: true, prefixProbe: true,
    metadata: control === 'select', suffix: fn('node'), allowClear: { clearIcon: node('flow-clear'), label: 'Flow clear' },
    showSearch: { filterOption: false }, components: { slot, kind, collisions: true }, ...extra },
  actions: [focus, click, ...(slot === 'input' ? [{ type: 'fill', text: 'Flow typed' }] : []), key('ArrowDown'), key('Enter'),
    blur, focus, key(' '), props({ suffix: fn('zero') }), props({ suffix: fn('undefined') }),
    props({ disabled: true }), blur, focus, props({ disabled: false }), outside] });
export const selectIconSamples = [];
export const selectComponentSamples = [
  make('root-element', 'select', 'root', 'element'),
  make('ac-root-element', 'autocomplete', 'root', 'element'),
  make('root-composite', 'select', 'root', 'composite'),
  make('root-native-only', 'select', 'root', 'composite-native-only'),
  make('input-composite', 'select', 'input', 'composite'),
];
export const selectIconsGeometry = { viewport: { width: 2300, height: 1900 }, root: { left: 300, top: 200, width: 280 } };
