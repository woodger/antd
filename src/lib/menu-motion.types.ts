import type { CssMotionName } from './css-motion.engine';

/** DOM-событие поверхности или истечение motionDeadline. */
export type MenuMotionEvent = TransitionEvent | AnimationEvent | { deadline: true; };

/** Исходный объект CSS properties или CSS-строка Svelte. */
export type MenuMotionStyle = string | Readonly<Record<string, string | number | null | undefined>>;

type MenuMotionPrepare = (element: HTMLElement) => void | Promise<unknown>;
type MenuMotionApply = (element: HTMLElement, event: null) => MenuMotionStyle | void;
type MenuMotionEnd = (element: HTMLElement, event: MenuMotionEvent) => boolean | void;

/** Настройки фаз списка и всплывающей поверхности Menu. */
export interface MenuMotion {
  motionName?: CssMotionName;
  /** Для inline явно заданное поле перекрывает openKeys. Popup использует состояние Menu. */
  visible?: boolean;
  /** Menu включает appear для popup и отключает для вложенного inline-списка. */
  motionAppear?: boolean;
  motionEnter?: boolean;
  motionLeave?: boolean;
  motionLeaveImmediately?: boolean;
  /** Положительное число миллисекунд после active. */
  motionDeadline?: number;
  /** Menu разрешает ранний монтаж через forceSubMenuRender. Popup также учитывает это поле. */
  forceRender?: boolean;
  /** Menu удерживает поверхность в пределах текущего режима. */
  removeOnLeave?: boolean;
  /** Menu назначает класс скрытого списка по своему prefixCls. */
  leavedClassName?: string;
  eventProps?: { className?: string; style?: MenuMotionStyle; };
  /** Подготовка popup при appear/enter принадлежит позиционированию. */
  onAppearPrepare?: MenuMotionPrepare;
  onEnterPrepare?: MenuMotionPrepare;
  onLeavePrepare?: MenuMotionPrepare;
  onAppearStart?: MenuMotionApply;
  onEnterStart?: MenuMotionApply;
  onLeaveStart?: MenuMotionApply;
  onAppearActive?: MenuMotionApply;
  onEnterActive?: MenuMotionApply;
  onLeaveActive?: MenuMotionApply;
  /** False оставляет переход активным до следующего собственного события. */
  onAppearEnd?: MenuMotionEnd;
  onEnterEnd?: MenuMotionEnd;
  onLeaveEnd?: MenuMotionEnd;
  onVisibleChanged?: (visible: boolean) => void;
}
