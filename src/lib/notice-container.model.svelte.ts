// Move the popover messages to the selected DOM-container. Visibility and CSS variables still
// depend on the context of the original holder.
import { untrack } from 'svelte';
import { getInlineStyleDeclarations, type InlineStyleLayer } from './inline-style.engine';
import { connectNoticeSurface } from './notice.dom';
import { connectPopupPortal } from './popup-portal.dom';

type NoticeContainer = HTMLElement | ShadowRoot;
type GetNoticeContainer = () => NoticeContainer | null | undefined;

interface NoticeContainerOptions {
  getContainer?: GetNoticeContainer;
  getPopupContainer?: GetNoticeContainer;
}

interface NoticeSurface {
  node?: HTMLDivElement;
  onVisible: (visible: boolean) => void;
}

/** The first transfer leaves DOM in place until the connection, the change of the already known purpose changes the key. */
export function createNoticeContainer(
  readOrigin: () => HTMLElement | undefined,
  readOptions: () => NoticeContainerOptions,
  readSurface: () => NoticeSurface,
  readStyles: () => readonly InlineStyleLayer[]
) {
  let target = $state.raw<NoticeContainer>();
  let containerKey = $state(0);
  let resolved = false;
  let portal = $state.raw<ReturnType<typeof connectPopupPortal>>();

  /** Compares DOM goals regardless of identity getter. */
  function setContainer(next: NoticeContainer | undefined) {
    if (resolved && target !== next) {
      containerKey++;
    }
    resolved = true;
    target = next;
  }

  $effect(() => {
    const origin = readOrigin();
    if (!origin) {
      return;
    }

    const { getContainer, getPopupContainer } = readOptions();
    const destination = getContainer?.() ?? getPopupContainer?.()
      ?? (getContainer || getPopupContainer ? origin.ownerDocument.body : undefined);
    untrack(() => setContainer(destination));
  });

  /** In native dialog, even a clear goal portal retains the test of the original top layer. */
  function connect(node: HTMLDivElement, origin: HTMLElement, onVisible: NoticeSurface['onVisible']) {
    const destination = target;
    if (!destination) {
      return connectNoticeSurface(node, origin, onVisible);
    }

    const revision = containerKey;
    const marker = node.ownerDocument.createComment('notice-container');
    node.before(marker);
    const connection = connectPopupPortal(node, {
      getPopupContainer: () => destination,
      origin,
      marker,
      autoLock: false,
      preservePointerEvents: true,
      get restoreOnDestroy() { return node.isConnected && revision === containerKey; },
      get preserveVariables() {
        const properties = Array.from(getInlineStyleDeclarations(readStyles()), item => item.property);
        return [...properties, '--ant-svelte-notice-viewport-top', '--ant-svelte-notice-viewport-height'];
      }
    });
    portal = connection;
    const disconnect = connectNoticeSurface(node, origin, onVisible);

    /** Removes the portal only after the visibility observation stops. */
    return () => {
      disconnect();
      connection();
      marker.remove();
      if (portal === connection) portal = undefined;
    };
  }

  $effect(() => {
    const { node, onVisible } = readSurface();
    const origin = readOrigin();
    void target;
    if (node && origin) {
      return untrack(() => connect(node, origin, onVisible));
    }
  });

  return {
    get key() { return containerKey; },
    /** Verifies CSS variables after updating your own inline surface layer. */
    syncTheme() { portal?.syncTheme(); }
  };
}
