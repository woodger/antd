import type { Snippet } from 'svelte';

export type SkeletonWidth = number | string;
export type SkeletonElementSize = 'small' | 'medium' | 'large';
export type SkeletonAvatarSize = SkeletonElementSize | number;
export interface SkeletonElementSlots {
  root?: string;
  content?: string;
}
export interface SkeletonElementProps {
  /** Local CSS prefix. Omission and an empty string inherit ConfigProvider. */
  prefixCls?: string;
  class?: string;
  rootClassName?: string;
  /** As an upstream, style relates to content; styles.root to an external div. */
  style?: string;
  active?: boolean;
  classNames?: SkeletonElementSlots;
  styles?: SkeletonElementSlots;
}
/** Independent placeholder avatar and avatar settings of the main Skeleton. */
export interface SkeletonAvatarProps extends SkeletonElementProps {
  size?: SkeletonAvatarSize;
  shape?: 'circle' | 'square';
}
export interface SkeletonButtonProps extends SkeletonElementProps {
  size?: SkeletonElementSize;
  shape?: 'circle' | 'square' | 'round' | 'default';
  block?: boolean;
}
export interface SkeletonInputProps extends SkeletonElementProps {
  size?: SkeletonElementSize;
  block?: boolean;
}
export interface SkeletonNodeProps extends SkeletonElementProps {
  children?: Snippet;
  /** @internal Replaces the default content class, matching the upstream Node. */
  internalClassName?: string;
}
export type SkeletonImageProps = SkeletonElementProps;
export interface SkeletonPartProps {
  prefixCls?: string;
  class?: string;
  /** The main Skeleton replaces the nested style with the appropriate semantic style. */
  style?: string;
}
/** Geometry line title in Skeleton. */
export interface SkeletonTitleProps extends SkeletonPartProps {
  width?: SkeletonWidth;
}
/** The number of lines and the width of the text placeholder Skeleton. */
export interface SkeletonParagraphProps extends SkeletonPartProps {
  rows?: number;
  width?: SkeletonWidth | SkeletonWidth[];
}

/** A boot frame that replaces children and retains available status. */
export interface SkeletonProps {
  /** @defaultValue true */
  loading?: boolean;
  /** @defaultValue false */
  active?: boolean;
  /** @defaultValue false */
  round?: boolean;
  /** @defaultValue false */
  avatar?: boolean | Omit<SkeletonAvatarProps, 'active'>;
  /** @defaultValue true */
  title?: boolean | SkeletonTitleProps;
  /** @defaultValue true */
  paragraph?: boolean | SkeletonParagraphProps;
  children?: Snippet;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-hidden'?: boolean;
  /** Existing native host; new semantic root and rootClassName belong to the frame. */
  class?: string;
  /** Existing native host; styles.root refers to the decorative frame. */
  style?: string;
  /** Local CSS prefix of the frame; the absence and empty line inherits ConfigProvider. */
  prefixCls?: string;
  rootClassName?: string;
  classNames?: SkeletonSemanticSlots
    | ((info: SkeletonSemanticInfo) => SkeletonSemanticSlots | undefined);
  styles?: SkeletonSemanticSlots
    | ((info: SkeletonSemanticInfo) => SkeletonSemanticSlots | undefined);
  /** Placeholder div after mount; undefined, when loading=false or the component is removed. */
  nativeElement?: HTMLDivElement;
  ref?: SkeletonRef;
}

export type SkeletonSemanticSlots = Partial<Record<
  'root' | 'header' | 'section' | 'avatar' | 'title' | 'paragraph', string
>>;
export interface SkeletonSemanticInfo {
  props: SkeletonProps & {
    avatar: NonNullable<SkeletonProps['avatar']>;
    title: NonNullable<SkeletonProps['title']>;
    paragraph: NonNullable<SkeletonProps['paragraph']>;
  };
}
export interface SkeletonRef {
  readonly nativeElement: HTMLDivElement | null;
}
export type SkeletonConfig = Pick<SkeletonProps, 'class' | 'style' | 'classNames' | 'styles'>;
