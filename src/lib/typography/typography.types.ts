import type { Snippet } from 'svelte';
import type { HTMLAnchorAttributes, HTMLAttributes } from 'svelte/elements';
import type { TextAreaProps } from '../input/textarea.types';
import type { TooltipProps } from '../tooltip.types';

/** Scalar/array content preserves text boundaries for JS ellipsis; snippet is a whole node. */
export type TypographyContent = string | number | bigint | boolean | null | undefined
  | Snippet | readonly TypographyContent[];
export type TypographyType = 'secondary' | 'success' | 'warning' | 'danger';
export type TypographySemanticName = 'root' | 'actions' | 'action' | 'textarea';
export type TypographySlots = Partial<Record<TypographySemanticName, string>>;
export type TypographySemantic = TypographySlots | ((info: {
  props: TypographySemanticProps;
}) => TypographySlots);

/** PrefixCls and direction are allowed before callback; the remaining props save input values. */
export interface TypographySemanticProps {
  prefixCls: string;
  direction: 'ltr' | 'rtl';
  component?: keyof HTMLElementTagNameMap;
  children?: TypographyContent;
  [name: string]: unknown;
}

/** The settings of the entire Typography family; local semantic styles take precedence. */
export interface TypographyConfig {
  class?: string;
  style?: string;
  classNames?: TypographySemantic;
  styles?: TypographySemantic;
}

export interface TypographyLocale {
  edit: string;
  copy: string;
  copied: string;
  expand: string;
  collapse: string;
}

/** A click invokes async text. Falsy text uses the original children fallback. */
export interface TypographyCopyConfig {
  text?: string | (() => string | Promise<string>);
  onCopy?: (event?: MouseEvent) => void;
  /** Scalar sets an ordinary icon; the array is ordinary and successful. Falsy icon includes default. */
  icon?: TypographyContent;
  /**
   * False disables both clues; the array sets ordinary and successful separately. Trigger/delays
   * inherits ConfigProvider.tooltip.
   */
  tooltips?: TypographyContent;
  format?: 'text/plain' | 'text/html';
  tabIndex?: number;
}

/** Editing is managed by the owner at a given editing; callbacks themselves do not change children. */
export interface TypographyEditConfig {
  text?: string;
  editing?: boolean;
  icon?: TypographyContent;
  /** Title edit Tooltip; false hides. Trigger/delays inherited ConfigProvider.tooltip. */
  tooltip?: TypographyContent;
  onStart?: () => void;
  onChange?: (value: string) => void;
  onCancel?: () => void;
  onEnd?: () => void;
  maxLength?: number;
  /** @defaultValue true */
  autoSize?: TextAreaProps['autoSize'];
  /** @defaultValue ['icon'] */
  triggerType?: readonly ('icon' | 'text')[];
  /** Null hides the default enter icon. */
  enterIcon?: Exclude<TypographyContent, Snippet> | Snippet<[className: string]>;
  tabIndex?: number;
}

/** Callback symbol returns content; for snippet use () = > snippet. */
export interface TypographyEllipsisConfig {
  /** @defaultValue 1 */
  rows?: number;
  expandable?: boolean | 'collapsible';
  suffix?: string;
  symbol?: Exclude<TypographyContent, Snippet> | ((expanded: boolean) => TypographyContent);
  /** It's read once. @defaultValue false */
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpand?: (event: MouseEvent, info: { expanded: boolean; }) => void;
  onEllipsis?: (ellipsis: boolean) => void;
  /** Tooltip truncated text; trigger/delays inherit ConfigProvider.tooltip. */
  tooltip?: TypographyContent | Omit<TooltipProps, 'children'>;
}

/** Native typography container; by default article. Block operations - the options are lower. */
export interface TypographyProps extends Omit<
  HTMLAttributes<HTMLElement>, 'children' | 'class' | 'style'
> {
  children?: TypographyContent;
  component?: keyof HTMLElementTagNameMap;
  direction?: 'ltr' | 'rtl';
  /** A nonempty local prefix takes precedence. Otherwise uses ConfigProvider.prefixCls. */
  prefixCls?: string;
  classNames?: TypographySemantic;
  styles?: TypographySemantic;
  class?: string;
  rootClassName?: string;
  style?: string;
  onClick?: HTMLAttributes<HTMLElement>['onclick'];
  onMouseEnter?: HTMLAttributes<HTMLElement>['onmouseenter'];
  onMouseLeave?: HTMLAttributes<HTMLElement>['onmouseleave'];
  /** Bind:nativeElement indicates the rendered element; there is not available during editing. */
  nativeElement?: HTMLElement;
}

/** General operations Text/Title/Paragraph/Link, including the original order of decorations. */
export interface TypographyBlockProps extends TypographyProps {
  actions?: { placement?: 'start' | 'end'; };
  editable?: boolean | TypographyEditConfig;
  copyable?: boolean | TypographyCopyConfig;
  type?: TypographyType;
  /** Typographic design; does not disable action buttons. */
  disabled?: boolean;
  ellipsis?: boolean | TypographyEllipsisConfig;
  code?: boolean;
  mark?: boolean;
  underline?: boolean;
  delete?: boolean;
  strong?: boolean;
  keyboard?: boolean;
  italic?: boolean;
}

/** Inline span; ellipsis does not support rows, expandable and onExpand. */
export interface TypographyTextProps extends Omit<TypographyBlockProps, 'component' | 'ellipsis'> {
  ellipsis?: boolean | Omit<TypographyEllipsisConfig, 'rows' | 'expandable' | 'onExpand'>;
}

/** Heading h1–h5; the unacceptable runtime level uses h1. */
export interface TypographyTitleProps extends Omit<TypographyBlockProps, 'component' | 'strong'> {
  /** @defaultValue 1 */
  level?: 1 | 2 | 3 | 4 | 5;
}

/** Div with lower indentation of the paragraph. */
export interface TypographyParagraphProps extends Omit<TypographyBlockProps, 'component'> {}

/** Native anchor; target=_blank receives rel by default noopener noreferrer. */
export interface TypographyLinkProps extends Omit<TypographyBlockProps, 'component' | 'ellipsis'>,
  Pick<HTMLAnchorAttributes, 'href' | 'target' | 'rel' | 'download' | 'hreflang' | 'ping' | 'referrerpolicy'> {
  ellipsis?: boolean;
}
