// Coordinates the forms mounted in a provider subtree. Scope snapshots retain the same identity
// until a named registration changes, and each provider receives an event before its ancestors.
import { getContext, setContext } from 'svelte';
import type { FormFieldSnapshot, FormInstance } from './form.model.svelte';
import type { FormProviderForms, FormProviderProps, FormProviderRefs, FormRef } from './form.types';
import type { FormValues } from './validation.engine';

interface FormProviderContext {
  registerForm(
    name: string | undefined, form: FormInstance<FormValues>, ref: FormRef<FormValues>
  ): () => void;
  notifyChange(name: string | undefined, changedFields: FormFieldSnapshot[]): void;
  notifyFinish(name: string | undefined, values: FormValues): void;
}

interface NamedForm {
  form: FormInstance<FormValues>;
  ref: FormRef<FormValues>;
}

const formProviderKey = Symbol('ant-design-form-provider');

/** Reads the nearest scope without creating a registry for standalone forms. */
export function useFormProvider() {
  return getContext<FormProviderContext | undefined>(formProviderKey);
}

/** Provides a registry that also forwards registration and events to enclosing scopes. */
export function provideFormProvider(getProps: () => FormProviderProps) {
  const parent = useFormProvider();
  const registrations = new Map<string, Set<NamedForm>>();
  let snapshot: { forms: FormProviderForms; refs: FormProviderRefs; } = {
    forms: {}, refs: Object.create(null)
  };

  /** Publishes both parts of a named registration and leaves older snapshots intact. */
  function updateNamedForm(name: string, entry?: NamedForm) {
    const refs: Partial<Record<string, FormRef<FormValues>>> = Object.assign(
      Object.create(null), snapshot.refs
    );
    if (entry) {
      refs[name] = entry.ref;
      snapshot = { forms: { ...snapshot.forms, [name]: entry.form }, refs };
      return;
    }

    const forms = { ...snapshot.forms };
    delete forms[name];
    delete refs[name];
    snapshot = { forms, refs };
  }

  /** Keeps the latest registration for a name and restores any still-mounted predecessor. */
  function registerNamedForm(name: string, entry: NamedForm) {
    const existing = registrations.get(name);
    const entries = existing ?? new Set<NamedForm>();
    if (!existing) {
      registrations.set(name, entries);
    }
    entries.add(entry);
    updateNamedForm(name, entry);

    /** Releases just this registration, even if another Form has since claimed the name. */
    return () => {
      const wasCurrent = [...entries].at(-1) === entry;
      entries.delete(entry);
      if (!wasCurrent) {
        return;
      }

      const remaining = [...entries].at(-1);
      if (!remaining) {
        registrations.delete(name);
      }
      updateNamedForm(name, remaining);
    };
  }

  setContext<FormProviderContext>(formProviderKey, {
    /** An unnamed form still sends events, but never occupies an entry in the registry. */
    registerForm(name, form, ref) {
      const remove = name ? registerNamedForm(name, { form, ref }) : undefined;
      const removeAncestor = parent?.registerForm(name, form, ref);

      /** Releases the registration at each level that observed it. */
      return () => {
        remove?.();
        removeAncestor?.();
      };
    },
    /** Shares the same field snapshots with the surrounding scope. */
    notifyChange(name, changedFields) {
      getProps().onFormChange?.(name, { changedFields, ...snapshot });
      parent?.notifyChange(name, changedFields);
    },
    /** Shares the successful submission snapshot with the surrounding scope. */
    notifyFinish(name, values) {
      getProps().onFormFinish?.(name, { values, ...snapshot });
      parent?.notifyFinish(name, values);
    }
  });
}
