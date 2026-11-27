// Owns values, field registration, metadata submitted and one Form. The revision of values and
// verification numbers separately protect against outdated responses.
import { tick, untrack } from 'svelte';
import { FormValidationError } from './FormValidationError';
import { setFormHooks, type FormFieldRegistration } from './form-internal';
import { focusFormField, getFormFieldElement, scrollFormField } from './form-field.dom';
import type { FormScrollOptions } from './form.types';
import type { ValidateMessages } from './validation-messages.types';
import { mergeValidationMessages } from './validation-message.engine';
import {
  containsFormPath,
  copyFormValue,
  formNamePath,
  getFormValue,
  mergeFormValues,
  sameFormPath,
  sameFormValue,
  setFormValue,
  type FormValueProjection,
  type NamePath,
  type NamePathValue,
  type PartialFormValues
} from './form-store.engine';
import {
  validateFieldValue,
  resolveValidationRules,
  type FieldError,
  type FieldErrors,
  type FormRules,
  type FormValues,
  type ValidationRule
} from './validation.engine';

export type SubmissionResult<Values extends FormValues> =
  | { status: 'success'; }
  | { status: 'invalid'; error: FormValidationError<Values>; }
  | { status: 'failed'; error: unknown; }
  | { status: 'busy'; };

/** All flags by default false; the returned snapshot preserves the same full volume values. */
export interface FormValidateOptions {
  /** Does not change errors/warnings/touched/validating and does not mark the field tested for dirty. */
  validateOnly?: boolean;
  /** Verifies also registered fields whose path begins with the chosen name. */
  recursive?: boolean;
  /** Checks for changed or touched fields, fields already validated normally, and fields with supplied defaults. */
  dirty?: boolean;
}

/** The binding state; the name retains the path segment types. */
export interface FormFieldMeta {
  touched: boolean;
  validating: boolean;
  errors: readonly string[];
  warnings: readonly string[];
  name: readonly (string | number)[];
  /**
   * Ordinary validation has been completed or the value has been changed through setFieldsValue;
   * setFields.validating sets the flag manually, validateOnly does not affect.
   */
  validated: boolean;
}

/** Passes null for an explicitly selected path with no known binding. */
export type FormFilterFunc = (meta: FormFieldMeta | null) => boolean;

/** Filter fields for getFieldsValue; roots FormList are filled separately from the filter. */
export interface FormGetFieldsValueConfig {
  filter?: FormFilterFunc;
}

/** Missing properties are saved; metadata updates only known bindings. */
export interface FormFieldData {
  name: NamePath;
  value?: unknown;
  touched?: boolean;
  validating?: boolean;
  errors?: readonly string[];
  warnings?: readonly string[];
  /** Accepted as in upstream, but computed validated does not replace. */
  validated?: boolean;
}

