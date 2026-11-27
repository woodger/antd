// Coordinates programmatic column alignment with manual scrolling. The column owns its selection
// timer and cancels it on removal.
import type { TimePickerOption } from './time-picker.engine';

/** After 300 ms chooses the nearest available line. With equality remains the first one. */
export function createTimeColumnScrollSelection(
  column: HTMLUListElement,
  disabled: (item: HTMLElement, index: number) => boolean,
  select: (item: HTMLElement, index: number) => void
) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  /** Discards the pending choice when reinstalling the position or removing the column. */
  function cancel() {
    clearTimeout(timer);
    timer = undefined;
  }

  /** Restarts the wait while the manual scroll continues. */
  function schedule() {
    cancel();
    timer = setTimeout(() => {
      timer = undefined;
      const items = [...column.querySelectorAll<HTMLElement>('li')];
      const first = items[0];
      if (!first) {
        return;
      }

      let minimum = Number.MAX_SAFE_INTEGER;
      let nearest = -1;
      for (const [index, item] of items.entries()) {
        if (disabled(item, index)) {
          continue;
        }

        const distance = Math.abs(item.offsetTop - first.offsetTop - column.scrollTop);
        if (distance < minimum) {
          minimum = distance;
          nearest = index;
        }
      }

      if (nearest >= 0) {
        select(items[nearest], nearest);
      }
    }, 300);
  }

  return { cancel, schedule };
}

/** Scroll alignment and delayed selection TimeColumn; each call owns listeners/raf/timer. */
export function connectTimePickerColumn(
  column: HTMLUListElement,
  selected: number | 'am' | 'pm' | null,
  options: readonly TimePickerOption[],
  changeOnScroll: () => boolean | undefined,
  onChange: (value: TimePickerOption['value']) => void
): () => void {
  const view = column.ownerDocument.defaultView!;
  let frame = 0;
  let scrolling = false;
  let distance: number | null = null;
  let attempts = 0;
  let disposed = false;

  const selection = createTimeColumnScrollSelection(
    column,
    (_, index) => !options[index] || options[index].disabled,
    (_, index) => onChange(options[index].value)
  );

  /** Removes the frame of alignment when the position coincides or clearing. */
  function stopScroll() {
    view.cancelAnimationFrame(frame);
    scrolling = false;
  }

  const first = column.querySelector<HTMLElement>('li');
  const target = selected === null ? null
    : column.querySelector<HTMLElement>(`[data-value="${selected}"]`);

  /** Subdues the selected line to the top of the column while its markings are available. */
  function align() {
    stopScroll();
    if (disposed || !first || !target) {
      return;
    }

    scrolling = true;
    attempts++;
    const targetTop = target.offsetTop - first.offsetTop;

    if (target.offsetTop === 0 && target !== first || !column.getClientRects().length) {
      if (attempts <= 5) frame = view.requestAnimationFrame(align);
      return;
    }

    const next = column.scrollTop + (targetTop - column.scrollTop) / 3;
    const nextDistance = Math.abs(targetTop - next);

    if (distance !== null && distance < nextDistance) {
      stopScroll();
      return;
    }

    distance = nextDistance;

    if (nextDistance <= 1) {
      column.scrollTop = targetTop;
      stopScroll();
      return;
    }

    column.scrollTop = next;
    frame = view.requestAnimationFrame(align);
  }

  /** Software alignment does not start the selection of an element. */
  function handleScroll() {
    if (scrolling || !changeOnScroll()) {
      selection.cancel();
      return;
    }

    selection.schedule();
  }

  column.addEventListener('scroll', handleScroll);
  align();

  /** Removes the handler and cancels the delayed operations when the column is changed. */
  return () => {
    disposed = true;
    stopScroll();
    selection.cancel();
    column.removeEventListener('scroll', handleScroll);
  };
}
