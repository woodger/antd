// Переносит popover сообщений в выбранный DOM-контейнер. Видимость и
// CSS-переменные по-прежнему зависят от контекста исходного holder.
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

/** Первый перенос оставляет DOM на месте до подключения, смена уже известной цели меняет key. */
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

  /** Сравнивает DOM-цели независимо от identity getter. */
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

  /** В нативном dialog даже явная цель portal сохраняет проверку исходного top layer. */
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

    /** Удаляет portal только после остановки наблюдения за видимостью. */
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
    /** Сверяет CSS variables после обновления собственного inline слоя поверхности. */
    syncTheme() { portal?.syncTheme(); }
  };
}
