// Владеет отдельным подтверждением, его отложенным рендером и освобождением корня.
import { mount, tick, unmount } from 'svelte';
import ModalStaticHolder from './ModalStaticHolder.svelte';
import { readGlobalConfig, type GlobalConfigProps } from './config-provider-global';
import { registerModalDestroy } from './modal-destroy.dom';
import { readModalLocale } from './modal-locale.dom';
import { runModalAction } from './modal-confirm-action.engine';
import type {
  ModalConfirmType, ModalConfirmation, ModalConfirmationRuntime, ModalStaticConfig, ModalStaticHandle
} from './modal-confirm.types';
import type { Locale } from './types';

export interface ModalStaticOwner {
  readonly confirmation: ModalConfirmation;
  readonly settings: Readonly<GlobalConfigProps>;
  readonly holderRender: GlobalConfigProps['holderRender'];
  readonly locale: Locale;
  readonly document: Document;
  readonly runtime: ModalConfirmationRuntime;
}

type CloseReason = 'destroy' | 'dismiss';

/** Создаёт браузерный корень по запросу и оставляет вызов без побочных эффектов при SSR. */
export function openStaticModal(
  type: ModalConfirmType, config: ModalStaticConfig
): ModalStaticHandle {
  const page = typeof document === 'undefined' ? undefined : document;
  const view = page?.defaultView;
  if (!page || !view) {
    return { destroy() {}, update() {} };
  }

  return createStaticModal(page, view, type, config);
}

