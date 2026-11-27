// Has a queue of confirmations and the result of actions. Holder mounts DOM in its context.
import { tick } from 'svelte';
import { runModalAction } from './modal-confirm-action.engine';
import { registerModalDestroy } from './modal-destroy.dom';
import type {
  ModalConfirmConfig,
  ModalConfirmHandle,
  ModalConfirmType,
  ModalConfirmation
} from './modal-confirm.types';

export const modalHolderKey = Symbol('ant-modal-holder');

interface Entry {
  view: ModalConfirmation;
  rendered: boolean;
  running: Set<boolean>;
  resolve: (confirmed: boolean) => void;
  unregister?: () => void;
}

/** Insulated Confirmations; DOM, theme and locale belong to ModalHolder. */
export function createModal() {
  const entries = new Map<number, Entry>();
  let confirmations = $state.raw<readonly ModalConfirmation[]>([]);
  let state: 'fresh' | 'mounted' | 'detached' = 'fresh';
  let nextId = 0;

  function publish() {
    confirmations = [...entries.values()].map(entry => entry.view);
  }

  function remove(entry: Entry) {
    const id = entry.view.id;
    if (entries.get(id) === entry) {
      entries.delete(id);
      entry.unregister?.();
      publish();
    }
  }

  function register(entry: Entry) {
    // Source destroyAll removes the context panel as soon as when removing the holder.
    entry.unregister = registerModalDestroy(() => {
      remove(entry);
      entry.resolve(false);
    });
  }

  function complete(id: number, notifyVisibility = false) {
    const entry = entries.get(id);
    if (!entry || entry.view.open) {
      return;
    }

    const config = entry.view.config;
    if (!notifyVisibility) {
      remove(entry);
      config.afterClose?.();
      return;
    }

    try {
      const afterCloseButton = typeof config.closable === 'object'
        ? config.closable.afterClose : undefined;
      afterCloseButton?.();
      config.afterClose?.();
      config.afterOpenChange?.(false);
    }
    finally {
      // Cleanup of child components should see the changes made in these callbacks.
      void tick().then(() => remove(entry));
    }
  }

  function close(entry: Entry, confirmed: boolean, onClose?: () => void) {
    if (entries.get(entry.view.id) !== entry || !entry.view.open) {
      return;
    }
    entry.view = { ...entry.view, open: false, pendingOk: false, pendingCancel: false };
    publish();
    entry.resolve(confirmed);
    try {
      onClose?.();
    }
    finally {
      if (!entry.rendered) complete(entry.view.id);
    }
  }

  function act(id: number, confirmed: boolean) {
    const entry = entries.get(id);
    if (!entry?.view.open) {
      return false;
    }

    const field = confirmed ? 'pendingOk' : 'pendingCancel';
    return runModalAction(entry.view.config, confirmed, entry.running, {
      isCurrent: () => entries.get(id) === entry && entry.view.open,
      finish: onClose => close(entry, confirmed, onClose),
      pending(value) {
        entry.view = { ...entry.view, [field]: value };
        publish();
      }
    });
  }

  function dismiss(id: number) {
    const entry = entries.get(id);
    if (!entry?.view.open) {
      return;
    }
    const callback = entry.view.config.onCancel;
    close(entry, false);
    // Escape/close/mask has already closed the dialog; the callback does not delay the closure.
    void Promise.resolve(callback?.(() => {})).catch(() => {});
  }

  function open(type: ModalConfirmType, config: ModalConfirmConfig): ModalConfirmHandle {
    let resolve!: (confirmed: boolean) => void;
    const completion = new Promise<boolean>(done => { resolve = done; });
    const entry: Entry = {
      view: {
        id: ++nextId,
        type,
        config: { ...config, type },
        open: true,
        pendingOk: false,
        pendingCancel: false
      },
      rendered: false,
      running: new Set(),
      resolve
    };
    if (state === 'detached') {
      resolve(false);
    }
    else {
      entries.set(entry.view.id, entry);
      if (state === 'mounted') {
        register(entry);
      }
      publish();
    }

    return {
      destroy: () => close(entry, false),
      update(patch) {
        if (entries.get(entry.view.id) !== entry || !entry.view.open) {
          return;
        }
        const current = { ...entry.view.config };
        const changes = typeof patch === 'function' ? patch(current) : patch;
        // update callback can destroy the window or disconnect the holder.
        if (entries.get(entry.view.id) !== entry || !entry.view.open) {
          return;
        }
        const config = { ...entry.view.config, ...changes };
        entry.view = { ...entry.view, config, type: config.type };
        publish();
      },
      // oxlint-disable-next-line unicorn/no-thenable -- The Modal hook API returns a PromiseLike handle.
      then: completion.then.bind(completion)
    };
  }

  function connect() {
    if (state === 'mounted') {
      throw new Error('A modal instance supports one mounted ModalHolder.');
    }
    state = 'mounted';
    for (const entry of entries.values()) {
      register(entry);
    }
    let connected = true;
    return () => {
      if (!connected) {
        return;
      }
      connected = false;
      state = 'detached';
      const pending = [...entries.values()];
      entries.clear();
      publish();
      for (const entry of pending) {
        entry.unregister?.();
        entry.resolve(false);
      }
    };
  }

  return {
    info: (config: ModalConfirmConfig) => open('info', config),
    success: (config: ModalConfirmConfig) => open('success', config),
    error: (config: ModalConfirmConfig) => open('error', config),
    warning: (config: ModalConfirmConfig) => open('warning', config),
    confirm: (config: ModalConfirmConfig) => open('confirm', config),
    [modalHolderKey]: {
      get confirmations() { return confirmations; },
      connect,
      mounted(id: number) {
        const entry = entries.get(id);
        if (entry) entry.rendered = true;
      },
      act,
      dismiss,
      complete
    }
  };
}
