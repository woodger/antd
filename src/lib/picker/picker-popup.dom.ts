// Allows placement and displacement rc-picker for native top layer. Geometry follows the field, and
// the new align setting is taken when re-measured.
import type { DatePickerPopupAlign, DatePickerProps } from './date-picker.types';
import { connectPopup } from '../popup.dom';
import { clipPopupArea, getPopupScrollers } from '../popup-geometry.dom';
import { getPopupPlacement, getPopupPosition, type PopupFlipCache } from '../popup-position.engine';
import { getTooltipPosition, type TooltipPosition, type TooltipRect } from '../tooltip/tooltip.engine';

type Placement = NonNullable<DatePickerProps['placement']>;
type AlignmentProps = Pick<DatePickerProps, 'popupAlign' | 'builtinPlacements'> & {
  placement: Placement;
};
type ConnectionOptions = Pick<Parameters<typeof connectPopup>[2],
  'applyPosition' | 'preserveFocus' | 'onDismiss' | 'onVisibilityChange'> & {
  onPlacement: (placement: string | undefined) => void;
};

// rc-picker 1.12.2 PickerTrigger, MIT, vendor/LICENSE.rc-picker.
const defaultPlacements: Record<Placement, DatePickerPopupAlign> = {
  bottomLeft: { points: ['tl', 'bl'], offset: [0, 4], overflow: { adjustX: 1, adjustY: 1 } },
  bottomRight: { points: ['tr', 'br'], offset: [0, 4], overflow: { adjustX: 1, adjustY: 1 } },
  topLeft: { points: ['bl', 'tl'], offset: [0, -4], overflow: { adjustX: 0, adjustY: 1 } },
  topRight: { points: ['br', 'tr'], offset: [0, -4], overflow: { adjustX: 0, adjustY: 1 } }
};

interface PickerAlignment {
  placement: Placement;
  align: DatePickerPopupAlign;
  fitViewport: boolean;
}

/** Saves the parameters of the last measurement, including variable arrays Svelte props. */
function readAlignment(
  props: AlignmentProps,
  placements: Readonly<Record<string, DatePickerPopupAlign>>
): PickerAlignment {
  const { placement, popupAlign, builtinPlacements } = props;
  const align = { ...placements[placement], ...popupAlign };
  const { points, offset, targetOffset, overflow } = align;

  return {
    placement,
    align: {
      ...align,
      points: points && [...points],
      offset: offset && [...offset],
      targetOffset: targetOffset && [...targetOffset],
      overflow: overflow && { ...overflow }
    },
    fitViewport: popupAlign === undefined && builtinPlacements === undefined
  };
}

/** Leaves the standard panel accessible if the original flip does not place it in the window. */
function fitPickerViewport(
  reference: DOMRect, bounds: DOMRect, viewport: TooltipRect, placement: Placement
): TooltipPosition {
  const horizontal = placement.endsWith('Right') ? 'right' : 'left';
  const vertical = placement.startsWith('top') ? 'top' : 'bottom';
  const result = getTooltipPosition(reference, bounds, viewport, vertical, true, horizontal, 4);
  const aligned = `${result.placement === 'top' ? 'top' : 'bottom'}${horizontal === 'right'
    ? 'Right' : 'Left'}` as const;

  return {
    ...result,
    left: Math.floor(result.left),
    top: Math.floor(result.top),
    sourceAlign: defaultPlacements[aligned]
  };
}

/** Measures positions in viewport, applying portal cut-off areas. */
function alignPickerPopup(
  reference: DOMRect,
  bounds: DOMRect,
  viewport: TooltipRect,
  documentElement: HTMLElement,
  scrollers: readonly HTMLElement[],
  alignment: PickerAlignment,
  flips: PopupFlipCache | undefined
): TooltipPosition {
  const right = viewport.x + viewport.width;
  const bottom = viewport.y + viewport.height;
  const visible = clipPopupArea({
    left: viewport.x, top: viewport.y, right, bottom
  }, scrollers);
  const { scrollLeft, scrollTop, scrollWidth, scrollHeight } = documentElement;
  const scroll = clipPopupArea({
    left: -scrollLeft,
    top: -scrollTop,
    right: Math.max(scrollWidth, bounds.width) - scrollLeft,
    bottom: Math.max(scrollHeight, bounds.height) - scrollTop
  }, scrollers);

  const result = getPopupPosition({
    target: reference,
    popup: { left: 0, top: 0, width: bounds.width, height: bounds.height },
    mirror: { right, bottom },
    visible, scroll, align: alignment.align,
    placements: defaultPlacements,
    scaleX: 1, scaleY: 1, flips
  });
  const point = result.align.points[0];
  const inset = result.align.dynamicInset;
  const left = inset && point[1] === 'r' ? right - result.right - bounds.width : result.x;
  const top = inset && point[0] === 'b' ? bottom - result.bottom - bounds.height : result.y;

  if (alignment.fitViewport && (left < viewport.x || top < viewport.y
    || left + bounds.width > right || top + bounds.height > bottom)) {
    return fitPickerViewport(reference, bounds, viewport, alignment.placement);
  }

  return {
    left, top, placement: alignment.placement,
    arrowX: result.arrowX, arrowY: result.arrowY,
    sourceAlign: result.align, flips: result.flips
  };
}

