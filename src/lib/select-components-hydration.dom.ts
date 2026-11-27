const attribute = 'data-ant-native-select-component-ssr';

/** Missing client key preserves parsed SSR marker prior to editor registration. */
export function selectComponentHydrationAttributes(enabled: boolean) {
  return enabled && typeof document === 'undefined' ? { [attribute]: '' } : {};
}

// Verifies the presence of an SSR marker on the node or its nearest suitable foresight without withdrawal.
export function isSelectComponentHydration(node: HTMLElement) {
  return Boolean(node.closest(`[${attribute}]`));
}

// Picks up SSR-marker when registering an editor. Removing restricts rehydration of the same
// boundary.
export function takeSelectComponentHydration(node: HTMLElement) {
  const owner = node.closest(`[${attribute}]`);
  owner?.removeAttribute(attribute);
  return Boolean(owner);
}

/** Slot without a registered editor also releases its SSR marker. */
export function clearSelectComponentHydration(node: HTMLElement | undefined) {
  node?.removeAttribute(attribute);
}
