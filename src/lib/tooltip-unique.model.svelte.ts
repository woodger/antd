// Группа владеет одной поверхностью и запросом на её показ. Смена цели во время enter
// ждёт окончания текущего движения, а удалённый участник освобождает свою запись сразу.
import { getContext, onDestroy, setContext } from 'svelte';
import type { ClassValue } from 'svelte/elements';
import type { InlineStyleLayer } from './inline-style.engine';
import type { PopupSourceAlign } from './popup-position.engine';
import type { TooltipSourcePlacement } from './tooltip.engine';
import type { AdjustOverflow, TooltipContent, TooltipPlacement } from './tooltip.types';

export interface TooltipUniqueView {
  readonly kind: 'tooltip' | 'dialog';
  readonly id: string;
  readonly prefix: string;
  readonly direction?: 'ltr' | 'rtl';
  readonly content: TooltipContent;
  readonly available: boolean;
  readonly rootClasses: ClassValue;
  readonly containerClasses: ClassValue;
  readonly backgroundClasses: ClassValue;
  readonly rootLayers: readonly InlineStyleLayer[];
  readonly containerLayers: readonly InlineStyleLayer[];
  readonly presetBackground?: string;
  readonly customColor: boolean;
  readonly anchor?: Element;
  readonly trigger?: Element;
  readonly placement: TooltipPlacement;
  readonly autoAdjustOverflow: boolean | AdjustOverflow;
  readonly sourcePlacement?: TooltipSourcePlacement;
  readonly sourceAlign?: PopupSourceAlign;
  readonly placements: Readonly<Record<string, PopupSourceAlign>>;
  readonly gap?: number;
  readonly motion: boolean;
  readonly defaultMotionName: string;
  readonly motionName?: string;
  readonly ariaLabel?: string;
  readonly ariaLabelledby?: string;
  readonly ariaDescribedby?: string;
  readonly ariaBusy?: boolean;
  readonly outsideEvents?: 'pointer' | 'mouse';
  onDismiss: (reason: 'escape' | 'outside') => void;
  onHoverChange?: (next: boolean) => void;
  onFocusIn?: (event: FocusEvent) => void;
  onFocusOut?: (event: FocusEvent) => void;
  onHidden?: () => void;
  onTransfer?: (element: HTMLDivElement) => void;
}

export interface TooltipUniqueOwner {
  readonly view: TooltipUniqueView;
  readonly context: Map<unknown, unknown>;
  isOpen: () => boolean;
}

export interface TooltipUniqueSurface {
  getPopupElement: () => HTMLDivElement | undefined;
  isShowing: () => boolean;
  forceAlign: () => void;
}

const key = Symbol('ant-tooltip-unique');

/** Возвращает ближайшую группу при инициализации участника. */
export function useTooltipUnique() {
  return getContext<TooltipUnique | undefined>(key);
}

/** Содержимое панели не переиспользует поверхность своего родителя. */
export function isolateTooltipUnique() {
  setContext(key, undefined);
}

/** Popup внутри другой нативной поверхности сохраняет собственный Escape и top layer. */
export function hasTooltipPopupAncestor(anchor: Element | undefined) {
  let node = anchor;
  while (node) {
    if (node.closest('[popover]')) return true;
    const root = node.getRootNode();
    node = 'host' in root ? (root as ShadowRoot).host : undefined;
  }
  return false;
}

/** Хранит последний запрос группы и удерживает только одного владельца содержимого. */
export function provideTooltipUnique(getSurface: () => TooltipUniqueSurface | undefined) {
  let owner = $state.raw<TooltipUniqueOwner>();
  let open = $state(false);
  let ready = $state(false);
  let active = true;
  let entering = false;
  let queued: TooltipUniqueOwner | undefined;
  let scheduled: { owner: TooltipUniqueOwner; open: boolean; } | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  // Инвалидирует также запрос с нулевой задержкой, ожидающий конца обновления Svelte.
  function cancel() {
    clearTimeout(timer);
    timer = undefined;
    scheduled = undefined;
  }

  // Возвращает признак снятого показа, который мог удерживать предыдущую панель.
  function discardPending(target: TooltipUniqueOwner) {
    const pending = scheduled?.owner === target ? scheduled : undefined;
    const wasNext = queued === target || pending?.open === true;
    if (pending) cancel();
    if (queued === target) queued = undefined;

    return wasNext;
  }

  // Оставляет старый контент на экране до завершения первого enter.
  function show(next: TooltipUniqueOwner) {
    if (open && entering && owner !== next) {
      queued = next;
      return;
    }

    queued = undefined;
    if (!open) entering = true;
    owner = next;
    open = true;
  }

  // Раннее закрытие предыдущего участника не сбрасывает ожидающий показ следующего.
  function request(target: TooltipUniqueOwner, next: boolean, delay: number) {
    if (!active) return;

    if (next && owner === target && open) {
      cancel();
      queued = undefined;
      return;
    }

    let requestedOwner = target;
    if (!next) {
      const canceledShow = discardPending(target);
      const current = owner;
      if (!current || current !== target && !canceledShow || scheduled?.open || queued
        || current.isOpen()) {
        return;
      }

      requestedOwner = current;
    }

    cancel();
    const change = { owner: requestedOwner, open: next };
    scheduled = change;

    // Проверяет актуальное состояние после задержки и перед обращением к владельцу.
    function apply() {
      if (scheduled !== change) return;

      cancel();
      if (next) {
        if (requestedOwner.isOpen()) {
          show(requestedOwner);
        }
        else if (!queued && owner && !owner.isOpen()) {
          open = false;
        }
      }
      else if (owner === requestedOwner && !requestedOwner.isOpen() && !queued) {
        open = false;
      }
    }

    if (delay > 0) timer = setTimeout(apply, delay);
    else queueMicrotask(apply);
  }

  onDestroy(() => {
    active = false;
    cancel();
    queued = undefined;
  });

  const group = {
    // Владелец сохраняет идентичность, даже если его props или DOM-цель обновляются.
    get owner() { return owner; },
    // Переключение между открытыми участниками сохраняет видимость общей поверхности.
    get open() { return open; },
    // Фон движется после завершения zoom входа, а при уходе сохраняет расчётную позицию.
    get ready() { return ready; },
    request,
    // Снимает все ссылки на уничтоженный участник, включая отложенные показы.
    release(target: TooltipUniqueOwner) {
      if (!active) return;

      const canceledShow = discardPending(target);
      if (owner !== target) {
        if (canceledShow && owner && !scheduled?.open && !queued) request(owner, false, 0);
        return;
      }

      const replacement = queued;
      entering = false;
      queued = undefined;
      if (replacement?.isOpen()) {
        show(replacement);
      }
      else {
        open = false;
        ready = false;
        owner = undefined;
      }
    },
    // Применяет последний запрос, поступивший во время анимации входа.
    settled(visible: boolean) {
      if (!active) return;

      entering = false;
      ready = visible;
      const next = queued;
      queued = undefined;
      if (!visible || !next) return;

      if (next.isOpen()) {
        show(next);
      }
      else if (owner && !scheduled?.open) {
        request(owner, false, 0);
      }
    },
    // Ref и выравнивание привязаны к владельцу, с которым теперь соединён DOM.
    surfaceFor(target: TooltipUniqueOwner) {
      return owner === target ? getSurface() : undefined;
    }
  };
  setContext(key, group);
  return group;
}

export type TooltipUnique = ReturnType<typeof provideTooltipUnique>;
