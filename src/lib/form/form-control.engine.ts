// Reads values from editor callbacks. Native event targets can expose value through their prototype.

/** Uses the target's configured prop when present, or the first callback argument itself. */
export function readFormControlValue(valuePropName: string, args: readonly unknown[]): unknown {
  const input = args[0];
  if (input === null || (typeof input !== 'object' && typeof input !== 'function')) {
    return input;
  }

  const target: unknown = Reflect.get(input, 'target');
  if (target !== null && typeof target === 'object' && valuePropName in target) {
    return Reflect.get(target, valuePropName);
  }

  return input;
}
