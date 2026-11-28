import { onMount, untrack } from 'svelte';
import { on } from 'svelte/events';
import { useConfig } from '../config-provider/config-context';
import type { GetContainer, GetPopupContainer } from '../types';
import { connectPopupPortal } from '../popup/popup-portal.dom';

interface DialogContainerOptions {
  component: 'modal' | 'drawer' | 'image';
  open: boolean;
  getContainer?: GetContainer;
  getPopupContainer?: GetPopupContainer;
  resolveWhenClosed?: boolean;
  portalByDefault?: boolean;
  style?: string;
  onPointerDown?: (event: PointerEvent) => void;
  onPointerUp?: (event: PointerEvent) => void;
  onPointerCancel?: () => void;
}

/** The first move preserves the SSR DOM. Later target changes recreate the panel like a portal. */
export function createDialogContainer(getOptions: () => DialogContainerOptions) {
  const config = useConfig();
  let target = $state.raw<Element | DocumentFragment | false>();
  let revision = $state(0);
  let connected = $state(false);
  let connection = $state.raw<ReturnType<typeof connectPopupPortal>>();
  let initialized = false;
  let currentRevision = 0;
  let activeNode: HTMLDialogElement | undefined;
  let mounted = $state(false);
  const portalByDefault = $derived(getOptions().portalByDefault === true);
  onMount(() => { mounted = true; });

  $effect(() => {
    if (!mounted) {
      return;
    }
    const options = getOptions();
    if (!options.open && options.resolveWhenClosed === false) {
      return;
    }

    // The target may mount in the same DOM update as open.
    const choice = options.getContainer;
    let next: Element | DocumentFragment | false | undefined;
    if (choice === undefined) {
      const getter = options.getPopupContainer;
      next = getter
        ? (options.component === 'drawer' ? getter(document.body) : getter()) ?? document.body
        : undefined;
    }
    else if (choice === false) {
      next = false;
    }
    else if (typeof choice === 'string') {
      next = (choice ? document.querySelector(choice) : null) ?? document.body;
    }
    else {
      next = (typeof choice === 'function' ? choice() : choice) ?? document.body;
    }

    if (initialized && next !== untrack(() => target)) revision = ++currentRevision;
    initialized = true;
    target = next;
  });

  $effect(() => {
    void getOptions().style;
    const current = connection;
    if (current) queueMicrotask(() => current.syncTheme());
  });

  function attach(node: HTMLDialogElement) {
    const container = target;
    return untrack(() => {
      const component = getOptions().component;
      const nodeRevision = currentRevision;
      activeNode = node;
      const document = node.ownerDocument;
      const view = document.defaultView!;
      const marker = document.createComment('dialog-container');
      const origin = node.parentElement ?? node;
      node.before(marker);
      let explicitPortal: (() => void) | undefined;
      const staticHost = origin.closest<HTMLElement>('[data-ant-modal-static-host]');

      /** Attaches the CSS context after moving the panel, so an early panelRef still points to a detached node. */
      function connectStaticOrigin() {
        if (staticHost && !staticHost.isConnected) document.body.append(staticHost);
      }

      /** Moves the existing DOM while retaining the owner's inline CSS variables. */
      function attachPortal(destination: Element | DocumentFragment) {
        const current = connectPopupPortal(node, {
          getPopupContainer: () => destination,
          origin,
          marker,
          autoLock: false,
          prepareOrigin: staticHost ? connectStaticOrigin : undefined,
          preservePointerEvents: component === 'image',
          // Cleanup of the old keyed panel leaves the DOM being removed out of the original branch.
          get restoreOnDestroy() { return node.isConnected && nodeRevision === currentRevision; },
          get preserveVariables() {
            const style = document.createElement('span').style;
            style.cssText = getOptions().style ?? '';
            return [
              '--ant-svelte-drawer-size',
              ...Array.from(style).filter(name => name.startsWith('--'))
            ];
          }
        });
        connection = current;

        return () => {
          current();
          if (connection === current) connection = undefined;
        };
      }

      if (container) {
        explicitPortal = attachPortal(container);
      }
      else if (container === undefined && component === 'image') {
        // Move the preview before showModal and keep nested viewers in their host dialog.
        const destination = origin.closest('dialog') ?? document.body;
        explicitPortal = attachPortal(destination);
      }
      else if (container === undefined) {
        $effect(() => {
          if (portalByDefault) {
            // The nearest dialog keeps a nested panel within its own focus scope.
            const destination = origin.closest('dialog') ?? document.body;
            return untrack(() => attachPortal(destination));
          }
        });
      }

      let lock: HTMLStyleElement | undefined;
      let lockNonce: string | undefined;

      function sync() {
        const nonce = config.csp?.nonce;
        // The hidden static root is required for CSSOM. The dialog can appear after it is moved.
        connected = node.isConnected && !node.closest('[data-ant-modal-static-host]');
        // Document :has() cannot see a modal in a ShadowRoot. Native modality still applies.
        const shadowModal = node.isConnected && node.open
          && !node.hasAttribute('data-ant-dialog-unlocked')
          && node.getRootNode() instanceof ShadowRoot;
        if (shadowModal && (!lock || lockNonce !== nonce)) {
          const next = document.createElement('style');
          if (nonce !== undefined) next.nonce = nonce;
          next.dataset.antDialogLock = '';
          next.textContent = 'html { overflow: hidden; }';
          // The policy is checked when a new style element is inserted with the current nonce.
          if (lock) {
            lock.replaceWith(next);
          }
          else {
            document.head.append(next);
          }
          lock = next;
          lockNonce = nonce;
        }
        else if (!shadowModal && lock) {
          lock.remove();
          lock = undefined;
        }
      }
      const observer = new view.MutationObserver(sync);
      observer.observe(node, {
        attributes: true,
        attributeFilter: ['open', 'data-ant-dialog-unlocked']
      });
      // The container may be temporarily detached or may be a DocumentFragment pending insertion by the owner.
      if (container) observer.observe(document, { childList: true, subtree: true });
      sync();
      $effect(sync);
      // Child handlers run inside the shadow boundary with the original native event targets.
      const listeners = [
        'click', 'keydown', 'keyup', 'focusin', 'focusout'
      ].map(type => on(node, type, () => {}));
      // The root handler also needs the native target before retargeting to the ShadowRoot host.
      listeners.push(
        on(node, 'pointerdown', event => getOptions().onPointerDown?.(event)),
        on(node, 'pointerup', event => getOptions().onPointerUp?.(event)),
        on(node, 'pointercancel', () => getOptions().onPointerCancel?.())
      );

      return () => {
        observer.disconnect();
        for (const remove of listeners) remove();
        lock?.remove();
        explicitPortal?.();
        marker.remove();
        if (activeNode === node) {
          activeNode = undefined;
          connected = false;
        }
      };
    });
  }

  return {
    get key() { return revision; },
    get target() { return target; },
    get connected() { return connected; },
    attach
  };
}
