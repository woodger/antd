const attribute = 'data-ant-native-select-component-ssr';

/** Отсутствующий client key сохраняет parsed SSR marker до регистрации editor. */
export function selectComponentHydrationAttributes(enabled: boolean) {
  return enabled && typeof document === 'undefined' ? { [attribute]: '' } : {};
}

export function isSelectComponentHydration(node: HTMLElement) {
  return Boolean(node.closest(`[${attribute}]`));
}

export function takeSelectComponentHydration(node: HTMLElement) {
  const owner = node.closest(`[${attribute}]`);
  owner?.removeAttribute(attribute);
  return Boolean(owner);
}

/** Slot без зарегистрированного editor тоже освобождает свой SSR marker. */
export function clearSelectComponentHydration(node: HTMLElement | undefined) {
  node?.removeAttribute(attribute);
}
