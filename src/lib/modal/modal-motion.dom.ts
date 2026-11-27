// Choosing a full-time movement or CSS-phase at the boundary of the transition. The panel alone
// determines the end of opening and closing Modal. The mask can finish its phase on its own.
import type { CssMotionState } from '../css-motion.dom';
import type { CssMotionEvent } from '../css-motion.types';
import { createModalNamedMotion } from './modal-named-motion.dom';
import { getModalMousePoint, getModalTransformOrigin } from './modal-origin.dom';
import type { ModalMousePosition } from './modal.types';
import type { AliasToken } from '../theme-token.types';

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

/** Converting canonical tokens into milliseconds for Web Animations. */
function getDurationMs(value: string, fallback: number): number {
  const match = value.trim().match(/^(\d*\.?\d+)(ms|s)$/);
  if (!match) {
    return fallback;
  }

  const milliseconds = Number(match[1]) * (match[2] === 's' ? 1000 : 1);
  return Number.isFinite(milliseconds) ? milliseconds : fallback;
}

/** The built-in effects use WAAPI for the panel and the current mask surface. */
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

  /** Removes the effects and makes their pending callbacks obsolete. */
  function cancel() {
    revision++;
    panelAnimation?.cancel();
    maskAnimation?.cancel();
    panelAnimation = undefined;
    maskAnimation = undefined;
  }

  /** Disabling the movement brings the current panel to the requested visibility. */
  function finish() {
    panelAnimation?.finish();
    maskAnimation?.finish();
  }

  /** When you change the system setup, you save the pending panel notification. */
  function handleReducedMotion() {
    if (reducedMotion.matches) finish();
  }

  /** The initial reversal frame is counted until the previous effect is cancelled. */
  function panelStart(open: boolean): Keyframe {
    if (open && !panelAnimation) {
      return hiddenPanel;
    }

    const { transform, opacity } = view.getComputedStyle(surface);
    return { transform, opacity };
  }

  /** Chooses the physical mask of the current mode and its initial transparency. */
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

  /** Removes fill masks after your own transition, even if the panel is still moving. */
  function animateMask(mask: NonNullable<ReturnType<typeof maskStart>>, duration: number, open: boolean) {
    const animation = mask.node.animate([{ opacity: mask.opacity }, { opacity: open ? 1 : 0 }], {
      duration,
      pseudoElement: mask.pseudoElement,
      fill: 'both'
    });
    maskAnimation = animation;

    /** The old effect does not clear the mask of the new transition. */
    function release() {
      if (maskAnimation === animation) {
        maskAnimation = undefined;
        animation.cancel();
      }
    }

    void animation.finished.then(release, release);
  }

  /** Schedules only the most recently requested transition. The mask does not delay the panel callback. */
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

    /** Finishes the phase after DOM update or the end of the animation of the current revision. */
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
    // Exterior elimination of the effect completes visibility. The reversal has already changed the audit.
    void animation.finished.then(settle, settle);
  }

  reducedMotion.addEventListener('change', handleReducedMotion);
  return {
    sync,
    /** Removes the browser listener and cancels the pending completion. */
    destroy() {
      cancel();
      reducedMotion.removeEventListener('change', handleReducedMotion);
    }
  };
}

/** When changing the mode, it cancels the old engine to the launch of the new phase. */
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

  /** A mask with a custom z-index stays inside its layer. */
  function getMask() {
    const selector = ':scope > [data-ant-modal-backdrop], :scope > [data-ant-modal-mask-layer] > [data-ant-modal-backdrop]';
    return dialog.querySelector<HTMLElement>(selector) ?? undefined;
  }

  /** A new set of names in open Modal applies to the next change of visibility. */
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

  /** Native closure cancels the panel. The named mask can stay in leave. */
  function closed() {
    if (!driver?.named || requested !== false) {
      driver?.connection.destroy();
      driver = undefined;
    }
    requested = false;
  }

  /** Dismantling the hidden panel resets its history appear/enter. */
  function reset() {
    driver?.connection.destroy();
    driver = undefined;
    requested = undefined;
  }

  return {
    sync,
    closed,
    reset,
    /** Events CSS only processes the current named transition. */
    end(part: ModalMotionPart, event: CssMotionEvent) {
      if (driver?.named) driver.connection.end(part, event);
    }
  };
}
