// Tracks row paths inside the nearest keyed list, including nested lists.
import { getContext, setContext } from 'svelte';
import type { FormRemovalPath } from './form-internal';

interface FormListContext {
  readonly prefixName: readonly (string | number)[];
  readonly prefixCls: string;
  captureRemovalPath(relative: readonly (string | number)[]): FormRemovalPath;
}

const listKey = Symbol('ant-design-form-list');

/** Installs a list scope or resets it at a Form boundary. */
export function provideFormList(list: FormListContext | undefined) {
  setContext(listKey, list);
}

/** Reads the list scope inherited by a field or nested list. */
export function useFormList(): FormListContext | undefined {
  return getContext(listKey);
}
