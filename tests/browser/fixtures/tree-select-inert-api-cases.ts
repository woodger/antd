export type TreeSelectInertApiMode = 'provided' | 'undefined' | 'empty' | 'omitted' | 'live';
export type TreeSelectInertApiDirection = 'ltr' | 'rtl';
export interface TreeSelectInertApiSample {
  id: string;
  provider: TreeSelectInertApiDirection;
  local: TreeSelectInertApiDirection;
  slot: 'default' | 'root' | 'input';
  ownDir?: TreeSelectInertApiDirection;
  nativeDir?: 'rtl';
  explicitUndefinedDir?: boolean;
  multiple?: boolean;
  callbackOnly?: boolean;
  ssrMode: TreeSelectInertApiMode;
}
export type TreeSelectInertApiAction =
  | { type: 'click' | 'outside' }
  | { type: 'fill'; text: string }
  | { type: 'caret'; start: number; end: number }
  | { type: 'props'; mode: TreeSelectInertApiMode }
  | { type: 'choose' | 'remove'; value: 'a' | 'b' };
export interface TreeSelectInertApiStyleSpec { marker: string; outlineWidth: number; width: number; }
export interface TreeSelectInertApiPropSpec {
  keys: boolean;
  callback: boolean;
  style: TreeSelectInertApiStyleSpec | 'empty' | undefined;
  choice: string | undefined;
  direction: TreeSelectInertApiDirection | undefined;
}
/** Only public inputs; Source receives CSSProperties, Native – CSS string. */
export function treeSelectInertApiPropSpec(
  sample: TreeSelectInertApiSample,
  mode: TreeSelectInertApiMode
): TreeSelectInertApiPropSpec {
  const provided = mode === 'provided' || mode === 'live';
  return {
    keys: mode !== 'omitted', callback: provided,
    style: provided ? {
      marker: mode,
      outlineWidth: mode === 'live' ? 31 : 23,
      width: mode === 'live' ? 621 : 543
    }
      : mode === 'empty' ? 'empty' : undefined,
    choice: provided ? mode === 'live' ? 'inert-choice-live' : 'inert-choice' : mode === 'empty' ? '' : undefined,
    direction: provided ? mode === 'live' ? sample.local === 'rtl' ? 'ltr' : 'rtl' : sample.local : undefined
  };
}
export const treeSelectInertApiSamples: readonly TreeSelectInertApiSample[] = [
  { id: 'inert-live-controls', provider: 'ltr', local: 'rtl', slot: 'default', ssrMode: 'provided' },
  {
    id: 'inert-callback-only',
    provider: 'ltr',
    local: 'rtl',
    slot: 'default',
    callbackOnly: true,
    ssrMode: 'provided'
  },
  {
    id: 'provider-rtl-local-ltr',
    provider: 'rtl',
    local: 'ltr',
    slot: 'default',
    ssrMode: 'provided'
  },
  {
    id: 'custom-root-own-dir',
    provider: 'ltr',
    local: 'rtl',
    slot: 'root',
    ownDir: 'rtl',
    ssrMode: 'provided'
  },
  {
    id: 'custom-root-provider-rtl',
    provider: 'rtl',
    local: 'ltr',
    slot: 'root',
    ownDir: 'ltr',
    ssrMode: 'live'
  },
  {
    id: 'custom-input-filter',
    provider: 'rtl',
    local: 'ltr',
    slot: 'input',
    ownDir: 'rtl',
    ssrMode: 'provided'
  },
  {
    id: 'multiple-choice',
    provider: 'ltr',
    local: 'rtl',
    slot: 'default',
    multiple: true,
    ssrMode: 'empty'
  },
  {
    id: 'native-dir-boundary',
    provider: 'ltr',
    local: 'rtl',
    slot: 'default',
    nativeDir: 'rtl',
    ssrMode: 'undefined'
  },
  {
    id: 'custom-root-explicit-undefined-dir',
    provider: 'ltr',
    local: 'rtl',
    slot: 'root',
    ownDir: 'rtl',
    explicitUndefinedDir: true,
    ssrMode: 'omitted'
  }
];
export function treeSelectInertApiActions(sample: TreeSelectInertApiSample): readonly TreeSelectInertApiAction[] {
  if (sample.id === 'inert-live-controls') {
    return [
      { type: 'click' }, { type: 'fill', text: 'Draft' }, { type: 'caret', start: 1, end: 4 },
      { type: 'props', mode: 'undefined' }, { type: 'props', mode: 'empty' },
      { type: 'props', mode: 'omitted' }, { type: 'props', mode: 'live' }, { type: 'outside' }
    ];
  }
  if (sample.callbackOnly) {
    return [{ type: 'click' }, { type: 'outside' }];
  }
  if (sample.multiple) {
    return [
      { type: 'click' }, { type: 'choose', value: 'b' }, { type: 'remove', value: 'a' },
      { type: 'props', mode: 'empty' }, { type: 'props', mode: 'undefined' }, {
        type: 'props',
        mode: 'live'
      }, { type: 'outside' }
    ];
  }
  if (sample.slot === 'input') {
    return [
      { type: 'click' }, { type: 'fill', text: 'Draft' }, { type: 'caret', start: 1, end: 4 },
      { type: 'props', mode: 'live' }, { type: 'outside' }
    ];
  }
  return [{ type: 'click' }, { type: 'props', mode: 'live' }, { type: 'outside' }];
}
