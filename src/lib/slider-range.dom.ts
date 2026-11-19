// Связывает нативный range с drag Slider. Pointer capture и слушатели принадлежат одной активной
// операции, touch события передаются общей геометрии контрола.
/** Pointer listeners экземпляра; отмена и уничтожение не вызывают завершение действия. */
export function connectSliderRangeDrag(
  node: HTMLElement,
  start: PointerEvent,
  move: (event: PointerEvent) => void,
  finish: (event: PointerEvent) => void,
  cancel: () => void
) {
  const document = node.ownerDocument;
  let active = true;
  // Снимает слушатели документа и освобождает захват исходного pointer, если он ещё действует.
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
  // Доставляет движение только указателю, начавшему drag, и подавляет нативное действие.
  function handleMove(event: PointerEvent) {
    if (event.pointerId !== start.pointerId) {
      return;
    }
    event.preventDefault();
    move(event);
  }
  // Завершает drag для исходного pointer после освобождения захвата и подписок.
  function handleEnd(event: PointerEvent) {
    if (event.pointerId !== start.pointerId) {
      return;
    }
    event.preventDefault();
    cleanup();
    finish(event);
  }
  // Прерывает drag при отмене исходного pointer, передавая результат в cancel.
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
  // DispatchEvent не создаёт активный native pointer для setPointerCapture.
  if (start.isTrusted) node.setPointerCapture(start.pointerId);
  return cleanup;
}

/** Нативный range даёт semantics/forms; touch-геометрией управляет общий drag, как у rc-slider. */
export function connectSliderRangeInput(
  node: HTMLInputElement,
  handlers: {
    start: (event: TouchEvent & { currentTarget: HTMLInputElement; }) => void;
    move: (event: TouchEvent & { currentTarget: HTMLInputElement; }) => void;
  }
) {
  // Передаёт touch start в общую модель и подавляет нативное изменение range.
  function handleStart(event: TouchEvent) {
    handlers.start(event as TouchEvent & { currentTarget: HTMLInputElement; });
    event.preventDefault();
  }
  // Передаёт touch move с текущим range общему drag и отменяет нативное движение ползунка.
  function handleMove(event: TouchEvent) {
    handlers.move(event as TouchEvent & { currentTarget: HTMLInputElement; });
    event.preventDefault();
  }
  node.addEventListener('touchstart', handleStart, { passive: false });
  node.addEventListener('touchmove', handleMove, { passive: false });
  // Снимает touch listeners со старого input при размонтировании или перепривязке.
  return () => {
    node.removeEventListener('touchstart', handleStart);
    node.removeEventListener('touchmove', handleMove);
  };
}
