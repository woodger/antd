import type { NamePath } from './form-store.engine';
import type { FormRule } from './validation.engine';
import type { FormFieldMeta } from './form.model.svelte';
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

export interface FormHooks {
  readonly resetKey: object;
  registerValidateMessages(getMessages: () => ValidateMessages | undefined): () => void;
  getFieldMeta(name: NamePath): FormFieldMeta | undefined;
  registerField(field: FormFieldRegistration): () => void;
  markFieldMounted(mountKey: symbol): void;
  initializeField(name: NamePath, initialValue?: unknown): void;
  initializeList(name: NamePath, initialValue?: readonly unknown[]): void;
  changeList(name: NamePath, values: readonly unknown[]): void;
}

// Unlisted Symbol retains communication through Svelte proxy, without extending public FormInstance.
const formHooksKey = Symbol('ant-design-form-hooks');

export function setFormHooks(form: object, hooks: FormHooks) {
  Object.defineProperty(form, formHooksKey, { value: hooks });
}

export function getFormHooks(form: object): FormHooks | undefined {
  return (form as { [formHooksKey]?: FormHooks })[formHooksKey];
}
