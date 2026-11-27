// Clarifies the DOM border of Menu events when transferring the submenu to another container.
// Processors receive the original event, temporary binding currentTarget is local to call.

/** Calls the handler on behalf of the logical owner of the event, then restores the DOM event. */
export function withMenuCurrentTarget<T extends Event, E extends HTMLElement>(
  event: T, target: E, handler: (event: T & { currentTarget: E; }) => void
) {
  if (event.currentTarget === target) {
    handler(event as T & { currentTarget: E; });
    return;
  }

  const descriptor = Object.getOwnPropertyDescriptor(event, 'currentTarget');
  Object.defineProperty(event, 'currentTarget', { configurable: true, value: target });
  try {
    handler(event as T & { currentTarget: E; });
  }
  finally {
    if (descriptor) {
      Object.defineProperty(event, 'currentTarget', descriptor);
    }
    else {
      Reflect.deleteProperty(event, 'currentTarget');
    }
  }
}

/** When moving into an open ShadowRoot, the browser supplies the host instead of the target inside it. */
export function getMenuHoverRelatedTarget(event: MouseEvent, entering: boolean): Node | null {
  const target = event.relatedTarget;
  if (!(target instanceof Node)) {
    return null;
  }
  if (entering || !(target instanceof Element) || !target.shadowRoot) {
    return target;
  }

  let hit = target.shadowRoot.elementFromPoint(event.clientX, event.clientY);
  while (hit?.shadowRoot) {
    const inner = hit.shadowRoot.elementFromPoint(event.clientX, event.clientY);
    if (!inner || inner === hit) break;
    hit = inner;
  }
  return hit ?? target;
}
