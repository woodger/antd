// Настраивает исходные CSSMotion defaults Menu и порядок переопределения hooks.
import type { MenuMotion } from './menu-motion.types';

/** Collapse начинает рост с нуля, сохраняет текущую высоту при уходе и ждёт её окончания. */
export function getMenuInlineMotion(
  name: string,
  custom: MenuMotion | undefined,
  nested: boolean
): MenuMotion {
  if (custom) {
    return nested ? { ...custom, motionAppear: false } : custom;
  }

  return {
    motionName: name,
    motionAppear: !nested,
    motionDeadline: 500,
    onAppearStart: collapsedStyle,
    onEnterStart: collapsedStyle,
    onAppearActive: expandedStyle,
    onEnterActive: expandedStyle,
    onLeaveStart: leavingStyle,
    onLeaveActive: collapsedStyle,
    onAppearEnd: stopCollapse,
    onEnterEnd: stopCollapse,
    onLeaveEnd: stopCollapse
  };
}

/** Popup готовит позицию перед появлением; leave может использовать пользовательский prepare. */
export function getMenuPopupMotion(
  name: string,
  custom: MenuMotion | undefined,
  prepare: NonNullable<MenuMotion['onEnterPrepare']>
): MenuMotion {
  return {
    ...(custom ?? { motionName: name }),
    motionAppear: true,
    onAppearPrepare: prepare,
    onEnterPrepare: prepare
  };
}

// Начинает appear/enter и заканчивает leave на свернутой высоте.
function collapsedStyle() {
  return { height: 0, opacity: 0 };
}

// Открывает список на высоту содержимого, включая вложенные списки текущего уровня.
function expandedStyle(element: HTMLElement) {
  return { height: element.scrollHeight, opacity: 1 };
}

// Сохраняет окрашенную высоту исходного списка, в том числе при прерывании.
function leavingStyle(element: HTMLElement) {
  return { height: element.offsetHeight };
}

// Opacity может завершиться раньше. Height имеет приоритет до исходного deadline.
const stopCollapse: NonNullable<MenuMotion['onLeaveEnd']> = (_element, event) =>
  'deadline' in event || 'propertyName' in event && event.propertyName === 'height';
