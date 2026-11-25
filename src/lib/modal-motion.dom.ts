// Выбирает штатное движение или CSS-фазы на границе перехода. Только панель определяет
// окончание открытия и закрытия Modal. Маска может закончить свою фазу самостоятельно.
import type { CssMotionState } from './css-motion.dom';
import type { CssMotionEvent } from './css-motion.types';
import { createModalNamedMotion } from './modal-named-motion.dom';
import { getModalMousePoint, getModalTransformOrigin } from './modal-origin.dom';
import type { ModalMousePosition } from './modal.types';
import type { AliasToken } from './theme-token.types';

type ModalMotionToken = Pick<AliasToken,
  'motion' | 'motionDurationMid' | 'motionDurationSlow' | 'motionEaseOutCirc' | 'motionEaseInOutCirc'>;

export type ModalMotionPart = 'panel' | 'mask';

export interface ModalMotionSettings {
  token: ModalMotionToken;
  named: boolean;
  masked: boolean;
  forceRender: boolean;
  rootPrefix: string;
  transitionName?: string;
  maskTransitionName?: string;
  mousePosition?: ModalMousePosition | null;
}

export interface ModalMotionCallbacks {
  settled(open: boolean): void;
  paint(part: ModalMotionPart, state: CssMotionState, commit?: boolean): void;
  origin(value: string | undefined): void;
}

const hiddenPanel = { transform: 'scale(0.2)', opacity: '0' };
const shownPanel = { transform: 'scale(1)', opacity: '1' };

/** Преобразует канонические токены длительности в миллисекунды для Web Animations. */
function getDurationMs(value: string, fallback: number): number {
  const match = value.trim().match(/^(\d*\.?\d+)(ms|s)$/);
  if (!match) {
    return fallback;
  }

  const milliseconds = Number(match[1]) * (match[2] === 's' ? 1000 : 1);
  return Number.isFinite(milliseconds) ? milliseconds : fallback;
}

/** Штатные эффекты используют WAAPI для панели и текущей поверхности маски. */
function createModalStockMotion(
  dialog: HTMLDialogElement,
  view: Window & typeof globalThis,
  callbacks: ModalMotionCallbacks,
  getMask: () => HTMLElement | undefined
) {
  const panel = dialog.querySelector<HTMLElement>(':scope > [data-ant-modal-panel]');
  if (!panel) {
    throw new Error('Modal requires a panel');
  }

  const surface = panel;
  const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)');
  let requested: boolean | undefined;
  let panelAnimation: Animation | undefined;
  let maskAnimation: Animation | undefined;
  let revision = 0;

  /** Снимает эффекты и делает их ожидающие callbacks устаревшими. */
  function cancel() {
    revision++;
    panelAnimation?.cancel();
    maskAnimation?.cancel();
    panelAnimation = undefined;
    maskAnimation = undefined;
  }

  /** Отключение движения доводит текущую панель до запрошенной видимости. */
  function finish() {
    panelAnimation?.finish();
    maskAnimation?.finish();
  }

  /** При смене системной настройки сохраняет ожидающее уведомление панели. */
  function handleReducedMotion() {
    if (reducedMotion.matches) finish();
  }

  /** Начальный кадр разворота считывается до отмены предыдущего эффекта. */
  function panelStart(open: boolean): Keyframe {
    if (open && !panelAnimation) {
      return hiddenPanel;
    }

    const { transform, opacity } = view.getComputedStyle(surface);
    return { transform, opacity };
  }

  /** Выбирает физическую маску текущего режима и её начальную прозрачность. */
  function maskStart(open: boolean, masked: boolean) {
    if (!masked) {
      return undefined;
    }

    const mask = getMask();
    const surface = mask?.hasAttribute('data-ant-modal-mask') ? mask : undefined;
    const native = !surface && dialog.matches(':modal');
    const node = native ? dialog : surface;
    if (!node || native && !('pseudoElement' in view.KeyframeEffect.prototype)) {
      return undefined;
    }

    const pseudoElement = native ? '::backdrop' : undefined;
    const opacity = open && !maskAnimation ? '0' : view.getComputedStyle(node, pseudoElement).opacity;
    return { node, pseudoElement, opacity };
  }

  /** Убирает fill маски после собственного перехода, даже если панель ещё движется. */
  function animateMask(mask: NonNullable<ReturnType<typeof maskStart>>, duration: number, open: boolean) {
    const animation = mask.node.animate([{ opacity: mask.opacity }, { opacity: open ? 1 : 0 }], {
      duration,
      pseudoElement: mask.pseudoElement,
      fill: 'both'
    });
    maskAnimation = animation;

    /** Старый эффект не очищает маску нового перехода. */
    function release() {
      if (maskAnimation === animation) {
        maskAnimation = undefined;
        animation.cancel();
      }
    }

    void animation.finished.then(release, release);
  }

  /** Планирует только последний запрошенный переход. Маска не задерживает callback панели. */
  function sync(open: boolean, options: ModalMotionSettings) {
    const { token, masked, mousePosition } = options;
    const enabled = token.motion && !reducedMotion.matches;
    if (requested === open) {
      if (!enabled) finish();
      return;
    }

    const maskDuration = getDurationMs(token.motionDurationMid, 200);
    const panelDuration = open ? getDurationMs(token.motionDurationSlow, 300) : maskDuration;
    const from = enabled && panelDuration > 0 ? panelStart(open) : undefined;
    const mask = enabled && maskDuration > 0 ? maskStart(open, masked) : undefined;
    cancel();
    if (open) {
      const point = getModalMousePoint(dialog.ownerDocument, mousePosition);
      callbacks.origin(getModalTransformOrigin(surface, point));
    }
    requested = open;
    const current = revision;

    /** Завершает фазу после DOM update или окончания анимации текущей ревизии. */
    function settle() {
      if (current === revision) {
        panelAnimation?.cancel();
        panelAnimation = undefined;
        callbacks.settled(open);
      }
    }

    if (mask) animateMask(mask, maskDuration, open);
    if (!from) {
      queueMicrotask(settle);
      return;
    }

    const animation = surface.animate([from, open ? shownPanel : hiddenPanel], {
      duration: panelDuration,
      easing: open ? token.motionEaseOutCirc : token.motionEaseInOutCirc,
      fill: 'both'
    });
    panelAnimation = animation;
    // Внешняя отмена эффекта завершает видимость. Разворот уже сменил ревизию.
    void animation.finished.then(settle, settle);
  }

  reducedMotion.addEventListener('change', handleReducedMotion);
  return {
    sync,
    /** Удаляет браузерный listener и отменяет ожидающие завершения. */
    destroy() {
      cancel();
      reducedMotion.removeEventListener('change', handleReducedMotion);
    }
  };
}

