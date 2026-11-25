// Движение панели определяет момент завершения Modal. Маска движется отдельно;
// разворот и удаление dialog отменяют анимации незавершённого перехода.
import type { AliasToken } from './theme-token.types';

type ModalMotionToken = Pick<AliasToken,
  'motion' | 'motionDurationMid' | 'motionDurationSlow' | 'motionEaseOutCirc' | 'motionEaseInOutCirc'>;

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

/** Поддерживает нативный ::backdrop и DOM-маску управляемого dialog. */
export function createModalMotion(dialog: HTMLDialogElement, onSettled: (open: boolean) => void) {
  const documentView = dialog.ownerDocument.defaultView;
  const panel = dialog.querySelector<HTMLElement>(':scope > [data-ant-modal-panel]');
  if (!documentView || !panel) {
    throw new Error('Modal requires a panel in an active document');
  }

  const view = documentView;
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

  /** После нативного закрытия следующее открытие начинает новый переход. */
  function reset() {
    cancel();
    requested = undefined;
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

    const native = dialog.matches(':modal');
    const node = native ? dialog : dialog.querySelector(':scope > [data-ant-modal-mask]');
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
  function sync(open: boolean, token: ModalMotionToken, masked: boolean) {
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
    requested = open;
    const current = revision;

    /** Завершает фазу после DOM update или окончания анимации текущей ревизии. */
    function settle() {
      if (current === revision) {
        panelAnimation?.cancel();
        panelAnimation = undefined;
        onSettled(open);
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
    reset,
    /** Удаляет браузерный listener и отменяет ожидающие завершения. */
    destroy() {
      cancel();
      reducedMotion.removeEventListener('change', handleReducedMotion);
    }
  };
}
