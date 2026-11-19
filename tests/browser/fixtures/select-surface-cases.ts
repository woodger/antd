export type SelectSurfacePopup = 'omitted' | 'origin' | 'wrap' | 'replace' | 'null' | 'undefined' | 'false' | 'empty' | 'zero' | 'array' | 'rich';
export type SelectSurfaceSemantic = 'omitted' | 'object' | 'function' | 'empty' | 'delete';
export interface SelectSurfaceConfig {
  classes?: SelectSurfaceSemantic;
  styles?: SelectSurfaceSemantic;
  className?: boolean;
  rootStyle?: boolean;
  allowClear?: boolean;
  search?: 'true' | 'false' | 'object';
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
}
export interface SelectSurfaceSample {
  id: string;
  control: 'select' | 'autocomplete';
  mode?: 'multiple' | 'tags';
  value?: string | string[];
  valueOwner: 'controlled' | 'default';
  openOwner: 'controlled' | 'default';
  defaultOpen?: boolean;
  popup: SelectSurfacePopup;
  classes: SelectSurfaceSemantic;
  styles: SelectSurfaceSemantic;
  config: SelectSurfaceConfig;
  dataset: 'basic' | 'empty';
  search: 'omitted' | 'true' | 'false' | 'object';
  prefix?: boolean;
  allowClear?: boolean;
  rawStyles?: boolean;
  virtual?: boolean;
  className?: boolean;
  rootStyle?: 'own' | 'next';
  footerPolicy?: 'plain' | 'prevent';
  notFound?: boolean;
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
  status?: 'error' | 'warning';
  scenario: 'menu' | 'wrap' | 'replacement' | 'ac-wrap' | 'ac-empty' | 'single' | 'functions' | 'multi' | 'tags' | 'rows' | 'ac-single' | 'ac-functions' | 'live' | 'root' | 'clear' | 'ac-clear' | 'search' | 'ac-search';
}
export type SelectSurfaceAction =
  | { type: 'click' | 'outside' | 'clear' | 'footer' }
  | { type: 'choose' | 'remove'; text: string }
  | { type: 'fill' | 'footer-fill'; text: string }
  | { type: 'key' | 'footer-key'; key: string }
  | { type: 'props'; set: Partial<SelectSurfaceSample> };

export const selectSurfaceGeometry = { viewport: { width: 1200, height: 900 },
  document: { width: 2200, height: 1800 }, root: { left: 300, top: 200, width: 280 } };

