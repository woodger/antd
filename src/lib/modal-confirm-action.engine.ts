// Starts the action of the confirmation button. The owner controls the visibility and life of the window.
import type { ModalConfirmConfig } from './modal-confirm.types';

interface ActionRuntime {
  isCurrent(): boolean;
  finish(onClose?: () => void): void;
  pending(value: boolean): void;
}

/** Retains manual closure and independently monitors waiting for OK and Cancel. */
export function runModalAction(
  config: Readonly<ModalConfirmConfig>,
  confirmed: boolean,
  running: Set<boolean>,
  runtime: ActionRuntime
) {
  if (running.has(confirmed)) {
    return false;
  }

  const callback = confirmed ? config.onOk : config.onCancel;
  const onClose = typeof config.closable === 'object' ? config.closable.onClose : undefined;

  /** The action preserves onClose at the time of pressing. */
  function finish() {
    runtime.finish(onClose);
  }

  if (!callback) {
    finish();
    return true;
  }

  running.add(confirmed);
  let result: unknown;
  try {
    result = callback.length ? callback(finish) : (callback as () => unknown)();
  }
  catch (error) {
    running.delete(confirmed);
    throw error;
  }

  if (result !== null
    && (typeof result === 'object' || typeof result === 'function')
    && 'then' in result
    && typeof result.then === 'function') {
    if (!runtime.isCurrent()) {
      void Promise.resolve(result).catch(() => {});
      return true;
    }

    runtime.pending(true);
    void Promise.resolve(result).then(finish, () => {
      if (runtime.isCurrent()) {
        running.delete(confirmed);
        runtime.pending(false);
      }
    });
  }
  else if (callback.length === 0) {
    finish();
  }
  else {
    running.delete(confirmed);
  }

  return true;
}
