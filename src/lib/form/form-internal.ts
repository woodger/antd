// The private link from an attached Form to the model. The same hooks are reused through proxies.
import type { NamePath } from './form-store.engine';
import type { FormRule, FormValues } from './validation.engine';
import type { FormFieldMeta, FormInstance } from './form.model.svelte';
import type { FormProps } from './form.types';
import type { ValidateMessages } from './validation-messages.types';

export interface FormFieldRegistration {
  readonly name: NamePath;
  // Symbol preserves when identity registration is stored inside Svelte proxy.
  readonly mountKey?: symbol;
  readonly rules?: readonly FormRule[];
  readonly validateFirst?: boolean | 'parallel';
  readonly validateDebounce?: number;
  readonly isList?: boolean;
  readonly isListField?: boolean;
  readonly initialValue?: unknown;
  readonly messageVariables?: Readonly<Record<string, string>>;
  /** Snapshot metadata for UI collector; undefined removes the former binding. */
  readonly onMetaChange?: (meta: FormFieldMeta | undefined) => void;
  /** Recreates the contents of the selected Field without replacing the neighboring controls. */
  readonly onReset?: () => void;
  readonly getInstance?: () => unknown;
  readonly getElement?: () => Element | undefined;
}

export type FormCallbackProvider<Values extends FormValues> = () => (
  Pick<FormProps<Values>, 'onValuesChange' | 'onFieldsChange'> & {
    onProviderFinish?: (values: Values) => void;
  }
) | undefined;

export interface FormHooks<Values extends FormValues> {
  readonly resetKey: object;
  registerValidateMessages(getMessages: () => ValidateMessages | undefined): () => void;
  registerCallbacks(getCallbacks: FormCallbackProvider<Values>): () => void;
  getFieldMeta(name: NamePath): FormFieldMeta | undefined;
  handleFieldBlur(name: NamePath): void;
  registerField(field: FormFieldRegistration): () => void;
  markFieldMounted(mountKey: symbol): void;
  initializeField(name: NamePath, initialValue?: unknown): void;
  initializeList(name: NamePath, initialValue?: readonly unknown[]): void;
  changeList(name: NamePath, values: readonly unknown[]): void;
}

// Unlisted Symbol retains communication through Svelte proxy, without extending public FormInstance.
const formHooksKey = Symbol('ant-design-form-hooks');

/** Adds the hooks without making them observable through enumeration or proxy state. */
export function setFormHooks<Values extends FormValues>(
  form: FormInstance<Values>,
  hooks: FormHooks<Values>
) {
  Object.defineProperty(form, formHooksKey, { value: hooks });
}

/** Returns undefined for a structural FormInstance supplied outside createForm. */
export function getFormHooks<Values extends FormValues>(
  form: FormInstance<Values>
): FormHooks<Values> | undefined {
  return (form as { [formHooksKey]?: FormHooks<Values> })[formHooksKey];
}
