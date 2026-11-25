// Связывает фазы CSSMotion с native popover. Закрытое содержимое удерживается до уведомления
// владельца, а смена open или уничтожение компонента отменяет устаревшее уведомление.
import { tick } from 'svelte';
import { on } from 'svelte/events';
import { useMenuMotion } from './menu-motion.svelte';
import type { MenuMotionEvent } from './menu-motion.types';

interface OverlayMotionInput {
  visible: boolean;
  forceRender: boolean;
  enabled: boolean;
  defaultName?: string;
  customName?: string;
  afterOpenChange?: (open: boolean) => void;
}

/** Устойчивый shell позволяет отделить CSS leave от доступности и удаления содержимого. */
export function useOverlayMotion(
  getPopup: () => HTMLElement | undefined,
  getInput: () => OverlayMotionInput
) {
  let reduced = $state(false);
  let visited = $state(false);
  let retained = $state(false);
  let change = $state.raw<{ visible: boolean }>();
  let notified: typeof change;

  $effect(() => {
    const view = getMotionOwner()?.ownerDocument.defaultView;
    if (!view) {
      return;
    }

    const media = view.matchMedia('(prefers-reduced-motion: reduce)');

    // Изменение настройки действует также на уже начатую фазу.
    function update() {
      reduced = media.matches;
    }

    update();
    return on(media, 'change', update);
  });

  const motionName = $derived.by(() => {
    const { defaultName, customName } = getInput();
    return typeof customName === 'string' ? customName : defaultName;
  });
  const builtIn = $derived(motionName !== undefined && motionName === getInput().defaultName);
  const motion = useMenuMotion(getMotionOwner, getPopup, () => {
    const { enabled, forceRender, visible } = getInput();
    return {
      motion: { motionName, motionDeadline: 1000 },
      present: true,
      visible,
      enabled: enabled && !reduced,
      forced: forceRender,
      settleWithoutAnimation: builtIn
    };
  });

  $effect.pre(() => {
    const { visible } = getInput();
    if (motionName && (visible || getInput().forceRender)) visited = true;
    if (visible === (change?.visible ?? false)) {
      return;
    }

    change = { visible };
    if (visible) retained = true;
  });

  $effect(() => {
    const current = change;
    if (!getPopup() || !current || current === notified || motion.state.phase) {
      return;
    }

    let active = true;
    // Сначала Svelte закрывает native popover. Snippet ещё доступен из ref в callback.
    void tick().then(() => {
      const { visible, afterOpenChange } = getInput();
      if (!active || current !== change || visible !== current.visible || motion.state.phase) {
        return;
      }

      notified = current;
      try {
        afterOpenChange?.(visible);
      }
      finally {
        if (!visible && current === change) retained = false;
      }
    });

    return () => { active = false; };
  });

  // Создаёт browser controller при первом показе или предварительном рендере.
  function getMotionOwner() {
    return visited ? getPopup() : undefined;
  }

  return {
    // Leave держит поверхности в top layer до окончания движения.
    get leaving() { return motion.state.phase === 'leave'; },
    // Содержимое переживает снятие top layer до завершения callback.
    get retained() { return retained; },
    // Классы совместимы с пользовательскими правилами для motionName.
    get className() { return motion.state.className; },
    // Рецепт Source подставляется только для встроенного имени.
    get zoom() {
      const { phase, step } = motion.state;
      return builtIn && phase && step ? `${phase}-${step}` : undefined;
    },
    // Следующий align использует раскладку без scale и сохраняет выбранный край.
    get pauseAlignment() {
      return motion.state.step === 'active' || motion.state.phase === 'leave';
    },
    // CSSMotion фильтрует события потомков и одновременно снимает deadline.
    end(event: MenuMotionEvent) { motion.end(event); }
  };
}
