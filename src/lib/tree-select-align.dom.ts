/** rc-trigger 3.10.1 useAlign/useWatch scheduling; MIT, vendor/LICENSE.rc-trigger. */
import {
  getPopupPlacement, getPopupPosition, type PopupFlipCache, type PopupSourceAlign
} from './popup-position.engine';
import { treeSelectBuiltinPlacements } from './tree-select-align.engine';
import { createTreeSelectAlignSurface, treeSelectAlignScrollers } from './tree-select-align-surface.dom';
import type { InlineStyleLayer } from './inline-style.engine';
import type { TooltipPlacement } from './tooltip.types';
import type { TooltipPosition, TooltipRect } from './tooltip.engine';
import type {
  TreeSelectMotionFrameState, TreeSelectMotionTransitionEnd
} from './tree-select-motion-frame.dom';

export interface TreeSelectAlignOptions {
  placement: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  popupAlign?: PopupSourceAlign;
  builtinPlacements?: Readonly<Record<string, PopupSourceAlign>>;
  style?: string;
  container: HTMLElement | ShadowRoot;
  open?: boolean;
  inMotion?: boolean;
  renderReady?: boolean;
  constrainX?: boolean;
  motion?: TreeSelectMotionFrameState;
  onMotionTransitionEnd?: (event: TreeSelectMotionTransitionEnd) => void;
}

export interface TreeSelectAlignSnapshot {
  alignment?: ReturnType<typeof getPopupPosition>;
  presentationAlignment?: ReturnType<typeof getPopupPosition>;
  scaleX: number;
}

const clipping = new WeakMap<HTMLElement, { parent: ParentNode | null; nodes: HTMLElement[] }>();

/** Pending props affect numeric alignment only after a Source trigger. */
export function createTreeSelectAlign(
  anchor: HTMLElement, popup: HTMLElement, getOptions: () => TreeSelectAlignOptions,
  initialFlips?: PopupFlipCache, initial?: TreeSelectAlignSnapshot
) {
  const document = popup.ownerDocument;
  const view = document.defaultView!;
  const defaults = treeSelectBuiltinPlacements();
  const surface = createTreeSelectAlignSurface(
    popup,
    () => getOptions().style,
    () => getOptions().container,
    () => getOptions().motion,
    event => getOptions().onMotionTransitionEnd?.(event),
    () => getOptions().constrainX ?? false
  );
  let active = true;
  let dirty = !initial?.alignment;
  let forced = false;
  let request = 0;
  let notify: (() => void) | undefined;
  let parent = getOptions().container;
  let cache = initial?.alignment;
  let presentationAlignment = initial?.presentationAlignment ?? cache;
  let scaleX = initial?.scaleX ?? 1;
  let targetWidth = anchor.getBoundingClientRect().width;
  let latestPlacement = getOptions().placement;
  let latestAlign = JSON.stringify(getOptions().popupAlign);
  let presentation: { left: number; top: number; style: InlineStyleLayer } | undefined;
  let presentationSignature = '';
  let watch = new Set<EventTarget>();
  const sizes = new Map<HTMLElement, string>();

  function schedule(force: boolean) {
    const options = getOptions();
    if (options.open === false || options.inMotion && !force) return;
    const token = ++request;
    Promise.resolve().then(() => {
      if (!active || request !== token) return;
      const latest = getOptions();
      if (latest.open === false || latest.inMotion && !force) return;
      dirty = true;
      forced ||= force;
      notify?.();
    });
  }
  function invalidate() { schedule(false); }
  function graph() {
    for (const node of watch) node.removeEventListener('scroll', invalidate);
    const container = getOptions().container;
    const from = container instanceof view.ShadowRoot ? null : container;
    watch = new Set([view, ...treeSelectAlignScrollers(anchor), ...treeSelectAlignScrollers(popup, from)]);
    for (const node of watch) node.addEventListener('scroll', invalidate, { passive: true });
    const saved = clipping.get(popup);
    if (!saved || saved.parent !== container)
      clipping.set(popup, { parent: container, nodes: treeSelectAlignScrollers(popup, from) });
  }

  graph();
  const resize = new view.ResizeObserver(entries => {
    let changed = false;
    for (const entry of entries) {
      const node = entry.target as HTMLElement;
      const rect = node.getBoundingClientRect();
      const signature = [Math.floor(rect.width), Math.floor(rect.height),
        node.offsetWidth, node.offsetHeight].join(':');
      if (sizes.get(node) === signature) continue;
      sizes.set(node, signature);
      if (node === anchor) targetWidth = rect.width;
      changed = true;
    }
    if (changed) invalidate();
  });
  resize.observe(anchor);
  resize.observe(popup);
  view.addEventListener('resize', invalidate, { passive: true });

  function position(_rect: DOMRect, _bounds: DOMRect, _viewport: TooltipRect): TooltipPosition {
    const options = getOptions();
    if (options.open === false && cache) cache.flips = {};
    const placements = options.builtinPlacements || defaults;
    const align = JSON.stringify(options.popupAlign);
    if (options.placement !== latestPlacement
      || align !== latestAlign && !placements[options.placement]) invalidate();
    latestPlacement = options.placement;
    latestAlign = align;

    if (parent !== options.container) {
      parent = options.container;
      graph();
      dirty = true;
    }
    if (options.open !== false && (!options.inMotion || forced) && (!cache || dirty)) {
      dirty = false;
      forced = false;
      const geometry = surface.geometry(anchor, clipping.get(popup)!.nodes);
      if (geometry.scaleX && geometry.scaleY) {
        cache = getPopupPosition({
          ...geometry,
          placements,
          align: { ...placements[options.placement], ...options.popupAlign },
          flips: cache?.flips ?? initialFlips
        });
        scaleX = geometry.scaleX;
        presentationSignature = '';
      }
    }
    if (!cache)
      return { left: -1000000, top: -1000000, arrowX: 0, arrowY: 0, placement: options.placement };
    // CSSMotion can finish internally while its memoized popup still paints the ACTIVE frame.
    // Keep calculating the next alignment, but publish it only when those children are ready.
    if (options.renderReady !== false) presentationAlignment = cache;
    const signature = surface.signature();
    if (!presentation || presentationSignature !== signature) {
      presentation = surface.present(presentationAlignment ?? cache);
      presentationSignature = signature;
    }
    const alignedPlacement = getPopupPlacement(placements, cache.align);
    return {
      left: presentation.left,
      top: presentation.top,
      arrowX: cache.arrowX,
      arrowY: cache.arrowY,
      sourceAlign: cache.align,
      alignedPlacement,
      flips: cache.flips,
      placement: (alignedPlacement ?? options.placement) as TooltipPlacement
    };
  }

  return {
    position,
    get style() { return presentation?.style; },
    commitFrame: surface.commit,
    get flips() { return cache?.flips; },
    snapshot(): TreeSelectAlignSnapshot {
      return { alignment: cache, presentationAlignment, scaleX };
    },
    get width() { return targetWidth / scaleX; },
    connect(forceAlign: () => void) { notify = forceAlign; },
    refreshFrame() { notify?.(); },
    forceAlign() { schedule(true); },
    resetFlips() {
      initialFlips = undefined;
      if (cache) cache.flips = {};
    },
    destroy() {
      active = false;
      request++;
      notify = undefined;
      resize.disconnect();
      for (const node of watch) node.removeEventListener('scroll', invalidate);
      view.removeEventListener('resize', invalidate);
      surface.destroy();
    }
  };
}
