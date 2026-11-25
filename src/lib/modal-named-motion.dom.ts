// Переносит фазы именованных переходов Modal на отдельные DOM-узлы панели и маски.
import { createCssMotion, type CssMotionState } from './css-motion.dom';
import { createCssMotionFrame } from './css-motion-frame.dom';
import type { CssMotionEvent } from './css-motion.types';
import type { ModalMotionCallbacks, ModalMotionSettings, ModalMotionPart } from './modal-motion.dom';
import { getModalMousePoint, getModalTransformOrigin } from './modal-origin.dom';
import type { ModalMousePosition } from './modal.types';

/** Следит за отменой и заменой CSS, в том числе если для имени нет активных правил. */
function createModalCssSurface(
  view: Window,
  getElement: () => HTMLElement | undefined,
  publish: (state: CssMotionState, commit?: boolean) => void
) {
  const frame = createCssMotionFrame(view);
  const motion = createCssMotion(view, getElement, paint);

  /** Отсутствие собственного эффекта завершает фазу после применения классов. */
  function checkForEffect() {
    frame.next(() => {
      if (!getElement()?.getAnimations().length) {
        motion.end({ deadline: true });
      }
    });
  }

  /** Синхронизирует только текущую CSS-фазу и снимает проверку старого кадра. */
  function paint(state: CssMotionState, commit?: boolean) {
    frame.cancel();
    publish(state, commit);
    if (state.step === 'active') checkForEffect();
  }

  return {
    sync: motion.sync,
    /** End от потомков отбрасывает CSSMotion, отмену перепроверяем в следующем кадре. */
    end(event: CssMotionEvent) {
      if ('type' in event && event.type.endsWith('cancel')) {
        if (event.target === getElement()) checkForEffect();
      }
      else {
        motion.end(event);
      }
    },
    /** Снимает фазы до передачи управления другому способу показа. */
    destroy() {
      frame.cancel();
      motion.destroy();
      publish({});
    }
  };
}

/** После закрытия панели mask CSS может завершаться на том же DOM самостоятельно. */
export function createModalNamedMotion(
  dialog: HTMLDialogElement,
  view: Window,
  initial: boolean | undefined,
  callbacks: ModalMotionCallbacks
) {
  const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)');
  const panel = createModalCssSurface(view, getPanel, (state, commit) =>
    callbacks.paint('panel', state, commit));
  const mask = createModalCssSurface(view, getMask, (state, commit) =>
    callbacks.paint('mask', state, commit));
  let requested: boolean | undefined = initial;
  let current: ModalMotionSettings | undefined;
  let origin: ModalMousePosition | undefined;

  /** Панель может размонтироваться раньше маски при destroyOnHidden. */
  function getPanel() {
    return dialog.querySelector<HTMLElement>(':scope > [data-ant-modal-panel]') ?? undefined;
  }

  /** Для именованной маски вместо ::backdrop используется реальный DOM-узел. */
  function getMask() {
    return dialog.querySelector<HTMLElement>(':scope > [data-ant-modal-backdrop]') ?? undefined;
  }

  /** Измеряет неанимированный кадр, используя точку, сохранённую при запросе открытия. */
  function prepare(element: HTMLElement) {
    callbacks.origin(getModalTransformOrigin(element, origin));
  }

  /** Движение маски начинается отдельно. Только панель сообщает о видимости Modal. */
  function sync(open: boolean, options: ModalMotionSettings) {
    if (open && requested !== open) {
      origin = getModalMousePoint(dialog.ownerDocument, options.mousePosition);
    }
    requested = open;
    current = options;

    const enabled = options.token.motion && !reducedMotion.matches;
    const maskName = options.maskTransitionName ?? `${options.rootPrefix}-fade`;
    mask.sync({
      motion: { motionName: maskName },
      present: Boolean(getMask()), visible: open && options.masked,
      initialVisibility: initial === true && options.masked ? true : undefined,
      enabled, settleOnCutoff: true
    });

    const panelName = options.transitionName ?? `${options.rootPrefix}-zoom`;
    panel.sync({
      motion: {
        motionName: panelName,
        onAppearPrepare: prepare,
        onEnterPrepare: prepare,
        onVisibleChanged: callbacks.settled
      },
      present: Boolean(getPanel()), visible: open,
      initialVisibility: initial, forced: options.forceRender,
      enabled, settleOnCutoff: true
    });
  }

  /** Переключение reduced motion применимо и к маске, которая ещё выходит. */
  function syncPreference() {
    if (current && requested !== undefined) sync(requested, current);
  }

  reducedMotion.addEventListener('change', syncPreference);
  return {
    sync,
    /** Завершение одной поверхности не меняет фазу другой. */
    end(part: ModalMotionPart, event: CssMotionEvent) {
      (part === 'panel' ? panel : mask).end(event);
    },
    /** Удаляет обе фазы и browser listener до размонтирования либо смены режима. */
    destroy() {
      reducedMotion.removeEventListener('change', syncPreference);
      panel.destroy();
      mask.destroy();
    }
  };
}
