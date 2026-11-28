import type { Snippet } from 'svelte';
import type { ImageElementData, ImagePreviewConfig, ImageSemantic } from './image.types';
export type ImagePreviewGroupItem = string | ImageElementData;
/** Setting the total viewer ImagePreviewGroup and the managed image index. */
export interface ImagePreviewGroupConfig extends Omit<
  ImagePreviewConfig,
  'onOpenChange' | 'src' | 'cover'
> {
  /** Managed zero-based index; default for local state — 0. */
  current?: number;
  onChange?: (current: number, previous: number) => void;
  onOpenChange?: (open: boolean, info: { current: number; }) => void;
  /** Snippet receives one-based number and full number of images. */
  countRender?: Snippet<[number, number]>;
}
/** General preview for explicit items or registered children Image. */
export interface ImagePreviewGroupProps {
  /** The group's Basic Image Prefix, as in Ant Design; the viewer adds -preview, children are independent. */
  previewPrefixCls?: string;
  /** An explicit list, including an empty one, takes precedence over registering child Image. */
  items?: readonly ImagePreviewGroupItem[];
  /** @defaultValue true */
  preview?: boolean | ImagePreviewGroupConfig;
  classNames?: ImageSemantic<ImagePreviewGroupSemanticProps>;
  styles?: ImageSemantic<ImagePreviewGroupSemanticProps>;
  fallback?: string;
  children?: Snippet;
}

/** As in PreviewGroup, the viewer configuration is outside the semantic resolver input. */
export type ImagePreviewGroupSemanticProps = Omit<ImagePreviewGroupProps, 'preview' | 'previewPrefixCls'>;
