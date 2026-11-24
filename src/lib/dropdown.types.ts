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
  items: readonly DropdownMenuEntry[];
  /** Выделяет строку без перевода фокуса. */
  activeKey?: string;
  onClick?: (info: DropdownMenuClickInfo) => void;
}

export type DropdownSlots = Partial<Record<
  'root' | 'item' | 'itemTitle' | 'itemIcon' | 'itemContent', string
>>;
export type DropdownSemantic = DropdownSlots | ((info: { props: DropdownProps; }) =>
  DropdownSlots | undefined);

/** Меню команд у trigger snippet с мышью, клавиатурой и возвратом фокуса. */
export interface DropdownProps {
  /** Непустой локальный префикс перекрывает ConfigProvider; внутреннее меню получает суффикс -menu. */
  prefixCls?: string;
  children: Snippet;
  menu: DropdownMenuProps;
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
  class?: string;
  style?: string;
}