/** При смене режима отменяет старый движок до запуска новой фазы. */
export function createModalMotion(dialog: HTMLDialogElement, callbacks: ModalMotionCallbacks) {
  const documentView = dialog.ownerDocument.defaultView;
  if (!documentView) {
    throw new Error('Modal requires an active document');
  }
  const view = documentView;
  type Driver = { named: true; connection: ReturnType<typeof createModalNamedMotion> }
    | { named: false; connection: ReturnType<typeof createModalStockMotion> };
  let driver: Driver | undefined;
  let requested: boolean | undefined;

  /** Маска с пользовательским z-index остаётся внутри своего слоя. */
  function getMask() {
    const selector = ':scope > [data-ant-modal-backdrop], :scope > [data-ant-modal-mask-layer] > [data-ant-modal-backdrop]';
    return dialog.querySelector<HTMLElement>(selector) ?? undefined;
  }

  /** Новый набор имён в открытом Modal применяется к следующей смене видимости. */
  function sync(open: boolean, options: ModalMotionSettings) {
    if (!driver || (requested !== open && driver.named !== options.named)) {
      driver?.connection.destroy();
      driver = options.named
        ? { named: true, connection: createModalNamedMotion(dialog, view, requested, callbacks, getMask) }
        : { named: false, connection: createModalStockMotion(dialog, view, callbacks, getMask) };
    }
    requested = open;
    driver.connection.sync(open, options);
  }

  /** Нативное закрытие отменяет панель. Именованная маска может оставаться в leave. */
  function closed() {
    if (!driver?.named || requested !== false) {
      driver?.connection.destroy();
      driver = undefined;
    }
    requested = false;
  }

  /** Размонтирование скрытой панели сбрасывает её историю appear/enter. */
  function reset() {
    driver?.connection.destroy();
    driver = undefined;
    requested = undefined;
  }

  return {
    sync,
    closed,
    reset,
    /** События CSS обрабатывает только текущий именованный переход. */
    end(part: ModalMotionPart, event: CssMotionEvent) {
      if (driver?.named) driver.connection.end(part, event);
    }
  };
}
