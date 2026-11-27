// Carries the phases of the named transitions Modal to the separate DOM-nodes of the panel and masks.
import { createCssMotion, type CssMotionState } from '../motion/css-motion.dom';
import { createCssMotionFrame } from '../motion/css-motion-frame.dom';
import type { CssMotionEvent } from '../motion/css-motion.types';
import type { ModalMotionCallbacks, ModalMotionSettings, ModalMotionPart } from './modal-motion.dom';
import { getModalMousePoint, getModalTransformOrigin } from './modal-origin.dom';
import type { ModalMousePosition } from './modal.types';

/** Monitors the cancellation and replacement of CSS, including if there are no active rules for the name. */
function createModalCssSurface(
  view: Window,
  getElement: () => HTMLElement | undefined,
  publish: (state: CssMotionState, commit?: boolean) => void
) {
  const frame = createCssMotionFrame(view);
  const motion = createCssMotion(view, getElement, paint);

  /** Lack of one's own effect completes the phase after class application. */
  function checkForEffect() {
    frame.next(() => {
      if (!getElement()?.getAnimations().length) {
        motion.end({ deadline: true });
      }
    });
  }

  /** Synchronizes only the current CSS-phase and removes the test of the old frame. */
  function paint(state: CssMotionState, commit?: boolean) {
    frame.cancel();
    publish(state, commit);
    if (state.step === 'active') checkForEffect();
  }

  return {
    sync: motion.sync,
    /** End from the descendants drops CSSMotion, the cancellation is rechecked in the next frame. */
    end(event: CssMotionEvent) {
      if ('type' in event && event.type.endsWith('cancel')) {
        if (event.target === getElement()) checkForEffect();
      }
      else {
        motion.end(event);
      }
    },
    /** Clears phases before handing control to a different visibility mechanism. */
    destroy() {
      frame.cancel();
      motion.destroy();
      publish({});
    }
  };
}

/** After closing the mask CSS panel can be completed on the same DOM on its own. */
export function createModalNamedMotion(
  dialog: HTMLDialogElement,
  view: Window,
  initial: boolean | undefined,
  callbacks: ModalMotionCallbacks,
  getMask: () => HTMLElement | undefined
) {
  const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)');
  const panel = createModalCssSurface(view, getPanel, (state, commit) =>
    callbacks.paint('panel', state, commit));
  const mask = createModalCssSurface(view, getMask, (state, commit) =>
    callbacks.paint('mask', state, commit));
  let requested: boolean | undefined = initial;
  let current: ModalMotionSettings | undefined;
  let origin: ModalMousePosition | undefined;

  /** The panel can be mounted before the mask at destroyOnHidden. */
  function getPanel() {
    return dialog.querySelector<HTMLElement>(':scope > [data-ant-modal-panel]') ?? undefined;
  }

  /** Measures the unanimated frame using the point saved when requesting an opening. */
  function prepare(element: HTMLElement) {
    callbacks.origin(getModalTransformOrigin(element, origin));
  }

  /** Mask movement begins separately. Only the panel communicates the visibility of Modal. */
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

  /** Shifting reduced motion is also applicable to the mask, which is still coming out. */
  function syncPreference() {
    if (current && requested !== undefined) sync(requested, current);
  }

  reducedMotion.addEventListener('change', syncPreference);
  return {
    sync,
    /** Completion of one surface does not change the phase of another. */
    end(part: ModalMotionPart, event: CssMotionEvent) {
      (part === 'panel' ? panel : mask).end(event);
    },
    /** Removes both phases and browser listeners before unmounting or changing the mode. */
    destroy() {
      reducedMotion.removeEventListener('change', syncPreference);
      panel.destroy();
      mask.destroy();
    }
  };
}
