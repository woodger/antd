// Choosing position rc-menu for a specific level and direction. The consumer's map replaces the
// entire position, and the displacement of the branch changes only offset.
import type { MenuPopupAlign, MenuProps, MenuSubMenu } from './menu.types';

const overflow = { adjustX: 1, adjustY: 1 };
const aboveAndBelow = {
  topLeft: { points: ['bl', 'tl'], overflow },
  topRight: { points: ['br', 'tr'], overflow },
  bottomLeft: { points: ['tl', 'bl'], overflow },
  bottomRight: { points: ['tr', 'br'], overflow }
};
const leftTop = { points: ['tr', 'tl'], overflow };
const leftBottom = { points: ['br', 'bl'], overflow };
const rightTop = { points: ['tl', 'tr'], overflow };
const rightBottom = { points: ['bl', 'br'], overflow };
// The order of keys is essential for the class when the points of several positions coincide.
const ltrPlacements = { ...aboveAndBelow, leftTop, leftBottom, rightTop, rightBottom };
const rtlPlacements = {
  ...aboveAndBelow,
  rightTop: leftTop,
  rightBottom: leftBottom,
  leftTop: rightTop,
  leftBottom: rightBottom
};

/** Retains the current Menu placement until the user supplies a map or offset. */
export function getMenuPopupAlignment(
  horizontal: boolean,
  rtl: boolean,
  builtinPlacements: MenuProps['builtinPlacements'],
  popupOffset: MenuSubMenu['popupOffset']
) {
  if (builtinPlacements === undefined && popupOffset === undefined) {
    return undefined;
  }

  const defaults = rtl ? rtlPlacements : ltrPlacements;
  const placements: Readonly<Record<string, MenuPopupAlign>> = { ...defaults, ...builtinPlacements };
  const placement: 'bottomLeft' | 'rightTop' = horizontal ? 'bottomLeft' : 'rightTop';
  const builtinAlign = placements[placement];
  const align = popupOffset ? { ...builtinAlign, offset: popupOffset } : builtinAlign;

  return { placement, placements, align };
}
