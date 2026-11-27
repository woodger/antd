// Measures Affix's placeholder and scroll target. Position updates and full size measurements are
// scheduled separately.
import { affixPosition } from './affix.engine';
import type { AffixPosition, AffixProps, AffixTarget } from './affix.types';

interface AffixRuntimeOptions {
  target: () => AffixTarget | null;
  offsetTop?: number;
  offsetBottom?: number;
}
const events = [
  'resize',
  'scroll',
  'touchstart',
  'touchmove',
  'touchend',
  'pageshow',
  'load'
] as const;

// Owns the DOM observers and publishes affixed changes and new geometry.
export function createAffixRuntime(
  root: HTMLElement,
  content: HTMLElement,
  notify: (position: AffixPosition | undefined) => void,
  getOnChange: () => AffixProps['onChange']
) {
  const view = root.ownerDocument.defaultView!;
  let active = true;
  let options: AffixRuntimeOptions = {
    // The initial measurement uses the document's window until the owner supplies a target.
    target: () => view
  };
  let listenedTarget: AffixTarget | null = null;
  let position: AffixPosition | undefined;
  let forceFrame: number | undefined;
  let lazyFrame: number | undefined;
  const observed = new Map<Element, readonly (number | undefined)[]>();

  // Moves listeners to the new target before the next measurement.
  function syncTarget() {
    const getTarget = options.target;
    const target = getTarget();
    if (target !== listenedTarget) {
      for (const event of events)
        listenedTarget?.removeEventListener(event, lazyUpdate);
      listenedTarget = target;
      for (const event of events)
        target?.addEventListener(event, lazyUpdate, { passive: true });
    }
    return target;
  }

  // Compares position and reports affixed changes before writing the current geometry.
  function measure(force: boolean) {
    if (!active) {
      return;
    }
    const target = syncTarget();
    if (!target) {
      return;
    }

    const placeholder = root.getBoundingClientRect();
    if (placeholder.top === 0
      && placeholder.left === 0
      && placeholder.width === 0
      && placeholder.height === 0) {
      return;
    }

    const bounds = 'getBoundingClientRect' in target
      ? target.getBoundingClientRect()
      : { top: 0, bottom: target.innerHeight };
    const next = affixPosition(
      placeholder,
      bounds,
      view.innerHeight,
      options.offsetTop,
      options.offsetBottom
    );
    if (!force
      && position
      && next
      && next.edge === position.edge
      && next.offset === position.offset) {
      return;
    }
    if (Boolean(next) !== Boolean(position))
      getOnChange()?.(Boolean(next));
    if (!active) {
      return;
    }

    if (next?.edge === position?.edge
      && next?.offset === position?.offset
      && next?.width === position?.width
      && next?.height === position?.height) {
      return;
    }
    position = next;
    notify(next);
  }

  // Schedules one full measurement pass on the next frame.
  function updatePosition() {
    if (!active || forceFrame !== undefined) {
      return;
    }
    forceFrame = view.requestAnimationFrame(() => {
      forceFrame = undefined;
      measure(true);
    });
  }
  // Handles scrolling without publishing unchanged edges and offset.
  function lazyUpdate() {
    if (!active || lazyFrame !== undefined) {
      return;
    }
    lazyFrame = view.requestAnimationFrame(() => {
      lazyFrame = undefined;
      measure(false);
    });
  }
  // Cancels the queued forced measurement.
  function cancel() {
    if (forceFrame !== undefined)
      view.cancelAnimationFrame(forceFrame);
    forceFrame = undefined;
  }

  const resize = new view.ResizeObserver(entries => {
    let changed = false;
    for (const { target } of entries) {
      const box = target.getBoundingClientRect();
      const offsets = target as HTMLElement;
      const dimensions = [
        Math.floor(box.width),
        Math.floor(box.height),
        offsets.offsetWidth,
        offsets.offsetHeight
      ];
      const previous = observed.get(target);
      if (previous && dimensions.some((value, index) => value !== previous[index])) {
        observed.set(target, dimensions);
        changed = true;
      }
    }
    // Rc ResizeObserver deduplicates floor and offset dimensions and schedules the callback in a microtask.
    if (changed)
      void Promise.resolve().then(updatePosition);
  });
  // Keeps ResizeObserver attached to the placeholder and current children.
  function observeChildren() {
    if (!active) {
      return;
    }
    const nodes = new Set<Element>([root, ...content.children]);
    for (const node of observed.keys()) {
      if (!nodes.has(node)) {
        resize.unobserve(node);
        observed.delete(node);
      }
    }
    for (const node of nodes) {
      if (!observed.has(node)) {
        observed.set(node, [-1, -1, -1, -1]);
        resize.observe(node);
      }
    }
  }
  const mutations = new view.MutationObserver(observeChildren);
  mutations.observe(content, { childList: true });
  observeChildren();

  return {
    // Updates settings and the target before forcing a measurement.
    configure(next: AffixRuntimeOptions) {
      if (!active) {
        return;
      }
      options = next;
      syncTarget();
      updatePosition();
    },
    updatePosition,
    cancel,
    // Cancels both frames and disconnects target listeners and observers.
    destroy() {
      if (!active) {
        return;
      }
      active = false;
      cancel();
      if (lazyFrame !== undefined)
        view.cancelAnimationFrame(lazyFrame);
      lazyFrame = undefined;
      for (const event of events)
        listenedTarget?.removeEventListener(event, lazyUpdate);
      listenedTarget = null;
      resize.disconnect();
      mutations.disconnect();
      observed.clear();
    }
  };
}
