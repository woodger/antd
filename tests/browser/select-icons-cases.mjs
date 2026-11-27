const node = slot => ({ kind: 'node', token: slot });
const fn = result => ({ kind: 'function', result });
const undef = { kind: 'undefined' };
const patch = set => ({ type: 'props', set });
const drop = (...keys) => ({ type: 'props', drop: keys });
const context = set => ({ type: 'context', set });
const contextDrop = (...keys) => ({ type: 'context', drop: keys });
const fill = text => ({ type: 'fill', text });
const choose = text => ({ type: 'choose', text });
const open = { type: 'click' }, outside = { type: 'outside' };
const values = { type: 'model', value: ['a', 'locked'] };
const single = { type: 'model', value: 'a' };
const returnKinds = ['undefined', 'null', 'false', 'zero', 'empty', 'array', 'empty-array', 'node'];
const iconConfig = side => ({ suffixIcon: node(side + '-suffix'), loadingIcon: node(side + '-loading'),
  menuItemSelectedIcon: node(side + '-item'), removeIcon: node(side + '-remove'),
  showSearch: { filterOption: false, searchIcon: node(side + '-search') },
  allowClear: { clearIcon: node(side + '-clear'), label: 'Erase ' + side } });
const make = (id, settings, actions) => ({ id: 'select-icons-' + id, control: 'select',
  settings: { showSearch: { filterOption: false }, ...settings }, actions });

