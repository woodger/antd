import type { Snippet } from 'svelte';
import type {
  AdjustOverflow,
  TooltipArrow,
  TooltipColor,
  TooltipPlacement,
  TooltipProps,
  TooltipSlots,
  TooltipTrigger
} from '../tooltip/tooltip.types';

export type PopoverPlacement = TooltipPlacement;
export type PopoverTrigger = TooltipTrigger;
/** False omits the section; true leaves an empty section without text; 0 is displayed. */
export type PopoverContent = string | number | boolean | Snippet;

/** bind:ref Popover/Popconfirm: is available after mount and cleaned at unmount. */
export interface PopoverRef {
  /** Basic DOM trigger, including SVG; prior to permission anchor can be undefined. */
  readonly nativeElement: Element | undefined;
  /** Independent div is kept hidden; in the group is available only to its owner. */
  readonly popupElement: HTMLDivElement | undefined;
  /** Combines calls into microtask; closed or destroyed popup does not open. */
  forceAlign: () => void;
}

export interface PopoverSlots extends TooltipSlots {
  title?: string;
  content?: string;
}

/** Callback receives props with permitted placement, trigger and delays; CSS – lines. */
export type PopoverSemantic = PopoverSlots | ((info: {
  props: PopoverSemanticProps;
}) => PopoverSlots);

export interface PopoverSemanticProps extends PopoverProps {
  /** The owner's input prop; the internal uncontrolled open does not replace it. */
  open?: boolean;
  placement: PopoverPlacement;
  trigger: PopoverTrigger | readonly PopoverTrigger[];
  mouseEnterDelay: number;
  mouseLeaveDelay: number;
}

/** Own settings Popover; defaults Tooltip do not apply. */
export interface PopoverConfig {
  class?: string;
  style?: string;
  classNames?: PopoverSemantic;
  styles?: PopoverSemantic;
  arrow?: TooltipArrow;
  trigger?: PopoverTrigger | readonly PopoverTrigger[];
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
}

/** Interactive Surface at trigger snippet with bind:open and focus control. */
export interface PopoverProps {
  children: Snippet;
  /** ID native popup; an empty string uses a stable fallback. Hidden ID follows fresh. */
  id?: string;
  /** Panel color and arrows; title/content retain their own semantic colors. */
  color?: TooltipColor;
  /** Local prefix panel; otherwise ConfigProvider. CSS variables are saved. */
  prefixCls?: string;
  /** DOM-class open trigger after hydration; by default `${prefixCls}-open`. */
  openClassName?: string;
  title?: PopoverContent | null;
  content?: PopoverContent | null;
  /** Hide the panel by saving the raw open and open-event. @defaultValue false */
  disabled?: boolean;
  /** Maintenances bind:open. */
  open?: boolean | undefined;
  /** @defaultValue false */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Is called after the application of visibility and the completion of its CSS motion. */
  afterOpenChange?: TooltipProps['afterOpenChange'];
  /** Name CSSMotion; an empty string disables animation. By default zoom-big. */
  motion?: TooltipProps['motion'];
  /** The explicit true uses a shared panel of the nearest Tooltip.UniqueProvider. @defaultValue false */
  unique?: TooltipProps['unique'];
  /** Removes title/content after afterOpenChange(false); shell native is saved. */
  destroyOnHidden?: boolean;
  /** Installs hidden content and portal after hydration, including destroyOnHidden. */
  forceRender?: boolean;
  /** Updates hidden title/content and semantic styles; by default false. */
  fresh?: boolean;
  /** Clear z-index; semantic root styles take precedence. */
  zIndex?: number;
  /** Basic events; [] disables them without separate showAction/hideAction. */
  trigger?: PopoverTrigger | readonly PopoverTrigger[];
  /** Replacing opening events; undefined uses trigger, [] disables them. */
  showAction?: readonly PopoverTrigger[];
  /** Replacing closing events; [] only preserves Escape and content actions. */
  hideAction?: readonly PopoverTrigger[];
  /** Delay focus in seconds; default 0 regardless of mouseEnterDelay. */
  focusDelay?: number;
  /** Latency blur in seconds; default 0 regardless of mouseLeaveDelay. */
  blurDelay?: number;
  /** @defaultValue 'top' */
  placement?: PopoverPlacement;
  /** Superimposed on top of the selected placements entry; nested overflow is replaced in its entirety. */
  align?: TooltipProps['align'];
  /** Replaces the entire automatically prepared map, including an empty object. */
  builtinPlacements?: TooltipProps['builtinPlacements'];
  /** Receives DOM popup and final align after flip, before new coordinates are applied. */
  onPopupAlign?: TooltipProps['onPopupAlign'];
  /** @defaultValue true */
  arrow?: TooltipArrow;
  /** @defaultValue true */
  autoAdjustOverflow?: boolean | AdjustOverflow;
  /** Delayed opening in seconds. */
  mouseEnterDelay?: number;
  /** Closure delay in seconds. */
  mouseLeaveDelay?: number;
  /** Local function → ConfigProvider. */
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-busy'?: boolean;
  popupClass?: string;
  class?: string;
  style?: string;
  rootClassName?: string;
  classNames?: PopoverSemantic;
  styles?: PopoverSemantic;
}
