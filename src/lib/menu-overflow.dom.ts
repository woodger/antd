// Измеряет только верхний ряд. Невидимые пункты сохраняют ширину для замера,
// а копии из всплывающего списка не влияют на результат.
import { getMenuVisibleCount } from './menu-overflow.engine';

export interface MenuOverflowLayout {
  visibleCount: number;
  hasWidth: boolean;
}

/** Синхронизирует ширины ряда и индикатора после layout без обновления из resize callback. */
export function connectMenuOverflow(
  root: HTMLUListElement,
  onLayout: (layout: MenuOverflowLayout) => void
) {
  const ownerWindow = root.ownerDocument.defaultView;
  if (!ownerWindow) {
    return;
  }

  const view = ownerWindow;
  let frame = 0;
  const watched = new Set<Element>();
  const resize = new view.ResizeObserver(schedule);
  const children = new view.MutationObserver(schedule);
  resize.observe(root);
  children.observe(root, { childList: true });
  schedule();

  return disconnect;

  // Объединяет изменения размеров и перестановки пунктов в одно чтение layout.
  function schedule() {
    if (!frame) {
      frame = view.requestAnimationFrame(measure);
    }
  }

  // Применяет целочисленные clientWidth и offsetWidth, как responsive Overflow.
  function measure() {
    frame = 0;
    const widths: number[] = [];
    const current = new Set<Element>();
    let more = 0;

    for (const child of root.children) {
      if (!(child instanceof view.HTMLElement)) {
        continue;
      }

      if (child.hasAttribute('data-menu-overflow-rest')) {
        more = child.offsetWidth;
      }
      else if (child.hasAttribute('data-menu-overflow-item')) {
        widths.push(child.offsetWidth);
      }
      else {
        continue;
      }

      current.add(child);
      if (!watched.has(child)) {
        watched.add(child);
        resize.observe(child, { box: 'border-box' });
      }
    }
    for (const node of watched) {
      if (!current.has(node)) {
        resize.unobserve(node);
        watched.delete(node);
      }
    }

    const available = root.clientWidth;
    onLayout({
      visibleCount: available ? getMenuVisibleCount(widths, available, more) : 0,
      hasWidth: available > 0
    });
  }

  // Отменяет отложенный замер при смене режима или удалении Menu.
  function disconnect() {
    view.cancelAnimationFrame(frame);
    resize.disconnect();
    children.disconnect();
    watched.clear();
  }
}
