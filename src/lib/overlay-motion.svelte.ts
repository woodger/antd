// Connects phases CSSMotion with native popover. Closed content is withheld until notified to the
// owner, and changing the open or destroying the component cancels the outdated notification.
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

/** Sustainable shell allows you to separate CSS leave from the availability and removal of contents. */
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

    // Changing the setting is also valid for the phase already started.
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
    // At first Svelte closes the native popover. Snippet is still available from ref to callback.
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

  // Creates a browser controller at the first display or preliminary render.
  function getMotionOwner() {
    return visited ? getPopup() : undefined;
  }

  return {
    // Leave keeps surfaces in the top layer until the end of the movement.
    get leaving() { return motion.state.phase === 'leave'; },
    // The content is experiencing the removal of the top layer until the callback is completed.
    get retained() { return retained; },
    // The classes are compatible with custom rules for motionName.
    get className() { return motion.state.className; },
    // The Source recipe is set up only for the built-in name.
    get zoom() {
      const { phase, step } = motion.state;
      return builtIn && phase && step ? `${phase}-${step}` : undefined;
    },
    // The following align uses the layout without scale and preserves the selected edge.
    get pauseAlignment() {
      return motion.state.step === 'active' || motion.state.phase === 'leave';
    },
    // CSSMotion filters the events of the descendants and at the same time removes the deadline.
    end(event: MenuMotionEvent) { motion.end(event); }
  };
}
