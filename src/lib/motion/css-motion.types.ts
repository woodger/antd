import type { CssMotionName } from './css-motion.engine';

export type CssMotionEvent = TransitionEvent | AnimationEvent | { deadline: true; };
export type CssMotionStyle = string | Readonly<Record<string, string | number | null | undefined>>;

type MotionPrepare<Element extends HTMLElement> = (element: Element) => void | Promise<unknown>;
type MotionApply<Element extends HTMLElement> = (element: Element, event: null) => CssMotionStyle | void;
type MotionEnd<Element extends HTMLElement> = (element: Element, event: CssMotionEvent) => boolean | void;

/** CSSMotion phase options with the target DOM node. */
export interface CssMotionConfig<Element extends HTMLElement = HTMLElement> {
  motionName?: CssMotionName;
  motionAppear?: boolean;
  motionEnter?: boolean;
  motionLeave?: boolean;
  motionLeaveImmediately?: boolean;
  /** Positive number of milliseconds after the active phase starts. */
  motionDeadline?: number;
  onAppearPrepare?: MotionPrepare<Element>;
  onEnterPrepare?: MotionPrepare<Element>;
  onLeavePrepare?: MotionPrepare<Element>;
  onAppearStart?: MotionApply<Element>;
  onEnterStart?: MotionApply<Element>;
  onLeaveStart?: MotionApply<Element>;
  onAppearActive?: MotionApply<Element>;
  onEnterActive?: MotionApply<Element>;
  onLeaveActive?: MotionApply<Element>;
  /** Returning false keeps the transition active until the next event. */
  onAppearEnd?: MotionEnd<Element>;
  onEnterEnd?: MotionEnd<Element>;
  onLeaveEnd?: MotionEnd<Element>;
  onVisibleChanged?: (visible: boolean) => void;
}
