import { onMount, untrack } from 'svelte';
import { on } from 'svelte/events';
import type { GetContainer, GetPopupContainer } from './types';
import { connectPopupPortal } from './popup-portal.dom';

interface DialogContainerOptions {
  component: 'modal' | 'drawer';
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

/** Первый перенос сохраняет SSR DOM; последующая смена target пересоздаёт panel, как portal. */
export function createDialogContainer(getOptions: () => DialogContainerOptions) {
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

    // Цель может монтироваться в том же DOM-обновлении, что и open.
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

    if (initialized && next !== target) revision = ++currentRevision;
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
      const nodeRevision = currentRevision;
      activeNode = node;
      const document = node.ownerDocument;
      const view = document.defaultView!;
      const marker = document.createComment('dialog-container');
      const origin = node.parentElement ?? node;
      node.before(marker);
      let explicitPortal: (() => void) | undefined;

      /** Переносит тот же DOM и оставляет владельцу его inline CSS variables. */
      function attachPortal(destination: Element | DocumentFragment) {
        const current = connectPopupPortal(node, {
          getPopupContainer: () => destination,
          origin,
          marker,
          autoLock: false,
          // Cleanup старого keyed panel не возвращает удаляемый DOM в исходную ветку.
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
      else if (container === undefined) {
        $effect(() => {
          if (portalByDefault) {
            // Ближайший dialog удерживает вложенную панель в своём focus scope.
            const destination = origin.closest('dialog') ?? document.body;
            return untrack(() => attachPortal(destination));
          }
        });
      }

      let lock: HTMLStyleElement | undefined;

      function sync() {
        connected = node.isConnected;
        // :has() в document не видит modal внутри ShadowRoot; модальность остаётся нативной.
        const shadowModal = node.isConnected && node.open
          && !node.hasAttribute('data-ant-dialog-unlocked')
          && node.getRootNode() instanceof ShadowRoot;
        if (shadowModal && !lock) {
          lock = document.createElement('style');
          lock.dataset.antDialogLock = '';
          lock.textContent = 'html { overflow: hidden; }';
          document.head.append(lock);
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
      // Контейнер может быть временно отключён или быть DocumentFragment до вставки владельцем.
      if (container) observer.observe(document, { childList: true, subtree: true });
      sync();
      // Child handlers выполняются внутри shadow boundary с исходными native event targets.
      const listeners = [
        'click', 'keydown', 'keyup', 'focusin', 'focusout'
      ].map(type => on(node, type, () => {}));
      // Root handler тоже должен получить native target до retargeting на ShadowRoot host.
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
