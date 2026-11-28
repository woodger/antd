// Owns values, field registration, metadata submitted and one Form. The revision of values and
// verification numbers separately protect against outdated responses.
import { tick, untrack } from 'svelte';
import { FormValidationError } from './FormValidationError';
import {
  setFormHooks, type FormCallbackProvider, type FormFieldRegistration, type FormRemovalPath
} from './form-internal';
import { focusFormField, getFormFieldElement, scrollFormField } from './form-field.dom';
import { readFormControlValue } from './form-control.engine';
import type { FormStoreListener, FormStoreUpdate } from './form-update.engine';
import type { FormScrollOptions, FormValidateTrigger } from './form.types';
import type { ValidateMessages } from './validation-messages.types';
import { mergeValidationMessages } from './validation-message.engine';
import {
  containsFormPath,
  copyFormValue,
  formNamePath,
  getFormValue,
  hasFormValue,
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

/** The field value and metadata at the time a Form change is published. */
export interface FormFieldSnapshot extends FormFieldMeta {
  value: unknown;
}

// A snapshot fed back through Form.fields does not replace the running validator.
const fieldSnapshotOrigin = Symbol('ant-design-form-field-snapshot');

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

type FormSubmitHandler<Values extends FormValues> = Parameters<FormInstance<Values>['submit']>[0];

interface FormModelSubmit<Values extends FormValues> {
  (): void;
  (onFinish: FormSubmitHandler<Values>): Promise<SubmissionResult<Values>>;
}

/** The model created by createForm, with an explicit entry point for control events. */
export interface FormModel<Values extends FormValues> extends FormInstance<Values> {
  /** Validates and runs the attached Form's submission callbacks. */
  get submit(): FormModelSubmit<Values>;
  /** Allows the callback-based submission operation to be wrapped. */
  set submit(run: FormInstance<Values>['submit']);
  /** Records a control edit and runs validation for the event. The default is onChange. */
  changeFieldValue<const Path extends NamePath>(
    name: Path,
    value: NamePathValue<Values, Path>,
    trigger?: string
  ): void;
  /** Handles a validation event without writing a value or marking the field touched. */
  validateFieldOn(name: NamePath, trigger: string): void;
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

interface ValidationRequest {
  source: 'explicit' | 'control' | 'dependency' | 'refresh';
  validateOnly?: boolean;
  trigger?: string;
  changedList?: StoredField;
}

interface PendingFieldRemoval {
  resolvePath: FormRemovalPath;
  isListField?: boolean;
}

type FieldBinding = FieldSelection & { field: StoredField; };

/** Matches configured event names without treating false as a trigger. */
function allowsValidationTrigger(triggers: FormValidateTrigger, event: string): boolean {
  return typeof triggers === 'string'
    ? triggers !== '' && triggers === event
    : triggers !== false && triggers.includes(event);
}

/** Preserves numeric path segments, including infinities and the strict equality rule for NaN. */
function fieldSelectionKey(path: readonly (string | number)[]): string | symbol {
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
}): FormModel<Values> {
  const modelDefaults = copyFormValue(initialValues);
  let defaults = modelDefaults;
  let valuesRevision = $state(0);
  let validationSequence = 0;
  let latestValidationRun = 0;
  let submissionRevision = 0;
  let mountedForms = 0;
  let storeLifetime = 0;
  let restoreDefaultsOnMount = false;
  let registrationOrder = 0;
  let initialValueOrder = 0;
  let values = $state<Values>(copyFormValue(defaults));
  let resetKey = $state.raw<object>({});
  // At teardown Svelte reads the previous $state; the registry stores up-to-date registrations.
  const fieldRegistry = new Set<StoredField>();
  const pendingRemovals: PendingFieldRemoval[] = [];
  const validationDelays = new Map<StoredField, () => void>();
  const messageProviders = new Set<() => ValidateMessages | undefined>();
  const callbackProviders = new Set<FormCallbackProvider<Values>>();
  const storeListeners = new Set<FormStoreListener>();
  let storeSnapshot: Readonly<Values> | undefined;
  const controlDrivenFields = new WeakSet<StoredField>();
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

  // A name can refer to multiple editors. The mount key identifies the emitting registration.
  function findFieldByMountKey(mountKey: symbol): StoredField | undefined {
    return fields.find((field) => field.registration?.mountKey === mountKey);
  }

  // Copies the arrays so that the listener does not change the metadata in the repository.
  function fieldMeta(field: StoredField, path = fieldPath(field)): FormFieldMeta {
    return {
      name: [...path], touched: field.touched, validating: field.validating,
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

  // Falsy defined initial values count, even when the field has never been touched.
  function isValidationDirty(field: StoredField, path = fieldPath(field)) {
    return field.dirty || field.touched || field.registration?.initialValue !== undefined
      || getFormValue(defaults, path) !== undefined;
  }

  // Follow the live paths and stop at pristine fields. Visit each registration once even in cycles.
  function dependentFields(names: readonly NamePath[]): FieldBinding[] {
    const byDependency = new Map<string | symbol, StoredField[]>();
    for (const field of fields) {
      for (const path of field.registration?.dependencies ?? []) {
        const key = fieldSelectionKey(formNamePath(path));
        const group = byDependency.get(key);
        if (group) {
          group.push(field);
        }
        else {
          byDependency.set(key, [field]);
        }
      }
    }

    const visited = new Set<StoredField>();
    const result: FieldBinding[] = [];
    for (const name of names) {
      visit(formNamePath(name));
    }

    return result;

    // Preserve the registration and path at the time an edit traverses the graph.
    function visit(namePath: (string | number)[]) {
      const list = byDependency.get(fieldSelectionKey(namePath));
      if (!list) {
        return;
      }

      for (const field of list) {
        if (visited.has(field)) {
          continue;
        }
        visited.add(field);

        const path = fieldPath(field);
        if (path.length && isValidationDirty(field, path)) {
          result.push({ path, field });
          visit(path);
        }
      }
    }
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

      if (filter) {
        const meta = field ? fieldMeta(field, path) : null;
        if (!filter(meta)) {
          continue;
        }
      }

      const currentValue = getFormValue(values, path);
      result = setFormValue(result, path, currentValue);
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

  // All mounted observers can read the same projection without subscribing to validation metadata.
  const watchValues = $derived(getFieldsValue());

  // Share one immutable root per write without copying the store when there are no observers.
  function readStoreSnapshot(): Readonly<Values> | undefined {
    if (storeListeners.size) {
      storeSnapshot ??= untrack(() => ({ ...values }));
      return storeSnapshot;
    }
  }

  // Predicates run in store order. Reads in a predicate cannot subscribe the writer's effect.
  function notifyStoreUpdate(previous: Readonly<Values> | undefined, update: FormStoreUpdate) {
    if (!previous) {
      return;
    }

    const current = readStoreSnapshot();
    if (current) {
      const listeners = [...storeListeners];
      untrack(() => {
        for (const listener of listeners) {
          listener(previous, current, update);
        }
      });
    }
  }

  // The last attached Form owns callbacks for this model until its registration is released.
  function currentCallbackProvider() {
    return [...callbackProviders].at(-1);
  }

  // Build both arguments from one field snapshot, including current indexed paths in lists.
  function publishFieldsChange(
    names: readonly NamePath[],
    owner = currentCallbackProvider()
  ) {
    if (!names.length || !owner) {
      return;
    }

    untrack(() => {
      if (owner !== currentCallbackProvider()) {
        return;
      }

      const onFieldsChange = owner()?.onFieldsChange;
      if (!onFieldsChange) {
        return;
      }

      const allFields: FormFieldSnapshot[] = [];
      const changedFields: FormFieldSnapshot[] = [];
      for (const { path, field } of fieldBindings()) {
        const value = getFormValue(values, path);
        const snapshot = { ...fieldMeta(field, path), value: copyFormValue(value) };
        Object.defineProperty(snapshot, fieldSnapshotOrigin, { value: true });
        allFields.push(snapshot);

        if (names.some((name) => sameFormPath(name, path))) {
          changedFields.push(snapshot);
        }
      }

      if (changedFields.length) {
        onFieldsChange(changedFields, allFields);
      }
    });
  }

  // The edited path can include data outside the projection of mounted fields, such as a list row.
  function publishValueChange(name: NamePath, dependencies: readonly NamePath[]) {
    untrack(() => {
      const onValuesChange = currentCallbackProvider()?.()?.onValuesChange;
      if (onValuesChange) {
        const value = getFormValue(values, name);
        const changed = setFormValue({}, name, value) as FormValueProjection<Values>;
        const all = setFormValue(getFieldsValue(), name, value) as FormValueProjection<Values>;
        onValuesChange(changed, all);
      }

      publishFieldsChange([name, ...dependencies]);
    });
  }

  // Releases a waiting debounce timer or dependency frame when its field is superseded.
  function cancelValidationDelay(field: StoredField): boolean {
    const cancel = validationDelays.get(field);
    if (!cancel) {
      return false;
    }

    cancel();

    return true;
  }

  // Resolves true when the scheduled wait elapses, or false when the owner cancels it.
  function delayValidation(field: StoredField, delay: number | 'frame'): Promise<boolean> {
    return new Promise((resolve) => {
      let cancel: () => void;

      function finish(elapsed: boolean) {
        if (validationDelays.get(field) === cancel) {
          validationDelays.delete(field);
        }
        resolve(elapsed);
      }

      if (delay === 'frame' && typeof requestAnimationFrame === 'function'
        && typeof cancelAnimationFrame === 'function') {
        const frame = requestAnimationFrame(() => finish(true));
        cancel = () => {
          cancelAnimationFrame(frame);
          finish(false);
        };
        validationDelays.set(field, cancel);

        return;
      }

      const timer = setTimeout(() => finish(true), delay === 'frame' ? 0 : delay);
      cancel = () => {
        clearTimeout(timer);
        finish(false);
      };
      validationDelays.set(field, cancel);
    });
  }

  // Runs selected checks at the same time and rejects an outdated shot.
  async function validate(
    selected: readonly StoredField[],
    { source, validateOnly = false, trigger, changedList }: ValidationRequest
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
    const publishesChanges = source !== 'refresh' || changedList !== undefined;
    const callbacks = publishesChanges ? currentCallbackProvider() : undefined;
    const entries = selected.map((field) => {
      const hasRules = fieldRules(field).length > 0;
      const publishes = Boolean(callbacks && hasRules && (!changedList || changedList === field));
      const event = source === 'control' ? trigger : field === changedList ? 'onChange' : undefined;
      const debounced = source === 'refresh' || (source === 'control' && !!event);
      return {
        field, path: fieldPath(field), run: field.run, hasRules, publishes, event,
        delay: debounced ? field.registration?.validateDebounce : undefined
      };
    });

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
        if (source === 'control' || source === 'dependency' || field === changedList) {
          field.errors = [];
        }
        field.warnings = [];
        field.dirty = true;
        field.validated = false;
        notifyFieldMeta(field);
      }
    }

    let results;
    try {
      if (callbacks) {
        const started = entries.filter((entry) => entry.publishes).map(({ path }) => path);
        publishFieldsChange(started, callbacks);
      }
    }
    finally {
      // A throwing listener must not leave validation pending forever.
      results = await Promise.all(entries.map(validateEntry));
    }

    if ((callbacks || storeListeners.size) && valuesRevision === snapshotRevision) {
      const validatedPaths: NamePath[] = [];
      const completed: NamePath[] = [];
      for (const [index, entry] of entries.entries()) {
        const { field, path, run, hasRules, publishes } = entry;
        if (hasRules && !results[index].cancelled && field.run === (validateOnly ? run : validationRun)
          && fields.includes(field) && sameFormPath(path, fieldPath(field))) {
          validatedPaths.push(path);
          if (publishes) completed.push(path);
        }
      }

      if (storeListeners.size && (validatedPaths.length || entries.every(entry => !entry.hasRules))) {
        notifyStoreUpdate(readStoreSnapshot(), { type: 'validateFinish', names: validatedPaths });
      }
      if (callbacks && valuesRevision === snapshotRevision) {
        publishFieldsChange(completed, callbacks);
      }
    }

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

    // A control event publishes pending metadata before the control finishes its own handler.
    // Dependent rule factories run after the UI has had a frame to apply changes from the edit.
    async function validateEntry(
      { field, path, hasRules, delay, event }: (typeof entries)[number]
    ): Promise<FieldError & { cancelled?: boolean }> {
      if (!hasRules) {
        return { name: path, errors: [], warnings: [] };
      }

      if (source === 'dependency') {
        if (!isCurrent(field, path)) {
          return cancelledEntry(field, path);
        }

        const elapsed = await delayValidation(field, 'frame');
        if (!elapsed || !isCurrent(field, path)) {
          return cancelledEntry(field, path);
        }
      }
      else if (source === 'control') {
        await tick();
        if (!isCurrent(field, path)) {
          return cancelledEntry(field, path);
        }
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

      if (event) {
        rules = rules.filter(({ validateTrigger }) =>
          !validateTrigger || allowsValidationTrigger(validateTrigger, event)
        );
      }

      const messageContext = {
        name: path.map(String).join('.'),
        variables: { label: path.map(String).join('.'), ...field.registration?.messageVariables },
        messages: mergeValidationMessages([...messageProviders].at(-1)?.())
      };
      const validateFirst = field.registration?.validateFirst;
      if (delay) {
        if (!isCurrent(field, path)) {
          return cancelledEntry(field, path);
        }

        const elapsed = await delayValidation(field, delay);
        if (!elapsed || !isCurrent(field, path)) {
          return cancelledEntry(field, path);
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

    // A pending timer or frame cannot continue with another value or a reassigned list row.
    function isCurrent(field: StoredField, path: NamePath) {
      return field.run === validationRun && valuesRevision === snapshotRevision
        && fieldRegistry.has(field) && sameFormPath(path, fieldPath(field));
    }

    // Only clear the pending flag if a newer check has not claimed this field.
    function cancelledEntry(field: StoredField, path: (string | number)[]) {
      if (field.run === validationRun) {
        field.validating = false;
        notifyFieldMeta(field);
      }

      return { name: path, errors: [], warnings: [], cancelled: true };
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
      selected = selected.filter((field) => isValidationDirty(field));
    }

    return validate(selected, { source: 'explicit', validateOnly: settings?.validateOnly });
  }

  // Automatic checks keep validation errors in the model; programming errors still surface.
  function validateAutomatically(selected: readonly StoredField[], request: ValidationRequest) {
    void validate(selected, request).catch((error: unknown) => {
      if (!(error instanceof FormValidationError)) {
        throw error;
      }
    });
  }

  // A declared event or dependency opts a binding into the control validation path.
  function usesControlValidation(field: StoredField) {
    const registration = field.registration;
    return controlDrivenFields.has(field) || registration?.validateTrigger !== undefined
      || registration?.dependencies !== undefined;
  }

  // Checks the field's event configuration before individual rules are filtered.
  function validateControlEvent(field: StoredField, trigger: string, sharedPath?: NamePath) {
    const triggers = field.registration?.validateTrigger ?? 'onChange';
    if (!allowsValidationTrigger(triggers, trigger) || !fieldRules(field).length) {
      return;
    }

    const selected = sharedPath === undefined ? [field] : fields.filter((candidate) =>
      sameFormPath(sharedPath, fieldPath(candidate))
    );
    validateAutomatically(selected, { source: 'control', trigger });
  }

  // Dispatches through the originating editor and reports when it must receive the committed value.
  function handleFieldEvent(mountKey: symbol, event: string, args: readonly unknown[]) {
    const field = findFieldByMountKey(mountKey);
    const registration = field?.registration;
    if (!field || !registration) {
      return false;
    }

    const name = fieldPath(field);
    const writesValue = event === (registration.trigger ?? 'onChange');
    controlDrivenFields.add(field);
    if (writesValue) {
      applyControlValue(field, name, () => {
        const extract = registration.getValueFromEvent;
        if (extract) {
          return extract(...args);
        }

        return readFormControlValue(registration.valuePropName ?? 'value', args);
      });
    }

    validateControlEvent(field, event, name);
    return writesValue;
  }

  // Returns the affected paths so a control edit can include them in its field-change callback.
  function startDependentValidation(names: readonly NamePath[]) {
    const dependents = untrack(() => dependentFields(names));
    if (dependents.length) {
      validateAutomatically(dependents.map(({ field }) => field), { source: 'dependency' });
    }

    return dependents.map(({ path }) => path);
  }

  // Dependent fields enter validation before either value-change callback sees the new store.
  function publishControlEdit(name: NamePath, previous: Readonly<Values> | undefined) {
    notifyStoreUpdate(previous, { type: 'valueUpdate', source: 'internal', names: [name] });
    const dependents = startDependentValidation([name]);
    notifyStoreUpdate(previous, { type: 'dependenciesUpdate', names: [name, ...dependents] });
    publishValueChange(name, dependents);
  }

  // Compatibility for manually wired fields, including list paths that change after a flush.
  function revalidateTouched(
    { explicitTouch = false, changedList }: { explicitTouch?: boolean; changedList?: StoredField } = {}
  ) {
    if (isSubmitting) {
      return;
    }

    const selected = fields.filter((field) => {
      if (field === changedList) {
        return allowsValidationTrigger(field.registration?.validateTrigger ?? 'onChange', 'onChange');
      }

      return field.touched && (explicitTouch || !usesControlValidation(field));
    });

    if (selected.length) {
      validateAutomatically(selected, { source: 'refresh', changedList });
    }
  }

  function markTouched(field: StoredField) {
    field.touched = true;
    field.dirty = true;
    notifyFieldMeta(field);
  }

  // Touch precedes extraction and normalization. Validation uses the value committed by this edit.
  function applyControlValue(field: StoredField, name: NamePath, readValue: () => unknown) {
    markTouched(field);
    const previous = getFormValue(values, name);
    const value = readValue();
    const normalize = field.registration?.normalize;
    // Keep the old root while preserving field identities for the synchronous normalizer.
    const nextValue = normalize ? normalize(value, previous, { ...values }) : value;
    if (previous === nextValue) {
      return;
    }

    const previousStore = readStoreSnapshot();
    const next = setFormValue(values, name, nextValue) as Values;
    updateValues(next);
    valuesRevision++;
    submissionError = undefined;
    publishControlEdit(name, previousStore);
  }

  // Updates the current proxy keys by saving the model’s reader links.
  function updateValues(next: Values) {
    storeSnapshot = undefined;
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

  // A field batch applies values and metadata in the caller's order without validating.
  function applyFieldUpdates(updates: readonly FormFieldData[], controlled: boolean) {
    const previousStore = readStoreSnapshot();
    for (const update of updates) {
      const { name, ...data } = update;
      const hasValue = 'value' in data;

      if (hasValue) {
        const next = setFormValue(values, name, data.value) as Values;
        const changed = !sameFormValue(values, next);
        // Equal controlled echoes can read their data from the store itself.
        if (!controlled || changed) {
          updateValues(next);
        }
        else {
          storeSnapshot = undefined;
        }

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

      const keepValidator = controlled && Object.hasOwn(update, fieldSnapshotOrigin);
      for (const field of fields) {
        if (!sameFormPath(name, fieldPath(field))
          || (!field.registration && !fieldRules(field).length)) {
          continue;
        }

        if ('touched' in update) field.touched = !!update.touched;
        if ('validating' in update && !keepValidator) {
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

      notifyStoreUpdate(previousStore, { type: 'setField', name, hasValue });
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

  // Resets flags and messages and releases work owned by the previous field lifetime.
  function resetFieldMetadata(field: StoredField) {
    cancelValidationDelay(field);
    field.errors = undefined;
    field.warnings = undefined;
    field.touched = false;
    field.dirty = false;
    field.validating = false;
    field.validated = false;
    field.run = ++validationSequence;
  }

  // Discard after the Svelte flush so sibling registrations and keyed list moves are visible.
  function scheduleFieldRemoval(registration: FormFieldRegistration) {
    if (registration.preserve !== false) {
      return;
    }

    const path = formNamePath(registration.name);
    const resolvePath = registration.isListField ? registration.getRemovalPath : () => path;
    if (!resolvePath) {
      return;
    }

    if (!pendingRemovals.length) {
      queueMicrotask(discardUnmountedValues);
    }
    pendingRemovals.push({ resolvePath, isListField: registration.isListField });
  }

  // A restored parent represents its whole initial value, including nested list entries.
  function discardUnmountedValues() {
    const removals = pendingRemovals.splice(0);
    if (!removals.length) {
      return;
    }

    const mountedPaths = new Set<string | symbol>();
    for (const field of fieldRegistry) {
      if (field.registration) {
        mountedPaths.add(fieldSelectionKey(fieldPath(field)));
      }
    }

    const updates = new Map<string | symbol, { path: readonly (string | number)[]; value: unknown }>();
    for (const { resolvePath, isListField } of removals) {
      const path = resolvePath((name) => getFormValue(values, name));
      if (!path?.length) {
        continue;
      }

      const key = fieldSelectionKey(path);
      if (mountedPaths.has(key)) {
        continue;
      }

      const value = isListField ? undefined : getFormValue(defaults, path);
      if (!Object.is(getFormValue(values, path), value)) {
        updates.set(key, { path, value });
      }
    }

    let next = values;
    const restored: NamePath[] = [];
    const ordered = [...updates.values()].sort((first, second) => first.path.length - second.path.length);
    for (const { path, value } of ordered) {
      if (!restored.some((parent) => containsFormPath(parent, path))) {
        next = setFormValue(next, path, value, true) as Values;
        restored.push(path);
      }
    }
    if (next === values) {
      return;
    }

    const previous = readStoreSnapshot();
    updateValues(next);
    valuesRevision++;
    submissionError = undefined;
    notifyStoreUpdate(previous, { type: 'remove', names: restored });
    if (mountedForms) {
      const names = ordered.map(({ path }) => path);
      const dependents = startDependentValidation(names);
      notifyStoreUpdate(previous, { type: 'dependenciesUpdate', names: [...names, ...dependents] });
    }
  }

  // Clearing the last owner invalidates work from that attachment and defers defaults until remount.
  function clearDetachedForm() {
    storeLifetime++;
    pendingRemovals.length = 0;
    latestValidationRun = ++validationSequence;
    for (const field of fieldRegistry) {
      resetFieldMetadata(field);
    }

    storeSnapshot = undefined;
    values = {} as Values;
    valuesRevision++;
    submissionRevision++;
    isSubmitting = false;
    submissionError = undefined;
    restoreDefaultsOnMount = true;
  }

  // Form defaults take priority on reset. Connecting a model fills gaps beneath its current store.
  function setInitialValues(initial: PartialFormValues<Values> | undefined, seed: boolean) {
    defaults = initial === undefined ? modelDefaults : mergeFormValues(modelDefaults, initial);
    if (!seed) {
      return;
    }

    untrack(() => {
      if (initial === undefined && !restoreDefaultsOnMount) {
        return;
      }

      restoreDefaultsOnMount = false;
      const next = mergeFormValues(defaults, values);
      if (!sameFormValue(values, next)) {
        updateValues(next);
        valuesRevision++;
      }
    });
  }

  let submit = wrapSubmission(submitWithFinish);

  /** Each read keeps its delegate when a caller wraps the callback-based submission method. */
  function wrapSubmission(run: FormInstance<Values>['submit']): FormModelSubmit<Values> {
    function submit(): void;
    function submit(onFinish: FormSubmitHandler<Values>): Promise<SubmissionResult<Values>>;
    function submit(onFinish?: FormSubmitHandler<Values>) {
      if (onFinish) {
        return run.call(form, onFinish);
      }
      const provider = currentCallbackProvider();
      const attachedSubmit = provider?.()?.submit;
      if (attachedSubmit) {
        attachedSubmit();
      }
      else {
        void run.call(form, () => {});
      }
    }
    return submit;
  }

  async function submitWithFinish(onFinish: FormSubmitHandler<Values>): Promise<SubmissionResult<Values>> {
    if (isSubmitting) {
      return { status: 'busy' };
    }

    const callbacks = currentCallbackProvider();
    const revision = ++submissionRevision;
    isSubmitting = true;
    submissionError = undefined;

    for (const field of fields) {
      field.touched = true;
      notifyFieldMeta(field);
    }

    try {
      const result = await validateFields();
      if (revision !== submissionRevision) {
        const error = new FormValidationError<Values>(result, {}, true);
        return { status: 'invalid', error };
      }
      if (callbacks && callbacks === currentCallbackProvider()) {
        callbacks()?.onProviderFinish?.(result);
      }
      await onFinish(result);

      return { status: 'success' };
    }
    catch (error) {
      if (error instanceof FormValidationError) {
        return { status: 'invalid', error };
      }

      if (revision === submissionRevision) {
        submissionError = error;
      }

      return { status: 'failed', error };
    }
    finally {
      if (revision === submissionRevision) {
        isSubmitting = false;
      }
    }
  }

  const form: FormModel<Values> = {
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
    changeFieldValue(name, value, trigger = 'onChange') {
      const field = ensureField(name);
      controlDrivenFields.add(field);
      applyControlValue(field, name, () => value);
      validateControlEvent(field, trigger);
    },
    validateFieldOn(name, trigger) {
      const field = findField(name);
      if (field) {
        controlDrivenFields.add(field);
        validateControlEvent(field, trigger);
      }
    },
    setFieldValue(name, value) {
      const previous = readStoreSnapshot();
      if (Object.is(getFormValue(values, name), value)) {
        const field = findField(name);
        if (field) field.dirty = true;

        // An explicit undefined entry can suppress a default when a Form attaches later.
        if (value === undefined && !hasFormValue(values, formNamePath(name))) {
          const next = setFormValue(values, name, value) as Values;
          updateValues(next);
          valuesRevision++;
        }
        // Even equal writes publish a fresh store root to predicates.
        storeSnapshot = undefined;
        notifyStoreUpdate(previous, { type: 'setField', name, hasValue: true });
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
      notifyStoreUpdate(previous, { type: 'setField', name, hasValue: true });
      revalidateTouched();
    },
    setFieldsValue(next) {
      const previous = readStoreSnapshot();
      const merged = mergeFormValues(values, next);

      for (const field of fields) {
        const path = fieldPath(field);
        if (!sameFormValue(getFormValue(values, path), getFormValue(merged, path))) {
          field.dirty = true;
          field.validated = true;
        }

        const provided = hasFormValue(next, path);

        if (!Object.is(getFormValue(values, path), getFormValue(merged, path))
          || provided) {
          clearField(field);
        }
      }

      updateValues(merged);
      valuesRevision++;
      submissionError = undefined;
      notifyStoreUpdate(previous, { type: 'valueUpdate', source: 'external' });
      revalidateTouched();
    },
    setFields(updates) {
      applyFieldUpdates(updates, false);
    },
    touchField(name) {
      const field = ensureField(name);
      markTouched(field);
      revalidateTouched({ explicitTouch: true });
    },
    resetFields(names) {
      const previous = readStoreSnapshot();
      if (names?.length === 0) {
        notifyStoreUpdate(previous, { type: 'reset', names });
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
        storeSnapshot = undefined;
        values = next;
        resetKey = {};
      }

      for (const field of selected) {
        resetFieldMetadata(field);
        notifyFieldMeta(field);
      }

      submissionError = undefined;

      selected.sort((first, second) =>
        (first.registrationOrder ?? 0) - (second.registrationOrder ?? 0)
      );
      for (const field of selected) field.registration?.onReset?.();
      notifyStoreUpdate(previous, { type: 'reset', names });
    },
    validateFields,
    get submit() {
      return submit;
    },
    set submit(run) {
      submit = wrapSubmission(run);
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
    setInitialValues,
    attachForm(getClearOnDestroy) {
      mountedForms++;

      return () => {
        mountedForms--;
        if (!mountedForms && getClearOnDestroy()) {
          clearDetachedForm();
        }
      };
    },
    registerValidateMessages(getMessages) {
      messageProviders.add(getMessages);
      return () => { messageProviders.delete(getMessages); };
    },
    registerCallbacks(getCallbacks) {
      callbackProviders.add(getCallbacks);
      return () => { callbackProviders.delete(getCallbacks); };
    },
    subscribeStoreUpdates(listener) {
      storeListeners.add(listener);
      return () => {
        storeListeners.delete(listener);
        if (!storeListeners.size) storeSnapshot = undefined;
      };
    },
    setControlledFields: (updates) => applyFieldUpdates(updates, true),
    getWatchValues: () => watchValues,
    getFieldMeta(name) {
      const field = findField(name);

      return field ? fieldMeta(field) : undefined;
    },
    handleFieldBlur(name) {
      const field = ensureField(name);
      if (usesControlValidation(field)) {
        validateControlEvent(field, 'onBlur');
      }
      else {
        markTouched(field);
        revalidateTouched();
      }
    },
    handleFieldEvent,
    initializeField: initializeFieldValue,
    initializeList: initializeFieldValue,
    markFieldMounted(mountKey) {
      const field = findFieldByMountKey(mountKey);
      if (field) field.initialValueOrder = ++initialValueOrder;
    },
    changeList(name, next) {
      const previous = readStoreSnapshot();
      updateValues(setFormValue(values, name, next) as Values);
      valuesRevision++;
      submissionError = undefined;
      const list = ensureField(name);
      if (list.registration?.validateTrigger === undefined) {
        clearField(list);
      }
      else {
        // With explicit triggers, an edit retains the manual result until validation runs again.
        cancelValidationDelay(list);
        list.run = ++validationSequence;
        list.validating = false;
      }
      markTouched(list);

      for (const field of fields) {
        if (field !== list && containsFormPath(name, fieldPath(field))) {
          cancelValidationDelay(field);
          field.run = ++validationSequence;
          field.validating = false;
          notifyFieldMeta(field);
        }
      }

      publishControlEdit(name, previous);

      // The names of keyed rows will be updated with flush; the metadata remains with the previous line instance.
      void tick().then(() => revalidateTouched({ changedList: list }));
    },
    registerField(registration) {
      return untrack(() => {
        initializeFieldValue(registration.name, registration.initialValue);
        const registeredLifetime = storeLifetime;

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

        if (registration.initialValue !== undefined) {
          notifyStoreUpdate(readStoreSnapshot(), {
            type: 'valueUpdate', source: 'internal', names: [registration.name]
          });
        }

        return () => {
          controlDrivenFields.delete(registered);
          notifyFieldMeta(registered, true);
          if (cancelValidationDelay(registered)) {
            registered.run = ++validationSequence;
            registered.validating = false;
          }

          if (registered.persistent) {
            if (registration.rules !== undefined || registration.preserve === false) {
              resetFieldMetadata(registered);
            }

            registered.registration = undefined;
          }
          else {
            registered.run = ++validationSequence;
            fieldRegistry.delete(registered);
            fields = [...fieldRegistry];
          }

          if (registeredLifetime === storeLifetime) {
            scheduleFieldRemoval(registration);
          }
        };
      });
    }
  });

  return form;
}
