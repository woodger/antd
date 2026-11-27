/** A label generates a second input click. The rc-checkbox bubble lock allows one external click. */
export function createCheckableClickLock() {
  let view: Window | null = null;
  let frame: number | undefined;

  // Cancels the pending animation frame and clears the bubble lock for the next click.
  function clear() {
    if (frame !== undefined) view?.cancelAnimationFrame(frame);
    frame = undefined;
  }

  return {
    // Sets the lock on the event document's window until the next frame.
    label(event: MouseEvent & { currentTarget: EventTarget & HTMLLabelElement; }) {
      clear();
      view = event.currentTarget.ownerDocument.defaultView;
      frame = view?.requestAnimationFrame(() => { frame = undefined; });
    },
    // Stops only the repeated click from bubbling while the label lock is active.
    input(event: MouseEvent) {
      if (frame === undefined) {
        return;
      }

      event.stopPropagation();
      clear();
    },
    destroy: clear
  };
}
