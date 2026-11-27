import type { CssMotionName } from './css-motion.engine';

/** Native end event CSS motion or original deadline without DOM event. */
export type TabsMotionEvent = Event | { deadline: true; };

/** Phase names CSSMotion; string uses suffix appear/enter/leave and start/active. */
export type TabsMotionName = CssMotionName;

type TabsMotionPrepare = (element: HTMLDivElement) => void | Promise<unknown>;
type TabsMotionStyle = (element: HTMLDivElement, event: null) => string | void;
type TabsMotionEnd = (element: HTMLDivElement, event: TabsMotionEvent) => boolean | void;

/**
 * Native CSSMotion for panel. Start/active returns CSS lines and gets event=null. Prepare also
 * works when the motion is switched off; end = false postpones completion. Prepare/start sees DOM
 * with prepared classes; active reads start classes. React children/internalRef is not used
 * baseline TabPanelList.
 */
export interface TabsPaneMotion {
  motionName?: TabsMotionName;
  /** The proprietary field overlaps the active panels; undefined stands for the original true. */
  visible?: boolean;
  /** @defaultValue true */
  motionAppear?: boolean;
  /** @defaultValue true */
  motionEnter?: boolean;
  /** @defaultValue true */
  motionLeave?: boolean;
  motionLeaveImmediately?: boolean;
  /** Positive timeout in ms after active; 0 doesn't set the deadline. */
  motionDeadline?: number;
  /** Its own field overlaps item.forceRender. */
  forceRender?: boolean;
  /** The proper field overlaps native destroyOnHidden; undefined means true. */
  removeOnLeave?: boolean;
  leavedClassName?: string;
  /** CSSMotion eventProps: stable className/style; the remaining fields do not read TabPanelList. */
  eventProps?: { className?: string; style?: string; [key: string]: unknown; };
  onAppearPrepare?: TabsMotionPrepare;
  onEnterPrepare?: TabsMotionPrepare;
  onLeavePrepare?: TabsMotionPrepare;
  onAppearStart?: TabsMotionStyle;
  onEnterStart?: TabsMotionStyle;
  onLeaveStart?: TabsMotionStyle;
  onAppearActive?: TabsMotionStyle;
  onEnterActive?: TabsMotionStyle;
  onLeaveActive?: TabsMotionStyle;
  onAppearEnd?: TabsMotionEnd;
  onEnterEnd?: TabsMotionEnd;
  onLeaveEnd?: TabsMotionEnd;
  onVisibleChanged?: (visible: boolean) => void;
}

/** Settings Tabs.animated; at tabPane=true Ant Design replaces custom motion switch. */
export interface TabsAnimatedConfig {
  inkBar?: boolean;
  tabPane?: boolean;
  /** Without tabPane includes its own CSSMotion; tabPane = false preserves without motion class. */
  tabPaneMotion?: TabsPaneMotion;
}
