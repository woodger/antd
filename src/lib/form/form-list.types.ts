import type { Snippet } from 'svelte';
import type { NamePath } from './form-store.engine';
import type { ValidationRule } from './validation.engine';

/** The index sets the current path, the key preserves an instance of the string when reshuffled. */
export interface FormListFieldData {
  name: number;
  key: number;
}

export interface FormListOperation {
  /** Without insertIndex adds at the end; the missing defaultValue remains undefined. */
  add(defaultValue?: unknown, insertIndex?: number): void;
  remove(index: number | readonly number[]): void;
  /** Moves the line with the key; the wrong indices do not change the list. */
  move(from: number, to: number): void;
}

export interface FormListMeta {
  errors: readonly string[];
  warnings: readonly string[];
}

/** The list rule uses the previous Svelte validator(value, values), only custom validation. */
export interface FormListRule {
  validator: NonNullable<ValidationRule['validator']>;
  message?: string;
  /** Warning is displayed in meta.warnings and does not block submit. */
  warningOnly?: boolean;
}

/** Manages the array in the nearest Form; the nested name is counted from the parent record FormList. */
export interface FormListProps {
  /** Prefix FormErrorList inside the list; empty/undefined inherits ConfigProvider. */
  prefixCls?: string;
  name: NamePath;
  /** Form initialValues has priority; the value is copied and involved in reset. */
  initialValue?: readonly unknown[];
  rules?: readonly FormListRule[];
  /** Like each on field.key. Bindings models take a full path from the root Form. */
  children: Snippet<[FormListFieldData[], FormListOperation, FormListMeta]>;
}
