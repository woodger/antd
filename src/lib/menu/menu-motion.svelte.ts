// Connects surface visibility to browser lifecycle and synchronous measurements CSSMotion.
import { flushSync, untrack } from 'svelte';
import { createMenuMotion, type MenuMotionInput, type MenuMotionState } from './menu-motion.dom';
import type { MenuMotionEvent } from './menu-motion.types';

/** Controller is created after linking the root. SSR builds only stable markings. */
export function useMenuMotion(
  getOwner: () => HTMLElement | undefined,
  getElement: () => HTMLElement | undefined,
  getInput: () => MenuMotionInput
) {
  let runtime = $state.raw<ReturnType<typeof createMenuMotion>>();
  let state = $state.raw<MenuMotionState>({});

  $effect(() => {
    const view = getOwner()?.ownerDocument.defaultView;
    if (!view) {
      return;
    }

    const controller = createMenuMotion(view, getElement, (next, commit) => {
      if (commit) flushSync(() => { state = next; });
      else state = next;
    });
    runtime = controller;
    return () => controller.destroy();
  });

  $effect.pre(() => {
    const controller = runtime;
    const next = getInput();
    untrack(() => controller?.sync(next));
  });

  return {
    // Allows markup to keep the outgoing surface at the same time as the mode update.
    get state() { return state; },
    // The event enters the current revision; DOM-controller checks the surface itself.
    end(event: MenuMotionEvent) { runtime?.end(event); }
  };
}
