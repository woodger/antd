// Fills the internal parameters of the factory. Public props remains the live getter of the owner,
// including at bind and the subsequent change of value.

/** Passes fixed settings only to the internal component. */
export function pickerAdapterProps<Props extends object, Options extends object>(
  props: Props,
  options: Options
): Props & Options {
  return new Proxy(props, {
    // Intercepts reading the parameters of the factory, saving the initial receiver for the rest.
    get(target, key, receiver) {
      return Object.hasOwn(options, key) ? Reflect.get(options, key)
        : Reflect.get(target, key, receiver);
    }
  }) as Props & Options;
}
