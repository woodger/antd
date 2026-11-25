// Связывает native dialog с переходом панели. Маска движется независимо, но только панель
// управляет закрытием, afterOpenChange и восстановлением фокуса.
import type { CssMotionState } from './css-motion.dom';
import type { CssMotionEvent } from './css-motion.types';
import {
  getDrawerMotionDuration, getDrawerTransform, type DrawerInteraction
} from './drawer.engine';
import { connectDrawerFocus } from './drawer-focus.dom';
import { createDrawerMotion } from './drawer-motion.dom';
import type { DrawerMotionConfig, DrawerPlacement } from './drawer.types';

export interface DrawerTransitionOptions {
  motion?: DrawerMotionConfig;
  maskMotion?: DrawerMotionConfig;
  enabled: boolean;
  forceRender: boolean;
  destroyOnHidden: boolean;
}

interface DrawerMotionBinding {
  getSection(): HTMLDivElement | undefined;
  getOptions(): DrawerTransitionOptions;
  paint(surface: 'panel' | 'mask', state: CssMotionState, commit?: boolean): void;
  maskVisibility(visible: boolean, present: boolean): void;
}

/** Создаёт browser lifecycle Drawer с независимыми эффектами панели и маски. */
export function createDrawerDialog(
  dialog: HTMLDialogElement,
  onClosing: (closing: boolean) => void,
  onSettled: (open: boolean) => void,
  getInteraction: () => DrawerInteraction,
  binding: DrawerMotionBinding
) {
  const contentWrapper = dialog.querySelector<HTMLDivElement>(
    ':scope > [data-ant-drawer-content-wrapper]'
  );
  const documentView = dialog.ownerDocument.defaultView;
  if (!contentWrapper || !documentView) {
    throw new Error('Drawer requires a wrapper in an active document');
  }

  const wrapper = contentWrapper;
  const view = documentView;
  const focus = connectDrawerFocus(dialog, getInteraction);
  const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)');
  const panel = createDrawerMotion(view, () => wrapper, binding.getSection, (state, commit) =>
    binding.paint('panel', state, commit));
  const mask = createDrawerMotion(view, getMask, getMask, (state, commit) =>
    binding.paint('mask', state, commit));
  let revision = 0;
  let phase: 'closed' | 'opening' | 'open' | 'closing' = 'closed';
  let side: DrawerPlacement = 'right';
  let disposed = false;
  let visited = false;
  let maskWasVisible = false;
  let requested = false;
  let cssTransition = false;

  /** Маска может монтироваться и скрываться независимо от wrapper. */
  function getMask() {
    return dialog.querySelector<HTMLDivElement>(':scope > [data-ant-drawer-mask]') ?? undefined;
  }

  /** После уничтожения children следующая панель снова проходит appear. */
  function releaseContent() {
    visited = false;
    maskWasVisible = false;
    panel.reset();
    mask.reset();
    binding.maskVisibility(false, false);
  }

  /** Применяет видимость и даёт владельцу прочитать ещё смонтированные children. */
  function finish(current: number, open: boolean) {
    if (disposed || revision !== current || open && !dialog.open) {
      return;
    }

    revision++;
    cssTransition = false;
    panel.cancelNative();
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
        const options = binding.getOptions();
        if (options.destroyOnHidden && !options.forceRender) releaseContent();
        onClosing(false);
        restore?.();
      }
    }
  }

  /** Без таймлайна уведомление всё равно ждёт обновления привязанного DOM. */
  function finishWithoutMotion(open: boolean) {
    const current = revision;
    queueMicrotask(() => finish(current, open));
  }

  /** Длительность штатных эффектов берётся из текущего оформления Drawer. */
  function nativeTiming() {
    const duration = reducedMotion.matches ? 0 : getDrawerMotionDuration(
      view.getComputedStyle(dialog).getPropertyValue('--ant-motion-duration-slow')
    );
    if (!duration) {
      return undefined;
    }

    return {
      duration,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
      fill: 'both'
    } satisfies KeyframeAnimationOptions;
  }

  /** Прерывает прежний кадр, сохраняя текущую геометрию для штатного перехода. */
  function begin(open: boolean, placement: DrawerPlacement, options: DrawerTransitionOptions) {
    const maskNode = getMask();
    const opacity = dialog.open && maskNode ? view.getComputedStyle(maskNode).opacity : '0';
    const from = dialog.open ? view.getComputedStyle(wrapper).transform
      : getDrawerTransform(placement);
    const current = ++revision;
    visited = true;
    phase = open ? 'opening' : 'closing';
    cssTransition = options.motion !== undefined;
    side = placement;
    panel.cancelNative();
    mask.cancelNative();
    onClosing(!open);
    if (open && !dialog.open) focus.open();

    const timing = nativeTiming();
    if (!cssTransition) {
      const to = open ? 'translate(0, 0)' : getDrawerTransform(placement);
      const started = panel.animate('transform', from, to, timing, () => {
        // Два штатных эффекта очищались вместе до afterOpenChange.
        if (!options.maskMotion) mask.cancelNative();
        finish(current, open);
      });
      if (!started) {
        finishWithoutMotion(open);
      }
    }

    if (!options.maskMotion) {
      mask.animate('opacity', opacity, open ? '1' : '0', timing);
    }
  }

  /** Синхронизирует CSS-фазы с requested open, пока native dialog удерживает модальность. */
  function syncCss(open: boolean, options: DrawerTransitionOptions) {
    const present = visited || options.forceRender;
    const enabled = options.enabled && !reducedMotion.matches;
    const panelMoving = phase === 'opening' || phase === 'closing';

    if (panelMoving && cssTransition && !options.motion) {
      panel.reset();
      finishWithoutMotion(open);
    }
    else {
      const config = panelMoving && !cssTransition ? undefined : options.motion;
      const current = revision;
      panel.css.sync({
        motion: {
          ...config,
          onVisibleChanged: panelMoving && cssTransition ? next => finish(current, next) : undefined
        },
        present, visible: open, enabled,
        inactive: !present,
        forced: options.forceRender,
        settleOnCutoff: true
      });
    }

    const visibleMask = open && getInteraction().mask.enabled;
    maskWasVisible ||= visibleMask;
    binding.maskVisibility(Boolean(options.maskMotion && visibleMask), present);
    if (options.maskMotion) mask.cancelNative();
    mask.css.sync({
      motion: {
        ...options.maskMotion,
        // Первый скрытый кадр может иметь leave-фазу, но ещё не меняет видимость маски.
        onVisibleChanged: next => {
          if (next || maskWasVisible) options.maskMotion?.onVisibleChanged?.(next);
        }
      },
      present, visible: visibleMask, enabled,
      inactive: !present,
      forced: options.forceRender,
      settleOnCutoff: true
    });
  }

  /** Штатное движение меняет ось с placement, пользовательская CSS-фаза остаётся текущей. */
  function sync(open: boolean, placement: DrawerPlacement) {
    if (disposed) {
      return;
    }

    const options = binding.getOptions();
    requested = open;
    if (open) {
      if (dialog.open) focus.sync();
      if (!dialog.open || phase === 'closing') {
        begin(true, placement, options);
      }
      else if (side !== placement && !cssTransition) {
        revision++;
        panel.cancelNative();
        mask.cancelNative();
        if (phase === 'opening') finishWithoutMotion(true);
      }
    }
    else if (dialog.open && phase !== 'closing') {
      begin(false, placement, options);
    }
    else if (phase === 'closed' && visited && options.destroyOnHidden && !options.forceRender) {
      releaseContent();
    }
    side = placement;
    syncCss(open, options);
  }

  /** Отключает активные эффекты при смене системной настройки движения. */
  function handleReducedMotion() {
    if (reducedMotion.matches) {
      panel.finishNative();
      mask.finishNative();
    }
    syncCss(requested, binding.getOptions());
  }

  reducedMotion.addEventListener('change', handleReducedMotion);

  return {
    sync,
    /** Semantic style владельца сохраняет приоритет над штатным эффектом. */
    syncStyles() {
      panel.syncStyles();
      mask.syncStyles();
    },
    /** Учитывает собственные события секции или маски, проверяемые контроллером CSSMotion. */
    end(surface: 'panel' | 'mask', event: CssMotionEvent) {
      (surface === 'panel' ? panel : mask).css.end(event);
    },
    /** Нативное закрытие отменяет выполнявшийся переход без пользовательского уведомления. */
    nativeClosed() {
      // При штатном close панель уже закрыта, а маска может ещё ждать свой deadline.
      if (phase === 'closed') {
        return;
      }

      revision++;
      phase = 'closed';
      cssTransition = false;
      requested = false;
      panel.reset();
      mask.reset();
      binding.maskVisibility(false, visited);
      onClosing(false);
      focus.close()?.();
    },
    /** Отключает обе поверхности и освобождает открытый dialog при размонтировании. */
    destroy() {
      disposed = true;
      revision++;
      reducedMotion.removeEventListener('change', handleReducedMotion);
      panel.destroy();
      mask.destroy();
      focus.close()?.();
    }
  };
}