/** Reactive values, validation and submit one form; the instance is not shared globally. */
export interface FormInstance<Values extends FormValues> {
  readonly values: Readonly<Values>;
  /** The previous projection of top-level errors; for nested fields, use getFieldsError. */
  readonly errors: Readonly<FieldErrors<Values>>;
  readonly isSubmitting: boolean;
  readonly submissionError: unknown;
  getFieldValue<const Path extends NamePath>(name: Path): NamePathValue<Values, Path>;
  /** Returns the values of registered fields, including only the selected parts of nested records. */
  getFieldsValue(): FormValueProjection<Values>;
  /** Reads all values. Passing true returns the store itself, while the root path returns a copy. */
  getFieldsValue(all: true | readonly [readonly []], filter?: undefined): Values;
  /** Selects the requested paths and their registered descendants, subject to the optional filter. */
  getFieldsValue(
    names: readonly NamePath[] | true,
    filter?: FormFilterFunc
  ): FormValueProjection<Values>;
  getFieldsValue(config: FormGetFieldsValueConfig): FormValueProjection<Values>;
  /** Brings back the errors of the fields of the model or the clearly listed paths. */
  getFieldsError(names?: readonly NamePath[]): FieldError[];
  getFieldError(name: NamePath): readonly string[];
  /** Warnings warningOnly are not included in errors and do not block. */
  getFieldWarning(name: NamePath): readonly string[];
  /**
   * Published ref, native element or a stable handle mounted control. The Instance type is
   * specified by the defiant side; before mount and after removal - undefined.
   */
  getFieldInstance<Instance = unknown>(name: NamePath): Instance | undefined;
  /** Delegates focus ref component; without ref uses associated native id. */
  focusField(name: NamePath): void;
  /** Scrolls to the ref root or the control with a native id. Unknown paths have no effect. */
  scrollToField(name: NamePath, options?: FormScrollOptions): void;
  /** Takes into account the field itself and the well-known models of the descendants; an empty path checks the whole model. */
  isFieldTouched(name: NamePath): boolean;
  /** No names: any touch-field; true requires all bindings, except the roots of FormList. */
  isFieldsTouched(allTouched?: boolean): boolean;
  /** With allTouched, each requested path must be touched itself or have a touched descendant. */
  isFieldsTouched(names?: readonly NamePath[], allTouched?: boolean): boolean;
  isFieldValidating(name: NamePath): boolean;
  /** Is there visible validation; the names coincide exactly, without automatically turning on the offspring. */
  isFieldsValidating(names?: readonly NamePath[]): boolean;
  isFieldRequired(name: NamePath): boolean;
  setFieldValue<const Path extends NamePath>(name: Path, value: NamePathValue<Values, Path>): void;
  /** Combines plain objects, replaces arrays and clears the errors of changed fields. */
  setFieldsValue(next: PartialFormValues<Values>): void;
  /** Applies records in order, does not start validation; value works and without binding. */
  setFields(fields: readonly FormFieldData[]): void;
  touchField(name: NamePath): void;
  /**
   * Unnamed resets the whole model; [] doesn't change anything, metadata is chosen in exact ways.
   * The contents of the selected UI bindings are recreated; the neighbors save DOM and metadata.
   */
  resetFields(names?: readonly NamePath[]): void;
  validateFields(options?: FormValidateOptions): Promise<Values>;
  validateFields(names?: readonly NamePath[], options?: FormValidateOptions): Promise<Values>;
  submit(onFinish: (values: Values) => void | Promise<void>): Promise<SubmissionResult<Values>>;
}

interface StoredField {
  path: (string | number)[];
  persistent?: boolean;
  registration?: FormFieldRegistration;
  registrationOrder?: number;
  initialValueOrder?: number;
  metaCache?: FormFieldMeta;
  errors?: string[];
  warnings?: string[];
  touched: boolean;
  dirty: boolean;
  validating: boolean;
  validated: boolean;
  run: number;
}

interface FieldSelection {
  path: (string | number)[];
  field?: StoredField;
}

type FieldBinding = FieldSelection & { field: StoredField; };

/** Preserves numeric path segments, including infinities and the strict equality rule for NaN. */
function fieldSelectionKey(path: FieldSelection['path']): string | symbol {
  if (path.some(part => typeof part === 'number' && Number.isNaN(part))) {
    return Symbol();
  }

  return JSON.stringify(path.map(part => typeof part === 'number' ? [String(part)] : part));
}

/** Selects the exact binding before descendants, or the unregistered path itself. */
function selectFieldPath(name: NamePath, bindings: ReadonlyMap<string | symbol, FieldBinding>) {
  const path = formNamePath(name);
  if (!path.length) {
    return [{ path }];
  }

  const selected: FieldSelection[] = [];
  const exact = bindings.get(fieldSelectionKey(path));
  if (exact) {
    selected.push(exact);
  }
  for (const binding of bindings.values()) {
    if (binding.path.length > path.length && containsFormPath(path, binding.path)) {
      selected.push(binding);
    }
  }

  return selected.length ? selected : [{ path }];
}

/** The last registration wins for each path at the first registration's position. */
function selectNamedFields(names: readonly NamePath[], bindings: readonly FieldBinding[]) {
  const byPath = new Map<string | symbol, FieldBinding>();
  for (const binding of bindings) {
    const key = fieldSelectionKey(binding.path);
    byPath.set(key, binding);
  }

  return names.flatMap(name => selectFieldPath(name, byPath));
}