const sample = (id: string, set: Partial<SelectSurfaceSample> = {}): SelectSurfaceSample => ({
  id: `select-surface-${id}`, control: 'select', value: 'a', valueOwner: 'controlled', openOwner: 'controlled',
  popup: 'origin', classes: 'omitted', styles: 'omitted', config: {}, dataset: 'basic', search: 'object',
  scenario: 'menu', ...set,
});
export const selectSurfaceSamples: readonly SelectSurfaceSample[] = [
  sample('origin', { valueOwner: 'default', openOwner: 'default' }),
  sample('wrap', { popup: 'wrap', scenario: 'wrap', footerPolicy: 'plain' }),
  ...(['replace', 'null', 'undefined', 'false', 'empty', 'zero', 'array', 'rich'] as const)
    .map(popup => sample(popup, { popup, scenario: popup === 'array' ? 'menu' : 'replacement' })),
  sample(
    'ac-wrap',
    { control: 'autocomplete', popup: 'wrap', scenario: 'ac-wrap', footerPolicy: 'plain' }
  ),
  sample('ac-null', { control: 'autocomplete', popup: 'null', scenario: 'replacement' }),
  sample(
    'ac-empty',
    { control: 'autocomplete', popup: 'wrap', dataset: 'empty', scenario: 'ac-empty' }
  ),
  sample(
    'ac-empty-content',
    {
      control: 'autocomplete',
      popup: 'wrap',
      dataset: 'empty',
      notFound: true,
      scenario: 'ac-empty'
    }
  ),
  sample('single-object', { value: undefined, classes: 'object', styles: 'object', prefix: true,
    allowClear: true, search: 'false', scenario: 'single' }),
  sample('single-functions', { classes: 'function', styles: 'function', config: {
    classes: 'object',
    styles: 'object'
  },
    popup: 'wrap', footerPolicy: 'prevent', prefix: true, allowClear: true, status: 'warning', scenario: 'functions' }),
  sample('multiple', { mode: 'multiple', value: ['a', 'b'], classes: 'object', styles: 'object', prefix: true,
    allowClear: true, scenario: 'multi' }),
  sample('tags', { mode: 'tags', value: ['a'], classes: 'function', styles: 'function',
    config: { classes: 'function', styles: 'function' }, allowClear: true, scenario: 'tags' }),
  sample(
    'rows',
    { classes: 'object', styles: 'object', rawStyles: true, virtual: false, scenario: 'rows' }
  ),
  sample('ac-object', { control: 'autocomplete', classes: 'object', styles: 'object', prefix: true,
    allowClear: true, scenario: 'ac-single' }),
  sample('ac-functions', { control: 'autocomplete', classes: 'function', styles: 'function', prefix: true,
    config: {
      classes: 'function',
      styles: 'function',
      variant: 'filled',
      size: 'large',
      disabled: true
    },
    disabled: false, allowClear: true, status: 'warning', scenario: 'ac-functions' }),
  sample('semantic-live', { classes: 'object', styles: 'object', config: {
    classes: 'object',
    styles: 'object'
  },
    prefix: true, allowClear: true, scenario: 'live' }),
  sample('root-config', { classes: 'object', styles: 'object', className: true, rootStyle: 'own', defaultOpen: true,
    openOwner: 'default', config: {
      classes: 'object',
      styles: 'object',
      className: true,
      rootStyle: true
    }, scenario: 'root' }),
  sample('ac-root-config', { control: 'autocomplete', className: true, rootStyle: 'own',
    config: { classes: 'object', styles: 'object', className: true, rootStyle: true }, scenario: 'root' }),
  sample(
    'clear-config',
    { popup: 'omitted', search: 'omitted', config: { allowClear: true }, scenario: 'clear' }
  ),
  sample(
    'ac-clear-config',
    {
      control: 'autocomplete',
      popup: 'omitted',
      search: 'omitted',
      config: { allowClear: true },
      scenario: 'ac-clear'
    }
  ),
  sample('search-config', { search: 'omitted', classes: 'function', styles: 'function',
    config: { search: 'object', variant: 'filled', size: 'large', disabled: true }, scenario: 'search' }),
  sample('ac-search-config', { control: 'autocomplete', search: 'omitted', disabled: false,
    classes: 'function', styles: 'function', config: { search: 'object', classes: 'function', styles: 'function',
      variant: 'filled', size: 'large', disabled: true }, scenario: 'ac-search' }),
];

export function selectSurfaceActions(sample: SelectSurfaceSample): SelectSurfaceAction[] {
  const click: SelectSurfaceAction = { type: 'click' }, outside: SelectSurfaceAction = { type: 'outside' };
  const beta: SelectSurfaceAction = { type: 'choose', text: 'Beta' };
  const props = (set: Partial<SelectSurfaceSample>): SelectSurfaceAction => ({ type: 'props', set });
  switch (sample.scenario) {
    case 'wrap': return [click, { type: 'footer' }, { type: 'footer-fill', text: 'Note' }, {
      type: 'footer-key',
      key: 'Tab'
    }, outside, click, beta, outside];
    case 'replacement': return [click, outside, props({ popup: 'origin' }), click, beta, outside];
    case 'ac-wrap': return [click, { type: 'fill', text: 'a' }, { type: 'footer' }, {
      type: 'footer-fill',
      text: 'Note'
    }, outside, click, beta, outside];
    case 'ac-empty': return [click, { type: 'fill', text: 'q' }, outside, props({ dataset: 'basic' }), click, beta, outside];
    case 'single': return [click, beta, { type: 'clear' }, outside];
    case 'functions': return [click, { type: 'footer' }, beta, props({
      size: 'small',
      status: 'error',
      variant: 'underlined'
    }), outside];
    case 'multi': return [click, { type: 'choose', text: 'Gamma' }, {
      type: 'remove',
      text: 'Alpha'
    }, { type: 'clear' }, outside];
    case 'tags': return [click, { type: 'fill', text: 'Free' }, { type: 'key', key: 'Enter' }, {
      type: 'remove',
      text: 'Alpha'
    }, outside];
    case 'rows': return [click, beta, props({ rawStyles: false }), outside];
    case 'ac-single': return [click, { type: 'fill', text: 'Be' }, beta, { type: 'clear' }, outside];
    case 'ac-functions': return [click, beta, props({
      size: 'small',
      variant: 'underlined',
      status: 'error'
    }), outside];
    case 'live': return [click, props({ classes: 'function', styles: 'function' }), beta,
      props({ classes: 'empty', styles: 'delete' }), click, props({
        classes: 'omitted',
        styles: 'omitted'
      }), outside];
    case 'root': return [click, beta, props({ rootStyle: 'next' }), outside];
    case 'clear': return [click, { type: 'clear' }, props({ allowClear: false }), click, beta, outside];
    case 'ac-clear': return [click, outside, props({ allowClear: true }), click, { type: 'clear' }, outside];
    case 'search': return [props({ disabled: false }), click, { type: 'fill', text: 'Beta' }, {
      type: 'key',
      key: 'Escape'
    }, props({
      search: 'false',
      variant: 'underlined'
    }), outside];
    case 'ac-search': return [click, { type: 'fill', text: 'New' }, outside, props({
      search: 'false',
      size: 'small',
      status: 'error'
    }), click, outside];
    default: return [click, beta, outside];
  }
}

