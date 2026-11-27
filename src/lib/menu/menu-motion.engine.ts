// Configures Menu's upstream CSSMotion defaults and hook override order.
import type { MenuMotion } from './menu-motion.types';

/** Collapse begins to grow from scratch, maintains the current height during care and waits for its completion. */
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

/** Popup prepares a position before the appearance; leave can use the custom preparation. */
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

// Begins appear/enter and ends the leave at a curtailed height.
function collapsedStyle() {
  return { height: 0, opacity: 0 };
}

// Opens the list to the height of the content, including the nested lists of the current level.
function expandedStyle(element: HTMLElement) {
  return { height: element.scrollHeight, opacity: 1 };
}

// Retains the painted height of the original list, including when interrupted.
function leavingStyle(element: HTMLElement) {
  return { height: element.offsetHeight };
}

// Opacity can be completed earlier. Height takes precedence before the original deadline.
const stopCollapse: NonNullable<MenuMotion['onLeaveEnd']> = (_element, event) =>
  'deadline' in event || 'propertyName' in event && event.propertyName === 'height';