/** Connects a single surface, saving refs, focus, and flip history when updating props. */
export function connectPickerPopup(
  popup: HTMLElement,
  anchor: HTMLElement,
  props: () => AlignmentProps,
  options: ConnectionOptions
) {
  const { documentElement, defaultView } = popup.ownerDocument;
  let parent: ParentNode | null | undefined;
  let popupScrollers: HTMLElement[] = [];
  let scrollTargets = new Set<EventTarget>();
  let needsMeasurement = true;
  let previousSizeKey = '';
  let previousOriginKey = '';
  let previousAlignKey: string | undefined;
  let alignment: PickerAlignment | undefined;
  let position: TooltipPosition | undefined;

  /** The following dimension reads actual props after scroll or resize. */
  function invalidateAlignment() {
    needsMeasurement = true;
  }

  /** Carries scroll listeners when changing DOM-container panel. */
  function watchScrollers() {
    scrollTargets.forEach(target => target.removeEventListener('scroll', invalidateAlignment));
    popupScrollers = getPopupScrollers(popup);
    scrollTargets = new Set([...getPopupScrollers(anchor), ...popupScrollers]);
    if (defaultView) scrollTargets.add(defaultView);
    for (const target of scrollTargets) {
      target.addEventListener('scroll', invalidateAlignment, { passive: true });
    }
    parent = popup.parentNode;
    invalidateAlignment();
  }

  /** Replaces the alignment settings at the measurement boundary, and the class takes from the current map. */
  function measure(reference: DOMRect, bounds: DOMRect, viewport: TooltipRect) {
    if (parent !== popup.parentNode) {
      watchScrollers();
    }

    const current = props();
    const placements = current.builtinPlacements ?? defaultPlacements;
    const alignKey = JSON.stringify(current.popupAlign);
    const sizeKey = [
      reference.width, reference.height, bounds.width, bounds.height, viewport.width, viewport.height
    ].join(':');
    const originKey = [reference.x, reference.y, viewport.x, viewport.y].join(':');
    const unnamedAlignChanged = alignKey !== previousAlignKey && !placements[current.placement];
    const refresh = needsMeasurement || sizeKey !== previousSizeKey
      || current.placement !== alignment?.placement || unnamedAlignChanged;

    if (!alignment || refresh) {
      alignment = readAlignment(current, placements);
      needsMeasurement = false;
    }
    if (!position || refresh || originKey !== previousOriginKey) {
      position = alignPickerPopup(
        reference, bounds, viewport, documentElement, popupScrollers, alignment, position?.flips
      );
    }
    previousSizeKey = sizeKey;
    previousOriginKey = originKey;
    previousAlignKey = alignKey;

    return {
      ...position,
      alignedPlacement: getPopupPlacement(placements, position.sourceAlign ?? {})
    };
  }

  defaultView?.addEventListener('resize', invalidateAlignment, { passive: true });
  const disconnect = connectPopup(popup, anchor, {
    ...options,
    placement: 'bottom',
    autoAdjustOverflow: true,
    maxWidth: '100vw',
    matchAnchorWidth: true,
    getPosition: measure,
    onPlacement: (_, value) => options.onPlacement(value.alignedPlacement),
    onVisibilityChange: shown => {
      if (!shown) invalidateAlignment();
      options.onVisibilityChange?.(shown);
    }
  });

  /** Removes its own listeners together with a common popup connection. */
  return () => {
    scrollTargets.forEach(target => target.removeEventListener('scroll', invalidateAlignment));
    defaultView?.removeEventListener('resize', invalidateAlignment);
    disconnect();
  };
}
