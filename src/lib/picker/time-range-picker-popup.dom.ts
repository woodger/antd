// Positions the arrow and the narrow panel TimeRangePicker relative to the active field. The
// measurement only lives until the popup is switched off.
/** Range Popup rc-picker: offset narrow time panel and arrows relatively active input. */
export function connectTimeRangePopup(
  root: HTMLElement,
  wrapper: HTMLElement,
  container: HTMLElement,
  activeInput: () => HTMLElement | undefined,
  rtl: () => boolean,
  onPosition: (arrow: number, offset: number) => void
) {
  const view = root.ownerDocument.defaultView!;
  let frame = 0;
  let disposed = false;
  let previous = '';

  // Measures the active field and publishes only changed offsets taking into account RTL.
  function update() {
    if (disposed) {
      return;
    }
    const input = activeInput();
    if (input) {
      // Rule 2. RangePickerCore creates an input inside the field and an arrow inside timeWrapper.
      // The controller is switched on after linking the wrapper and the panel to this markup.
      const inputRect = input.parentElement!.getBoundingClientRect();
      const bounds = wrapper.getBoundingClientRect();
      const panelWidth = container.getBoundingClientRect().width;
      const arrowWidth = wrapper.querySelector<HTMLElement>('[data-picker-range-arrow]')!.offsetWidth;
      const selectorWidth = root.getBoundingClientRect().width;
      const rightToLeft = rtl();
      const arrow = (rightToLeft ? inputRect.right - arrowWidth : inputRect.left) - bounds.left;
      const offset = panelWidth && panelWidth < selectorWidth ? Math.max(0, rightToLeft
        ? bounds.right - (inputRect.right - arrowWidth + panelWidth)
        : inputRect.left + arrowWidth - bounds.left - panelWidth) : 0;
      const signature = `${arrow}:${offset}`;

      if (signature !== previous) {
        previous = signature;
        onPosition(arrow, offset);
      }
    }
    frame = view.requestAnimationFrame(update);
  }

  update();
  // Stops the next measurement and excludes the publication after the controller is destroyed.
  return () => {
    disposed = true;
    view.cancelAnimationFrame(frame);
  };
}
