// Agrees the popup position with anchor and scroll-container measurements. Geometry is updated by
// triggers, and the publication of the position takes into account the readiness of the motion
// frame.
/** rc-trigger 3.10.1 useAlign/useWatch scheduling; MIT, vendor/LICENSE.rc-trigger. */
import {
  getPopupPlacement, getPopupPosition, type PopupFlipCache, type PopupSourceAlign
} from '../popup-position.engine';
import { treeSelectBuiltinPlacements } from './tree-select-align.engine';
import {
  createTreeSelectAlignSurface, type TreeSelectAlignBorderBox
} from './tree-select-align-surface.dom';
import { getPopupScrollers } from '../popup-geometry.dom';
import type { InlineStyleLayer } from '../inline-style.engine';
import type { TooltipPlacement } from '../tooltip/tooltip.types';
import type { TooltipPosition, TooltipRect } from '../tooltip/tooltip.engine';
import type { PopupOverflow } from '../types';
import type {
  TreeSelectMotionFrameState, TreeSelectMotionTransitionEnd
} from './tree-select-motion-frame.dom';

export interface TreeSelectAlignOptions {
  placement: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  popupAlign?: PopupSourceAlign;
  builtinPlacements?: Readonly<Record<string, PopupSourceAlign>>;
  popupOverflow?: PopupOverflow;
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

/** The new props affects the numerical position after an event that triggers the measurement. */
export function createTreeSelectAlign(
  anchor: Element,
  popup: HTMLElement,
  getOptions: () => TreeSelectAlignOptions,
  initialFlips?: PopupFlipCache,
  initial?: TreeSelectAlignSnapshot
) {
  const document = popup.ownerDocument;
  // Rule 2: the calling components connect alignment only for browser popup.
  const view = document.defaultView!;
  let defaultOverflow = getOptions().popupOverflow;
  let defaults = treeSelectBuiltinPlacements(defaultOverflow);
  let borderBox: TreeSelectAlignBorderBox | undefined;
  const surface = createTreeSelectAlignSurface(
    popup,
    () => getOptions().style,
    () => getOptions().container,
    () => getOptions().motion,
    event => getOptions().onMotionTransitionEnd?.(event),
    () => getOptions().constrainX ?? false,
    () => borderBox
  );
  let active = true;
  let dirty = !initial?.alignment;
  let forced = false;
  let alignmentRevision = 0;
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
  let scrollTargets = new Set<EventTarget>();
  const sizes = new Map<HTMLElement, string>();

  // The last microtask defines dirty/forced. Closure or motion can cancel it.
  function schedule(force: boolean) {
    const options = getOptions();
    if (options.open === false || options.inMotion && !force) {
      return;
    }
    const scheduledRevision = ++alignmentRevision;
    Promise.resolve().then(() => {
      if (!active || alignmentRevision !== scheduledRevision) {
        return;
      }
      const latest = getOptions();
      if (latest.open === false || latest.inMotion && !force) {
        return;
      }
      dirty = true;
      forced ||= force;
      notify?.();
    });
  }
  // Scroll and resize are waiting for the end of motion, unlike forceAlign.
  function invalidate() {
    schedule(false);
  }

  // Reconnects listeners after changing the container and updating its cut-off boundaries.
  function watchScrollTargets() {
    for (const node of scrollTargets) node.removeEventListener('scroll', invalidate);
    const container = getOptions().container;
    const from = container instanceof view.ShadowRoot ? null : container;
    const anchorScrollers = getPopupScrollers(anchor);
    const popupScrollers = getPopupScrollers(popup, from);
    scrollTargets = new Set([view, ...anchorScrollers, ...popupScrollers]);
    for (const node of scrollTargets) {
      node.addEventListener('scroll', invalidate, { passive: true });
    }

    const saved = clipping.get(popup);
    if (!saved || saved.parent !== container) {
      clipping.set(popup, { parent: container, nodes: getPopupScrollers(popup, from) });
    }
  }

  watchScrollTargets();
  // Saves border box popup and plans to recalculate only when the size is changed.
  const resize = new view.ResizeObserver(entries => {
    let changed = false;
    for (const entry of entries) {
      const node = entry.target as HTMLElement;
      if (node === popup) {
        const size = entry.borderBoxSize?.[0];
        const style = view.getComputedStyle(popup);
        borderBox = size ? {
          size,
          width: style.width,
          height: style.height,
          boxSizing: style.boxSizing,
          writingMode: style.writingMode
        } : undefined;
      }

      const rect = node.getBoundingClientRect();
      const signature = [
        Math.floor(rect.width),
        Math.floor(rect.height),
        node.offsetWidth,
        node.offsetHeight
      ].join(':');
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

  // Stores the settings of the last passage and resets the flip directions when closed.
  function refreshPlacementOptions(options: TreeSelectAlignOptions) {
    if (options.open === false && cache) cache.flips = {};
    if (options.popupOverflow !== defaultOverflow) {
      defaultOverflow = options.popupOverflow;
      defaults = treeSelectBuiltinPlacements(defaultOverflow);
    }
    const placements = options.builtinPlacements || defaults;
    const align = JSON.stringify(options.popupAlign);
    if (options.placement !== latestPlacement
      || align !== latestAlign && !placements[options.placement]) {
      invalidate();
    }
    latestPlacement = options.placement;
    latestAlign = align;
    return placements;
  }

  // Updates the cache relative to the current container when the measurement is allowed.
  function refreshGeometry(
    options: TreeSelectAlignOptions,
    placements: Readonly<Record<string, PopupSourceAlign>>
  ) {
    if (parent !== options.container) {
      parent = options.container;
      watchScrollTargets();
      dirty = true;
    }
    if (options.open === false || (options.inMotion && !forced) || (cache && !dirty)) {
      return;
    }

    dirty = false;
    forced = false;
    // Rule 2: the first watchScrollTargets fills the record before calling the position.
    const clippingEntry = clipping.get(popup)!;
    const geometry = surface.geometry(anchor, clippingEntry.nodes);
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

  // Publishes coordinates only after the appearance of measured geometry.
  function position(_rect: DOMRect, _bounds: DOMRect, _viewport: TooltipRect): TooltipPosition {
    const options = getOptions();
    const placements = refreshPlacementOptions(options);
    refreshGeometry(options, placements);

    if (!cache) {
      return { left: -1000000, top: -1000000, arrowX: 0, arrowY: 0, placement: options.placement };
    }
    // CSSMotion can be completed while the popup still draws frame ACTIVE. Publish fresh geometry,
    // when it can apply popup contents.
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
    // Returns the style of the last published frame.
    get style() { return presentation?.style; },
    commitFrame: surface.commit,
    // Reads the directions accumulated during the measurements of the current discovery.
    get flips() { return cache?.flips; },
    // Passes both the measured and published positions when the DOM container changes.
    snapshot(): TreeSelectAlignSnapshot {
      return { alignment: cache, presentationAlignment, scaleX };
    },
    // Translates the width of the anchor from the DOM-coordinate to the popup coordinates.
    get width() { return targetWidth / scaleX; },
    // Saves the owner's callback, which applies the next dimension.
    connect(forceAlign: () => void) { notify = forceAlign; },
    // Requests the publication of the frame without the tag dirty.
    refreshFrame() { notify?.(); },
    // An obvious command can recalculate the position during motion.
    forceAlign() { schedule(true); },
    // Resets the initial and accumulated directions of flip.
    resetFlips() {
      initialFlips = undefined;
      if (cache) cache.flips = {};
    },
    // Cancel the microtask and disables the observation before the cleanup of the surface.
    destroy() {
      active = false;
      alignmentRevision++;
      notify = undefined;
      resize.disconnect();
      for (const node of scrollTargets) node.removeEventListener('scroll', invalidate);
      view.removeEventListener('resize', invalidate);
      surface.destroy();
    }
  };
}
