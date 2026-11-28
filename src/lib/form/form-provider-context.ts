// Coordinates the forms mounted in a provider subtree. Scope snapshots retain the same identity
// until a named registration changes, and each provider receives an event before its ancestors.
import { getContext, setContext } from 'svelte';
import type { FormFieldSnapshot, FormInstance } from './form.model.svelte';
import type { FormProviderForms, FormProviderProps } from './form.types';
import type { FormValues } from './validation.engine';

interface FormProviderContext {
  registerForm(name: string | undefined, form: FormInstance<FormValues>): () => void;
  notifyChange(name: string | undefined, changedFields: FormFieldSnapshot[]): void;
  notifyFinish(name: string | undefined, values: FormValues): void;
}

const formProviderKey = Symbol('ant-design-form-provider');

/** Reads the nearest scope without creating a registry for standalone forms. */
export function useFormProvider() {
  return getContext<FormProviderContext | undefined>(formProviderKey);
}

/** Provides a registry that also forwards registration and events to enclosing scopes. */
export function provideFormProvider(getProps: () => FormProviderProps) {
  const parent = useFormProvider();
  const registrations = new Map<string, Set<{ form: FormInstance<FormValues>; }>>();
  let forms: FormProviderForms = {};

  /** Keeps the latest registration for a name and restores any still-mounted predecessor. */
  function registerNamedForm(name: string, form: FormInstance<FormValues>) {
    const entry = { form };
    const existing = registrations.get(name);
    const entries = existing ?? new Set<typeof entry>();
    if (!existing) {
      registrations.set(name, entries);
    }
    entries.add(entry);
    forms = { ...forms, [name]: form };

    /** Releases just this registration, even if another Form has since claimed the name. */
    return () => {
      const wasCurrent = [...entries].at(-1) === entry;
      entries.delete(entry);
      if (!wasCurrent) {
        return;
      }

      const remaining = [...entries].at(-1);
      if (remaining) {
        forms = { ...forms, [name]: remaining.form };
      }
      else {
        registrations.delete(name);
        const next = { ...forms };
        delete next[name];
        forms = next;
      }
    };
  }

  setContext<FormProviderContext>(formProviderKey, {
    /** An unnamed form still sends events, but never occupies an entry in the registry. */
    registerForm(name, form) {
      const remove = name ? registerNamedForm(name, form) : undefined;
      const removeAncestor = parent?.registerForm(name, form);

      /** Releases the registration at each level that observed it. */
      return () => {
        remove?.();
        removeAncestor?.();
      };
    },
    /** Shares the same field snapshots with the surrounding scope. */
    notifyChange(name, changedFields) {
      getProps().onFormChange?.(name, { changedFields, forms });
      parent?.notifyChange(name, changedFields);
    },
    /** Shares the successful submission snapshot with the surrounding scope. */
    notifyFinish(name, values) {
      getProps().onFormFinish?.(name, { values, forms });
      parent?.notifyFinish(name, values);
    }
  });
}
