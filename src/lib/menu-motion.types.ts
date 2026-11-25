import type { CssMotionConfig, CssMotionEvent, CssMotionStyle } from './css-motion.types';

/** DOM-событие поверхности или истечение motionDeadline. */
export type MenuMotionEvent = CssMotionEvent;

/** Исходный объект CSS properties или CSS-строка Svelte. */
export type MenuMotionStyle = CssMotionStyle;

/** Настройки фаз списка и всплывающей поверхности Menu. */
export interface MenuMotion extends CssMotionConfig {
  /** Для inline явно заданное поле перекрывает openKeys. Popup использует состояние Menu. */
  visible?: boolean;
  /** Menu включает appear для popup и отключает для вложенного inline-списка. */
  motionAppear?: boolean;
  /** Menu разрешает ранний монтаж через forceSubMenuRender. Popup также учитывает это поле. */
  forceRender?: boolean;
  /** Menu удерживает поверхность в пределах текущего режима. */
  removeOnLeave?: boolean;
  /** Menu назначает класс скрытого списка по своему prefixCls. */
  leavedClassName?: string;
  eventProps?: { className?: string; style?: MenuMotionStyle; };
  /** Подготовка popup при appear/enter принадлежит позиционированию. */
  onAppearPrepare?: CssMotionConfig['onAppearPrepare'];
}
