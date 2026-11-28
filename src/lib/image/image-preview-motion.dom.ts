// Connects CSSMotion to one native preview root. A phase can finish only on the dialog's own
// effect or when the active classes no longer produce an effect.
import { on } from 'svelte/events';
import { createCssMotion, type CssMotionState } from '../motion/css-motion.dom';
import { createCssMotionFrame } from '../motion/css-motion-frame.dom';

export interface ImagePreviewMotionSettings {
  name: string | undefined;
  enabled: boolean;
  builtInFade: boolean;
}

export interface ImagePreviewMotionFrame {
  className?: string;
  fadeStarting: boolean;
}

/** Owns browser motion listeners for the lifetime of the retained viewer. */
export function connectImagePreviewMotion(
  root: HTMLDialogElement,
  onFrame: (frame: ImagePreviewMotionFrame) => void,
  onVisibleChanged: (visible: boolean) => void
) {
  const view = root.ownerDocument.defaultView ?? window;
  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  const completion = createCssMotionFrame(view);
  const motion = createCssMotion(view, () => root, paint);
  let request: (ImagePreviewMotionSettings & { visible: boolean; fromHidden: boolean; }) | undefined;

  /** Invalidates the cancellation check when another phase paints its classes. */
  function paint(state: CssMotionState) {
    completion.cancel();

    // Native show can paint the retained root before Motion supplies its zero-opacity frame.
    const fadeStarting = state.step === 'start' && state.phase !== 'leave'
      && request?.fromHidden === true && request.builtInFade;
    onFrame({ className: state.className, fadeStarting });
  }

  /** Applies the current theme and the browser's motion preference to the pending visibility. */
  function applyPreference() {
    if (!request) {
      return;
    }
    const { name, enabled, visible } = request;

    motion.sync({
      motion: {
        motionName: name === undefined ? 'fade' : name,
        onVisibleChanged
      },
      present: true,
      visible,
      enabled: enabled && !reduced.matches,
      settleWithoutAnimation: true,
      settleOnCutoff: true
    });
  }

  /** A replacement class can start another effect after canceling the old one. */
  function checkCancellation(event: Event) {
    if (event.target !== root) {
      return;
    }

    completion.next(() => {
      if (!root.getAnimations().length) motion.end({ deadline: true });
    });
  }

  reduced.addEventListener('change', applyPreference);
  const listeners = [
    on(root, 'transitionend', motion.end),
    on(root, 'animationend', motion.end),
    on(root, 'transitioncancel', checkCancellation),
    on(root, 'animationcancel', checkCancellation)
  ];

  return {
    /** Starts or updates the phase without remounting the preview. */
    sync(visible: boolean, settings: ImagePreviewMotionSettings, newlyShown = false) {
      const fromHidden = request?.visible === visible ? request.fromHidden : newlyShown;
      request = { ...settings, visible, fromHidden };
      applyPreference();
    },
    /** Releases frame work and events when the viewer moves to another root or unmounts. */
    destroy() {
      motion.destroy();
      completion.cancel();
      reduced.removeEventListener('change', applyPreference);
      for (const remove of listeners) remove();
    }
  };
}
