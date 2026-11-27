// Transactions with Form values and paths. Copying is limited to plain objects and arrays, and
// reading the path takes into account only the own properties of containers.
import type { Dayjs } from 'dayjs';

/** A string is a literal key; only an array specifies a nested path. The number creates an array index. */
export type NamePath = string | number | readonly (string | number)[];

/** The type of value of a known path; the dynamic path returns unknown. */
export type NamePathValue<Values, Path extends NamePath> = Path extends keyof Values
  ? Values[Path]
  : Path extends readonly []
    ? Values
    : Path extends readonly [infer Head, ...infer Tail]
      ? Head extends keyof NonNullable<Values>
        ? Tail extends readonly (string | number)[]
          ? NamePathValue<NonNullable<Values>[Head], Tail>
            | (undefined extends Values ? undefined : null extends Values ? undefined : never)
          : unknown
        : unknown
      : unknown;

/** Plain objects are combined recursively; arrays and instances of classes are replaced entirely. */
export type PartialFormValues<Value> = Value extends
  Date | RegExp | Dayjs | Map<unknown, unknown> | Set<unknown>
  ? Value
  : Value extends readonly unknown[]
    ? Value
    : Value extends object
      ? { [Key in keyof Value]?: PartialFormValues<Value[Key]> }
      : Value;

// Saves the string key in its entirety, including the points, and copies the transferred array.
export function formNamePath(name: NamePath): (string | number)[] {
  return Array.isArray(name) ? [...name] : [name as string | number];
}

// Requires an exact match to all segments, including their types.
export function sameFormPath(first: NamePath, second: NamePath): boolean {
  const left = formNamePath(first);
  const right = formNamePath(second);

  return left.length === right.length && left.every((part, index) => part === right[index]);
}

// Empty path encompasses all fields, the rest are checked as prefixes.
export function containsFormPath(parent: NamePath, child: NamePath): boolean {
  const prefix = formNamePath(parent);
  const path = formNamePath(child);

  return prefix.length <= path.length && prefix.every((part, index) => part === path[index]);
}

// Allows dictionaries without a prototype. Class copies remain opaque.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

// Writes his own field even for names like __proto_, bypassing the prototype setter.
function defineValue(target: object, key: string | number, value: unknown) {
  Object.defineProperty(
    target,
    key,
    { value, enumerable: true, configurable: true, writable: true }
  );
}

/** Copies variable containers, saving Dayjs and other opaque instances. */
export function copyFormValue<Value>(value: Value, seen = new WeakMap<object, unknown>()): Value {
  if (!Array.isArray(value) && !isPlainObject(value)) {
    return value;
  }
  if (seen.has(value)) {
    return seen.get(value) as Value;
  }

  const copy = Array.isArray(value) ? [] : {};
  if (Array.isArray(copy) && Array.isArray(value)) copy.length = value.length;
  seen.set(value, copy);

  for (const key of Object.keys(value)) {
    const original = (value as Record<string, unknown>)[key];
    const copied = copyFormValue(original, seen);
    defineValue(copy, key, copied);
  }

  return copy as Value;
}

// Interrupts the transition to an absent or inherited segment of the path.
export function getFormValue(store: unknown, name: NamePath): unknown {
  let current = store;

  for (const part of formNamePath(name)) {
    if (current === null || typeof current !== 'object' || !Object.hasOwn(current, part)) {
      return undefined;
    }

    current = (current as Record<string | number, unknown>)[part];
  }

  return current;
}

// Copies containers only along the path and copies the recorded value.
export function setFormValue(store: unknown, name: NamePath, value: unknown): unknown {
  const path = formNamePath(name);
  return setAtPath(store, 0);

  // In the missing container, the type of the next segment selects an array or object.
  function setAtPath(current: unknown, index: number): unknown {
    if (index === path.length) {
      return copyFormValue(value);
    }

    const part = path[index];
    let copy: unknown[] | Record<string, unknown>;
    if (Array.isArray(current)) {
      copy = [...current];
    }
    else if (isPlainObject(current)) {
      copy = { ...current };
    }
    else {
      copy = typeof part === 'number' ? [] : {};
    }

    const previous = getFormValue(current, [part]);
    const replacement = setAtPath(previous, index + 1);
    defineValue(copy, part, replacement);

    return copy;
  }
}

// Recursively combines dictionaries and replaces other values, including arrays.
export function mergeFormValues<Values>(store: Values, next: unknown): Values {
  const seen = new WeakMap<object, unknown>();
  return merge(store, next) as Values;

  // Registers a copy before recursing to save the input object cycles.
  function merge(current: unknown, value: unknown): unknown {
    if (!isPlainObject(value)) {
      return copyFormValue(value, seen);
    }
    if (seen.has(value)) {
      return seen.get(value);
    }

    const copy = isPlainObject(current) ? copyFormValue(current) : {};
    seen.set(value, copy);

    for (const key of Object.keys(value)) {
      const previous = getFormValue(copy, key);
      const replacement = merge(previous, value[key]);
      defineValue(copy, key, replacement);
    }

    return copy;
  }
}

/** Plain containers are compared to their own values; opaque instances – by identity. */
export function sameFormValue(left: unknown, right: unknown): boolean {
  const pairs = new WeakMap<object, WeakSet<object>>();

  // Repeating a pair of objects completes the recursion without requiring a shared identity container.
  function equal(first: unknown, second: unknown): boolean {
    if (Object.is(first, second)) {
      return true;
    }
    if ((!Array.isArray(first) && !isPlainObject(first))
      || (!Array.isArray(second) && !isPlainObject(second))) {
      return false;
    }
    if (Array.isArray(first) !== Array.isArray(second)) {
      return false;
    }
    if (Array.isArray(first) && Array.isArray(second) && first.length !== second.length) {
      return false;
    }

    const keys = Object.keys(first);
    if (keys.length !== Object.keys(second).length) {
      return false;
    }
    const compared = pairs.get(first);
    if (compared?.has(second)) {
      return true;
    }

    const matched = compared ?? new WeakSet<object>();
    matched.add(second);
    pairs.set(first, matched);

    return keys.every((key) => Object.hasOwn(second, key) && equal(
      (first as Record<string, unknown>)[key], (second as Record<string, unknown>)[key]
    ));
  }

  return equal(left, right);
}
