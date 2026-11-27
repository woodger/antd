import type { Snippet } from 'svelte';
import type { HTMLFieldsetAttributes } from 'svelte/elements';
import type { CheckboxChangeEvent, CheckboxContent } from './checkbox.types';

export type CheckboxGroupValue = string | number | boolean;

export interface CheckboxGroupOption<Value extends CheckboxGroupValue = string> {
  value: Value;
  label: CheckboxContent;
  disabled?: boolean;
  id?: string;
  title?: string;
  className?: string;
  style?: string;
  required?: boolean;
  onChange?: (event: CheckboxChangeEvent) => void;
}

/** Typed array of values and independent native checkboxes for FormData. */
export interface CheckboxGroupProps<Value extends CheckboxGroupValue = string> extends Omit<
  HTMLFieldsetAttributes,
  'children' | 'class' | 'onchange'
> {
  /** Nonempty options override children. Nullish entries and values are skipped. */
  options?: readonly (Value | CheckboxGroupOption<Value> | null | undefined)[];
  children?: Snippet;
  /** Bindable state. Options normalize it, while children preserve the raw array as in upstream. */
  value?: Value[] | undefined;
  /** Initial local value. Later prop changes do not reinitialize state. */
  defaultValue?: readonly Value[];
  /** Alias of the filtered callback. Its array is independent of bind:value. */
  onValueChange?: (value: Value[]) => void;
  /** Array of available registered values. Invoked before onValueChange. */
  onChange?: (value: Value[]) => void;
  /** Base prefix for the group and generated options. Children resolve their own prefix. */
  prefixCls?: string;
  rootClassName?: string;
  /** Bindable fieldset with the existing native form, reset, and disabled contracts. */
  nativeElement?: HTMLFieldSetElement;
  class?: string;
}
