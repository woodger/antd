// Двигает фон общей подсказки отдельно от её содержимого. Позиции приходят после обычного align,
// а новая цель стартует от фактически нарисованного кадра незавершённого перехода.
import type { TooltipPosition } from './tooltip.engine';

/** Перемещает фон с Source easing и длительностью темы, сохраняя native top layer Tooltip. */
export function connectTooltipUniqueBackground(node: HTMLElement, getMoving: () => boolean) {
  const view = node.ownerDocument.defaultView;
  const preference = view?.matchMedia('(prefers-reduced-motion: reduce)');
  let layout: { left: number; top: number; width: number; height: number; } | undefined;
  let animation: Animation | undefined;

  // Снимает временную проекцию, оставляя текущую целевую геометрию в inline style.
  function cancelAnimation() {
    animation?.cancel();
    animation = undefined;
  }

  // Прекращает сдвиг при закрытии, чтобы следующее открытие начиналось с новой геометрии.
  function stop() {
    cancelAnimation();
    layout = undefined;
  }

  // Отмена действует также при смене настройки посреди перехода.
  function syncMotion() {
    if (!getMoving() || preference?.matches) cancelAnimation();
  }

  // Считывает длительность из CSS уровня активного владельца.
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
    // Отписывает фон вместе с общей поверхностью.
    destroy() {
      stop();
      preference?.removeEventListener('change', syncMotion);
    },
    // Применяет новое положение к тексту сразу, а фон ведёт от старой позиции к новой.
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
