import type { Component, Snippet } from 'svelte';
import type { HTMLAttributes, HTMLFormAttributes } from 'svelte/elements';
import type { FormValidationError } from './FormValidationError';
import type {
  FormFieldData, FormFieldSnapshot, FormInstance, SubmissionResult
} from './form.model.svelte.js';
import type { FormValueProjection, PartialFormValues } from './form-store.engine';
import type { ColProps } from '../grid/grid.types';
import type { FormValues } from './validation.engine';
import type { ComponentSize, RenderEmptyContent, Variant } from '../types';
import type { Options, ScrollAction } from '../vendor/compute-scroll-into-view';
import type { TooltipProps } from '../tooltip/tooltip.types';
import type { FormFieldMessages, ValidateMessages } from './validation-messages.types';
import type { FormValidateStatus } from './form-error-list.types';

export interface FormFeedbackInfo extends FormFieldMessages {
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
 * Scrolls to the field and its computed CSS scroll margins. Defaults to if-needed/nearest
 * with focus left in place.
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

/** Events that validate a field. An empty array or false disables control-triggered validation. */
export type FormValidateTrigger = string | readonly string[] | false;

/** Maps values between a named FormItem and its editor. */
export interface FormItemValueAdapter {
  /** The event that writes a value through the control snippet. Defaults to onChange. */
  trigger?: string;
  /** The editor value prop and default event target key. Defaults to value. */
  valuePropName?: string;
  /** Reads a value from the editor's original event arguments. */
  getValueFromEvent?(...args: unknown[]): unknown;
  /** Maps the stored value to editor props and takes precedence over valuePropName on render. */
  getValueProps?(value: unknown): Readonly<Record<string, unknown>>;
  /** Synchronously normalizes a control edit using the previous field value and full store. */
  normalize?(value: unknown, previousValue: unknown, previousValues: Readonly<FormValues>): unknown;
}

/** The value props and event dispatch supplied to the FormItem control snippet. */
export interface FormItemControl {
  readonly props: Readonly<Record<string, unknown>>;
  /** Forwards the editor's original arguments to the configured write and validation triggers. */
  emit(event: string, ...args: unknown[]): void;
}

/** Identifies value writes while metadata, reset and validation notifications omit the source. */
export interface FormItemUpdateInfo {
  readonly source?: 'internal' | 'external';
}

/** Selects render updates from ordered snapshots of the form store. */
export type FormItemShouldUpdate = boolean | {
  compare(
    previous: Readonly<FormValues>,
    current: Readonly<FormValues>,
    info: FormItemUpdateInfo
  ): boolean;
}['compare'];

/** Values observed by the render snippet and the live model for form actions. */
export interface FormItemRenderContext {
  readonly values: Readonly<FormValues>;
  readonly form: FormInstance<FormValues> | undefined;
  /** The nearest Form's mounted handle, when the item has an owner. */
  readonly ref?: FormRef<FormValues>;
}

/** The currently mounted named models in a FormProvider subtree. */
export type FormProviderForms = Readonly<Partial<Record<string, FormInstance<FormValues>>>>;

/** Imperative handles for the same named registrations as the model snapshot. */
export type FormProviderRefs = Readonly<Partial<Record<string, FormRef<FormValues>>>>;

export interface FormProviderChangeInfo {
  changedFields: FormFieldSnapshot[];
  forms: FormProviderForms;
  readonly refs?: FormProviderRefs;
}

export interface FormProviderFinishInfo {
  values: FormValues;
  forms: FormProviderForms;
  readonly refs?: FormProviderRefs;
}

/** Observes descendant forms without adding a DOM wrapper. */
export interface FormProviderProps {
  children?: Snippet;
  /** Accepted by the source provider, where it also has no effect. */
  prefixCls?: string;
  /** Receives edits and validation events, including for forms with an empty or omitted name. */
  onFormChange?: (name: string | undefined, info: FormProviderChangeInfo) => void;
  /** Receives successful submissions before the form's finish callback. */
  onFormFinish?: (name: string | undefined, info: FormProviderFinishInfo) => void;
}

/** The whole form store and its live model, supplied to the form's render snippet. */
export interface FormRenderContext<Values extends FormValues = FormValues> {
  readonly values: Readonly<Values>;
  readonly form: FormInstance<Values>;
  /** The Form's imperative handle after mount. */
  readonly ref?: FormRef<Values>;
}

/** Root attributes and content forwarded to a custom Svelte component. */
export interface FormRootProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'class'>,
  Omit<HTMLFormAttributes, keyof HTMLAttributes<HTMLFormElement>> {
  children: Snippet;
  class?: string;
  /** Forward with a bindable prop and bind:this on the custom host. */
  nativeElement?: HTMLElement;
}

/** A mounted Form's imperative handle. It follows changes to the active model and host. */
export interface FormRef<Values extends FormValues = FormValues> extends FormInstance<Values> {
  readonly nativeElement: HTMLElement | undefined;
  /** Runs the mounted Form's submit callbacks, including when there is no native host. */
  submit(): void;
  submit(onFinish: (values: Values) => void | Promise<void>): Promise<SubmissionResult<Values>>;
}

/** Native form for reactive model, validation and asynchronous onFinish. */
export interface FormProps<Values extends FormValues> extends Omit<
  HTMLFormAttributes,
  'children' | 'onsubmit' | 'onreset' | 'class'
> {
  /** An explicit model. When omitted, Form owns an isolated instance. */
  form?: FormInstance<Values>;
  /** Fills missing values on attachment and provides defaults for subsequent resets. */
  initialValues?: PartialFormValues<Values>;
  /** Applies external field values and metadata after mounting, without change callbacks. */
  fields?: readonly FormFieldData[];
  /** CSS prefix root Form; empty/undefined inherit ConfigProvider regardless of FormItem. */
  prefixCls?: string;
  children: Snippet;
  /** Renders content from the full current store in place of the children snippet. */
  render?: Snippet<[FormRenderContext<Values>]>;
  /** Binds the mounted form handle until the component unmounts. */
  ref?: FormRef<Values>;
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
  /** Default validation events for this form's fields. */
  validateTrigger?: FormValidateTrigger;
  /** Keeps field values after removal by default. Individual fields can override it. */
  preserve?: boolean;
  /** Clears model values when the last Form using this model detaches. */
  clearOnDestroy?: boolean;
  /** Native tag, Svelte component, or false to render without a wrapper. Defaults to form. */
  component?: keyof HTMLElementTagNameMap | Component<FormRootProps> | false;
  /** Handles a native reset after the form model has been reset. */
  onreset?: FormRootProps['onreset'];
  /** Defaults disabled for children; the nearest ConfigProvider and prop control priority. */
  disabled?: boolean;
  /** A control edit supplies the changed path and the values of the registered fields. */
  onValuesChange?: (
    changedValues: FormValueProjection<Values>,
    allValues: FormValueProjection<Values>
  ) => void;
  /** Control edits and validation report the changed fields and the snapshot they came from. */
  onFieldsChange?: (changedFields: FormFieldSnapshot[], allFields: FormFieldSnapshot[]) => void;
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

/** Actual Form component props also allow an empty form or a render-only form. */
export type FormComponentProps<Values extends FormValues> = Omit<FormProps<Values>, 'children'> & {
  children?: Snippet;
};

/** Defaults Form; undefined inherits parent record, {} replaces it. */
export type FormConfig = Pick<
  FormProps<FormValues>, 'colon' | 'labelAlign' | 'labelWrap' | 'requiredMark'
    | 'class' | 'style' | 'classNames' | 'styles' | 'scrollToFirstError' | 'tooltip'
    | 'validateMessages'
>;
