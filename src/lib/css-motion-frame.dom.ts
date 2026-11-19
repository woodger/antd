/** rc-motion1.3.3 useNextFrame; MIT, vendor/LICENSE.rc-motion. */
export function createCssMotionFrame(view: Window) {
  let frame: number | undefined;
  let revision = 0;

  function cancel() {
    revision++;
    if (frame !== undefined) view.cancelAnimationFrame(frame);
    frame = undefined;
  }

  return {
    cancel,
    next(callback: () => void) {
      cancel();
      const current = revision;
      frame = view.requestAnimationFrame(() => {
        if (current !== revision) {
          return;
        }
        frame = view.requestAnimationFrame(() => {
          frame = undefined;
          if (current === revision) callback();
        });
      });
    }
  };
}
