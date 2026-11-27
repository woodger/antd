import type { Snippet } from 'svelte';
import type { AriaAttributes, HTMLAttributes } from 'svelte/elements';

export type TagPresetColor =
  'blue'
  | 'purple'
  | 'cyan'
  | 'green'
  | 'magenta'
  | 'pink'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'volcano'
  | 'geekblue'
  | 'lime'
  | 'gold';
export type TagStatusColor = 'success' | 'processing' | 'error' | 'default' | 'warning';
export type TagColor = TagPresetColor | TagStatusColor | (string & {});
export type TagVariant = 'filled' | 'outlined' | 'solid';
export type TagCloseIcon = boolean | string | number | null | Snippet;

/** ARIA-configuration close control; disabled/afterClose at Tag is not used as upstream. */
export interface TagCloseConfig extends AriaAttributes {
  closeIcon?: TagCloseIcon;
  disabled?: boolean;
  afterClose?: () => unknown;
}

export type TagClosable = boolean | TagCloseConfig | null;

export type CheckableTagValue = string | number;

/** The value retains the type; the label can contain decorative Snippet. */
export interface CheckableTagOption<Value extends CheckableTagValue = CheckableTagValue> {
  value: Value;
  label: string | number | boolean | Snippet | null | undefined;
  className?: string;
  style?: string;
}

export interface CheckableTagGroupSlots {
  root?: string;
  item?: string;
}

export type CheckableTagGroupSemantic<Value extends CheckableTagValue = CheckableTagValue> =
  CheckableTagGroupSlots
  | ((info: { props: CheckableTagGroupProps<Value>; }) => CheckableTagGroupSlots);

interface CheckableTagGroupBaseProps<Value extends CheckableTagValue> extends AriaAttributes {
  /** Local prefix, otherwise ConfigProvider. Daughters CheckableTag receive prefix independently. */
  prefixCls?: string;
  /** Stable unique values; the string and number with the same text differ. */
  options?: readonly (Value | CheckableTagOption<Value>)[];
  /** Lack inherits componentDisabled in tags; group class only reflects this prop. */
  disabled?: boolean;
  id?: string;
  role?: HTMLAttributes<HTMLDivElement>['role'];
  class?: string;
  rootClassName?: string;
  style?: string;
  classNames?: CheckableTagGroupSemantic<Value>;
  styles?: CheckableTagGroupSemantic<Value>;
  /** Bindable div; is available after mount and cleared at unmount. */
  nativeElement?: HTMLDivElement;
  [key: `data-${string}`]: unknown;
}

/** Choices through CheckableTag: value is managed by the owner, defaultValue - only the initial. */
export type CheckableTagGroupProps<Value extends CheckableTagValue = CheckableTagValue> =
  CheckableTagGroupBaseProps<Value> & ({
    multiple?: false;
    value?: Value | null;
    defaultValue?: Value | null;
    onChange?: (value: Value | null) => void;
  } | {
    multiple: true;
    value?: Value[];
    defaultValue?: Value[];
    onChange?: (value: Value[]) => void;
  });

export interface TagSlots {
  root?: string;
  /** Decorative wrapper-border icon Snippet. */
  icon?: string;
  /** Applied in the presence of icon, as the original content slot. */
  content?: string;
  /** Native closure button with previous geometry and focus behavior. */
  close?: string;
}

/** Callback receives props with allowed, color and disabled; CSS is specified lines. */
export type TagSemantic = TagSlots | ((info: { props: TagProps; }) => TagSlots | undefined);

/**
 * Inherited record; an explicit object, including {}, replaces the parent record. CheckableTag uses
 * only class/style. Root style: context styles.root, context style, local styles.root, local style;
 * the calculated color goes in front of them.
 */
export interface TagConfig {
  class?: string;
  style?: string;
  variant?: TagVariant;
  classNames?: TagSemantic;
  styles?: TagSemantic;
  closable?: TagClosable;
  closeIcon?: TagCloseIcon;
}

/** Mark with color, icon and canceled closure. */
export interface TagProps extends Omit<
  HTMLAttributes<HTMLSpanElement | HTMLAnchorElement>, 'children' | 'class' | 'style' | 'color'
> {
  children: Snippet;
  /** Local component prefix; an empty line inherits ConfigProvider. */
  prefixCls?: string;
  /** Preset, status or CSS-color; the absence preserves the previous default class. */
  color?: TagColor;
  /** Local variant takes precedence over the context variant, then filled. */
  variant?: TagVariant;
  rootClassName?: string;
  classNames?: TagSemantic;
  styles?: TagSemantic;
  icon?: Snippet;
  /** Absence inherits the context; false/null hide the control if the closable is not specified. */
  closeIcon?: TagCloseIcon;
  /** Boolean or original close config; local false overrides context. */
  closable?: TagClosable;
  /** Prioritize over closable['aria-label'] and locale.closeText. */
  closeLabel?: string;
  /** Non-empty href chooses root anchor disabled; removes href and adds aria-disabled. */
  href?: string;
  target?: string;
  /** Bindable native span/anchor; changes together with root type and is cleaned at unmount. */
  nativeElement?: HTMLSpanElement | HTMLAnchorElement;
  disabled?: boolean;
  onClose?: (event: MouseEvent) => void;
  /** Click by tag; closure doesn't pop up here. Includes source Wave. */
  onClick?: HTMLAttributes<HTMLSpanElement | HTMLAnchorElement>['onclick'];
  /** Native alias; when transferring together takes precedence over onClick. */
  onclick?: HTMLAttributes<HTMLSpanElement | HTMLAnchorElement>['onclick'];
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string;
  style?: string;
}

/** Controlled filter tag. onChange receives the new checked value. */
export interface CheckableTagProps extends Omit<
  HTMLAttributes<HTMLButtonElement>,
  'children' | 'class' | 'style'
> {
  /** Local component prefix; an empty line inherits ConfigProvider. */
  prefixCls?: string;
  children: Snippet;
  /** @defaultValue false */
  checked?: boolean;
  disabled?: boolean;
  icon?: Snippet;
  onChange?: (checked: boolean) => void;
  /** After onChange for click; onclick takes precedence. Space doesn't cause onClick. */
  onClick?: HTMLAttributes<HTMLButtonElement>['onclick'];
  /** Prior to Space processing; preventDefault cancels the switch. onkeydown takes priority. */
  onKeyDown?: HTMLAttributes<HTMLButtonElement>['onkeydown'];
  /** Bindable link to the native button; cleared at unmount. */
  nativeElement?: HTMLButtonElement;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string;
  style?: string;
}
