import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { PopupSourceAlign } from './popup-position.engine';
import type { TooltipProps } from './tooltip.types';
import type { MenuMotion } from './menu-motion.types';
import type { RenderEmptyContent } from './types';

export type MenuMode = 'vertical' | 'horizontal' | 'inline';
export type MenuTheme = 'light' | 'dark';
export type MenuContent = string | number | Snippet;

/** Событие пересечения границы пункта, заголовка или всей ветки. */
export interface MenuHoverInfo {
  /** Строковый ключ Menu, в том числе для пункта с числовым key. */
  key: string;
  /** Нативное событие с currentTarget соответствующей строки или заголовка на время вызова. */
  domEvent: MouseEvent;
}
export type MenuHoverEventHandler = (info: MenuHoverInfo) => void;

/** Данные пункта и состояние выбора для значка после подписи. */
export interface MenuItemIconInfo extends MenuItem {
  eventKey: string;
  isSelected: boolean;
}

/** Рисует содержимое после подписи и extra. Boolean и null не создают узел. */
export type MenuItemIcon = Snippet<[MenuItemIconInfo]> | string | number | boolean | null;

/** Положение поверхности относительно заголовка, включая смещения и обработку краёв. */
export type MenuPopupAlign = Omit<PopupSourceAlign, '_experimental'>;

/** Параметры подсказок свёрнутого меню. Значение false отключает общий Tooltip. */
export type MenuTooltip = Omit<TooltipProps, 'children'> | false;

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
  /** Подпись пункта, группы или подменю с вложенным содержимым. */
  label?: RenderEmptyContent;
  class?: string;
  style?: string;
}
export interface MenuItem extends MenuCommon {
  /** Пользовательские атрибуты пункта. Служебные маркеры Menu имеют приоритет. */
  [attribute: `data-${string}`]: unknown;
  type?: 'item';
  key: string | number;
  icon?: Snippet;
  /** Значок в конце строки. Пустое значение использует настройку ветки или Menu. */
  itemIcon?: MenuItemIcon;
  extra?: MenuContent;
  /** Строка также задаёт HTML title. False отключает подсказку для пункта. */
  title?: MenuContent | false | null;
  disabled?: boolean;
  danger?: boolean;
  /** События строки доступны у включённого пункта. */
  onMouseEnter?: MenuHoverEventHandler;
  onMouseLeave?: MenuHoverEventHandler;
  onClick?: (info: MenuClickInfo) => void;
}
export interface MenuSubMenu extends MenuCommon {
  type?: 'submenu';
  key: string | number;
  children: readonly MenuItemType[];
  icon?: Snippet;
  /** Значок в конце строк потомков. False отключает наследуемый значок. */
  itemIcon?: MenuItemIcon;
  title?: string;
  disabled?: boolean;
  theme?: MenuTheme;
  popupClassName?: string;
  /** Поле делегата rc-menu. Для оформления строки используется class. */
  rootClassName?: string;
  /** Смещение [x, y] в пикселях. Заменяет offset выбранной позиции. */
  popupOffset?: readonly number[];
  /** Стили отдельной поверхности popup; styles.popup.root имеет приоритет. */
  popupStyle?: string;
  /** Переопределяет popupRender Menu для этой ветки. */
  popupRender?: MenuPopupRender;
  /** Переопределяет значок этого подменю; false и null скрывают его. */
  expandIcon?: MenuExpandIcon;
  /** Граница ветки включает её списки, даже когда они вынесены в отдельный контейнер. */
  onMouseEnter?: MenuHoverEventHandler;
  onMouseLeave?: MenuHoverEventHandler;
  /** Граница заголовка. События доступны у включённого заголовка. */
  onTitleMouseEnter?: MenuHoverEventHandler;
  onTitleMouseLeave?: MenuHoverEventHandler;
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
  /** Как в обёртке Ant Design, фактическое направление задаёт ConfigProvider. */
  direction?: 'ltr' | 'rtl';
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
  /** @internal Семантика строк выбора внутри фильтра Table. */
  _itemRole?: 'menuitemcheckbox' | 'menuitemradio';
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
  /** Замещает встроенные анимации inline-списков и popup. */
  motion?: MenuMotion;
  /** Обёртка Ant Design разрешает карту встроенных фаз сама; для настройки используйте motion. */
  defaultMotions?: Partial<Record<MenuMode | 'other', MenuMotion>>;
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
  /** Общий значок после подписи и extra каждого пункта. */
  itemIcon?: MenuItemIcon;
  /** Общие параметры Tooltip для строк свёрнутого меню. */
  tooltip?: MenuTooltip;
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
