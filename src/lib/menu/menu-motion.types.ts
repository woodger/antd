import type { CssMotionConfig, CssMotionEvent, CssMotionStyle } from '../motion/css-motion.types';

/** DOM-surface event or expiration motionDeadline. */
export type MenuMotionEvent = CssMotionEvent;

/** Starting object CSS properties or CSS-line Svelte. */
export type MenuMotionStyle = CssMotionStyle;

/** Menu Phase and Pop-Up Settings. */
export interface MenuMotion extends CssMotionConfig {
  /** For inline, the clearly defined field overlaps openKeys. Popup uses Menu status. */
  visible?: boolean;
  /** Menu includes for popup and disables for the nested inline list. */
  motionAppear?: boolean;
  /** Menu allows early installation through forceSubMenuRender. Popup also takes into account this field. */
  forceRender?: boolean;
  /** Menu keeps the surface within the current mode. */
  removeOnLeave?: boolean;
  /** Menu assigns a class of hidden list according to its prefixCls. */
  leavedClassName?: string;
  eventProps?: { className?: string; style?: MenuMotionStyle; };
  /** Preparation of popup at appear/enter belongs to positioning. */
  onAppearPrepare?: CssMotionConfig['onAppearPrepare'];
}
