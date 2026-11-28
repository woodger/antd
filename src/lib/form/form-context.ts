// Shares field behavior and the live model of the nearest Form with descendant controls.
import { getContext, onDestroy, onMount, setContext } from 'svelte';
import type { FormFieldRegistration } from './form-internal';
import type {
  FormFeedbackIcons, FormRequiredMark, FormSemanticSlots, FormTooltipProps, FormValidateTrigger
} from './form.types';
import type { FormValidateStatus } from './form-error-list.types';
import type { FormFieldMeta, FormInstance } from './form.model.svelte';
import type { ColProps } from '../grid/grid.types';
import type { NamePath } from './form-store.engine';
import type { Variant } from '../types';
import { useConfig } from '../config-provider/config-context';
import type { FormRule, FormValues } from './validation.engine';

export interface FormContext {
  readonly model: FormInstance<FormValues>;
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
  getFieldError(name: NamePath): readonly string[];
  getFieldWarning(name: NamePath): readonly string[];
  getFieldMeta(name: NamePath): (Pick<FormFieldMeta, 'touched' | 'validating'>
    & Partial<Pick<FormFieldMeta, 'validated'>>) | undefined;
  isFieldRequired(name: NamePath): boolean;
  hasRequiredRules(rules: readonly FormRule[]): boolean;
  handleFieldBlur(name: NamePath): void;
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
}

/** Captures the nearest Form during component initialization and follows model replacement. */
export function useFormInstance<Values extends FormValues = FormValues>(): FormInstanceRef<Values> {
  const context = getContext<FormContext | undefined>(formKey);
  return {
    get current() {
      // Context erases the value schema. The caller knows the schema supplied to the nearest Form.
      return context?.model as FormInstance<Values> | undefined;
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