/** Разделяет запрошенные настройки и снимок, с которым уже работает панель. */
function createStaticModal(
  page: Document, view: Window, type: ModalConfirmType, initial: ModalStaticConfig
): ModalStaticHandle {
  const target = page.createElement('div');
  // Вычисленные переменные доступны portal только из подключённого CSS-контекста.
  target.dataset.antModalStaticHost = '';
  target.inert = true;
  target.style.setProperty('display', 'none', 'important');
  let current: ModalStaticConfig & { close: () => void; } = {
    ...initial, type, open: true, close: destroy
  };
  const initialSettings = readGlobalConfig();
  let settings = $state.raw(initialSettings);
  let locale = $state.raw(readModalLocale());
  const holderRender = initialSettings.holderRender;
  let confirmation = $state.raw<ModalConfirmation>({
    id: 0, type, config: initial, open: true, pendingOk: false, pendingCancel: false
  });
  let host: ReturnType<typeof ModalStaticHolder> | undefined;
  let timer: number | undefined;
  let panel: HTMLDialogElement | undefined;
  let shown = false;
  let disposed = false;
  let closing: CloseReason | undefined;
  let waitForClose = false;
  let actionRevision = 0;
  const running = new Set<boolean>();
  const actionPending = { pendingOk: false, pendingCancel: false };

  const runtime: ModalConfirmationRuntime = { mounted, act, dismiss, complete };
  const owner: ModalStaticOwner = {
    get confirmation() { return confirmation; },
    get settings() { return settings; },
    get locale() { return locale; },
    holderRender,
    document: page,
    runtime
  };
  let unregister = registerModalDestroy(closeFromRegistry);
  schedule();

  /** Новый вызов или update в том же такте заменяют ещё не выполненный рендер. */
  function schedule() {
    view.clearTimeout(timer);
    timer = view.setTimeout(render);
  }

  /** Снимает регистрацию сразу и даёт закрывающемуся компоненту завершить lifecycle. */
  function dispose() {
    if (disposed) {
      return;
    }

    disposed = true;
    view.clearTimeout(timer);
    timer = undefined;
    unregister?.();
    unregister = undefined;
    panel = undefined;
    const instance = host;
    host = undefined;
    if (instance) {
      void tick().then(() => unmount(instance)).finally(() => target.remove());
    }
    else {
      target.remove();
    }
  }

  /** Любое завершение показа делает результаты прежних действий устаревшими. */
  function invalidateActions() {
    actionRevision++;
    running.clear();
    actionPending.pendingOk = false;
    actionPending.pendingCancel = false;
  }

  /** Регистрирует нативный dialog для закрытия до первого показа и при переносе. */
  function mounted(_id: number, element?: HTMLDialogElement) {
    panel = element;
  }

  /** Настройки глобального провайдера читаются при рендере, holderRender закреплён при вызове. */
  function render() {
    timer = undefined;
    const open = current.open === true;
    if (closing && !open && (!panel?.isConnected || (!panel.open && !waitForClose))) {
      dispose();
      return;
    }
    if (!host && !open) {
      return;
    }

    settings = readGlobalConfig();
    locale = readModalLocale();
    const { afterOpenChange, getContainer } = current;
    confirmation = {
      ...confirmation,
      type: current.type,
      open,
      config: {
        ...current,
        getContainer: getContainer === false ? undefined : getContainer,
        afterOpenChange(visible) {
          shown = visible;
          afterOpenChange?.(visible);
        }
      },
      ...actionPending
    };
    if (!host) {
      try {
        host = mount(ModalStaticHolder, { target, props: { owner } });
      }
      catch (error) {
        dispose();
        throw error;
      }
    }
  }

  /** Запоминает причину до движения панели и закрывает ещё не показанный корень без колбэков. */
  function close(reason: CloseReason) {
    if (disposed || closing) {
      return;
    }

    closing = reason;
    waitForClose = shown || panel?.open === true;
    current = { ...current, open: false };
    invalidateActions();
    if (reason === 'dismiss') {
      confirmation = { ...confirmation, open: false, ...actionPending };
    }
    schedule();
  }

  /** Программное закрытие не вызывает обработчик отмены. */
  function destroy() {
    close('destroy');
  }

  /** destroyAll уже убрал регистрацию из общего стека. */
  function closeFromRegistry() {
    unregister = undefined;
    destroy();
  }

  /** Escape, фон и кнопка закрытия уведомят исходный onCancel после afterClose. */
  function dismiss() {
    close('dismiss');
  }

  /** Вызывает close callbacks показанного снимка до освобождения отдельного корня. */
  function complete() {
    if (disposed || current.open) {
      return;
    }

    shown = false;
    const reason = closing;
    const options = confirmation.config;
    const afterClose = reason ? initial.afterClose : options.afterClose;
    const afterCloseButton = typeof options.closable === 'object'
      ? options.closable.afterClose : undefined;
    try {
      afterCloseButton?.();
      afterClose?.();
      if (reason === 'dismiss') {
        void Promise.resolve(initial.onCancel?.(() => {})).catch(() => {});
      }
      options.afterOpenChange?.(false);
    }
    finally {
      if (reason) {
        dispose();
      }
    }
  }

  /** Использует текущее действие панели и защищает новую видимость от старого Promise. */
  function act(_id: number, confirmed: boolean) {
    const revision = actionRevision;
    const field = confirmed ? 'pendingOk' : 'pendingCancel';
    /** Проверяется после пользовательского callback и при завершении ожидания. */
    function isCurrent() {
      return !disposed && current.open === true && revision === actionRevision;
    }

    if (!isCurrent()) {
      return false;
    }

    return runModalAction(confirmation.config, confirmed, running, {
      isCurrent,
      finish(onClose) {
        if (isCurrent()) {
          destroy();
          onClose?.();
        }
      },
      pending(value) {
        actionPending[field] = value;
        confirmation = { ...confirmation, [field]: value };
      }
    });
  }

  /** Функция заменяет пользовательские поля целиком, внутренний close остаётся за владельцем. */
  function update(patch: Parameters<ModalStaticHandle['update']>[0]) {
    if (disposed) {
      return;
    }

    const before = current;
    const next = typeof patch === 'function' ? patch(before) : { ...before, ...patch };
    if (disposed || before !== current) {
      return;
    }

    if (before.open !== next.open) {
      invalidateActions();
    }
    current = { ...next, close: destroy };
    if (current.open) {
      closing = undefined;
      unregister ??= registerModalDestroy(closeFromRegistry);
    }
    schedule();
  }

  return { destroy, update };
}
