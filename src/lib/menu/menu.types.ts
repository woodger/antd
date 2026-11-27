import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { PopupSourceAlign } from '../popup-position.engine';
import type { TooltipProps } from '../tooltip/tooltip.types';
import type { MenuMotion } from './menu-motion.types';
import type { RenderEmptyContent } from '../types';

export type MenuMode = 'vertical' | 'horizontal' | 'inline';
export type MenuTheme = 'light' | 'dark';
export type MenuContent = string | number | Snippet;

/** The crossing of the border of the point, the header or the whole branch. */
export interface MenuHoverInfo {
  /** Menu string key, including for item with numerical key. */
  key: string;
  /** Native Event from currentTarget of the corresponding string or header at the time of the call. */
  domEvent: MouseEvent;
}
export type MenuHoverEventHandler = (info: MenuHoverInfo) => void;

/** Item data and selection status for the post-label icon. */
export interface MenuItemIconInfo extends MenuItem {
  eventKey: string;
  isSelected: boolean;
}

/** Draws the contents after the label and extra. Boolean and null do not create a knot. */
export type MenuItemIcon = Snippet<[MenuItemIconInfo]> | string | number | boolean | null;

/** Position of the surface relative to the heading, including offsets and edge handling. */
export type MenuPopupAlign = Omit<PopupSourceAlign, '_experimental'>;

/** Options for twisted menu prompts. The value false disconnects the total Tooltip. */
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

/** Menu settings in ConfigProvider. Your own record replaces your parent. */
export interface MenuConfig {
  class?: string;
  style?: string;
  classNames?: MenuSemantic<MenuClassNames>;
  styles?: MenuSemantic<MenuStyles>;
  expandIcon?: MenuExpandIcon;
}

interface MenuCommon {
  key?: string | number;
  /** Label of an item, group, or submenu with nested content. */
  label?: RenderEmptyContent;
  class?: string;
  style?: string;
}
export interface MenuItem extends MenuCommon {
  /** Custom attribute items. Menu’s service markers take precedence. */
  [attribute: `data-${string}`]: unknown;
  type?: 'item';
  key: string | number;
  icon?: Snippet;
  /** The icon at the end of the line. Empty value uses the configuration of the branch or Menu. */
  itemIcon?: MenuItemIcon;
  extra?: MenuContent;
  /** The string also sets HTML title. False disables a hint for point. */
  title?: MenuContent | false | null;
  disabled?: boolean;
  danger?: boolean;
  /** Line events are available at the included item. */
  onMouseEnter?: MenuHoverEventHandler;
  onMouseLeave?: MenuHoverEventHandler;
  onClick?: (info: MenuClickInfo) => void;
}
export interface MenuSubMenu extends MenuCommon {
  type?: 'submenu';
  key: string | number;
  children: readonly MenuItemType[];
  icon?: Snippet;
  /** An icon at the end of lines of descendants. False disables an inherited badge. */
  itemIcon?: MenuItemIcon;
  title?: string;
  disabled?: boolean;
  theme?: MenuTheme;
  popupClassName?: string;
  /** Field delegate rc-menu. Class is used to design the line. */
  rootClassName?: string;
  /** Displacement [x, y] in pixels. Replaces the offset of the selected position. */
  popupOffset?: readonly number[];
  /** Separate surface styles popup; styles.popup.root takes precedence. */
  popupStyle?: string;
  /** Redefines popupRender Menu for this branch. */
  popupRender?: MenuPopupRender;
  /** Redefines the icon of this substitution; false and null hide it. */
  expandIcon?: MenuExpandIcon;
  /** The boundary of the branch includes its lists, even when they are placed in a separate container. */
  onMouseEnter?: MenuHoverEventHandler;
  onMouseLeave?: MenuHoverEventHandler;
  /** Boundary of the title. Events are available at the included title. */
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

/** Popup submenu data and access to its default rows. */
export interface MenuPopupRenderInfo {
  /** These branches, canonical eventKey and direct strings in children. */
  item: MenuSubMenu & { eventKey: string; };
  /** Root to branch, including the overflowed key when available. */
  keys: readonly string[];
  /** Renders a row from item.children with the default styles, events, and ref. */
  renderItem: Snippet<[child: MenuItemType]>;
}

/** Draws a popup around the source list or replaces its contents. */
export type MenuPopupRender = Snippet<[
  originMenu: Snippet<[children?: Snippet]>,
  info: MenuPopupRenderInfo
]>;

/** Branch data and current state for rendering the expand icon. */
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
/** Wood navigation points with links, selection, submenu and keyboard. */
export interface MenuProps extends Omit<
  HTMLAttributes<HTMLUListElement>,
  'children' | 'onselect'
> {
  /** Local prefix of all parts of Menu and popup; an empty line inherits ConfigProvider. */
  prefixCls?: string;
  items?: readonly MenuItemType[];
  /** @defaultValue 'vertical' */
  mode?: MenuMode;
  /** As in the Ant Destination, the actual direction sets ConfigProvider. */
  direction?: 'ltr' | 'rtl';
  /** @defaultValue 'light' */
  theme?: MenuTheme;
  /** @defaultValue false */
  disabled?: boolean;
  /** Leaves all the items in the horizontal Menu line. */
  disabledOverflow?: boolean;
  /** Overflow button content. Defaults to the ellipsis icon. */
  overflowedIndicator?: MenuContent | false | null;
  /** The class of the pop-up list of unincluded items. */
  overflowedIndicatorPopupClassName?: string;
  selectedKeys?: readonly string[];
  /** Initial local value. Later prop changes do not reinitialize state. */
  defaultSelectedKeys?: readonly string[];
  /** @defaultValue false */
  multiple?: boolean;
  /** @defaultValue true */
  selectable?: boolean;
  /** @internal Semantics for selection rows inside Table filters. */
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
  /** Replaces built-in inline and popup animations. */
  motion?: MenuMotion;
  /** Ant Design wrapper resolves built-in phases map itself; use motion for customization. */
  defaultMotions?: Partial<Record<MenuMode | 'other', MenuMotion>>;
  /** @defaultValue 'hover' */
  triggerSubMenuAction?: 'hover' | 'click';
  /** @defaultValue 0.1 */
  subMenuOpenDelay?: number;
  /** @defaultValue 0.1 */
  subMenuCloseDelay?: number;
  /** Replaces built-in positions by name for submenu and overcrowding list. */
  builtinPlacements?: Readonly<Record<string, MenuPopupAlign>>;
  /** Semantic classes accumulate after classes from ConfigProvider.menu. */
  classNames?: MenuSemantic<MenuClassNames>;
  /**
   * CSS lines for semantic slots. For the root order of layers: provider styles.root, provider
   * style, local styles.root, local style. The nested slots are replaced entirely.
   */
  styles?: MenuSemantic<MenuStyles>;
  /** Submenu expand icon. undefined inherits ConfigProvider.menu. */
  expandIcon?: MenuExpandIcon;
  /** Decorates pop-up changes, including a list of overflows. */
  popupRender?: MenuPopupRender;
  /** General icon after label and extra each item. */
  itemIcon?: MenuItemIcon;
  /** General parameters Tooltip for folded menu strings. */
  tooltip?: MenuTooltip;
  /**
   * Container popup submenu; trigger — native button title. Missing prop inherits ConfigProvider;
   * its own undefined disables it. In case of render force zero-arity getter can first get
   * undefined; SSR does not cause getter.
   */
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement | ShadowRoot;
  rootClassName?: string;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLUListElement;
}
