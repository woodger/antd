import type { Snippet } from 'svelte';
import type {
  MenuClickInfo, MenuDivider, MenuGroup, MenuItem, MenuProps, MenuSubMenu
} from './menu.types';
import type { AdjustOverflow, TooltipAlignConfig, TooltipPlacement } from './tooltip.types';

/** Физические стороны и углы, включая боковое размещение. */
export type DropdownPlacement = TooltipPlacement;
export type DropdownTrigger = 'hover' | 'click' | 'contextMenu';

/** Объект включает стрелку. pointAtCenter привязывает её к центру trigger. */
export interface DropdownArrowOptions {
  pointAtCenter?: boolean;
}

export interface DropdownClickInfo {
  key: string;
  domEvent: MouseEvent;
}

/** Событие встроенного Menu. Кнопки и ссылки передают MouseEvent и при вводе с клавиатуры. */
export interface DropdownMenuClickInfo extends MenuClickInfo {
  domEvent: MouseEvent;
}

export interface DropdownMenuItem extends Omit<MenuItem, 'key' | 'label' | 'onClick'> {
  key: string;
  label: string | Snippet;
  textValue?: string;
  href?: string;
  target?: string;
  rel?: string;
  onClick?: (info: DropdownClickInfo) => void;
}

export interface DropdownDivider {
  key: string;
  type: 'divider';
}

export type DropdownItem = DropdownMenuItem | DropdownDivider;

type DropdownMenuClick = { onClick?: (info: DropdownMenuClickInfo) => void; };
type DropdownCommand = Omit<MenuItem, 'onClick'> & DropdownMenuClick
  & Pick<DropdownMenuItem, 'href' | 'target' | 'rel' | 'textValue'>;
type DropdownBranch = Omit<MenuSubMenu, 'children' | 'onClick'> & DropdownMenuClick
  & { children: readonly DropdownMenuEntry[]; };
type DropdownGroup = Omit<MenuGroup, 'children'> & { children?: readonly DropdownMenuEntry[]; };

/** Menu принимает команды, группы, разделители и вложенные ветки. */
export type DropdownMenuEntry = DropdownCommand | DropdownBranch | DropdownGroup | MenuDivider | null;

/** Параметры вложенного Menu. Dropdown задаёт вертикальный режим и отключает выбор по умолчанию. */
export interface DropdownMenuProps extends Omit<MenuProps, 'items' | 'nativeElement' | 'onClick'> {
  items?: readonly DropdownMenuEntry[];
  /** Выделяет строку без перевода фокуса. */
  activeKey?: string;
  onClick?: (info: DropdownMenuClickInfo) => void;
}

export type DropdownSlots = Partial<Record<
  'root' | 'item' | 'itemTitle' | 'itemIcon' | 'itemContent', string
>>;
export type DropdownSemantic = DropdownSlots | ((info: { props: DropdownProps; }) =>
  DropdownSlots | undefined);

/** Общие классы и стили панели и её меню. Вложенный provider заменяет record целиком. */
export interface DropdownConfig extends Pick<DropdownProps, 'classNames' | 'styles'> {
  /** Дополнительный класс корня панели. */
  class?: string;
  /** Слой корня между styles.root провайдера и styles.root экземпляра. */
  style?: string;
}

/** Меню команд у trigger snippet с мышью, клавиатурой и возвратом фокуса. */
export interface DropdownProps {
  /** Непустой локальный префикс перекрывает ConfigProvider; внутреннее меню получает суффикс -menu. */
  prefixCls?: string;
  children: Snippet;
  /** DOM-узел trigger после монтирования, включая SVG. Очищается при unmount. */
  ref?: Element;
  /** Дополнительный класс панели Dropdown. */
  rootClassName?: string;
  /** Класс открытого trigger после hydration. Пустая строка отключает `${prefixCls}-open`. */
  openClassName?: string;
  menu?: DropdownMenuProps;
  /** Оборачивает или заменяет панель. Origin доступен, когда передан menu.items. */
  popupRender?: Snippet<[origin?: Snippet]>;
  /** Удаляет панель после закрытия и завершения анимации. @defaultValue false */
  destroyOnHidden?: boolean;
  /** Монтирует скрытую панель на клиенте до первого открытия. @defaultValue false */
  forceRender?: boolean;
  /** CSSMotion-класс. Пустая строка отключает переход. */
  transitionName?: string;
  /** Поддерживает bind:open. */
  open?: boolean | undefined;
  /** @defaultValue false */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: DropdownTrigger | readonly DropdownTrigger[];
  /** Фокусирует меню также при открытии наведением или внешним владельцем. */
  autoFocus?: boolean;
  disabled?: boolean;
  placement?: DropdownPlacement;
  /** Переопределяет точки, смещения и правила коррекции выбранного placement. */
  align?: TooltipAlignConfig;
  /** @defaultValue false */
  arrow?: boolean | DropdownArrowOptions;
  /** @defaultValue true */
  autoAdjustOverflow?: boolean | AdjustOverflow;
  /** @defaultValue 0.1 */
  mouseEnterDelay?: number;
  /** @defaultValue 0.1 */
  mouseLeaveDelay?: number;
  /** Локальная функция перекрывает ConfigProvider; undefined сохраняет provider fallback. */
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  /** Классы поверхности и строк на каждом уровне меню. */
  classNames?: DropdownSemantic;
  /** CSS-декларации поверхности и строк на каждом уровне меню. */
  styles?: DropdownSemantic;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  class?: string;
  style?: string;
}
