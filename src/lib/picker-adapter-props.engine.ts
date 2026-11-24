// Заполняет внутренние параметры фабрики. Публичные props остаются живыми getter'ами
// владельца, в том числе при bind и последующей смене значения.

/** Передаёт фиксированные параметры только внутреннему компоненту. */
export function pickerAdapterProps<Props extends object, Options extends object>(
  props: Props,
  options: Options
): Props & Options {
  return new Proxy(props, {
    // Перехватывает чтение параметров фабрики, сохраняя исходный receiver для остальных.
    get(target, key, receiver) {
      return Object.hasOwn(options, key) ? Reflect.get(options, key)
        : Reflect.get(target, key, receiver);
    }
  }) as Props & Options;
}
