/** Label создаёт второй input click; bubble lock rc-checkbox оставляет один внешний click. */
export function createCheckableClickLock() {
  let view: Window | null = null;
  let frame: number | undefined;

  // Отменяет оставшийся RAF и сбрасывает блокировку всплытия для нового click.
  function clear() {
    if (frame !== undefined) view?.cancelAnimationFrame(frame);
    frame = undefined;
  }

  return {
    // Устанавливает блокировку на окно документа события до ближайшего кадра.
    label(event: MouseEvent & { currentTarget: EventTarget & HTMLLabelElement; }) {
      clear();
      view = event.currentTarget.ownerDocument.defaultView;
      frame = view?.requestAnimationFrame(() => { frame = undefined; });
    },
    // Останавливает только всплытие повторного click в рамках блокировки label.
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
