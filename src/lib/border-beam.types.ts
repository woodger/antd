import type { Snippet } from 'svelte';

/** Colors keep their original order. Percentages 0–100 map to the beam's visible 70%. */
export type BorderBeamGradient = { color: string; percent: number; }[];
export type BorderBeamColor = string | BorderBeamGradient;

/**
 * Shared layer class and style. Local values take precedence. A nested config is replaced in full.
 */
export interface BorderBeamConfig {
  class?: string;
  style?: string;
}

/** Decorative CSS beams inside a container, with no extra wrapper. */
export interface BorderBeamProps {
  /** Local CSS prefix. Otherwise inherits ConfigProvider. The shared prefix sets the variable namespace. */
  prefixCls?: string;
  /**
   * Svelte replacement for the React child ref. Pass bind:this from a native container or
   * bind:nativeElement from a component. Decoration requires an HTMLElement. The caller remains
   * responsible for positioning the container.
   */
  target?: HTMLElement | SVGElement | null;
  children?: Snippet | string | number | boolean | null;
  /** When omitted, uses the current theme's primary and primaryHover gradient. */
  color?: BorderBeamColor;
  /** Finite numbers ≥ 1 are rounded down. Other values become 1. */
  count?: number;
  /** Cycle duration in seconds. Defaults to 6. A positive value overrides the CSS. */
  duration?: number;
  /** Line width. Numbers are in px. Defaults to --ant-line-width. */
  lineWidth?: number | string;
  /**
   * Outset. Numbers are in px. Strings use calc(-1 * outset). When omitted, uses the four border
   * widths measured once per target change.
   */
  outset?: number | string;
  /** Size of the moving pseudo-element. Numbers are in px and the default is 100px. */
  size?: number | string;
  class?: string;
  /** Style for the decorative layers. Component settings supply their CSS variables after style. */
  style?: string;
}
