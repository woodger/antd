import type { Snippet } from 'svelte';

export interface WatermarkFont {
  color?: CanvasFillStrokeStyles['fillStyle'];
  fontSize?: number | string;
  fontWeight?: 'normal' | 'lighter' | 'bold' | 'bolder' | number;
  fontStyle?: 'none' | 'normal' | 'italic' | 'oblique';
  fontFamily?: string;
  textAlign?: CanvasTextAlign;
}

export interface WatermarkText {
  text: string;
  font?: WatermarkFont;
}

export type WatermarkContent = string | WatermarkText;

/** Styles ConfigProvider.watermark; local class/style is added after the provider's settings. */
export interface WatermarkConfig {
  class?: string;
  style?: string;
}

/** Repeated Canvas-substrate of text or image with inheritance in Modal/Drawer. */
export interface WatermarkProps {
  /** By default global token.zIndexPopupBase - 1; explicit 0 is saved. */
  zIndex?: number;
  rotate?: number;
  width?: number;
  height?: number;
  image?: string;
  content?: WatermarkContent | readonly WatermarkContent[];
  /** Color/fontSize uses global colorFill/fontSizeLG; line font has priority. */
  font?: WatermarkFont;
  class?: string;
  rootClassName?: string;
  style?: string;
  gap?: readonly [number, number];
  offset?: readonly [number, number];
  children?: Snippet;
  /** Passes the backdrop to child Modal and Drawer components. */
  inherit?: boolean;
  /** External removal of the watermark DOM does not invoke the regular unmount callback. */
  onRemove?: () => void;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLDivElement;
}

export interface WatermarkContentLine {
  text: string;
  font: Required<WatermarkFont>;
}