export function selectSurfaceSlots(control: 'select' | 'autocomplete'): string[] {
  return ['root', 'prefix', ...(control === 'select' ? ['suffix'] : []), 'input', 'placeholder', 'content',
    ...(control === 'select' ? ['item', 'itemContent', 'itemRemove'] : []), 'clear', 'popup.root', 'popup.list', 'popup.listItem'];
}

export function selectSurfaceSemantic(
  kind: SelectSurfaceSemantic,
  side: 'own' | 'context',
  control: 'select' | 'autocomplete',
  props: Record<string, unknown> = {}
) {
  const classes: Record<string, unknown> = {}, styles: Record<string, unknown> = {};
  if (kind === 'omitted' || kind === 'empty') return { classes, styles };
  const slots = ['root', 'prefix', ...(control === 'select' ? ['suffix'] : []), 'input', 'placeholder', 'content',
    ...(control === 'select' ? ['item', 'itemContent', 'itemRemove'] : []), 'clear', 'popup.root', 'popup.list', 'popup.listItem'];
  const state = kind === 'function' ? `-${props.size ?? 'unset'}-${props.variant ?? 'unset'}-${props.disabled ? 'disabled' : 'enabled'}-${props.status ?? 'unset'}` : '';
  for (const slot of slots) {
    const path = slot.split('.'), key = path.at(-1)!;
    const classTarget = path.length > 1 ? (classes.popup ??= {}) as Record<string, unknown> : classes;
    const styleTarget = path.length > 1 ? (styles.popup ??= {}) as Record<string, unknown> : styles;
    classTarget[key] = `surface-${side}-${slot.replaceAll('.', '-')}${state}`;
    styleTarget[key] = side === 'context' ? {
      color: 'rgb(101, 31, 41)',
      backgroundColor: 'rgb(241, 231, 221)'
    }
      : { color: 'rgb(21, 61, 101)' };
  }
  if (kind === 'delete') {
    styles.root = { color: undefined, backgroundColor: undefined };
    styles.input = { color: undefined };
    styles.popup = { root: { color: undefined }, list: undefined, listItem: { color: undefined } };
  }
  return { classes, styles };
}

export function selectSurfaceData(dataset: 'basic' | 'empty', rawStyles: boolean) {
  if (dataset === 'empty') return [];
  return [{ label: 'Group', className: 'surface-raw-group', title: 'Authored group', options: [
    { value: 'a', label: 'Alpha', title: 'Authored Alpha', ...(rawStyles ? {
      className: 'surface-raw-alpha', style: {
        color: 'rgb(71, 72, 73)',
        backgroundColor: 'rgb(241, 242, 243)'
      } } : {}) },
    { value: 'b', label: 'Beta' },
  ] }, { value: 'c', label: 'Gamma' }, { value: 'd', label: 'Disabled', disabled: true }];
}

export function selectSurfaceRootStyle(kind?: 'context' | 'own' | 'next') {
  if (kind === 'context') return {
    color: 'rgb(111, 41, 51)',
    backgroundColor: 'rgb(221, 231, 241)'
  };
  return { width: '100%', ...(kind === 'own' ? { color: 'rgb(31, 51, 71)' }
    : kind === 'next' ? { color: 'rgb(51, 71, 91)' } : {}) };
}