/**
 * Creates an isolated reactive form model. Plain objects and arrays are copied. Stale asynchronous
 * validation cannot replace errors for newer values.
 */
export function createForm<Values extends FormValues>({
  initialValues,
  rules = {}
}: {
  initialValues: Values;
  rules?: FormRules<Values>;
}): FormInstance<Values> {
  const defaults = copyFormValue(initialValues);
  let valuesRevision = $state(0);
  let validationSequence = 0;
  let latestValidationRun = 0;
  let registrationOrder = 0;
  let initialValueOrder = 0;
  let values = $state<Values>(copyFormValue(defaults));
  let resetKey = $state.raw<object>({});
  // At teardown Svelte reads the previous $state; the registry stores up-to-date registrations.
  const fieldRegistry = new Set<StoredField>();
  const validationDelays = new Map<StoredField, () => void>();
  const messageProviders = new Set<() => ValidateMessages | undefined>();
  let fields = $state.raw<StoredField[]>([]);
  let isSubmitting = $state(false);
  let submissionError = $state.raw<unknown>();

  // The name from the registration may change when rearranging the lines FormList.
  function fieldPath(field: StoredField): (string | number)[] {
    return formNamePath(field.registration?.name ?? field.path);
  }

  // Compares the full path, keeping the difference of the string key and the index.
  function findField(name: NamePath): StoredField | undefined {
    return fields.find((field) => sameFormPath(fieldPath(field), name));
  }

  // Copies the arrays so that the listener does not change the metadata in the repository.
  function fieldMeta(field: StoredField): FormFieldMeta {
    return {
      name: [...fieldPath(field)], touched: field.touched, validating: field.validating,
      validated: field.validated, errors: [...(field.errors ?? [])],
      warnings: [...(field.warnings ?? [])]
    };
  }

  // Publishes only a new state or signal to remove registration.
  function notifyFieldMeta(field: StoredField, destroy = false) {
    // UI callbacks do not become dependencies of the effect that caused the model setter.
    untrack(() => {
      const callback = field.registration?.onMetaChange;
      if (destroy) {
        field.metaCache = undefined;
        callback?.(undefined);
        return;
      }
      if (!callback) {
        return;
      }

      const meta = fieldMeta(field);
      if (!sameFormValue(meta, field.metaCache)) {
        field.metaCache = meta;
        callback(meta);
      }
    });
  }

  // If the names match, you choose the last registration control, no listing.
  function controlRegistration(name: NamePath): FormFieldRegistration | undefined {
    let found: StoredField | undefined;
    for (const field of fieldRegistry) {
      if (field.registration && !field.registration.isList
        && sameFormPath(fieldPath(field), name)
        && (field.registrationOrder ?? 0) > (found?.registrationOrder ?? 0)) {
        found = field;
      }
    }

    return found?.registration;
  }

  // Gives the models space for value and errors before registration DOM-field.
  function ensureField(name: NamePath): StoredField {
    const existing = findField(name);
    if (existing) {
      return existing;
    }

    return addField(name);
  }

  // Adds the field to the living register and publishes a new reactive list.
  function addField(name: NamePath): StoredField {
    const field = $state<StoredField>({
      path: formNamePath(name), touched: false, dirty: false, validating: false,
      validated: false, run: 0
    });
    fieldRegistry.add(field);
    fields = [...fieldRegistry];

    return field;
  }

  for (const name of new Set([...Object.keys(defaults), ...Object.keys(rules)])) {
    ensureField(name).persistent = true;
  }

  function fieldRules(field: StoredField, path = fieldPath(field)) {
    return field.registration?.rules
      ?? (path.length === 1 && Object.hasOwn(rules, path[0])
        ? rules[path[0] as keyof typeof rules] : undefined)
      ?? [];
  }

  function rootErrors(entries: readonly FieldError[]): FieldErrors<Values> {
    return Object.fromEntries(entries.filter((field) => field.name.length === 1)
      .map((field) => [field.name[0], [...field.errors]])) as FieldErrors<Values>;
  }

  function getFieldsError(names?: readonly NamePath[]): FieldError[] {
    return names
      ? names.map((name) => ({
        name: formNamePath(name),
        errors: [...(findField(name)?.errors ?? [])],
        warnings: [...(findField(name)?.warnings ?? [])]
      }))
      : fields.map((field) => ({
        name: fieldPath(field),
        errors: [...(field.errors ?? [])],
        warnings: [...(field.warnings ?? [])]
      }));
  }

  function isFieldTouched(name: NamePath): boolean {
    return fields.some((field) => containsFormPath(name, fieldPath(field)) && field.touched);
  }

  function isFieldsTouched(
    namesOrAll?: readonly NamePath[] | boolean,
    allTouched = false
  ): boolean {
    const names = Array.isArray(namesOrAll) ? namesOrAll as readonly NamePath[] : undefined;
    const all = typeof namesOrAll === 'boolean' ? namesOrAll : allTouched;

    if (names) {
      return all ? names.every(isFieldTouched) : names.some(isFieldTouched);
    }

    // Roots initialValues without binding — store containers, not additional controls.
    const bindings = fields.filter((field) =>
      field.registration || fieldRules(field).length || field.touched
    );

    return all
      ? bindings.every((field) => field.touched || field.registration?.isList)
      : bindings.some((field) => field.touched);
  }

  function isFieldsValidating(names?: readonly NamePath[]): boolean {
    return fields.some((field) => field.validating
      && (!names || names.some((name) => sameFormPath(name, fieldPath(field)))));
  }

  // Read the current names once, including names updated when a FormList row moves.
  function fieldBindings(): FieldBinding[] {
    const bindings: FieldBinding[] = [];
    for (const field of fields) {
      const path = fieldPath(field);
      if (path.length && (field.registration || fieldRules(field, path).length)) {
        bindings.push({ path, field });
      }
    }

    return bindings.sort(
      (first, second) => (first.field.registrationOrder ?? 0) - (second.field.registrationOrder ?? 0)
    );
  }

  // Filter callbacks can change the store. Read each value only after its filter runs.
  function projectFieldValues(selected: readonly FieldSelection[], filter?: FormFilterFunc) {
    const lists: NamePath[] = [];
    let result: unknown = {};

    for (const { path, field } of selected) {
      if (field?.registration?.isList) {
        lists.push(path);
        continue;
      }

      const meta: FormFieldMeta | null = field ? {
        touched: field.touched,
        validating: field.validating,
        errors: [...(field.errors ?? [])],
        warnings: [...(field.warnings ?? [])],
        name: [...path],
        validated: field.validated
      } : null;
      if (!filter || filter(meta)) {
        const currentValue = getFormValue(values, path);
        result = setFormValue(result, path, currentValue);
      }
    }

    for (const path of lists) {
      if (!getFormValue(result, path)) {
        result = setFormValue(result, path, []);
      }
    }

    // The dynamic paths above copy only the selected parts of the store.
    return result as FormValueProjection<Values>;
  }

  function getFieldsValue(all: true | readonly [readonly []], filter?: undefined): Values;
  function getFieldsValue(
    namesOrConfig?: readonly NamePath[] | true | FormGetFieldsValueConfig,
    filter?: FormFilterFunc
  ): FormValueProjection<Values>;
  function getFieldsValue(
    namesOrConfig?: readonly NamePath[] | true | FormGetFieldsValueConfig,
    filter?: FormFilterFunc
  ): Values | FormValueProjection<Values> {
    void valuesRevision;
    if (namesOrConfig === true && !filter) {
      return values;
    }

    const names = Array.isArray(namesOrConfig) ? namesOrConfig as readonly NamePath[] : undefined;
    if (names?.length === 0) {
      return {};
    }

    const select = names || namesOrConfig === true
      ? filter : (namesOrConfig as FormGetFieldsValueConfig | undefined)?.filter;
    const bindings = fieldBindings();
    const selected = names ? selectNamedFields(names, bindings) : bindings;

    return projectFieldValues(selected, select);
  }

  // Confirms that for the field there was and the expectation of debounce was canceled.
  function cancelValidationDelay(field: StoredField): boolean {
    const cancel = validationDelays.get(field);
    if (!cancel) {
      return false;
    }

    cancel();

    return true;
  }

  // Finishes waiting both after the timer and after an obvious cancellation.
  function delayValidation(field: StoredField, delay: number): Promise<boolean> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        validationDelays.delete(field);
        resolve(true);
      }, delay);
      validationDelays.set(field, () => {
        clearTimeout(timer);
        validationDelays.delete(field);
        resolve(false);
      });
    });
  }

  // Runs selected checks at the same time and rejects an outdated shot.
  async function validate(
    selected: readonly StoredField[],
    validateOnly = false,
    triggered = false
  ): Promise<Values> {
    if (!validateOnly) {
      for (const field of selected) {
        if (cancelValidationDelay(field)) {
          field.validating = false;
          notifyFieldMeta(field);
        }
      }
    }

    const snapshot = copyFormValue(values);
    const snapshotRevision = valuesRevision;
    const validationRun = ++validationSequence;
    // Promises share freshness tracking. validateOnly leaves the visible validation's field.run unchanged.
    latestValidationRun = validationRun;
    const entries = selected.map((field) => ({
      field,
      path: fieldPath(field),
      run: field.run,
      hasRules: fieldRules(field).length > 0,
      delay: triggered ? field.registration?.validateDebounce : undefined
    }));

    if (!validateOnly) {
      for (const { field, hasRules } of entries) {
        if (!hasRules) {
          // The previous error-projection preserves empty keys; manual metadata are not cleared.
          field.errors ??= [];
          field.warnings ??= [];
          continue;
        }

        field.run = validationRun;
        field.validating = true;
        field.warnings = [];
        field.dirty = true;
        field.validated = false;
        notifyFieldMeta(field);
      }
    }

    const results = await Promise.all(entries.map(validateEntry));

    const nextErrors = results.filter((field) => field.errors.length);

    const outOfDate = latestValidationRun !== validationRun || valuesRevision !== snapshotRevision
      || results.some((result) => result.cancelled)
      || entries.some(({ field, path, run, hasRules }) =>
        field.run !== (validateOnly || !hasRules ? run : validationRun) || !fields.includes(field)
          || !sameFormPath(path, fieldPath(field))
      );

    if (outOfDate || nextErrors.length) {
      throw new FormValidationError(snapshot, rootErrors(nextErrors), outOfDate, nextErrors);
    }

    return snapshot;

    // Rules and messages are read when you start a specific field. After await, only the owner of
    // the current inspection can publish its result.
    async function validateEntry({ field, path, hasRules, delay }: (typeof entries)[number]) {
      if (!hasRules) {
        return { name: path, errors: [], warnings: [] };
      }

      let rules: readonly ValidationRule<Values>[];
      try {
        rules = resolveValidationRules(fieldRules(field), form);
      }
      catch (error) {
        if (!validateOnly && field.run === validationRun) {
          field.validating = false;
          notifyFieldMeta(field);
        }
        throw error;
      }

      const messageContext = {
        name: path.map(String).join('.'),
        variables: { label: path.map(String).join('.'), ...field.registration?.messageVariables },
        messages: mergeValidationMessages([...messageProviders].at(-1)?.())
      };
      const validateFirst = field.registration?.validateFirst;
      if (delay) {
        const elapsed = await delayValidation(field, delay);
        if (!elapsed || field.run !== validationRun || valuesRevision !== snapshotRevision
          || !fields.includes(field) || !sameFormPath(path, fieldPath(field))) {
          if (field.run === validationRun) {
            field.validating = false;
            notifyFieldMeta(field);
          }

          return { name: path, errors: [], warnings: [], cancelled: true };
        }
      }

      const value = getFormValue(snapshot, path);
      const messages = await validateFieldValue(value, snapshot, rules, validateFirst, messageContext);

      if (!validateOnly && field.run === validationRun) {
        field.validating = false;

        if (valuesRevision === snapshotRevision && sameFormPath(path, fieldPath(field))) {
          field.errors = messages.errors;
          field.warnings = messages.warnings;
          field.validated = true;
        }
        notifyFieldMeta(field);
      }

      return { name: path, ...messages };
    }
  }

  // Selects registered fields, descendants of the prefix or obvious paths.
  function validateFields(
    namesOrOptions?: readonly NamePath[] | FormValidateOptions,
    options?: FormValidateOptions
  ): Promise<Values> {
    const names = Array.isArray(namesOrOptions) ? namesOrOptions as readonly NamePath[] : undefined;
    const settings = (names ? options : namesOrOptions ?? options) as FormValidateOptions | undefined;
    let selected = [...fields];

    if (names) {
      if (settings?.recursive) {
        selected = fields.filter((field) =>
          names.some((name) => containsFormPath(name, fieldPath(field)))
        );
      }
      else if (settings?.validateOnly) {
        selected = fields.filter((field) =>
          names.some((name) => sameFormPath(name, fieldPath(field)))
        );
      }
      else {
        selected = names.map(ensureField);
      }
    }

    if (settings?.dirty) {
      selected = selected.filter((field) => field.dirty || field.touched
        || field.registration?.initialValue !== undefined
        || getFormValue(defaults, fieldPath(field)) !== undefined);
    }

    return validate(selected, settings?.validateOnly);
  }

  // After changing the list, you check the touched fields if you do not submit.
  function revalidateTouched() {
    if (isSubmitting) {
      return;
    }

    const selected = fields.filter((field) => field.touched);

    if (selected.length) {
      void validate(selected, false, true).catch((error: unknown) => {
        if (!(error instanceof FormValidationError)) {
          throw error;
        }
      });
    }
  }

  // Updates the current proxy keys by saving the model’s reader links.
  function updateValues(next: Values) {
    // Svelte lists inherited names only in the presence of own property in the original target.
    if (Object.keys(next).some((name) => !Object.hasOwn(values, name)
      && Object.hasOwn(Object.prototype, name))) {
      values = copyFormValue(next);

      return;
    }

    for (const name of Object.keys(values)) {
      if (!Object.hasOwn(next, name)) delete (values as FormValues)[name];
    }

    for (const name of Object.keys(next)) {
      (values as FormValues)[name] = next[name];
    }
  }

  // Purifies the result of the field and deprives the previous verification of the right to publish.
  function clearField(field: StoredField) {
    cancelValidationDelay(field);
    field.errors = [];
    field.warnings = [];
    field.validating = false;
    field.run = ++validationSequence;
    notifyFieldMeta(field);
  }

  const form: FormInstance<Values> = {
    get values() {
      void valuesRevision;

      return values;
    },
    get errors() {
      return rootErrors(fields.filter((field) => field.errors !== undefined)
        .map((field) => ({ name: fieldPath(field), errors: field.errors ?? [], warnings: [] })));
    },
    get isSubmitting() {
      return isSubmitting;
    },
    get submissionError() {
      return submissionError;
    },
    getFieldValue(name) {
      void valuesRevision;

      return getFormValue(values, name) as NamePathValue<Values, typeof name>;
    },
    getFieldsValue,
    getFieldsError,
    // An unknown path returns an empty list, like a field without errors.
    getFieldError(name) {
      const field = findField(name);
      return field?.errors ?? [];
    },
    // Warnings are read separately from the errors that block submitted.
    getFieldWarning(name) {
      const field = findField(name);
      return field?.warnings ?? [];
    },
    getFieldInstance<Instance = unknown>(name: NamePath) {
      const registration = controlRegistration(name);
      return registration?.getInstance?.() as Instance | undefined;
    },
    focusField(name) {
      const field = controlRegistration(name);
      focusFormField(field?.getInstance?.(), () => field?.getElement?.());
    },
    scrollToField(name, options) {
      const field = controlRegistration(name);
      const instance = field?.getInstance?.();
      const node = getFormFieldElement(instance) ?? field?.getElement?.();
      if (!node) {
        return;
      }

      scrollFormField(node, options);
      if (options?.focus) form.focusField(name);
    },
    isFieldTouched,
    isFieldsTouched,
    isFieldValidating: (name) => isFieldsValidating([name]),
    isFieldsValidating,
    isFieldRequired: (name) => {
      const field = findField(name);

      return field ? resolveValidationRules(fieldRules(field), form)
        .some((rule) => rule.required && !rule.warningOnly) : false;
    },
    setFieldValue(name, value) {
      if (Object.is(getFormValue(values, name), value)) {
        const field = findField(name);
        if (field) field.dirty = true;

        return;
      }

      updateValues(setFormValue(values, name, value) as Values);
      const field = ensureField(name);
      field.dirty = true;
      clearField(field);

      for (const child of fields) {
        if (child !== field && containsFormPath(name, fieldPath(child))) clearField(child);
      }

      valuesRevision++;
      submissionError = undefined;
      revalidateTouched();
    },
    setFieldsValue(next) {
      const merged = mergeFormValues(values, next);

      for (const field of fields) {
        const path = fieldPath(field);
        if (!sameFormValue(getFormValue(values, path), getFormValue(merged, path))) {
          field.dirty = true;
          field.validated = true;
        }

        const parent = getFormValue(next, path.slice(0, -1));
        const provided = parent !== null && typeof parent === 'object'
          && path.length > 0 && Object.hasOwn(parent, path[path.length - 1]);

        if (!Object.is(getFormValue(values, path), getFormValue(merged, path))
          || provided) {
          clearField(field);
        }
      }

      updateValues(merged);
      valuesRevision++;
      submissionError = undefined;
      revalidateTouched();
    },
    setFields(updates) {
      for (const update of updates) {
        const { name, ...data } = update;

        if ('value' in data) {
          const next = setFormValue(values, name, data.value) as Values;
          const changed = !sameFormValue(values, next);
          updateValues(next);

          if (changed) {
            valuesRevision++;
            submissionError = undefined;

            for (const field of fields) {
              if (containsFormPath(name, fieldPath(field))) {
                cancelValidationDelay(field);
                field.run = ++validationSequence;
                const wasValidating = field.validating;
                field.validating = false;
                if (wasValidating) notifyFieldMeta(field);
              }
            }
          }
        }

        for (const field of fields) {
          if (!sameFormPath(name, fieldPath(field))
            || (!field.registration && !fieldRules(field).length)) {
            continue;
          }

          if ('touched' in update) field.touched = !!update.touched;
          if ('validating' in update) {
            cancelValidationDelay(field);
            field.run = ++validationSequence;
            field.validating = !!update.validating;
            field.validated = !field.validating;
          }
          if ('errors' in update) field.errors = [...(update.errors ?? [])];
          if ('warnings' in update) field.warnings = [...(update.warnings ?? [])];
          field.dirty = true;
          notifyFieldMeta(field);
        }
      }
    },
    touchField(name) {
      const field = ensureField(name);
      field.touched = true;
      field.dirty = true;
      notifyFieldMeta(field);
      revalidateTouched();
    },
    resetFields(names) {
      if (names?.length === 0) {
        return;
      }

      const selected = names ? fields.filter((field) =>
        names.some((name) => sameFormPath(name, fieldPath(field)))
      ) : [...fields];
      let next = names ? values : copyFormValue(defaults);

      if (names) {
        for (const name of names) {
          next = setFormValue(next, name, getFormValue(defaults, name)) as Values;
        }
      }

      // Defaults are followed by mount order as React Field; registrationOrder preserves the
      // previous order value projection, refs and reset callbacks.
      const initialFields = [...selected].sort((first, second) =>
        (first.initialValueOrder ?? 0) - (second.initialValueOrder ?? 0)
      );
      for (const field of initialFields) {
        const registration = field.registration;
        const path = fieldPath(field);

        if (registration && !registration.isListField
          && registration.initialValue !== undefined
          && getFormValue(defaults, path) === undefined) {
          const conflicts = selected.some((other) => other !== field
            && sameFormPath(path, fieldPath(other))
            && other.registration?.initialValue !== undefined);

          if (!conflicts) next = setFormValue(next, path, registration.initialValue) as Values;
        }
      }

      if (names) {
        if (!sameFormValue(values, next)) valuesRevision++;
        updateValues(next);
      }
      else {
        valuesRevision++;
        values = next;
        resetKey = {};
      }

      for (const field of selected) {
        cancelValidationDelay(field);
        field.errors = undefined;
        field.warnings = undefined;
        field.touched = false;
        field.dirty = false;
        field.validating = false;
        field.validated = false;
        field.run = ++validationSequence;
        notifyFieldMeta(field);
      }

      submissionError = undefined;

      selected.sort((first, second) =>
        (first.registrationOrder ?? 0) - (second.registrationOrder ?? 0)
      );
      for (const field of selected) field.registration?.onReset?.();
    },
    validateFields,
    async submit(onFinish) {
      if (isSubmitting) {
        return { status: 'busy' };
      }

      isSubmitting = true;
      submissionError = undefined;

      for (const field of fields) {
        field.touched = true;
        notifyFieldMeta(field);
      }

      try {
        const result = await validateFields();
        await onFinish(result);

        return { status: 'success' };
      }
      catch (error) {
        if (error instanceof FormValidationError) {
          return { status: 'invalid', error };
        }

        submissionError = error;

        return { status: 'failed', error };
      } finally {
        isSubmitting = false;
      }
    }
  };

  // Applies initialValue only to the missing value, without subscribing to the store.
  function initializeFieldValue(name: NamePath, initialValue?: unknown) {
    untrack(() => {
      if (initialValue !== undefined && getFormValue(values, name) === undefined) {
        updateValues(setFormValue(values, name, initialValue) as Values);
        valuesRevision++;
      }
    });
  }

  setFormHooks(form, {
    get resetKey() {
      return resetKey;
    },
    registerValidateMessages(getMessages) {
      messageProviders.add(getMessages);
      return () => { messageProviders.delete(getMessages); };
    },
    getFieldMeta(name) {
      const field = findField(name);

      return field ? fieldMeta(field) : undefined;
    },
    initializeField: initializeFieldValue,
    initializeList: initializeFieldValue,
    markFieldMounted(mountKey) {
      const field = fields.find((field) => field.registration?.mountKey === mountKey);
      if (field) field.initialValueOrder = ++initialValueOrder;
    },
    changeList(name, next) {
      updateValues(setFormValue(values, name, next) as Values);
      valuesRevision++;
      submissionError = undefined;
      const list = ensureField(name);
      clearField(list);
      list.touched = true;
      list.dirty = true;

      for (const field of fields) {
        if (field !== list && containsFormPath(name, fieldPath(field))) {
          cancelValidationDelay(field);
          field.run = ++validationSequence;
          field.validating = false;
          notifyFieldMeta(field);
        }
      }

      // The names of keyed rows will be updated with flush; the metadata remains with the previous line instance.
      void tick().then(revalidateTouched);
    },
    registerField(registration) {
      return untrack(() => {
        initializeFieldValue(registration.name, registration.initialValue);

        let field = findField(registration.name);

        if (!field || field.registration) field = addField(registration.name);

        const registered = field;
        registered.registration = registration;
        registered.registrationOrder = ++registrationOrder;
        registered.initialValueOrder = ++initialValueOrder;
        registered.metaCache = undefined;
        if (registered.touched || registered.validating || registered.validated
          || registered.errors?.length || registered.warnings?.length) {
          notifyFieldMeta(registered);
        }

        return () => {
          notifyFieldMeta(registered, true);
          if (cancelValidationDelay(registered)) {
            registered.run = ++validationSequence;
            registered.validating = false;
          }

          if (registered.persistent) {
            if (registration.rules !== undefined) {
              registered.run = ++validationSequence;
              registered.errors = undefined;
              registered.warnings = undefined;
              registered.touched = false;
              registered.dirty = false;
              registered.validating = false;
              registered.validated = false;
            }

            registered.registration = undefined;
          }
          else {
            registered.run = ++validationSequence;
            fieldRegistry.delete(registered);
            fields = [...fieldRegistry];
          }
        };
      });
    }
  });

  return form;
}
