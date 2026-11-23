// Связывает видимость поверхности с browser lifecycle и синхронными замерами CSSMotion.
import { flushSync, untrack } from 'svelte';
import { createMenuMotion, type MenuMotionInput, type MenuMotionState } from './menu-motion.dom';
import type { MenuMotionEvent } from './menu-motion.types';

/** Controller создаётся после привязки корня. SSR строит только стабильную разметку. */
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
    // Даёт markup держать уходящую поверхность одновременно с обновлением режима.
    get state() { return state; },
    // Событие попадает в текущую ревизию; DOM-controller проверяет саму поверхность.
    end(event: MenuMotionEvent) { runtime?.end(event); }
  };
}
