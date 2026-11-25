import type { CssMotionName } from './css-motion.engine';

export type CssMotionEvent = TransitionEvent | AnimationEvent | { deadline: true; };
export type CssMotionStyle = string | Readonly<Record<string, string | number | null | undefined>>;

type MotionPrepare<Element extends HTMLElement> = (element: Element) => void | Promise<unknown>;
type MotionApply<Element extends HTMLElement> = (element: Element, event: null) => CssMotionStyle | void;
type MotionEnd<Element extends HTMLElement> = (element: Element, event: CssMotionEvent) => boolean | void;

/** Настройки фаз CSSMotion с DOM-узлом получателя. */
export interface CssMotionConfig<Element extends HTMLElement = HTMLElement> {
  motionName?: CssMotionName;
  motionAppear?: boolean;
  motionEnter?: boolean;
  motionLeave?: boolean;
  motionLeaveImmediately?: boolean;
  /** Положительное число миллисекунд после начала активной фазы. */
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
  /** Возврат false оставляет переход активным до следующего события. */
  onAppearEnd?: MotionEnd<Element>;
  onEnterEnd?: MotionEnd<Element>;
  onLeaveEnd?: MotionEnd<Element>;
  onVisibleChanged?: (visible: boolean) => void;
}
