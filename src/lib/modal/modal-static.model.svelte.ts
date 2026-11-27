// He has a separate confirmation, his postponed render and the liberation of the root.
import { mount, tick, unmount } from 'svelte';
import ModalStaticHolder from './ModalStaticHolder.svelte';
import { readGlobalConfig, type GlobalConfigProps } from '../config-provider-global';
import { registerModalDestroy } from './modal-destroy.dom';
import { readModalLocale } from './modal-locale.dom';
import { runModalAction } from './modal-confirm-action.engine';
import type {
  ModalConfirmType, ModalConfirmation, ModalConfirmationRuntime, ModalStaticConfig, ModalStaticHandle
} from './modal-confirm.types';
import type { Locale } from '../types';

export interface ModalStaticOwner {
  readonly confirmation: ModalConfirmation;
  readonly settings: Readonly<GlobalConfigProps>;
  readonly holderRender: GlobalConfigProps['holderRender'];
  readonly locale: Locale;
  readonly document: Document;
  readonly runtime: ModalConfirmationRuntime;
}

type CloseReason = 'destroy' | 'dismiss';

/** Creates a browser root on request and leaves a call without side effects at SSR. */
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

/** Separates the requested settings and the shot with which the panel is already working. */
function createStaticModal(
  page: Document, view: Window, type: ModalConfirmType, initial: ModalStaticConfig
): ModalStaticHandle {
  const target = page.createElement('div');
  // Calculated variables are only available from connected CSS-context.
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

  /** A new call or update in the same tick replaces a render that has not run yet. */
  function schedule() {
    view.clearTimeout(timer);
    timer = view.setTimeout(render);
  }

  /** Removes the registration immediately and gives the closing component to complete the lifecycle. */
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

  /** Any completion of the show makes the results of previous actions obsolete. */
  function invalidateActions() {
    actionRevision++;
    running.clear();
    actionPending.pendingOk = false;
    actionPending.pendingCancel = false;
  }

  /** Registers a native dialog for closing before the first impression and when transferred. */
  function mounted(_id: number, element?: HTMLDialogElement) {
    panel = element;
  }

  /** The settings of the global provider are recited at the render, holderRender is fixed when calling. */
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

  /** Remembers the cause before the panel moves and closes the root not yet shown without flasks. */
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

  /** The software closure does not cause a cancellation handler. */
  function destroy() {
    close('destroy');
  }

  /** destroyAll has already removed the registration from the general stack. */
  function closeFromRegistry() {
    unregister = undefined;
    destroy();
  }

  /** Escape, background and closing button will notify the original onCancel after afterClose. */
  function dismiss() {
    close('dismiss');
  }

  /** Causes close callbacks shown picture before the release of a separate root. */
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

  /** Uses the current action of the panel and protects the new visibility from the old Promise. */
  function act(_id: number, confirmed: boolean) {
    const revision = actionRevision;
    const field = confirmed ? 'pendingOk' : 'pendingCancel';
    /** Is checked after the custom callback and at the end of the wait. */
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

  /** The function replaces the custom fields entirely, the internal close remains with the owner. */
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
