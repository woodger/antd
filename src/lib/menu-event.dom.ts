// Уточняет DOM-границу событий Menu при переносе подменю в другой контейнер.
// Обработчики получают исходное событие, временная привязка currentTarget локальна для вызова.

/** Вызывает обработчик от имени логического владельца события, затем восстанавливает DOM event. */
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

/** При движении в открытый ShadowRoot браузер передаёт host вместо цели внутри него. */
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