export const selectIconSamples = [
  make('suffix-local', {}, [open, fill('needle'), patch({ loading: true }), patch({ suffixIcon: node('local-suffix') }), { type: 'suffix-click' },
    ...[null, false, 0, '', undef].map(suffixIcon => patch({ suffixIcon })), drop('suffixIcon'),
    ...[node('local-loading'), null, false, 0, '', undef].map(loadingIcon => patch({ loadingIcon })), drop('loadingIcon'),
    patch({ loading: false, showSearch: { filterOption: false, searchIcon: node('local-search') } }),
    ...[null, false, 0, '', undef].map(searchIcon => patch({ showSearch: { filterOption: false, searchIcon } })),
    patch({ showSearch: false }), patch({ showSearch: true }), outside]),
  make('suffix-context', { config: iconConfig('context') }, [open, fill('q'), patch({ suffixIcon: undef }),
    patch({ suffixIcon: node('own-suffix') }), patch({ suffixIcon: null }), drop('suffixIcon'),
    ...[null, false, 0, '', undef].map(suffixIcon => context({ suffixIcon })), contextDrop('suffixIcon'),
    patch({ loading: true }), context({ loadingIcon: null }), context({ loadingIcon: false }), contextDrop('loadingIcon'),
    patch({ loading: false }), context({ showSearch: false }), patch({ showSearch: undef }), outside]),
  make('suffix-function', { suffix: fn('node') }, [open, { type: 'suffix-click' }, fill('q'), patch({ loading: true }),
    patch({ title: 'unrelated parent update' }), choose('Number one'),
    ...returnKinds.map(result => patch({ suffix: fn(result) })),
    ...[false, 0, null, undef].map(suffix => patch({ suffix })), drop('suffix'), outside]),
  make('clear-single', { allowClear: { clearIcon: node('own-clear'), label: 'Erase single' }, config: iconConfig('context') }, [
    { type: 'clear', activation: 'pointer' }, single, { type: 'clear', activation: 'Enter' }, single,
    patch({ allowClear: { clearIcon: node('own-clear'), label: '' } }),
    ...[{}, { clearIcon: null }, { clearIcon: false }, { clearIcon: 0 }, { clearIcon: '' }, { clearIcon: undef },
      { clearIcon: node('own-clear'), label: null }, true, false, undef].map(allowClear => patch({ allowClear })),
    drop('allowClear'), context({ allowClear: true }), context({ allowClear: false }), contextDrop('allowClear'),
    patch({ allowClear: true, disabled: true }), patch({ disabled: false }), open, fill('q'), outside]),
  make('clear-multiple', { mode: 'multiple', allowClear: {}, value: ['a', 'locked'] }, [
    { type: 'clear', activation: 'Space' }, values, patch({ allowClear: { clearIcon: node('multi-clear'), label: 'Erase values' } }),
    { type: 'clear', activation: 'pointer' }, values, patch({ disabled: true }), patch({ disabled: false }),
    open, fill('q'), choose('Number one'), outside]),
  make('item-remove-functions', { mode: 'multiple', value: ['a', 'locked'], suffix: fn('node'),
    menuItemSelectedIcon: fn('node'), removeIcon: fn('node') }, [open, { type: 'remove', value: 'Alpha' }, values,
    choose('Number one'), fill('q'), ...returnKinds.map(result => patch({ menuItemSelectedIcon: fn(result), removeIcon: fn(result) })),
    patch({ disabled: true }), patch({ disabled: false }), outside, open, outside]),
  make('item-remove-context', { mode: 'tags', value: ['a', 'locked'], config: iconConfig('context') }, [open,
    ...[null, false, 0, '', undef].map(value => patch({ menuItemSelectedIcon: value, removeIcon: value })),
    drop('menuItemSelectedIcon', 'removeIcon'), context({ menuItemSelectedIcon: fn('node'), removeIcon: fn('node') }),
    { type: 'remove', value: 'Alpha' }, values, outside]),
  make('nested-provider', { mode: 'multiple', value: ['a', 'locked'], config: iconConfig('parent'), inner: 'omitted' }, [
    open, { type: 'inner', value: {} }, { type: 'inner', value: { allowClear: true } },
    { type: 'inner', value: iconConfig('inner') }, patch({ suffixIcon: node('own-suffix'), removeIcon: node('own-remove') }),
    drop('suffixIcon', 'removeIcon'), { type: 'inner', value: 'omitted' }, outside]),
  make('feedback', { feedback: true, suffixIcon: null }, [open, patch({ suffixIcon: false }), patch({ suffixIcon: 0 }),
    drop('suffixIcon'), patch({ loading: true }), patch({ suffixIcon: null }), patch({ suffix: fn('node') }),
    patch({ suffix: false }), drop('suffix'), patch({ loading: false }), outside]),
  make('metadata', { mode: 'multiple', value: ['a', 'locked'], metadata: true, config: iconConfig('context'),
    suffix: fn('node'), menuItemSelectedIcon: fn('node'), removeIcon: fn('node'), allowClear: { clearIcon: node('own-clear'), label: '' } }, [
    open, fill('m'), patch({ loading: true }), patch({ suffixIcon: null, loadingIcon: null }),
    patch({ menuItemSelectedIcon: null, removeIcon: null, allowClear: true }), choose('String one'), outside]),
  make('static-array', { mode: 'multiple', value: ['a', 'locked'], suffixIcon: { kind: 'array' },
    menuItemSelectedIcon: { kind: 'array' }, removeIcon: { kind: 'array' }, allowClear: { clearIcon: { kind: 'array' } } }, [
    open, patch({ suffixIcon: { kind: 'empty-array' }, menuItemSelectedIcon: { kind: 'empty-array' }, removeIcon: { kind: 'empty-array' } }), outside]),
  ...[
    ['default-context', { config: iconConfig('context') }, [open, fill('a'), patch({ loadingIcon: node('unused-loading') }), outside]],
    ['explicit-suffix', { config: iconConfig('context'), suffixIcon: undef }, [open, fill('a'),
      ...[node('ac-own-suffix'), null, false, 0, '', undef].map(suffixIcon => patch({ suffixIcon })),
      drop('suffixIcon'), patch({ suffix: fn('node') }), fill('q'), patch({ showSearch: false }), outside]],
    ['clear-object', { config: iconConfig('context'), allowClear: { clearIcon: node('ac-clear'), label: 'Erase text' } }, [
      { type: 'clear', activation: 'pointer' }, single, { type: 'clear', activation: 'Enter' }, single,
      patch({ allowClear: {} }), patch({ allowClear: { clearIcon: null, label: '' } }), patch({ allowClear: undef }),
      drop('allowClear'), open, fill('b'), outside]],
    ['item-function', { menuItemSelectedIcon: fn('node'), removeIcon: fn('node'), suffix: fn('node') }, [
      open, fill('q'), choose('String one'), open, patch({ menuItemSelectedIcon: fn('undefined') }),
      patch({ menuItemSelectedIcon: null }), outside]],
  ].map(([id, settings, actions]) => ({ ...make('ac-' + id, settings, actions), control: 'autocomplete' })),
];

export const selectComponentSamples = [
  ...['root', 'input'].flatMap(slot => ['intrinsic', 'function', 'element'].map(kind => make('components-' + slot + '-' + kind,
    { components: { slot, kind }, componentOwner: true, showSearch: { filterOption: false } }, [
      { type: 'focus-method' }, ...(slot === 'input' ? [fill('component draft')] : []),
      { type: 'component-key', key: 'ArrowDown' }, { type: 'component-key', key: 'Escape' },
      patch({ disabled: true }), patch({ disabled: false }), { type: 'blur-method' },
      patch({ components: { slot, kind: kind === 'element' ? 'function' : 'element' } }),
      { type: 'focus-method' }, outside]))),
  ...['root', 'input'].map(slot => ({ ...make('ac-components-' + slot, { components: { slot, kind: 'function' },
    componentOwner: true }, [{ type: 'focus-method' }, { type: 'component-key', key: 'ArrowDown' },
      { type: 'component-key', key: 'Escape' }, { type: 'blur-method' }, outside]), control: 'autocomplete' })),
];
export const selectIconsGeometry = { viewport: { width: 2300, height: 1900 }, root: { left: 300, top: 200, width: 280 } };
export const selectIconsSSRStates = ['initial'];
