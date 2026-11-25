// Хранит только активные браузерные подтверждения для общего Modal.destroyAll.
let callbacks: (() => void)[] | undefined;

/** Регистрирует закрытие и возвращает снятие регистрации для владельца окна. */
export function registerModalDestroy(destroy: () => void) {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const current = callbacks ??= [];
  current.push(destroy);

  /** Удаляет конкретную регистрацию при закрытии или размонтировании владельца. */
  return () => {
    const index = current.indexOf(destroy);
    if (index !== -1) {
      current.splice(index, 1);
    }
  };
}

/** Закрывает окна в обратном порядке регистрации. */
export function destroyAllModals() {
  while (callbacks?.length) {
    const destroy = callbacks.pop();
    destroy?.();
  }
}
