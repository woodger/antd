// Bind native dialog to the transition of the panel. Mask moves independently, but only the panel
// manages closure, afterOpenChange and focus recovery.
import type { CssMotionState } from '../motion/css-motion.dom';
import type { CssMotionEvent } from '../motion/css-motion.types';
import {
  getDrawerMotionDuration, getDrawerTransform, type DrawerInteraction
} from './drawer.engine';
import { connectDialogFocus } from '../dialog/dialog-focus.dom';
import { createDrawerMotion } from './drawer-motion.dom';
import type { DrawerMotionConfig, DrawerPlacement } from './drawer.types';

export interface DrawerTransitionOptions {
  motion?: DrawerMotionConfig;
  maskMotion?: DrawerMotionConfig;
  enabled: boolean;
  forceRender: boolean;
  destroyOnHidden: boolean;
}

interface DrawerMotionBinding {
  getSection(): HTMLDivElement | undefined;
  getOptions(): DrawerTransitionOptions;
  paint(surface: 'panel' | 'mask', state: CssMotionState, commit?: boolean): void;
  maskVisibility(visible: boolean, present: boolean): void;
}

/** Creates browser lifecycle Drawer with independent panel and mask effects. */
export function createDrawerDialog(
  dialog: HTMLDialogElement,
  onClosing: (closing: boolean) => void,
  onSettled: (open: boolean) => void,
  getInteraction: () => DrawerInteraction,
  binding: DrawerMotionBinding
) {
  const contentWrapper = dialog.querySelector<HTMLDivElement>(
    ':scope > [data-ant-drawer-content-wrapper]'
  );
  const documentView = dialog.ownerDocument.defaultView;
  if (!contentWrapper || !documentView) {
    throw new Error('Drawer requires a wrapper in an active document');
  }

  const wrapper = contentWrapper;
  const view = documentView;
  const focus = connectDialogFocus(dialog, getInteraction);
  const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)');
  const panel = createDrawerMotion(view, () => wrapper, binding.getSection, (state, commit) =>
    binding.paint('panel', state, commit));
  const mask = createDrawerMotion(view, getMask, getMask, (state, commit) =>
    binding.paint('mask', state, commit));
  let revision = 0;
  let phase: 'closed' | 'opening' | 'open' | 'closing' = 'closed';
  let side: DrawerPlacement = 'right';
  let disposed = false;
  let visited = false;
  let maskWasVisible = false;
  let requested = false;
  let cssTransition = false;

  /** The mask can be mounted and hidden regardless of the wrapper. */
  function getMask() {
    return dialog.querySelector<HTMLDivElement>(':scope > [data-ant-drawer-mask]') ?? undefined;
  }

  /** After the destruction of children, the next panel takes the chase again. */
  function releaseContent() {
    visited = false;
    maskWasVisible = false;
    panel.reset();
    mask.reset();
    binding.maskVisibility(false, false);
  }

  /** Applies visibility and gives the owner to read still mounted children. */
  function finish(current: number, open: boolean) {
    if (disposed || revision !== current || open && !dialog.open) {
      return;
    }

    revision++;
    cssTransition = false;
    panel.cancelNative();
    if (open) {
      phase = 'open';
      onSettled(true);
      return;
    }

    phase = 'closed';
    const restore = focus.close();
    const settledRevision = revision;
    try {
      onSettled(false);
    }
    finally {
      if (revision === settledRevision) {
        const options = binding.getOptions();
        if (options.destroyOnHidden && !options.forceRender) releaseContent();
        onClosing(false);
        restore?.();
      }
    }
  }

  /** Without a timeline, the notification still awaits an update of tied DOM. */
  function finishWithoutMotion(open: boolean) {
    const current = revision;
    queueMicrotask(() => finish(current, open));
  }

  /** The duration of regular effects is taken from the current design of Drawer. */
  function nativeTiming() {
    const duration = reducedMotion.matches ? 0 : getDrawerMotionDuration(
      view.getComputedStyle(dialog).getPropertyValue('--ant-motion-duration-slow')
    );
    if (!duration) {
      return undefined;
    }

    return {
      duration,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
      fill: 'both'
    } satisfies KeyframeAnimationOptions;
  }

  /** Interrupts the former frame, preserving the current geometry for the regular transition. */
  function begin(open: boolean, placement: DrawerPlacement, options: DrawerTransitionOptions) {
    const maskNode = getMask();
    const opacity = dialog.open && maskNode ? view.getComputedStyle(maskNode).opacity : '0';
    const from = dialog.open ? view.getComputedStyle(wrapper).transform
      : getDrawerTransform(placement);
    const current = ++revision;
    visited = true;
    phase = open ? 'opening' : 'closing';
    cssTransition = options.motion !== undefined;
    side = placement;
    panel.cancelNative();
    mask.cancelNative();
    onClosing(!open);
    if (open && !dialog.open) focus.open();

    const timing = nativeTiming();
    if (!cssTransition) {
      const to = open ? 'translate(0, 0)' : getDrawerTransform(placement);
      const started = panel.animate('transform', from, to, timing, () => {
        // Both built-in effects were cleaned up before afterOpenChange.
        if (!options.maskMotion) mask.cancelNative();
        finish(current, open);
      });
      if (!started) {
        finishWithoutMotion(open);
      }
    }

    if (!options.maskMotion) {
      mask.animate('opacity', opacity, open ? '1' : '0', timing);
    }
  }

  /** Synchronizes the CSS-phase with the requested open while the native dialog holds the modality. */
  function syncCss(open: boolean, options: DrawerTransitionOptions) {
    const present = visited || options.forceRender;
    const enabled = options.enabled && !reducedMotion.matches;
    const panelMoving = phase === 'opening' || phase === 'closing';

    if (panelMoving && cssTransition && !options.motion) {
      panel.reset();
      finishWithoutMotion(open);
    }
    else {
      const config = panelMoving && !cssTransition ? undefined : options.motion;
      const current = revision;
      panel.css.sync({
        motion: {
          ...config,
          onVisibleChanged: panelMoving && cssTransition ? next => finish(current, next) : undefined
        },
        present, visible: open, enabled,
        inactive: !present,
        forced: options.forceRender,
        settleOnCutoff: true
      });
    }

    const visibleMask = open && getInteraction().mask.enabled;
    maskWasVisible ||= visibleMask;
    binding.maskVisibility(Boolean(options.maskMotion && visibleMask), present);
    if (options.maskMotion) mask.cancelNative();
    mask.css.sync({
      motion: {
        ...options.maskMotion,
        // The first hidden frame may have a leave phase, but it does not yet change the appearance of the mask.
        onVisibleChanged: next => {
          if (next || maskWasVisible) options.maskMotion?.onVisibleChanged?.(next);
        }
      },
      present, visible: visibleMask, enabled,
      inactive: !present,
      forced: options.forceRender,
      settleOnCutoff: true
    });
  }

  /** The full-time movement changes the axis with placement, the custom CSS-phase remains current. */
  function sync(open: boolean, placement: DrawerPlacement) {
    if (disposed) {
      return;
    }

    const options = binding.getOptions();
    requested = open;
    if (open) {
      if (dialog.open) focus.sync();
      if (!dialog.open || phase === 'closing') {
        begin(true, placement, options);
      }
      else if (side !== placement && !cssTransition) {
        revision++;
        panel.cancelNative();
        mask.cancelNative();
        if (phase === 'opening') finishWithoutMotion(true);
      }
    }
    else if (dialog.open && phase !== 'closing') {
      begin(false, placement, options);
    }
    else if (phase === 'closed' && visited && options.destroyOnHidden && !options.forceRender) {
      releaseContent();
    }
    side = placement;
    syncCss(open, options);
  }

  /** Disables active effects when changing the system setting of the movement. */
  function handleReducedMotion() {
    if (reducedMotion.matches) {
      panel.finishNative();
      mask.finishNative();
    }
    syncCss(requested, binding.getOptions());
  }

  reducedMotion.addEventListener('change', handleReducedMotion);

  return {
    sync,
    /** The owner's semantic style takes precedence over the built-in effect. */
    syncStyles() {
      panel.syncStyles();
      mask.syncStyles();
    },
    /** Takes into account the section’s own events or masks checked by the CSSMotion controller. */
    end(surface: 'panel' | 'mask', event: CssMotionEvent) {
      (surface === 'panel' ? panel : mask).css.end(event);
    },
    /** Native closure cancels the completed transition without user notification. */
    nativeClosed() {
      // During a normal close, the panel may already be closed while the mask still waits for its deadline.
      if (phase === 'closed') {
        return;
      }

      revision++;
      phase = 'closed';
      cssTransition = false;
      requested = false;
      panel.reset();
      mask.reset();
      binding.maskVisibility(false, visited);
      onClosing(false);
      focus.close()?.();
    },
    /** Disconnects both surfaces and releases an open dialog when unmounting. */
    destroy() {
      disposed = true;
      revision++;
      reducedMotion.removeEventListener('change', handleReducedMotion);
      panel.destroy();
      mask.destroy();
      focus.close()?.();
    }
  };
}
