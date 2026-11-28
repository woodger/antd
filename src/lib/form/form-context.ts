// Shares field behavior and the live model of the nearest Form with descendant controls.
import { getContext, onDestroy, onMount, setContext } from 'svelte';
import type { FormFieldRegistration } from './form-internal';
import type {
  FormFeedbackIcons, FormRef, FormRequiredMark, FormSemanticSlots, FormTooltipProps,
  FormValidateTrigger
} from './form.types';
import type { FormValidateStatus } from './form-error-list.types';
import type { FormFieldMeta, FormInstance } from './form.model.svelte';
import type { ColProps } from '../grid/grid.types';
import type { NamePath } from './form-store.engine';
import type { Variant } from '../types';
import { useConfig } from '../config-provider/config-context';
import type { FormRule, FormValues } from './validation.engine';
import type { FormValidationMessage } from './validation-messages.types';
import type { ValidationMessages } from './validation-nested.engine';

export interface FormContext {
  readonly model: FormInstance<FormValues>;
  readonly ref: FormRef<FormValues> | undefined;
  readonly variant?: Variant;
  readonly disabled: boolean;
  readonly submitting: boolean;
  readonly layout: 'vertical' | 'horizontal' | 'inline';
  readonly colon?: boolean;
  readonly labelAlign?: 'left' | 'right';
  readonly labelWrap?: boolean;
  readonly labelCol?: ColProps;
  readonly wrapperCol?: ColProps;
  readonly requiredMark?: FormRequiredMark;
  readonly classNames?: FormSemanticSlots;
  readonly styles?: FormSemanticSlots;
  readonly tooltip?: FormTooltipProps;
  readonly feedbackIcons?: FormFeedbackIcons;
  readonly validateTrigger?: FormValidateTrigger;
  readonly preserve?: boolean;
  readonly resetKey?: object;
  getFieldMessages(name: NamePath, kind: keyof ValidationMessages): readonly FormValidationMessage[];
  getFieldMeta(name: NamePath): (Pick<FormFieldMeta, 'touched' | 'validating'>
    & Partial<Pick<FormFieldMeta, 'validated'>>) | undefined;
  isFieldRequired(name: NamePath): boolean;
  hasRequiredRules(rules: readonly FormRule[]): boolean;
  handleFieldBlur(name: NamePath): void;
  handleFieldEvent(mountKey: symbol, event: string, args: readonly unknown[]): boolean;
  registerField?(field: FormFieldRegistration): (() => void) | undefined;
  markFieldMounted(mountKey: symbol): void;
  getFieldValue(name: NamePath): unknown;
  initializeField(name: NamePath, initialValue?: unknown): void;
  initializeList(name: NamePath, initialValue?: readonly unknown[]): void;
  changeList(name: NamePath, values: readonly unknown[]): void;
}

export interface FormFieldContext {
  // Status-only contexts pass state without creating native associations for child controls.
  readonly id?: string;
  readonly name?: string;
  readonly label?: string;
  readonly labelledBy?: string;
  readonly disabled: boolean | undefined;
  readonly required: boolean;
  readonly status: FormValidateStatus | undefined;
  // Errors remain available with visual success/validating or explicit empty status.
  readonly invalid?: boolean;
  readonly describedBy: string | undefined;
  registerControl?(getInstance: () => unknown): () => void;
  onBlur(): void;
}

const formKey = Symbol('ant-design-form');
const fieldKey = Symbol('ant-design-form-field');

/** A reactive reference to the model of the nearest Form. */
export interface FormInstanceRef<Values extends FormValues> {
  readonly current: FormInstance<Values> | undefined;
  /** The nearest Form's imperative handle after it mounts. */
  readonly ref?: FormRef<Values>;
}

/** Captures the nearest Form during component initialization and follows model replacement. */
export function useFormInstance<Values extends FormValues = FormValues>(): FormInstanceRef<Values> {
  // The context erases the schema. Both getters use the caller's schema for the nearest Form.
  const context = getContext<FormContext | undefined>(formKey);
  return {
    get current() {
      return context?.model as FormInstance<Values> | undefined;
    },
    get ref() {
      return context?.ref as FormRef<Values> | undefined;
    }
  };
}

/** Publishes the form context owned by this component. */
export function provideForm(form: FormContext) {
  setContext(formKey, form);
}

/** Reads form settings with the effective disabled state of the nearest ConfigProvider. */
export function useForm(): FormContext | undefined {
  const parent = getContext<FormContext | undefined>(formKey);
  if (!parent) {
    return;
  }

  const config = useConfig();
  const form: FormContext = Object.create(parent, {
    // Source DisabledContext is followed by the nearest provider; native submitting remains separate.
    disabled: { get: () => config.componentDisabled || parent.submitting }
  });

  return form;
}

/** Sets the field association for the controls in this scope. */
export function provideFormField(field: FormFieldContext | undefined) {
  setContext(fieldKey, field);
}

/** Reads field attributes and keeps a control registration until it unmounts. */
export function useFormField(getInstance?: () => unknown): FormFieldContext | undefined {
  const parent = getContext<FormFieldContext | undefined>(fieldKey);
  const config = useConfig();
  const form = useForm();
  const field: FormFieldContext | undefined = parent ? Object.create(parent, {
    disabled: { get: () => config.componentDisabled || form?.submitting }
  }) : undefined;
  if (field?.registerControl && getInstance) {
    // The order is determined by the tree of the components, and not by the order of the mount controls.
    let mounted = false;
    const remove = field.registerControl(() => mounted ? getInstance() : undefined);
    onMount(() => {
      mounted = true;
      return () => { mounted = false; };
    });
    onDestroy(remove);
  }

  return field;
}
