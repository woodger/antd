import type { Snippet } from 'svelte';
import type { PopupSourceAlign } from '../popup-position.engine';
import type { PresetColorKey } from '../theme-token.types';
import type { RenderEmptyContent } from '../types';

/** ReactNode is replaced by text, boolean, nested arrays and Svelte Snippet. */
export type TooltipContent = RenderEmptyContent;

/** bind:ref is available after mount and is cleaned at unmount; DOM getters reflect current nodes. */
export interface TooltipRef {
  /** Basic DOM trigger, including SVG; prior to permission anchor can be undefined. */
  readonly nativeElement: Element | undefined;
  /** Independent span is kept hidden; a common owner panel is available in the group. */
  readonly popupElement: HTMLSpanElement | undefined;
  /** Combines calls into microtask; closed or destroyed popup does not open. */
  forceAlign: () => void;
}

/** AlignType rc-trigger 3.10.1; offsets accept numbers, percentages and parseFloat strings. */
export type TooltipAlignConfig = PopupSourceAlign;

/** Physical directions; Left/Right in the name does not change at RTL. */
export type TooltipPlacement =
  | 'top' | 'bottom' | 'left' | 'right'
  | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
export type TooltipTrigger = 'hover' | 'focus' | 'click' | 'contextMenu';
/** Preset names are scatter-sensitive; the remaining strings are transmitted CSS as one value. */
export type TooltipColor = PresetColorKey | `${PresetColorKey}-inverse` | (string & {});

/** Object shows the arrow; pointAtCenter by default false. */
export type TooltipArrow = boolean | { pointAtCenter?: boolean };

/** Semantics rc-trigger: numerical 0 and 1 allow flip; boolean false disables correction. */
export interface AdjustOverflow {
  adjustX?: 0 | 1;
  adjustY?: 0 | 1;
}

export interface TooltipSlots {
  root?: string;
  container?: string;
  arrow?: string;
}

/** CSS is given by strings; callback receives props with allowed trigger, delays and placements. */
export type TooltipSemantic = TooltipSlots | ((info: {
  props: TooltipSemanticProps;
}) => TooltipSlots);

export interface TooltipSemanticProps extends Omit<TooltipProps, 'children' | 'getPopupContainer'> {
  /** The owner's input prop; the internal uncontrolled open does not replace it. */
  open?: boolean;
  /** Internal Tooltip native consumers do not have Svelte children snippet. */
  children?: Snippet;
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement | ShadowRoot;
  trigger: TooltipTrigger | readonly TooltipTrigger[];
  mouseEnterDelay: number;
  mouseLeaveDelay: number;
  destroyOnHidden: boolean;
  builtinPlacements: Readonly<Record<string, PopupSourceAlign>>;
}

/** Popup settings; nested provider replaces the object entirely, undefined inherits the parent. */
export interface TooltipConfig {
  class?: string;
  style?: string;
  classNames?: TooltipSemantic;
  styles?: TooltipSemantic;
  arrow?: TooltipArrow;
  trigger?: TooltipTrigger | readonly TooltipTrigger[];
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
}

