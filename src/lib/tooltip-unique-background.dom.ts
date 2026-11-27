// Moves the background of the general clue separately from its contents. Positions come after the
// usual align, and the new goal starts from the actually drawn frame of an unfinished transition.
import type { TooltipPosition } from './tooltip.engine';

/** Moves the background with Source easing and theme duration, saving the native top layer Tooltip. */
export function connectTooltipUniqueBackground(node: HTMLElement, getMoving: () => boolean) {
  const view = node.ownerDocument.defaultView;
  const preference = view?.matchMedia('(prefers-reduced-motion: reduce)');
  let layout: { left: number; top: number; width: number; height: number; } | undefined;
  let animation: Animation | undefined;

  // Removes the temporary projection, leaving the current targeted geometry in the inline style.
  function cancelAnimation() {
    animation?.cancel();
    animation = undefined;
  }

  // Stops the shift when closed so that the next discovery begins with new geometry.
  function stop() {
    cancelAnimation();
    layout = undefined;
  }

  // Cancellation also applies when you change the setting in the middle of the transition.
  function syncMotion() {
    if (!getMoving() || preference?.matches) cancelAnimation();
  }

  // Reads the duration of the CSS level of the active owner.
  function duration() {
    const value = view?.getComputedStyle(node).getPropertyValue('--ant-motion-duration-slow').trim();
    if (!value) return 300;

    const magnitude = Number.parseFloat(value);
    return magnitude * (value.endsWith('ms') ? 1 : 1000);
  }

  preference?.addEventListener('change', syncMotion);

  return {
    stop,
    syncMotion,
    // Unsubscribes the backdrop along with the shared surface.
    destroy() {
      stop();
      preference?.removeEventListener('change', syncMotion);
    },
    // Applies a new position to the text at once, and the background leads from the old position to the new one.
    position(next: TooltipPosition, bounds: DOMRect, apply: (position: TooltipPosition) => void) {
      const { left, top } = next;
      const { width, height } = bounds;
      const moved = !layout || left !== layout.left || top !== layout.top
        || width !== layout.width || height !== layout.height;
      if (!moved) {
        apply(next);
        return;
      }

      const moving = layout && getMoving() && !preference?.matches;
      const from = moving ? node.getBoundingClientRect() : undefined;
      cancelAnimation();

      apply(next);
      node.style.width = `${width}px`;
      node.style.height = `${height}px`;
      layout = { left, top, width, height };
      if (!from) return;

      const time = duration();
      if (!(time > 0)) return;

      const to = node.getBoundingClientRect();
      animation = node.animate([
        {
          translate: `${from.left - to.left}px ${from.top - to.top}px`,
          width: `${from.width}px`,
          height: `${from.height}px`
        },
        { translate: '0 0', width: `${width}px`, height: `${height}px` }
      ], { duration: time, easing: 'ease' });
    }
  };
}
