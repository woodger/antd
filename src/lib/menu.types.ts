import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { PopupSourceAlign } from './popup-position.engine';

export type MenuMode = 'vertical' | 'horizontal' | 'inline';
export type MenuTheme = 'light' | 'dark';
export type MenuContent = string | number | Snippet;

/** Положение поверхности относительно заголовка, включая смещения и обработку краёв. */
export type MenuPopupAlign = Omit<PopupSourceAlign, '_experimental'>;

export type MenuSubMenuSlots = Partial<Record<
  'item' | 'itemTitle' | 'list' | 'itemIcon' | 'itemContent',
  string
>>;
export type MenuPopupSlots = { root?: string; };
export type MenuClassNames = MenuSubMenuSlots & {
  root?: string;
  popup?: string | MenuPopupSlots;
  subMenu?: MenuSubMenuSlots;
};
export type MenuStyles = MenuSubMenuSlots & {
  root?: string;
  popup?: MenuPopupSlots;
  subMenu?: MenuSubMenuSlots;
};
export type MenuSemantic<T> = T | ((info: { props: MenuProps; }) => T | undefined);

/** Настройки Menu в ConfigProvider. Собственный record заменяет родительский. */
export interface MenuConfig {
  class?: string;
  style?: string;
  classNames?: MenuSemantic<MenuClassNames>;
  styles?: MenuSemantic<MenuStyles>;
  expandIcon?: MenuExpandIcon;
}

interface MenuCommon {
  key?: string | number;
  label?: MenuContent;
  class?: string;
  style?: string;
}
export interface MenuItem extends MenuCommon {
  type?: 'item';
  key: string | number;
  icon?: Snippet;
  extra?: MenuContent;
  title?: string;
  disabled?: boolean;
  danger?: boolean;
  onClick?: (info: MenuClickInfo) => void;
}
export interface MenuSubMenu extends MenuCommon {
  type?: 'submenu';
  key: string | number;
  children: readonly MenuItemType[];
  icon?: Snippet;
  title?: string;
  disabled?: boolean;
  theme?: MenuTheme;
  popupClassName?: string;
  /** Смещение [x, y] в пикселях. Заменяет offset выбранной позиции. */
  popupOffset?: readonly number[];
  /** Стили отдельной поверхности popup; styles.popup.root имеет приоритет. */
  popupStyle?: string;
  /** Переопределяет popupRender Menu для этой ветки. */
  popupRender?: MenuPopupRender;
  /** Переопределяет значок этого подменю; false и null скрывают его. */
  expandIcon?: MenuExpandIcon;
  onClick?: (info: MenuClickInfo) => void;
  onTitleClick?: (info: { key: string; domEvent: MouseEvent | KeyboardEvent; }) => void;
}
export interface MenuGroup extends MenuCommon {
  type: 'group';
  children?: readonly MenuItemType[];
}
export interface MenuDivider extends Omit<MenuCommon, 'label'> {
  type: 'divider';
  dashed?: boolean;
}
export type MenuItemType = MenuItem | MenuSubMenu | MenuGroup | MenuDivider | null;

/** Данные всплывающего подменю и доступ к его штатным строкам. */
export interface MenuPopupRenderInfo {
  /** Данные ветки, канонический eventKey и непосредственные строки в children. */
  item: MenuSubMenu & { eventKey: string; };
  /** Путь от корня до ветки, включая ключ переполнения при его наличии. */
  keys: readonly string[];
  /** Выводит строку из item.children со штатными стилями, событиями и ref. */
  renderItem: Snippet<[child: MenuItemType]>;
}

/** Рисует popup вокруг исходного списка или заменяет его содержимое. */
export type MenuPopupRender = Snippet<[
  originMenu: Snippet<[children?: Snippet]>,
  info: MenuPopupRenderInfo
]>;

/** Данные ветки и её текущее состояние при отрисовке значка раскрытия. */
export interface MenuExpandIconInfo extends MenuSubMenu {
  eventKey: string;
  isSubMenu: true;
  isOpen: boolean;
  disabled: boolean;
}
export type MenuExpandIcon = Snippet<[MenuExpandIconInfo]> | false | null;

export interface MenuClickInfo {
  key: string;
  keyPath: string[];
  domEvent: MouseEvent | KeyboardEvent;
  itemData: MenuItem;
}
export interface MenuSelectInfo extends MenuClickInfo {
  selectedKeys: string[];
}
/** Дерево пунктов навигации со ссылками, выбором, подменю и клавиатурой. */
export interface MenuProps extends Omit<
  HTMLAttributes<HTMLUListElement>,
  'children' | 'onselect'
> {
  /** Локальный префикс всех частей Menu и popup; пустая строка наследует ConfigProvider. */
  prefixCls?: string;
  items?: readonly MenuItemType[];
  /** @defaultValue 'vertical' */
  mode?: MenuMode;
  /** @defaultValue 'light' */
  theme?: MenuTheme;
  /** @defaultValue false */
  disabled?: boolean;
  /** Оставляет все пункты в строке горизонтального Menu. */
  disabledOverflow?: boolean;
  /** Содержимое кнопки переполнения. Без prop используется значок многоточия. */
  overflowedIndicator?: MenuContent | false | null;
  /** Класс всплывающего списка невместившихся пунктов. */
  overflowedIndicatorPopupClassName?: string;
  selectedKeys?: readonly string[];
  /** Начальное локальное значение; последующие изменения prop не переинициализируют состояние. */
  defaultSelectedKeys?: readonly string[];
  /** @defaultValue false */
  multiple?: boolean;
  /** @defaultValue true */
  selectable?: boolean;
  openKeys?: readonly string[];
  defaultOpenKeys?: readonly string[];
  onOpenChange?: (keys: string[]) => void;
  onClick?: (info: MenuClickInfo) => void;
  onSelect?: (info: MenuSelectInfo) => void;
  onDeselect?: (info: MenuSelectInfo) => void;
  /** @defaultValue 24 */
  inlineIndent?: number;
  inlineCollapsed?: boolean;
  /** @defaultValue false */
  forceSubMenuRender?: boolean;
  /** @defaultValue 'hover' */
  triggerSubMenuAction?: 'hover' | 'click';
  /** @defaultValue 0.1 */
  subMenuOpenDelay?: number;
  /** @defaultValue 0.1 */
  subMenuCloseDelay?: number;
  /** Заменяет встроенные позиции по имени для подменю и списка переполнения. */
  builtinPlacements?: Readonly<Record<string, MenuPopupAlign>>;
  /** Семантические классы накапливаются после классов из ConfigProvider.menu. */
  classNames?: MenuSemantic<MenuClassNames>;
  /**
   * CSS-строки для semantic slots. Для корня порядок слоёв: provider styles.root,
   * provider style, local styles.root, local style. Вложенные slots заменяются целиком.
   */
  styles?: MenuSemantic<MenuStyles>;
  /** Значок раскрытия подменю. Undefined наследует ConfigProvider.menu. */
  expandIcon?: MenuExpandIcon;
  /** Оформляет всплывающие подменю, включая список переполнения. */
  popupRender?: MenuPopupRender;
  /**
   * Контейнер popup подменю; trigger — native button заголовка.
   * Отсутствующий prop наследует ConfigProvider; собственный undefined отключает его.
   * При force render zero-arity getter может сначала получить undefined; SSR не вызывает getter.
   */
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement | ShadowRoot;
  rootClassName?: string;
  /** Нативный ref доступен после mount и очищается при unmount. */
  nativeElement?: HTMLUListElement;
}
