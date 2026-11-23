// Выбирает позицию rc-menu для конкретного уровня и направления. Карта потребителя
// заменяет позиции целиком, а смещение ветки меняет только offset.
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
// Порядок ключей существенен для класса при совпадении точек нескольких позиций.
const ltrPlacements = { ...aboveAndBelow, leftTop, leftBottom, rightTop, rightBottom };
const rtlPlacements = {
  ...aboveAndBelow,
  rightTop: leftTop,
  rightBottom: leftBottom,
  leftTop: rightTop,
  leftBottom: rightBottom
};

/** Сохраняет прежнее размещение Menu, пока пользователь не задал карту или смещение. */
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
