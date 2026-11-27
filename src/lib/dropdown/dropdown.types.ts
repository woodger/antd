import type { Snippet } from 'svelte';
import type {
  MenuClickInfo, MenuDivider, MenuGroup, MenuItem, MenuProps, MenuSubMenu
} from '../menu/menu.types';
import type { AdjustOverflow, TooltipAlignConfig, TooltipPlacement } from '../tooltip.types';

/** Physical aspects and angles, including lateral placement. */
export type DropdownPlacement = TooltipPlacement;
export type DropdownTrigger = 'hover' | 'click' | 'contextMenu';

/** The source of the visibility request. The menu command requests closure. */
export interface DropdownOpenChangeInfo {
  source: 'trigger' | 'menu';
}

/** The object includes an arrow. pointAtCenter ties it to the center trigger. */
export interface DropdownArrowOptions {
  pointAtCenter?: boolean;
}

export interface DropdownClickInfo {
  key: string;
  domEvent: MouseEvent;
}

/** Event from the built-in Menu. Buttons and links emit a MouseEvent even with keyboard activation. */
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

/** Menu hosts teams, groups, dividers and nested branches. */
export type DropdownMenuEntry = DropdownCommand | DropdownBranch | DropdownGroup | MenuDivider | null;

/** Parameters of nested Menu. Dropdown sets vertical mode and disables the default selection. */
export interface DropdownMenuProps extends Omit<MenuProps, 'items' | 'nativeElement' | 'onClick'> {
  items?: readonly DropdownMenuEntry[];
  /** Selects a line without translating the focus. */
  activeKey?: string;
  onClick?: (info: DropdownMenuClickInfo) => void;
}

export type DropdownSlots = Partial<Record<
  'root' | 'item' | 'itemTitle' | 'itemIcon' | 'itemContent', string
>>;
export type DropdownSemantic = DropdownSlots | ((info: { props: DropdownProps; }) =>
  DropdownSlots | undefined);

/** Shared classes and styles of the panel and its menu. The nested provider replaces the entire record. */
export interface DropdownConfig extends Pick<DropdownProps, 'classNames' | 'styles'> {
  /** Additional panel root class. */
  class?: string;
  /** Root layer between styles.root provider and styles.root copies. */
  style?: string;
}

/** The command menu at trigger snippet with mouse, keyboard and focus return. */
export interface DropdownProps {
  /** The non-empty local prefix overrides ConfigProvider; the internal menu receives a suffix -menu. */
  prefixCls?: string;
  children: Snippet;
  /** DOM-node after mounting, including SVG. Purged at unmount. */
  ref?: Element;
  /** Additional Dropdown panel class. */
  rootClassName?: string;
  /** The class of open trigger after hydration. Empty string disables `${prefixCls}-open`. */
  openClassName?: string;
  menu?: DropdownMenuProps;
  /** Wraps or replaces the panel. Origin is available when transferred menu.items. */
  popupRender?: Snippet<[origin?: Snippet]>;
  /** Removes the panel after the animation is closed and completed. @defaultValue false */
  destroyOnHidden?: boolean;
  /** Mount the hidden panel on the client before the first opening. @defaultValue false */
  forceRender?: boolean;
  /** CSSMotion class. An empty string disables the transition. */
  transitionName?: string;
  /** Maintenances bind:open. */
  open?: boolean | undefined;
  /** @defaultValue false */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, info: DropdownOpenChangeInfo) => void;
  trigger?: DropdownTrigger | readonly DropdownTrigger[];
  /** It also focuses the menu when opened by guidance or by an external owner. */
  autoFocus?: boolean;
  disabled?: boolean;
  placement?: DropdownPlacement;
  /** Overrides the points, displacements and correction rules of the selected placement. */
  align?: TooltipAlignConfig;
  /** @defaultValue false */
  arrow?: boolean | DropdownArrowOptions;
  /** @defaultValue true */
  autoAdjustOverflow?: boolean | AdjustOverflow;
  /** @defaultValue 0.1 */
  mouseEnterDelay?: number;
  /** @defaultValue 0.1 */
  mouseLeaveDelay?: number;
  /** The local function overrides ConfigProvider; undefined preserves provider fallback. */
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  /** Surfacing classes and lines at each menu level. */
  classNames?: DropdownSemantic;
  /** CSS-declaration of the surface and lines at each menu level. */
  styles?: DropdownSemantic;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  class?: string;
  style?: string;
}
