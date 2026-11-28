// Projects reactive form values for component consumers. Structural equality keeps a selection
// stable across unrelated updates, and no model or field context is shared between instances.
import { useFormInstance } from './form-context';
import { getFormHooks } from './form-internal';
import type { FormInstance } from './form.model.svelte';
import {
  copyFormValue, getFormValue, sameFormValue,
  type FormValueProjection, type NamePath, type NamePathValue
} from './form-store.engine';
import type { FormValues } from './validation.engine';

/** Uses the nearest Form when form is omitted. Both options may be reactive getters. */
export interface FormWatchOptions<Values extends FormValues = FormValues> {
  readonly form?: FormInstance<Values>;
  /** Includes unregistered values. Defaults to false. */
  readonly preserve?: boolean;
}

/** Lets a reactive getter supply a path while keeping the observer mounted. */
export interface FormWatchPath<Path extends NamePath = NamePath> {
  readonly path: Path;
}

/** The selection is read at use time. Destructuring captures its current value. */
export interface FormWatchValue<Value> {
  readonly value: Value;
}

/** A pure selector that also supports an empty or partial form. */
export type FormWatchSelector<Values extends FormValues, Value> =
  (values: Readonly<FormValueProjection<Values>>) => Value;

/** Observes the result of a selector. Call during component initialization. */
export function useFormWatch<
  Values extends FormValues = FormValues,
  Value = unknown
>(
  selector: FormWatchSelector<Values, Value>,
  formOrOptions?: FormInstance<Values> | FormWatchOptions<Values>
): FormWatchValue<Value>;
/** Observes the whole projection when no path is supplied. */
export function useFormWatch<Values extends FormValues = FormValues>(
  path?: null,
  formOrOptions?: FormInstance<Values> | FormWatchOptions<Values>
): FormWatchValue<FormValueProjection<Values> | undefined>;
/** Observes a named path. Call during component initialization. */
export function useFormWatch<
  Values extends FormValues = FormValues,
  const Path extends NamePath = NamePath
>(
  path: Path | FormWatchPath<Path>,
  formOrOptions?: FormInstance<Values> | FormWatchOptions<Values>
): FormWatchValue<NamePathValue<FormValueProjection<Values>, Path> | undefined>;
export function useFormWatch<Values extends FormValues>(
  source?: NamePath | FormWatchPath | FormWatchSelector<Values, unknown> | null,
  formOrOptions?: FormInstance<Values> | FormWatchOptions<Values>
): FormWatchValue<unknown> {
  const owner = useFormInstance<Values>();
  const options = formOrOptions && 'getFieldsValue' in formOrOptions
    ? { form: formOrOptions }
    : formOrOptions;

  // The server and the initial hydration pass use the same empty selection as the source hook.
  let mounted = $state(false);
  $effect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        mounted = true;
      }
    });

    return () => {
      active = false;
      mounted = false;
    };
  });

  let previous: unknown;
  const value = $derived.by(() => {
    const form = mounted ? options?.form ?? owner.current : undefined;
    const next = readSelection(form);
    if (!sameFormValue(previous, next)) {
      previous = copyFormValue(next);
    }

    return previous;
  });

  return { get value() { return value; } };

  /** Calls the selector or reads the path from the selected store projection. */
  function readSelection(form: FormInstance<Values> | undefined): unknown {
    if (!form && typeof source !== 'function') {
      return undefined;
    }

    let values: unknown = {};
    if (form) {
      values = options?.preserve
        ? form.getFieldsValue(true)
        : getFormHooks(form)?.getWatchValues() ?? form.getFieldsValue();
    }

    if (typeof source === 'function') {
      // The projection permits absent properties, including an empty or complete store.
      return source(values as Readonly<FormValueProjection<Values>>);
    }
    if (source == null) {
      return values;
    }

    const path = typeof source === 'object' && 'path' in source ? source.path : source;
    return getFormValue(values, path);
  }
}