/** Hint with configurable events, bind:open and an accessible description trigger. */
export interface TooltipProps {
  title?: TooltipContent;
  /** Legacy content is more priority than title=0; falsy overlay uses the title. */
  overlay?: TooltipContent;
  /**
   * Updates content and the semantic container while the popup is closed.
   * @defaultValue false
   * The cache retains the chosen Snippet while its captured Svelte state remains reactive.
   */
  fresh?: boolean;
  /** Preset or CSS background; the custom color selects the text by source luminance. */
  color?: TooltipColor;
  /** Local prefix popup; otherwise ConfigProvider. CSS variables and native wrappers are saved. */
  prefixCls?: string;
  /** DOM-class open after hydration; an empty string uses `${prefixCls}-open`. */
  openClassName?: string;
  children: Snippet;
  /** ID native popup; an empty string uses a stable fallback. Hidden ID follows fresh. */
  id?: string;
  /** Hide the popup by saving the raw open and the processing of trigger events. @defaultValue false */
  disabled?: boolean;
  /** Maintenances bind:open. */
  open?: boolean | undefined;
  /** Participates in the nearest Tooltip.UniqueProvider. false leaves its own panel. */
  unique?: boolean;
  /** @defaultValue false */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Is called after the application of visibility and the completion of its CSS motion. */
  afterOpenChange?: (open: boolean) => void;
  /** Name CSSMotion; an empty string disables animation. By default zoom-big-fast. */
  motion?: { motionName?: string };
  /** Removes content after afterOpenChange(false). @defaultValue false */
  destroyOnHidden?: boolean;
  /**
   * Mounts the hidden content and portal after hydration, including with destroyOnHidden.
   * @defaultValue false
   */
  forceRender?: boolean;
  /** Clear z-index popup; semantic root styles take precedence. */
  zIndex?: number;
  /** @defaultValue 'top' */
  placement?: TooltipPlacement;
  /** Superimposed on top of the selected placements entry; nested overflow is replaced in its entirety. */
  align?: TooltipAlignConfig;
  /** Replaces the entire automatically prepared map, including an empty object. */
  builtinPlacements?: Readonly<Record<string, TooltipAlignConfig>>;
  /** Receives DOM popup and final align after flip, before new coordinates are applied. */
  onPopupAlign?: (popup: HTMLElement, align: TooltipAlignConfig) => void;
  /** @defaultValue true */
  arrow?: TooltipArrow;
  /** @defaultValue true */
  autoAdjustOverflow?: boolean | AdjustOverflow;
  /** Basic events; [] disables them if showAction/hideAction is not specified separately. */
  trigger?: TooltipTrigger | readonly TooltipTrigger[];
  /**
   * Replacing only opening events; undefined uses trigger, [] disables them. Hover without click
   * also includes touch.
   */
  showAction?: readonly TooltipTrigger[];
  /**
   * Replaces only closing events; undefined uses trigger. [] disables trigger and outside-closing,
   * saving Escape.
   */
  hideAction?: readonly TooltipTrigger[];
  /** Focus delay in seconds; default 0, does not inherit mouseEnterDelay. */
  focusDelay?: number;
  /** Latency blur in seconds; default 0, does not inherit mouseLeaveDelay. */
  blurDelay?: number;
  /** Delayed opening in seconds. */
  mouseEnterDelay?: number;
  /** Closure delay in seconds. */
  mouseLeaveDelay?: number;
  /** Local function → ConfigProvider; undefined inherits fallback. */
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  class?: string;
  style?: string;
  /** Applied to popup; class/style save native wrapper contract. */
  rootClassName?: string;
  classNames?: TooltipSemantic;
  styles?: TooltipSemantic;
}

/** Parameters Tooltip Slider pens; formatter=null disables the contents of the hint. */
export interface SliderTooltipConfig {
  open?: boolean;
  /** Disables the participation of handle prompts in Tooltip.UniqueProvider. */
  unique?: TooltipProps['unique'];
  /** Forwarded to each Slider tooltip. The hidden ID follows fresh. */
  id?: TooltipProps['id'];
  /** Hides clues without disabling Slider or changing its meaning. */
  disabled?: TooltipProps['disabled'];
  /** Mounts hidden content after hydration, including destroyOnHidden. */
  forceRender?: TooltipProps['forceRender'];
  /** A clear layer of each clue. Without it, a level from a context or theme is used. */
  zIndex?: TooltipProps['zIndex'];
  /** Updates the contents of the hidden hint; default cache preserves the last open frame. */
  fresh?: boolean;
  /** Removes the contents of each hidden hint; by default preserves. */
  destroyOnHidden?: boolean;
  color?: TooltipColor;
  /** Local prefix Tooltip; otherwise ConfigProvider. Applied to all single/range hints. */
  prefixCls?: string;
  /** DOM-class open handle after hydration; default - `${prefixCls}-open`. */
  openClassName?: string;
  placement?: TooltipPlacement;
  align?: TooltipAlignConfig;
  builtinPlacements?: Readonly<Record<string, TooltipAlignConfig>>;
  onPopupAlign?: TooltipProps['onPopupAlign'];
  arrow?: TooltipArrow;
  /** Matches Tooltip. Boolean defaults retain native viewport behavior. */
  autoAdjustOverflow?: boolean | AdjustOverflow;
  formatter?: ((value: number) => string | null) | null;
  /** Has priority over ConfigProvider; Slider does not have root getPopupContainer. */
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
}
