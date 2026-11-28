import type { Snippet } from 'svelte';
import type { HTMLImgAttributes } from 'svelte/elements';
import type { GetContainer } from '../types';
import type { ImagePreviewGroupSemanticProps } from './image-preview-group.types';

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

/** Artwork for preview controls. An empty value leaves the control without a glyph. */
export type ImagePreviewIcons = Partial<Record<
  'rotateLeft' | 'rotateRight' | 'zoomIn' | 'zoomOut' | 'close' | 'prev' | 'next' | 'flipX' | 'flipY',
  Snippet | false | null
>>;

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

/** Renderable preview buttons with their current action, label, and disabled state. */
export interface ImagePreviewActionIcons {
  prevIcon?: Snippet;
  nextIcon?: Snippet;
  flipYIcon: Snippet;
  flipXIcon: Snippet;
  rotateLeftIcon: Snippet;
  rotateRightIcon: Snippet;
  zoomOutIcon: Snippet;
  zoomInIcon: Snippet;
}

export interface ImagePreviewRenderInfo {
  icons: ImagePreviewActionIcons;
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
  /** Overrides the provider's popup container. Browser getters receive no arguments. */
  getContainer?: GetContainer;
  onOpenChange?: (open: boolean) => void;
  /** Reports visibility after preview motion has finished. */
  afterOpenChange?: (open: boolean) => void;
  /** CSS name for appear, enter, and leave. An empty string disables preview motion. */
  motionName?: string;
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
  /** Accepted by Ant Design's preview config, whose wrapper supplies the built-in artwork. */
  icons?: ImagePreviewIcons;
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
type ImageProgressSlots = Partial<Record<ImageProgressSlot, string>>;
export type ImageProgressClassNames = ImageProgressSlots;
export type ImageProgressStyles = ImageProgressSlots;

/** Class names or inline CSS for the nodes owned by the preview. */
export interface ImagePopupSlots {
  root?: string;
  mask?: string;
  body?: string;
  footer?: string;
  actions?: string;
  close?: string;
}

/** Semantic fields for the thumbnail, its loading surface, and the preview. */
export interface ImageSlots {
  root?: string;
  image?: string;
  cover?: string;
  placeholder?: { progress?: ImageProgressSlots; };
  popup?: ImagePopupSlots;
}

/** Image resolvers receive the effective preview with resolved mask visibility and artwork. */
export type ImageSemanticProps = Omit<ImageProps, 'preview' | 'nativeElement' | 'imageElement'> & {
  preview: (Omit<ImagePreviewConfig, 'mask' | 'icons'> & {
    mask: boolean;
    icons: Readonly<Record<keyof ImagePreviewIcons, Snippet>>;
  }) | null;
};

export type ImageSemantic<Props = ImageSemanticProps> = ImageSlots
  | ((info: { props: Props; }) => ImageSlots | undefined);

/** ConfigProvider.image. An explicit record replaces the inherited settings. */
export interface ImageConfig {
  class?: string;
  style?: string;
  fallback?: string;
  classNames?: ImageSemantic<ImageSemanticProps | ImagePreviewGroupSemanticProps>;
  styles?: ImageSemantic<ImageSemanticProps | ImagePreviewGroupSemanticProps>;
  preview?: Pick<ImagePreviewConfig, 'mask' | 'closeIcon'>;
}

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
  classNames?: ImageSemantic;
  /** Semantic CSS. The ordinary thumbnail applies the separate `style` prop to its img. */
  styles?: ImageSemantic;
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
