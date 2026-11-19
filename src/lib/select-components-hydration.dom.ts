const attribute = 'data-ant-native-select-component-ssr';

/** Отсутствующий client key сохраняет parsed SSR marker до регистрации editor. */
export function selectComponentHydrationAttributes(enabled: boolean) {
  return enabled && typeof document === 'undefined' ? { [attribute]: '' } : {};
}

// Проверяет наличие SSR-маркера на узле или его ближайшем подходящем предке без изъятия.
export function isSelectComponentHydration(node: HTMLElement) {
  return Boolean(node.closest(`[${attribute}]`));
}

// Забирает SSR-маркер при регистрации редактора. Удаление ограничивает повторную гидратацию той
// же границы.
export function takeSelectComponentHydration(node: HTMLElement) {
  const owner = node.closest(`[${attribute}]`);
  owner?.removeAttribute(attribute);
  return Boolean(owner);
}

/** Slot без зарегистрированного editor тоже освобождает свой SSR marker. */
export function clearSelectComponentHydration(node: HTMLElement | undefined) {
  node?.removeAttribute(attribute);
}
