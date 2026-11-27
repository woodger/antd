import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export type AlertType = 'success' | 'info' | 'warning' | 'error';
export type AlertVariant = 'outlined' | 'filled';
export type AlertContent = string | number | boolean | null | Snippet
  | readonly (AlertContent | undefined)[];

export interface AlertCloseAttributes {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  role?: HTMLAttributes<HTMLButtonElement>['role'];
  [attribute: `aria-${string}`]: unknown;
  [attribute: `data-${string}`]: unknown;
}
export interface AlertClosable extends AlertCloseAttributes {
  disabled?: boolean;
  /** An empty string preserves the previous empty button. Other falsy values use the fallback. */
  closeIcon?: AlertContent;
  /** Dismissal callback. preventDefault does not cancel dismissal. */
  onClose?: (event: MouseEvent) => void;
  /** Captured when dismissal is requested. Called after DOM removal and cancelled on unmount. */
  afterClose?: () => void;
}
export interface AlertSemanticSlots {
  root?: string;
  icon?: string;
  section?: string;
  title?: string;
  description?: string;
  actions?: string;
  close?: string;
}
export interface AlertSemanticInfo {
  props: Omit<AlertProps, 'closable'> & {
    prefixCls: string;
    variant: AlertVariant;
    type: AlertType;
    closable: boolean;
  };
}
export type AlertSemantic = AlertSemanticSlots
  | ((info: AlertSemanticInfo) => AlertSemanticSlots | undefined);
export interface AlertRef {
  /** Captured after mount. After dismissal, the node stays detached until unmount. */
  readonly nativeElement: HTMLDivElement;
}
/** Inherited styling and close or icon defaults. An explicit record replaces the parent's record. */
export interface AlertConfig extends Pick<
  AlertProps, 'class' | 'style' | 'variant' | 'classNames' | 'styles'
> {
  closable?: boolean | (AlertCloseAttributes & Pick<AlertClosable, 'closeIcon'>);
  successIcon?: AlertContent;
  infoIcon?: AlertContent;
  warningIcon?: AlertContent;
  errorIcon?: AlertContent;
}

/** Status message with an action and animated dismissal. */
export interface AlertProps {
  type?: AlertType;
  /** @defaultValue 'outlined' */
  variant?: AlertVariant;
  title?: AlertContent;
  description?: AlertContent;
  /** undefined shows the icon in a banner and hides it in regular mode. */
  showIcon?: boolean;
  /** null and undefined use the context or default icon. false and an empty string leave an empty span. */
  icon?: AlertContent;
  action?: AlertContent;
  /** @defaultValue false */
  banner?: boolean;
  /** @defaultValue false */
  closable?: boolean | AlertClosable;
  /** @defaultValue 'alert' */
  role?: HTMLAttributes<HTMLDivElement>['role'];
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-live'?: 'off' | 'assertive' | 'polite';
  /** @defaultValue true */
  'aria-atomic'?: HTMLAttributes<HTMLDivElement>['aria-atomic'];
  'aria-hidden'?: HTMLAttributes<HTMLDivElement>['aria-hidden'];
  class?: string;
  style?: string;
  /** Local CSS prefix. Omission and an empty string inherit ConfigProvider. */
  prefixCls?: string;
  rootClassName?: string;
  /** Callbacks receive resolved prefixCls, variant, type, showIcon, and boolean closable. */
  classNames?: AlertSemantic;
  styles?: AlertSemantic;
  onClick?: (event: MouseEvent) => void;
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
  /** bind:nativeElement reflects the current DOM. It is undefined before mount and after close or unmount. */
  nativeElement?: HTMLDivElement;
  /** bind:ref receives the root snapshot after mount and is cleared on unmount. */
  ref?: AlertRef;
  [attribute: `aria-${string}`]: unknown;
  [attribute: `data-${string}`]: unknown;
}
