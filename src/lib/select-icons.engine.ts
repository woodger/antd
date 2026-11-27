/** Ant Design 6.6.8 / rc-select 1.10.1; MIT, vendor/LICENSE.ant-design and vendor/LICENSE.rc-select. */
import type { RenderEmptyContent } from './types';
import type { SelectAllowClear, SelectMenuItemIconInfo, SelectRenderNode, SelectSuffixInfo } from './select-icons.types';

type SearchIconConfig = boolean | { searchIcon?: RenderEmptyContent };
type IconDefinition<Info> = { producer: true; value: (info: Info) => RenderEmptyContent }
  | { producer: false; value: RenderEmptyContent };

export interface SelectSuffixInput {
  suffix?: SelectRenderNode<SelectSuffixInfo>;
  suffixIcon?: RenderEmptyContent;
  loadingIcon?: RenderEmptyContent;
  showSearch?: SearchIconConfig;
  context?: {
    suffixIcon?: RenderEmptyContent;
    loadingIcon?: RenderEmptyContent;
    showSearch?: SearchIconConfig;
  };
  info: SelectSuffixInfo;
  hasFeedback?: boolean;
}

export interface SelectSuffixDefaults {
  down: RenderEmptyContent;
  search: RenderEmptyContent;
  loading: RenderEmptyContent;
}

export interface SelectSuffixResolution {
  content: RenderEmptyContent;
  appendFeedback: boolean;
  /** Root show-arrow depends on nullish, and Affix depends on the truth. */
  hasSuffix: boolean;
  visible: boolean;
}

export interface SelectIconResolution {
  content: RenderEmptyContent;
  /** Only undefined-result TransBtn creates an internal fallback span. */
  fallback: boolean;
}

export interface SelectMenuIconResolution extends SelectIconResolution {
  visible: boolean;
}

export interface SelectClearInput {
  allowClear?: boolean | SelectAllowClear | null;
  contextAllowClear?: boolean | SelectAllowClear | null;
  combobox?: boolean;
  disabled?: boolean;
  displayCount: number;
  searchValue: string;
}

export interface SelectClearResolution {
  visible: boolean;
  content: RenderEmptyContent;
  label: string;
}

function firstDefined<Content>(...values: Content[]): Content | undefined {
  return values.find(value => value !== undefined);
}

function searchIcon(config: SearchIconConfig | undefined): RenderEmptyContent {
  if (config === false) {
    return null;
  }
  return typeof config === 'object' ? config.searchIcon : undefined;
}

function iconDefinition<Info>(
  own: SelectRenderNode<Info>,
  context: SelectRenderNode<Info>,
  fallback: RenderEmptyContent
): IconDefinition<Info> {
  const value = own !== undefined ? own : context;
  if (value === undefined) {
    return { producer: false, value: fallback };
  }
  return typeof value === 'function' ? { producer: true, value } : { producer: false, value };
}

export function resolveSelectSuffix(
  input: SelectSuffixInput,
  defaults: SelectSuffixDefaults
): SelectSuffixResolution {
  const raw = input.suffix;
  if (raw !== null && raw !== undefined) {
    const render = raw;
    const info = input.info;
    const content = typeof render === 'function' ? render({
      searchValue: info.searchValue, open: info.open, focused: info.focused,
      showSearch: info.showSearch, loading: info.loading
    }) : render;
    return { content, appendFeedback: false, hasSuffix: content !== null && content !== undefined,
      visible: Boolean(content) };
  }

  const local = input.suffixIcon;
  const appendFeedback = Boolean(input.hasFeedback);
  if (local === null && !appendFeedback) {
    return { content: null, appendFeedback: false, hasSuffix: false, visible: false };
  }

  let content: RenderEmptyContent;
  if (local !== undefined) {
    content = local;
  }
  else if (input.info.loading) {
    content = firstDefined(
      input.loadingIcon,
      input.context?.loadingIcon,
      defaults.loading
    );
  }
  else if (input.info.open && input.info.showSearch) {
    content = firstDefined(
      searchIcon(input.showSearch),
      searchIcon(input.context?.showSearch),
      defaults.search
    );
  }
  else {
    content = firstDefined(input.context?.suffixIcon, defaults.down);
  }

  // Source Fragment preserves Affix even with false/0/empty content.
  return {
    content: local === null ? false : content,
    appendFeedback,
    hasSuffix: true,
    visible: true
  };
}

export function resolveSelectMenuIcon<Value extends string | number>(
  own: SelectRenderNode<SelectMenuItemIconInfo<Value>>,
  context: SelectRenderNode<SelectMenuItemIconInfo<Value>>,
  fallbackContent: RenderEmptyContent,
  info: SelectMenuItemIconInfo<Value>
): SelectMenuIconResolution {
  const { producer, value: render } = iconDefinition(own, context, fallbackContent);
  if (render && !producer && !info.isSelected) {
    return { visible: false, content: undefined, fallback: false };
  }

  const content = producer ? render({
    value: info.value, disabled: info.disabled, isSelected: info.isSelected
  }) : render;
  return { visible: true, content: content === undefined ? info.isSelected ? '✓' : null : content,
    fallback: content === undefined };
}

export function resolveSelectRemoveIcon(
  own: SelectRenderNode<undefined>,
  context: SelectRenderNode<undefined>,
  fallbackContent: RenderEmptyContent
): SelectIconResolution {
  const { producer, value: render } = iconDefinition(own, context, fallbackContent);
  const content = producer ? render(undefined) : render ?? '×';
  return { content: content === undefined ? '×' : content, fallback: content === undefined };
}

export function resolveSelectClear(
  input: SelectClearInput,
  defaultIcon: RenderEmptyContent,
  defaultLabel = 'Clear'
): SelectClearResolution {
  const allowClear = input.allowClear ?? input.contextAllowClear;
  if (!allowClear || input.disabled || !(input.displayCount || input.searchValue)
    || input.combobox && input.searchValue === '') {
    return { visible: false, content: null, label: '' };
  }

  const config = typeof allowClear === 'object' ? allowClear : undefined;
  return { visible: true, content: (allowClear === true ? defaultIcon : config?.clearIcon) || '×',
    label: config?.label ?? defaultLabel };
}
