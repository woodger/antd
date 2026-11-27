import type { Snippet } from 'svelte';
import type { HTMLFormAttributes } from 'svelte/elements';
import type { FormValidationError } from './FormValidationError';
import type { FormInstance } from './form.model.svelte.js';
import type { ColProps } from '../grid.types';
import type { FormValues } from './validation.engine';
import type { ComponentSize, RenderEmptyContent, Variant } from '../types';
import type { Options, ScrollAction } from '../vendor/compute-scroll-into-view';
import type { TooltipProps } from '../tooltip.types';
import type { ValidateMessages } from './validation-messages.types';
import type { FormValidateStatus } from './form-error-list.types';

export interface FormFeedbackInfo {
  status: FormValidateStatus;
  errors: readonly string[];
  warnings: readonly string[];
}
/** False hides an icon; the other falsy values use a standard status icon. */
export type FormFeedbackIcons = (info: FormFeedbackInfo) => Partial<Record<FormValidateStatus, RenderEmptyContent>>;

/** Defaults hints label; icon replaces React element Svelte snippet. */
export interface FormTooltipProps extends Omit<TooltipProps, 'children'> {
  icon?: Snippet | null;
  /** Fallback content of the icon if icon is not specified. */
  children?: RenderEmptyContent;
}

/** Content includes arrays; the object contains Tooltip options and a local icon. */
export type FormItemTooltip = FormTooltipProps | RenderEmptyContent;

/**
 * Scroll Form: by default if-needed/nearest, without changing the focus. CSS scroll-margin does not
 * yet participate in the calculation.
 */
export interface FormScrollOptions extends Options {
  /** Native scrolling behavior or callback with calculated actions. */
  behavior?: ScrollBehavior | ((actions: ScrollAction[]) => unknown);
  /** After scrolling causes focusField; no user behavior is expected. */
  focus?: boolean;
}

export interface FormRequiredMarkInfo {
  required: boolean;
}

/**
 * Visual label marker. The content includes the tooltip icon after colon processing when supplied.
 * The bivariant renderer remains compatible with existing string snippets.
 */
export type FormRequiredMark = boolean | 'optional'
  | { render(label: RenderEmptyContent, info: FormRequiredMarkInfo): ReturnType<Snippet> }['render'];

export interface FormLocale {
  /** An empty line uses the original English fallback. */
  optional?: string;
  /** Locale message templates. ConfigProvider.form and Form.validateMessages take precedence. */
  defaultValidateMessages?: ValidateMessages;
}

/** Flat class/CSS slots Form; root refers to Form, the rest to fields and ErrorList. */
export interface FormSemanticSlots {
  root?: string;
  label?: string;
  content?: string;
  help?: string;
  helpItem?: string;
  extra?: string;
}

/** Callback receives native props with allowed layout/disabled and default labels. */
export type FormSemantic = FormSemanticSlots
  | (<Values extends FormValues>(info: { props: FormProps<Values> }) => FormSemanticSlots | undefined);

/** Native form for reactive model, validation and asynchronous onFinish. */
export interface FormProps<Values extends FormValues> extends Omit<
  HTMLFormAttributes,
  'children' | 'onsubmit' | 'onreset' | 'class'
> {
  /** An insulated model created by createForm. */
  form: FormInstance<Values>;
  /** CSS prefix root Form; empty/undefined inherit ConfigProvider regardless of FormItem. */
  prefixCls?: string;
  children: Snippet;
  /** @defaultValue 'vertical' */
  layout?: 'vertical' | 'horizontal' | 'inline';
  /** Adds colon to the horizontal label; undefined inherits ConfigProvider.form, then true. */
  colon?: boolean;
  /** Label alignment; undefined inherits ConfigProvider.form, then right. */
  labelAlign?: 'left' | 'right';
  /** Translation of the text of the label; undefined inherits ConfigProvider.form, then false. */
  labelWrap?: boolean;
  /** Columns label on ColProps; FormItem replaces the whole object, including {}. */
  labelCol?: ColProps;
  /** Columns according to ColProps; nested FormItem does not inherit external columns. */
  wrapperCol?: ColProps;
  /** Only design label, unchanged required/validation; config, then true. */
  requiredMark?: FormRequiredMark;
  /** Decoration of daughter fields; undefined resembles external Form, saving ConfigProvider. */
  variant?: Variant;
  /** Shape size and children; undefined inherits nearest Form/ConfigProvider. */
  size?: ComponentSize;
  /** Defaults prompts; do not show an icon without FormItem.tooltip. */
  tooltip?: FormTooltipProps;
  /** Defaults icons for FormItem.hasFeedback; local icons renderer takes precedence. */
  feedbackIcons?: FormFeedbackIcons;
  /** Local groups replace config entirely; the message of a separate rule is more prioritized. */
  validateMessages?: ValidateMessages;
  /** By default, form; false leaves context without native wrapper and DOM attributes. */
  component?: 'form' | false;
  /** Defaults disabled for children; the nearest ConfigProvider and prop control priority. */
  disabled?: boolean;
  /** Is called after successful validation; Promise keeps submitting until completion. */
  onFinish?: (values: Values) => void | Promise<void>;
  /** Errors validation; outOfDate is distinguished by an outdated verification result. */
  onFinishFailed?: (error: FormValidationError<Values>) => void;
  /**
   * Scrolling the first error after onFinishFailed; local prop replaces config in its entirety.
   * True scrolls without focus, false disables action. Unconfigured, native autofocus is saved.
   */
  scrollToFirstError?: boolean | FormScrollOptions;
  /** Error execution onFinish; validation errors are received in onFinishFailed. */
  onError?: (error: unknown) => void;
  /** Semantic slots classes accumulate after ConfigProvider.form.classNames. */
  classNames?: FormSemantic;
  /** CSS-line semantic slots after config.styles; local style overlaps root. */
  styles?: FormSemantic;
  /** Additional class native wrapper; component = false does not create root. */
  rootClassName?: string;
  class?: string;
}

/** Defaults Form; undefined inherits parent record, {} replaces it. */
export type FormConfig = Pick<
  FormProps<FormValues>, 'colon' | 'labelAlign' | 'labelWrap' | 'requiredMark'
    | 'class' | 'style' | 'classNames' | 'styles' | 'scrollToFirstError' | 'tooltip'
    | 'validateMessages'
>;
