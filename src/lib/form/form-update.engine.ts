// Resolves the update rules for FormItem. Store snapshots and notifications belong to the model.
import { containsFormPath, getFormValue, sameFormPath, type NamePath } from './form-store.engine';
import type { FormItemShouldUpdate } from './form.types';
import type { FormValues } from './validation.engine';

export type FormStoreUpdate =
  | { type: 'valueUpdate'; source: 'internal' | 'external'; names?: readonly NamePath[] }
  | { type: 'setField'; name: NamePath; hasValue: boolean }
  | { type: 'reset'; names?: readonly NamePath[] }
  | { type: 'remove' | 'dependenciesUpdate' | 'validateFinish'; names: readonly NamePath[] };

export type FormStoreListener = (
  previous: Readonly<FormValues>,
  current: Readonly<FormValues>,
  update: FormStoreUpdate
) => void;

interface FormItemSubscription {
  path?: readonly (string | number)[];
  dependencies?: readonly NamePath[];
  shouldUpdate?: FormItemShouldUpdate;
}

/** A reset recreates content only when it includes the item's exact name or the entire form. */
export function resetsFormItem(
  update: FormStoreUpdate,
  path: readonly (string | number)[]
): boolean {
  return update.type === 'reset'
    && (update.names === undefined || update.names.some(name => sameFormPath(name, path)));
}

/** Applies the field's selector without calling the predicate for exact writes or dependency notices. */
export function acceptsFormItemUpdate(
  previous: Readonly<FormValues>,
  current: Readonly<FormValues>,
  update: FormStoreUpdate,
  { path, dependencies, shouldUpdate }: FormItemSubscription
): boolean {
  if (shouldUpdate === true) {
    return true;
  }

  const name = path ?? [];
  const compare = typeof shouldUpdate === 'function' ? shouldUpdate : undefined;

  switch (update.type) {
    case 'reset':
      return resetsFormItem(update, name);
    case 'remove':
      return compare?.(previous, current, {}) ?? false;
    case 'setField':
      if (sameFormPath(update.name, name) || update.hasValue && containsFormPath(update.name, name)) {
        return true;
      }
      return !name.length && (compare?.(previous, current, {}) ?? false);
    case 'dependenciesUpdate':
      return dependencies?.some(path => update.names.some(name => sameFormPath(path, name))) ?? false;
    default:
      if (update.names?.some(path => sameFormPath(path, name))) {
        return true;
      }
      if (compare) {
        const info = update.type === 'valueUpdate' ? { source: update.source } : {};
        return compare(previous, current, info);
      }
      if (dependencies?.length && !name.length) {
        return false;
      }
      return getFormValue(previous, name) !== getFormValue(current, name);
  }
}
