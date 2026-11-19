// Согласует позицию popup с измерениями anchor и scroll-контейнеров. Геометрия
// обновляется по триггерам, а публикация позиции учитывает готовность кадра motion.
/** rc-trigger 3.10.1 useAlign/useWatch scheduling; MIT, vendor/LICENSE.rc-trigger. */
import {
  getPopupPlacement, getPopupPosition, type PopupFlipCache, type PopupSourceAlign
} from './popup-position.engine';
import { treeSelectBuiltinPlacements } from './tree-select-align.engine';
import {
  createTreeSelectAlignSurface, treeSelectAlignScrollers, type TreeSelectAlignBorderBox
} from './tree-select-align-surface.dom';
import type { InlineStyleLayer } from './inline-style.engine';
import type { TooltipPlacement } from './tooltip.types';
import type { TooltipPosition, TooltipRect } from './tooltip.engine';
import type { PopupOverflow } from './types';
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

/** Новые props влияют на числовую позицию после события, запускающего измерение. */
export function createTreeSelectAlign(
  anchor: Element,
  popup: HTMLElement,
  getOptions: () => TreeSelectAlignOptions,
  initialFlips?: PopupFlipCache,
  initial?: TreeSelectAlignSnapshot
) {
  const document = popup.ownerDocument;
  // Правило 2: вызывающие компоненты подключают alignment только для browser popup.
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

  // Последняя микрозадача определяет dirty/forced. Закрытие или motion могут её отменить.
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
  // Scroll и resize ждут окончания motion, в отличие от forceAlign.
  function invalidate() {
    schedule(false);
  }

  // Переподключает слушатели после смены контейнера и обновляет его границы отсечения.
  function watchScrollTargets() {
    for (const node of scrollTargets) node.removeEventListener('scroll', invalidate);
    const container = getOptions().container;
    const from = container instanceof view.ShadowRoot ? null : container;
    const anchorScrollers = treeSelectAlignScrollers(anchor);
    const popupScrollers = treeSelectAlignScrollers(popup, from);
    scrollTargets = new Set([view, ...anchorScrollers, ...popupScrollers]);
    for (const node of scrollTargets) {
      node.addEventListener('scroll', invalidate, { passive: true });
    }

    const saved = clipping.get(popup);
    if (!saved || saved.parent !== container) {
      clipping.set(popup, { parent: container, nodes: treeSelectAlignScrollers(popup, from) });
    }
  }

  watchScrollTargets();
  // Сохраняет border box popup и планирует пересчёт только при изменении размера.
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

  // Хранит настройки последнего прохода и сбрасывает направления flip при закрытии.
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

  // Обновляет кэш относительно текущего контейнера, когда измерение разрешено.
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
    // Правило 2: первый watchScrollTargets заполняет запись до вызова position.
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

  // Публикует координаты только после появления измеренной геометрии.
  function position(_rect: DOMRect, _bounds: DOMRect, _viewport: TooltipRect): TooltipPosition {
    const options = getOptions();
    const placements = refreshPlacementOptions(options);
    refreshGeometry(options, placements);

    if (!cache) {
      return { left: -1000000, top: -1000000, arrowX: 0, arrowY: 0, placement: options.placement };
    }
    // CSSMotion может завершиться, пока popup ещё рисует кадр ACTIVE.
    // Публикуем свежую геометрию, когда её сможет применить содержимое popup.
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
    // Возвращает стиль последнего опубликованного кадра.
    get style() { return presentation?.style; },
    commitFrame: surface.commit,
    // Читает направления, накопленные во время измерений текущего открытия.
    get flips() { return cache?.flips; },
    // Передаёт и измеренную, и опубликованную позиции при смене DOM-контейнера.
    snapshot(): TreeSelectAlignSnapshot {
      return { alignment: cache, presentationAlignment, scaleX };
    },
    // Переводит ширину anchor из DOM-координат в координаты popup.
    get width() { return targetWidth / scaleX; },
    // Сохраняет callback владельца, который применяет очередное измерение.
    connect(forceAlign: () => void) { notify = forceAlign; },
    // Запрашивает публикацию кадра без пометки dirty.
    refreshFrame() { notify?.(); },
    // Явная команда может пересчитать положение во время motion.
    forceAlign() { schedule(true); },
    // Сбрасывает исходные и накопленные направления flip.
    resetFlips() {
      initialFlips = undefined;
      if (cache) cache.flips = {};
    },
    // Отменяет микрозадачу и отключает наблюдение перед cleanup поверхности.
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
