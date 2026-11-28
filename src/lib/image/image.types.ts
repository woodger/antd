import type { Snippet } from 'svelte';
import type { HTMLImgAttributes } from 'svelte/elements';

export interface ImageTransform {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  flipX: boolean;
  flipY: boolean;
}
export type ImageTransformAction =
  'flipY'
  | 'flipX'
  | 'rotateLeft'
  | 'rotateRight'
  | 'zoomIn'
  | 'zoomOut'
  | 'close'
  | 'prev'
  | 'next'
  | 'wheel'
  | 'doubleClick'
  | 'move'
  | 'dragRebound'
  | 'reset'
  | 'touchZoom';
export interface ImageInfo {
  url?: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
}
/** Actions viewer; onActive adopts a relative offset of the index in the group. */
export interface ImagePreviewActions {
  onActive: (offset: number) => void;
  onFlipY: () => void;
  onFlipX: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onClose: () => void;
  onReset: () => void;
}
export interface ImagePreviewRenderInfo {
  transform: ImageTransform;
  current: number;
  total: number;
  image: ImageInfo;
  actions: ImagePreviewActions;
}
/** Viewer settings: visibility, conversions, focus trap and render snippets. */
export interface ImagePreviewConfig {
  src?: string;
  /** Managed visibility; onOpenChange requests its change from the owner. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  afterOpenChange?: (open: boolean) => void;
  /** Reports transform and action through queue requestAnimationFrame. */
  onTransform?: (info: { transform: ImageTransform; action: ImageTransformAction; }) => void;
  scaleStep?: number;
  minScale?: number;
  maxScale?: number;
  wheel?: boolean;
  movable?: boolean;
  focusTrap?: boolean;
  mask?: boolean | { enabled?: boolean; blur?: boolean; closable?: boolean; };
  closeIcon?: Snippet | boolean | null;
  cover?: boolean | Snippet | { coverNode?: Snippet; placement?: 'top' | 'bottom' | 'center'; };
  zIndex?: number;
  /** Snippet receives the original action bar and viewer context. */
  actionsRender?: Snippet<[Snippet, ImagePreviewRenderInfo]>;
  /** Snippet receives the original image and current transform. */
  imageRender?: Snippet<
    [Snippet, { transform: ImageTransform; image: ImageInfo; current?: number; }]
  >;
}

/** The owner supplies progress independently of the image request. */
export interface ImageProgressConfig {
  percent?: number;
  /** Receives the default rail and the current rounded percentage. */
  render?: Snippet<[Snippet, number]>;
}

type ImageProgressSlot = 'root' | 'content' | 'rail' | 'indicator';
export type ImageProgressClassNames = Partial<Record<ImageProgressSlot, string>>;
export type ImageProgressStyles = Partial<Record<ImageProgressSlot, string>>;

/** Native image with fallback/placeholder and interactive preview. */
export interface ImageProps extends Omit<
  HTMLImgAttributes,
  'width'
  | 'height'
  | 'class'
  | 'style'
  | 'onerror'
  | 'onload'
  | 'onclick'
  | 'onkeydown'
  | 'placeholder'
  | 'children'
> {
  /** Local CSS-prefix Image; blank string inherits ConfigProvider, the default viewer adds -preview. */
  prefixCls?: string;
  /** Full prefix viewer; undefined gives prefixCls + -preview, an empty line is saved. */
  previewPrefixCls?: string;
  width?: number | string;
  height?: number | string;
  /** @defaultValue true */
  preview?: boolean | ImagePreviewConfig;
  fallback?: string;
  /** Active progress occupies the Image root until the owner disables it. */
  placeholder?: boolean | Snippet | { progress?: boolean | ImageProgressConfig; };
  rootClassName?: string;
  classNames?: {
    popup?: { root?: string; };
    placeholder?: { progress?: ImageProgressClassNames; };
  };
  /** Root and progress CSS. The ordinary thumbnail takes `style` on its img. */
  styles?: {
    root?: string;
    placeholder?: { progress?: ImageProgressStyles; };
  };
  class?: string;
  style?: string;
  onError?: (event: Event) => void;
  onLoad?: (event: Event) => void;
  onClick?: (event: MouseEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLElement;
  /** The native ref is available after mount and cleared on unmount. */
  imageElement?: HTMLImageElement;
}
export type ImageElementData = Pick<
  HTMLImgAttributes,
  'src'
  | 'alt'
  | 'crossorigin'
  | 'decoding'
  | 'draggable'
  | 'loading'
  | 'referrerpolicy'
  | 'sizes'
  | 'srcset'
  | 'usemap'
  | 'fetchpriority'
>;
