// Связывает фазы Drawer с native dialog и анимациями panel и mask. Ревизия motion исключает
// применение завершения старого кадра.
import {
  getDrawerMotionDuration, getDrawerTransform, type DrawerInteraction
} from './drawer.engine';
import { connectDrawerFocus } from './drawer-focus.dom';
import type { DrawerPlacement } from './drawer.types';

interface DrawerMotion {
  animation: Animation;
  element: HTMLElement;
  property: 'transform' | 'opacity';
}

// Создаёт DOM-контроллер для шаблона с panel и mask.
export function createDrawerDialog(
  dialog: HTMLDialogElement,
  onClosing: (closing: boolean) => void,
  onSettled: (open: boolean) => void,
  getInteraction: () => DrawerInteraction
) {
  const panel = dialog.querySelector<HTMLElement>(':scope > [data-ant-drawer-content-wrapper]')!;
  const focus = connectDrawerFocus(dialog, getInteraction);
  const view = dialog.ownerDocument.defaultView!;
  const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)');
  let animations: DrawerMotion[] = [];
  let revision = 0;
  let phase: 'closed' | 'opening' | 'open' | 'closing' = 'closed';
  let side: DrawerPlacement = 'right';
  let disposed = false;

  // Повышает ревизию и отменяет текущую пару анимаций.
  function cancelMotion() {
    revision++;
    for (const { animation } of animations)
      animation.cancel();
    animations = [];
  }

  // Уведомляет о своей ревизии после применения видимости и до удаления содержимого.
  function finish(current: number, open: boolean) {
    if (disposed || revision !== current || open && !dialog.open) {
      return;
    }

    cancelMotion();
    if (open) {
      phase = 'open';
      onSettled(true);
      return;
    }

    phase = 'closed';
    const restore = focus.close();

    const settledRevision = revision;
    try {
      onSettled(false);
    }
    finally {
      if (revision === settledRevision) {
        onClosing(false);
        restore?.();
      }
    }
  }

  // Маска может исчезнуть независимо от панели и направления её движения.
  function getMask() {
    return dialog.querySelector<HTMLElement>(':scope > [data-ant-drawer-mask]');
  }

  // Берёт начало fade из текущего кадра, когда изменение open прерывает движение.
  function getMaskOpacity() {
    const mask = getMask();
    return mask && dialog.open ? view.getComputedStyle(mask).opacity : '0';
  }

  // Выносит уведомление нулевой фазы из синхронного DOM-обновления.
  function finishWithoutMotion(open: boolean) {
    const current = revision;
    queueMicrotask(() => finish(current, open));
  }

  // Inline CSS владельца имеет приоритет, но тайминг visibility продолжает идти.
  function syncStyles() {
    for (const { animation, element, property } of animations) {
      const effect = animation.effect;
      if (effect instanceof view.KeyframeEffect) {
        const target = element.style.getPropertyValue(property) ? null : element;
        if (effect.target !== target) effect.target = target;
      }
    }
  }

  // Запускает анимации panel и mask либо сразу применяет итог при reduced motion.
  function animate(from: string, to: string, opacity: string, opening: boolean) {
    const duration = reducedMotion.matches
      ? 0
      : getDrawerMotionDuration(
        view.getComputedStyle(dialog).getPropertyValue('--ant-motion-duration-slow')
      );
    if (!duration) {
      finishWithoutMotion(opening);
      return;
    }

    const current = revision;
    const options: KeyframeAnimationOptions = {
      duration,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
      fill: 'both'
    };
    const motion = panel.animate([{ transform: from }, { transform: to }], options);
    animations = [{ animation: motion, element: panel, property: 'transform' }];
    const mask = getMask();
    if (mask) {
      const fade = mask.animate([{ opacity }, { opacity: opening ? '1' : '0' }], options);
      animations.push({ animation: fade, element: mask, property: 'opacity' });
    }

    syncStyles();
    void motion.finished.then(() => finish(current, opening), () => {});
  }

  // Сверяет состояние dialog с open и placement. При повторном открытии берёт текущий кадр.
  function sync(open: boolean, placement: DrawerPlacement) {
    if (disposed) {
      return;
    }

    if (open) {
      if (dialog.open) focus.sync();
      if (dialog.open && phase !== 'closing') {
        if (side !== placement) {
          cancelMotion();
          if (phase === 'opening') finishWithoutMotion(true);
        }
        side = placement;
        return;
      }

      const from = dialog.open
        ? view.getComputedStyle(panel).transform
        : getDrawerTransform(placement);
      const opacity = getMaskOpacity();
      cancelMotion();
      side = placement;
      phase = 'opening';
      onClosing(false);
      if (!dialog.open) focus.open();
      animate(from, 'translate(0, 0)', opacity, true);
    }
    else if (dialog.open && phase !== 'closing') {
      const from = view.getComputedStyle(panel).transform;
      const opacity = getMaskOpacity();
      cancelMotion();
      side = placement;
      phase = 'closing';
      onClosing(true);
      animate(from, getDrawerTransform(placement), opacity, false);
    }
  }

  // Завершает текущие анимации при включении reduced motion.
  function handleReducedMotion() {
    if (reducedMotion.matches) {
      for (const { animation } of animations)
        animation.finish();
    }
  }

  reducedMotion.addEventListener('change', handleReducedMotion);

  return {
    sync,
    syncStyles,
    // Синхронизирует lifecycle после закрытия dialog браузером.
    nativeClosed() {
      cancelMotion();
      phase = 'closed';
      onClosing(false);
      focus.close()?.();
    },
    // Отключает слушатель, отменяет motion и освобождает открытый dialog.
    destroy() {
      disposed = true;
      reducedMotion.removeEventListener('change', handleReducedMotion);
      cancelMotion();
      focus.close()?.();
    }
  };
}
