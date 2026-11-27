/** CSS transition/animation event or the CSSMotion deadline. */
export type TreeMotionEvent = Event | { deadline: true; };
export type TreeMotionName = string | Partial<Record<
  'appear' | 'enter' | 'leave'
  | 'appearPrepare' | 'enterPrepare' | 'leavePrepare'
  | 'appearStart' | 'enterStart' | 'leaveStart'
  | 'appearActive' | 'enterActive' | 'leaveActive',
  string
>>;

type TreeMotionPrepare = (element: HTMLDivElement) => void | Promise<unknown>;
type TreeMotionStyle = (element: HTMLDivElement, event: null) => string | void;
type TreeMotionEnd = (element: HTMLDivElement, event: TreeMotionEvent) => boolean | void;

/** Native CSSMotion groups: start/active return CSS-strings; prepare can be expected. */
export interface TreeMotionConfig {
  motionName?: TreeMotionName;
  /** Its own value overlaps the visibility of the group as the original CSSMotion spread. */
  visible?: boolean;
  /** Tree forcibly turns on when opened and switches off when folding. */
  motionAppear?: boolean;
  motionEnter?: boolean;
  motionLeave?: boolean;
  motionLeaveImmediately?: boolean;
  motionDeadline?: number;
  forceRender?: boolean;
  removeOnLeave?: boolean;
  leavedClassName?: string;
  eventProps?: { className?: string; style?: string; [key: string]: unknown; };
  onAppearPrepare?: TreeMotionPrepare;
  onEnterPrepare?: TreeMotionPrepare;
  onLeavePrepare?: TreeMotionPrepare;
  onAppearStart?: TreeMotionStyle;
  onEnterStart?: TreeMotionStyle;
  onLeaveStart?: TreeMotionStyle;
  onAppearActive?: TreeMotionStyle;
  onEnterActive?: TreeMotionStyle;
  onLeaveActive?: TreeMotionStyle;
  onAppearEnd?: TreeMotionEnd;
  onEnterEnd?: TreeMotionEnd;
  onLeaveEnd?: TreeMotionEnd;
}
