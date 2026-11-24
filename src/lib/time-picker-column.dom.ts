// Согласует программное выравнивание колонок и ручную прокрутку. Таймер
// выбора принадлежит колонке и отменяется при её удалении.
import type { TimePickerOption } from './time-picker.engine';

/** Через 300 мс выбирает ближайшую доступную строку. При равенстве остаётся первая. */
export function createTimeColumnScrollSelection(
  column: HTMLUListElement,
  disabled: (item: HTMLElement, index: number) => boolean,
  select: (item: HTMLElement, index: number) => void
) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  /** Отбрасывает ожидающий выбор при переустановке позиции или удалении колонки. */
  function cancel() {
    clearTimeout(timer);
    timer = undefined;
  }

  /** Перезапускает ожидание, пока продолжается ручная прокрутка. */
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

/** Scroll alignment и delayed selection TimeColumn; каждый вызов владеет listeners/raf/timer. */
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

  /** Снимает кадр выравнивания при совпадении позиции или очистке. */
  function stopScroll() {
    view.cancelAnimationFrame(frame);
    scrolling = false;
  }

  const first = column.querySelector<HTMLElement>('li');
  const target = selected === null ? null
    : column.querySelector<HTMLElement>(`[data-value="${selected}"]`);

  /** Подводит выбранную строку к верху колонки, пока её разметка доступна. */
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

  /** Программное выравнивание не запускает выбор элемента. */
  function handleScroll() {
    if (scrolling || !changeOnScroll()) {
      selection.cancel();
      return;
    }

    selection.schedule();
  }

  column.addEventListener('scroll', handleScroll);
  align();

  /** Убирает обработчик и отменяет отложенные операции при смене колонки. */
  return () => {
    disposed = true;
    stopScroll();
    selection.cancel();
    column.removeEventListener('scroll', handleScroll);
  };
}
