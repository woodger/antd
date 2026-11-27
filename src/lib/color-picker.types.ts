import type { Snippet } from 'svelte';
import type { HTMLButtonAttributes } from 'svelte/elements';
import type { AggregationColor } from './color';
import type { ColorMode, ColorFormat, ColorValue } from './color-picker.engine';
import type { ComponentSize } from './types';

export type ColorPickerContent = string | number | null | undefined | Snippet;
export type ColorPickerPlacement = 'top' | 'bottom' | 'left' | 'right'
  | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
export interface ColorPickerSlots {
  root?: string;
  body?: string;
  content?: string;
  description?: string;
  popup?: { root?: string; };
}
export interface ColorPickerStyles extends ColorPickerSlots {
  popupOverlayInner?: string;
}
export type ColorPickerSemantic<T> = T | ((info: { props: ColorPickerProps; }) => T);

/** Preset entries can be single colors or gradients. defaultOpen is read on mount. */
export interface ColorPickerPreset {
  key?: string | number;
  label: ColorPickerContent;
  colors: readonly Exclude<ColorValue, null>[];
  defaultOpen?: boolean;
}

/** Ant Design ColorPicker. Supplied value, open, and format remain controlled by the owner. */
export interface ColorPickerProps extends Omit<HTMLButtonAttributes,
  'value' | 'defaultValue' | 'children' | 'size' | 'style' | 'class' | 'disabled'
> {
  value?: ColorValue;
  /** Initial value read at creation. The supplied value takes precedence. */
  defaultValue?: ColorValue;
  mode?: ColorMode | readonly ColorMode[];
  open?: boolean;
  disabled?: boolean;
  format?: ColorFormat;
  /** Initial format. Defaults to hex when format and defaultFormat are absent. */
  defaultFormat?: ColorFormat;
  allowClear?: boolean;
  /** Removes the Alpha control. The upstream opacity constraint takes effect on the next change. */
  disabledAlpha?: boolean;
  disabledFormat?: boolean;
  presets?: readonly ColorPickerPreset[];
  size?: ComponentSize | 'medium';
  trigger?: 'click' | 'hover';
  placement?: ColorPickerPlacement;
  arrow?: boolean | { pointAtCenter?: boolean; };
  autoAdjustOverflow?: boolean | { adjustX?: 0 | 1; adjustY?: 0 | 1; };
  /** The hidden panel retains state by default. true destroys it on close. */
  destroyOnHidden?: boolean;
  /**
   * The local function overrides ConfigProvider. undefined preserves the provider fallback. It runs
   * after the first open, and waits for reopening after destroyOnHidden.
   */
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement;
  /** A custom trigger retains its native semantics. */
  children?: Snippet;
  showText?: boolean | Snippet<[color: AggregationColor]>;
  /** Picker and Presets are snippets in place of React components. panel provides the original composition. */
  panelRender?: Snippet<[panel: Snippet, extra: {
    components: { Picker: Snippet; Presets: Snippet; };
  }]>;
  /** The CSS value is always RGB or linear-gradient regardless of editor format. */
  onChange?: (color: AggregationColor, css: string) => void;
  /** Separate completion callback. Allows committing a controlled value after dragging ends. */
  onChangeComplete?: (color: AggregationColor) => void;
  onClear?: () => void;
  onOpenChange?: (open: boolean) => void;
  onFormatChange?: (format?: ColorFormat) => void;
  class?: string;
  rootClassName?: string;
  style?: string;
  /** The local owner overrides ConfigProvider.prefixCls. Nested controls inherit the shared prefix. */
  prefixCls?: string;
  classNames?: ColorPickerSemantic<ColorPickerSlots>;
  styles?: ColorPickerSemantic<ColorPickerStyles>;
}

/** Inherited styles and arrow. Local semantic slots take precedence. */
export interface ColorPickerConfig {
  class?: string;
  style?: string;
  arrow?: ColorPickerProps['arrow'];
  classNames?: ColorPickerProps['classNames'];
  styles?: ColorPickerProps['styles'];
}

export interface ColorPickerLocale {
  presetEmpty: string;
  transparent: string;
  singleColor: string;
  gradientColor: string;
}

/** Private panelRender composition boundary. Each Picker manages its own drag and preview state. */
export interface ColorPickerPanelProps {
  prefixCls: string;
  value: AggregationColor;
  mode: ColorMode;
  modes: readonly ColorMode[];
  format?: ColorFormat;
  props: ColorPickerProps;
  activeIndex?: number;
  dragging?: boolean;
  onChange: (color: AggregationColor, drag?: boolean) => void;
  onComplete: (color: AggregationColor) => void;
  onMode: (mode: ColorMode) => void;
  onFormat: (format: ColorFormat) => void;
}
