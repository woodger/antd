// Saves the absolute panel sizes React inside the native top layer. The calculation receives the
// dimensions at the beginning of the container, and the browser selects the final width in free
// space.
import type { TooltipPosition } from './tooltip.engine';

const rightInset = '--ant-dropdown-fit-right';
const bottomInset = '--ant-dropdown-fit-bottom';
const inlineAlignment = '--ant-dropdown-fit-justify';

export const dropdownFitVariables = [rightInset, bottomInset, inlineAlignment];

/** Finds an area from which the absolute-surface would get an accessible width. */
function getInlineRegion(surface: HTMLElement, customContainer: boolean) {
  const document = surface.ownerDocument;
  const viewport = document.documentElement;
  const view = document.defaultView;

  if (customContainer && view) {
    let node: Node | null = surface.parentNode;
    while (node && node !== viewport) {
      if (node instanceof view.HTMLElement && establishesContainingBlock(view, node)) {
        const rect = node.getBoundingClientRect();
        const left = rect.left + node.clientLeft - node.scrollLeft;
        return { left, right: left + node.clientWidth };
      }
      node = node instanceof view.ShadowRoot ? node.host : node.parentNode;
    }
  }

  const left = -viewport.scrollLeft;
  return { left, right: left + viewport.clientWidth };
}

/** Takes into account positioning and CSS-properties, creating concluded block. */
function establishesContainingBlock(view: Window, node: HTMLElement) {
  const style = view.getComputedStyle(node);
  const effects = [style.transform, style.translate, style.rotate, style.scale,
    style.perspective, style.filter, style.backdropFilter];
  return style.position !== 'static' || effects.some(value => value && value !== 'none')
    || /\b(layout|paint|strict|content)\b/.test(style.contain) || style.contentVisibility === 'auto'
    || /\b(transform|translate|rotate|scale|perspective|filter|backdrop-filter|contain)\b/
      .test(style.willChange);
}

/** Applies a single position and restores the former geometry when removing the align. */
export function createDropdownPosition(
  surface: HTMLElement,
  useSourcePlacement: () => boolean,
  hasCustomContainer: () => boolean
) {
  const viewport = surface.ownerDocument.documentElement;
  const style = surface.style;
  let region: ReturnType<typeof getInlineRegion> | undefined;
  let bounds: DOMRect;
  let available = 0;

  // The corrected boundary in px is preserved between frames with the same dimensions.
  function write(property: string, value: string) {
    if (style.getPropertyValue(property) !== value) style.setProperty(property, value);
  }

  // The previous placements use only left/top. Remove additional insets.
  function reset() {
    if (!region) return;

    for (const property of dropdownFitVariables) style.removeProperty(property);
    region = undefined;
    available = 0;
  }

  // With a sufficient location in both positions, the re-measure does not change anything.
  function measure() {
    if (!useSourcePlacement()) {
      reset();
      bounds = surface.getBoundingClientRect();
      return bounds;
    }

    region = getInlineRegion(surface, hasCustomContainer());
    bounds = surface.getBoundingClientRect();
    if (bounds.width < Math.min(available, region.right - region.left)) return bounds;

    write('left', `${region.left}px`);
    write(rightInset, `${viewport.clientWidth - region.right}px`);
    write(inlineAlignment, 'unsafe left');
    bounds = surface.getBoundingClientRect();
    return bounds;
  }

  // Dynamic inset holds the right or bottom edge when transferring text to the menu.
  function apply(position: TooltipPosition) {
    if (!region) return;

    const align = position.sourceAlign;
    const dynamicInset = align?.dynamicInset || align?._experimental?.dynamicInset;
    const point = align?.points?.[0];
    const fromRight = dynamicInset && point?.[1] === 'r';
    const fromBottom = dynamicInset && point?.[0] === 'b';
    const left = fromRight ? region.left : position.left;
    const right = fromRight ? position.left + bounds.width : region.right;
    const bottom = fromBottom ? `${viewport.clientHeight - position.top - bounds.height}px` : 'auto';
    available = right - left;

    write('left', `${left}px`);
    write(rightInset, `${viewport.clientWidth - right}px`);
    write(inlineAlignment, fromRight ? 'unsafe right' : 'unsafe left');
    write(bottomInset, bottom);
    write('top', fromBottom ? 'auto' : `${position.top}px`);
    write('--arrow-x', `${position.arrowX}px`);
    write('--arrow-y', `${position.arrowY}px`);
  }

  return { apply, measure, reset };
}
