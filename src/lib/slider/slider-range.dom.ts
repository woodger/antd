// Links the native range with drag Slider. Pointer capture and listeners belong to one active
// operation, touch events are transmitted to the general geometry of control.
/** Pointer listeners copy; cancellation and destruction do not cause the action to be completed. */
export function connectSliderRangeDrag(
  node: HTMLElement,
  start: PointerEvent,
  move: (event: PointerEvent) => void,
  finish: (event: PointerEvent) => void,
  cancel: () => void
) {
  const document = node.ownerDocument;
  let active = true;
  // Removes the listeners of the document and releases the capture of the original pointer if it is still valid.
  function cleanup() {
    if (!active) {
      return;
    }
    active = false;
    document.removeEventListener('pointermove', handleMove);
    document.removeEventListener('pointerup', handleEnd);
    document.removeEventListener('pointercancel', handleCancel);
    if (node.hasPointerCapture(start.pointerId)) node.releasePointerCapture(start.pointerId);
  }
  // Delivers the movement only to the pointer that started the drag and suppresses the native action.
  function handleMove(event: PointerEvent) {
    if (event.pointerId !== start.pointerId) {
      return;
    }
    event.preventDefault();
    move(event);
  }
  // Finishes the drag for the original pointer after the release of the takeover and subscriptions.
  function handleEnd(event: PointerEvent) {
    if (event.pointerId !== start.pointerId) {
      return;
    }
    event.preventDefault();
    cleanup();
    finish(event);
  }
  // Interrupts the drag when the original pointer is canceled, transmitting the result to cancel.
  function handleCancel(event: PointerEvent) {
    if (event.pointerId !== start.pointerId) {
      return;
    }
    cleanup();
    cancel();
  }
  document.addEventListener('pointermove', handleMove, { passive: false });
  document.addEventListener('pointerup', handleEnd);
  document.addEventListener('pointercancel', handleCancel);
  // DispatchEvent does not create an active native pointer for setPointerCapture.
  if (start.isTrusted) node.setPointerCapture(start.pointerId);
  return cleanup;
}

/** Native range gives semantics/forms; touch geometry controls the total drag, as in rc-slider. */
export function connectSliderRangeInput(
  node: HTMLInputElement,
  handlers: {
    start: (event: TouchEvent & { currentTarget: HTMLInputElement; }) => void;
    move: (event: TouchEvent & { currentTarget: HTMLInputElement; }) => void;
  }
) {
  // Transmits the touch start into the general model and suppresses the native range change.
  function handleStart(event: TouchEvent) {
    handlers.start(event as TouchEvent & { currentTarget: HTMLInputElement; });
    event.preventDefault();
  }
  // Transmits touch move with the current range general drag and cancels the native slider movement.
  function handleMove(event: TouchEvent) {
    handlers.move(event as TouchEvent & { currentTarget: HTMLInputElement; });
    event.preventDefault();
  }
  node.addEventListener('touchstart', handleStart, { passive: false });
  node.addEventListener('touchmove', handleMove, { passive: false });
  // Removes touch listeners from the old input on unmount or rebinding.
  return () => {
    node.removeEventListener('touchstart', handleStart);
    node.removeEventListener('touchmove', handleMove);
  };
}
