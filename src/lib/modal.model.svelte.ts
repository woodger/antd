// Владеет очередью подтверждений и результатом действий. Holder монтирует DOM в своём контексте.
import { tick } from 'svelte';
import type {
  ModalConfirmConfig,
  ModalConfirmHandle,
  ModalConfirmType
} from './modal-confirm.types';

export const modalHolderKey = Symbol('ant-modal-holder');

export interface ModalConfirmation {
  readonly id: number;
  readonly type: ModalConfirmType;
  readonly config: Readonly<ModalConfirmConfig>;
  readonly open: boolean;
  readonly pendingOk: boolean;
  readonly pendingCancel: boolean;
}

interface Entry {
  view: ModalConfirmation;
  rendered: boolean;
  running: Set<boolean>;
  resolve: (confirmed: boolean) => void;
}

/** Изолированные подтверждения; DOM, тема и локаль принадлежат ModalHolder. */
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
      publish();
    }
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
      // Cleanup дочерних компонентов должен видеть изменения, внесённые в этих callbacks.
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
    if (entry.running.has(confirmed)) {
      return false;
    }

    const config = entry.view.config;
    const field = confirmed ? 'pendingOk' : 'pendingCancel';
    const callback = confirmed ? config.onOk : config.onCancel;
    // Действие сохраняет onClose на момент нажатия. afterClose читается при закрытии окна.
    const onClose = typeof config.closable === 'object' ? config.closable.onClose : undefined;
    const finish = () => close(entry, confirmed, onClose);
    if (!callback) {
      finish();
      return true;
    }

    entry.running.add(confirmed);
    let result: unknown;
    try {
      result = callback.length ? callback(finish) : (callback as () => unknown)();
    }
    catch (error) {
      entry.running.delete(confirmed);
      throw error;
    }
    if (result !== null
      && (typeof result === 'object' || typeof result === 'function')
      && 'then' in result
      && typeof result.then === 'function') {
      if (!entry.view.open || entries.get(id) !== entry) {
        void Promise.resolve(result).catch(() => {});
        return true;
      }
      entry.view = { ...entry.view, [field]: true };
      publish();
      void Promise.resolve(result).then(finish, () => {
        // Отклонённая async-проверка оставляет окно для повторного действия.
        if (entries.get(id) !== entry || !entry.view.open) {
          return;
        }
        entry.running.delete(confirmed);
        entry.view = { ...entry.view, [field]: false };
        publish();
      });
    }
    else if (callback.length === 0) {
      finish();
    }
    else {
      entry.running.delete(confirmed);
    }
    return true;
  }

  function dismiss(id: number) {
    const entry = entries.get(id);
    if (!entry?.view.open) {
      return;
    }
    const callback = entry.view.config.onCancel;
    close(entry, false);
    // Escape/close/mask уже закрыли dialog; callback не задерживает закрытие.
    void Promise.resolve(callback?.(() => {})).catch(() => {});
  }

  function open(type: ModalConfirmType, config: ModalConfirmConfig): ModalConfirmHandle {
    let resolve!: (confirmed: boolean) => void;
    const completion = new Promise<boolean>(done => { resolve = done; });
    const entry: Entry = {
      view: {
        id: ++nextId,
        type,
        config: { ...config },
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
        // update callback может уничтожить окно или отсоединить holder.
        if (entries.get(entry.view.id) !== entry || !entry.view.open) {
          return;
        }
        entry.view = { ...entry.view, config: { ...entry.view.config, ...changes } };
        publish();
      },
      // oxlint-disable-next-line unicorn/no-thenable -- Hook Modal API возвращает PromiseLike handle.
      then: completion.then.bind(completion)
    };
  }

  function connect() {
    if (state === 'mounted') {
      throw new Error('A modal instance supports one mounted ModalHolder.');
    }
    state = 'mounted';
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
      for (const entry of pending) entry.resolve(false);
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
