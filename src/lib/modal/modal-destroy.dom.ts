// Stores only active browser confirmations for a total of Modal.destroyAll.
let callbacks: (() => void)[] | undefined;

/** Registers the closure and returns the check-in withdrawal for the window holder. */
export function registerModalDestroy(destroy: () => void) {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const current = callbacks ??= [];
  current.push(destroy);

  /** Removes a specific registration when the owner is closed or dismantled. */
  return () => {
    const index = current.indexOf(destroy);
    if (index !== -1) {
      current.splice(index, 1);
    }
  };
}

/** Closes the windows in the reverse order of registration. */
export function destroyAllModals() {
  while (callbacks?.length) {
    const destroy = callbacks.pop();
    destroy?.();
  }
}
