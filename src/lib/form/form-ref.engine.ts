// Exposes a mounted Form's host and submission behavior alongside its active model.
import type { FormInstance, SubmissionResult } from './form.model.svelte';
import type { FormRef } from './form.types';
import type { FormValues } from './validation.engine';

/** Keeps the handle stable while looking up the current model on every read. */
export function createFormRef<Values extends FormValues>(
  readModel: () => FormInstance<Values>,
  readElement: () => HTMLElement | undefined,
  submitForm: () => void
): FormRef<Values> {
  type Finish = (values: Values) => void | Promise<void>;
  const methods = new Map<PropertyKey, {
    owner: FormInstance<Values>;
    source: unknown;
    bound: unknown;
  }>();
  const handle = { get nativeElement() { return readElement(); }, submit };

  /** Uses the owner callbacks by default and retains the explicit model submission overload. */
  function submit(): void;
  function submit(finish: Finish): Promise<SubmissionResult<Values>>;
  function submit(finish?: Finish) {
    if (finish) {
      return readModel().submit(finish);
    }
    submitForm();
  }

  /** Binds model methods to their own receiver, including methods supplied by a custom model. */
  function read(key: PropertyKey): unknown {
    if (Object.hasOwn(handle, key)) {
      return Reflect.get(handle, key);
    }
    const owner = readModel();
    const value: unknown = Reflect.get(owner, key);
    if (typeof value !== 'function') {
      return value;
    }
    const cached = methods.get(key);
    if (cached?.owner === owner && cached.source === value) {
      return cached.bound;
    }
    const bound: unknown = value.bind(owner);
    methods.set(key, { owner, source: value, bound });
    return bound;
  }

  // Every model member remains addressable, including the non-enumerable internal symbol.
  return new Proxy(handle, {
    get: (_, key) => read(key),
    has: (target, key) => Reflect.has(target, key) || Reflect.has(readModel(), key),
    ownKeys: target => [...new Set([...Reflect.ownKeys(readModel()), ...Reflect.ownKeys(target)])],
    getOwnPropertyDescriptor(target, key) {
      const local = Reflect.getOwnPropertyDescriptor(target, key);
      if (local) return local;
      const member = Reflect.getOwnPropertyDescriptor(readModel(), key);
      return member && { configurable: true, enumerable: member.enumerable, get: () => read(key) };
    }
  }) as FormRef<Values>;
}
