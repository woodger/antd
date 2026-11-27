import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { ComponentSize } from './types';
import type { TabsAnimatedConfig } from './tabs-motion.types';
import type { TabsRenderTabBar } from './tabs-nav.types';
import type { PopupOffset, PopupSourceAlign } from './popup-position.engine';

export type TabsType = 'line' | 'card' | 'editable-card';
export type TabsPlacement = 'top' | 'bottom' | 'start' | 'end';
export type TabsPosition = 'top' | 'right' | 'bottom' | 'left';
export type TabsContent = string | number | boolean | null | Snippet;
export type TabsExtraContent = TabsContent | { left?: TabsContent; right?: TabsContent; };
export type TabsIndicatorSize = number | ((origin: number) => number);

/** Size and logical alignment of the active title indicator. */
export interface TabsIndicator {
  /** Size in px or pure calculation from full width/height title. */
  size?: TabsIndicatorSize;
  /** @defaultValue 'center' */
  align?: 'start' | 'center' | 'end';
}

/** The physical direction of changing native scroll titles. */
export interface TabsScrollInfo {
  direction: 'left' | 'right' | 'top' | 'bottom';
}

export type TabsMoreTrigger = 'hover' | 'click' | 'contextMenu' | 'focus';
export type TabsMorePlacement = 'topLeft' | 'top' | 'topRight'
  | 'bottomLeft' | 'bottom' | 'bottomRight';
export type TabsMoreOffset = PopupOffset;
/** Source AlignType rc-trigger: physical points, numerical/interest offsets and overflow. */
export type TabsMoreAlign = PopupSourceAlign;
export type TabsMorePlacements = Readonly<Record<string, TabsMoreAlign>>;

export interface TabsMoreRenderInfo {
  restTabs: readonly TabsItem[];
  onClose: () => void;
}

/** Hidden tab menu settings; popupRender gets the original listbox as snippet. */
export interface TabsMoreProps {
  icon?: TabsContent;
  popupRender?: Snippet<[Snippet, TabsMoreRenderInfo]>;
  /** @defaultValue 'hover' */
  trigger?: TabsMoreTrigger | readonly TabsMoreTrigger[];
  /** Overlaps trigger actions only for opening; an empty array disables them. */
  showAction?: readonly TabsMoreTrigger[];
  /** Overlaps the closing actions; contextMenu default — ['click'], focus blur closes at the button. */
  hideAction?: readonly TabsMoreTrigger[];
  /** Own class of open More; undefined uses the current Tabs prefix + dropdown-open. */
  openClassName?: string;
  /** Replaces the standard menu and popupRender; content is lazy. */
  overlay?: Snippet;
  /** Removes the popup and its state after the end of leave. @defaultValue false */
  autoDestroy?: boolean;
  /** Motion class prefix; default - total ConfigProvider prefix + slide-up; '' disables CSS motion. */
  transitionName?: string;
  /** overrides transitionName with current Tabs prefix + dropdown-; '' does not overlap. */
  animation?: string;
  /** @defaultValue 'bottomLeft' */
  placement?: TabsMorePlacement;
  /** Replaces the whole source table; undefined preserves six defaults rc-dropdown. */
  placements?: TabsMorePlacements;
  /** Overlaps placements, including the explicit undefined, which gives an empty Trigger table. */
  builtinPlacements?: TabsMorePlacements;
  /** Shallowly overlaps the selected placement, including the whole object overflow. */
  align?: TabsMoreAlign;
  /** Uses client coordinates of the last click/hover/contextMenu; without the dot - button. */
  alignPoint?: boolean;
  /** Receives popup and actual points after flip, before recording offsets in DOM. */
  onPopupAlign?: (popup: HTMLDivElement, align: TabsMoreAlign) => void;
  /** The original rc-dropdown adds div-arrow and show-arrow class without its own Tabs styles. */
  arrow?: boolean;
  /** Delays in seconds, as in the original Dropdown. @defaultValue 0.1 */
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
  /**
   * Boolean overlaps the internal state, including onClose. The explicit undefined includes a
   * separate Trigger state: keyboard/onClose only changes open Tabs.
   */
  visible?: boolean;
  /** Like more in rc-tabs, replaces the internal pointer or dismiss callback. Supply visible for controlled operation. */
  onVisibleChange?: (visible: boolean) => void;
  overlayClassName?: string;
  overlayStyle?: string;
  /** Overrides the root or provider function, including with an own undefined value. */
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  autoFocus?: boolean;
  minOverlayWidthMatchTrigger?: boolean;
  onOverlayClick?: (event: MouseEvent) => void;
}

export interface TabsItem {
  key: string;
  label: TabsContent;
  children?: Snippet;
  icon?: Snippet;
  /** Detailed panel class after classNames.content; does not change tab title. */
  className?: string;
  /** CSS-bar panel after styles.content and before motion styles. */
  style?: string;
  disabled?: boolean;
  /** In editable-card prohibits deletion; disabled also hides the button. */
  closable?: boolean;
  /** Null and false hide the button when closable is omitted. closable=true keeps it. */
  closeIcon?: TabsContent;
  forceRender?: boolean;
  /** Configuration of the panel overlaps the root, including the explicit false. */
  destroyOnHidden?: boolean;
}

/** The original available names of the control buttons are Tabs. */
export interface TabsLocale {
  addAriaLabel?: string;
  removeAriaLabel?: string;
  /** Listbox name of hidden tabs; empty string is saved. */
  dropdownAriaLabel?: string;
}

/** Class names or CSS lines; popup string reduces record popup.root. */
export interface TabsSlots {
  root?: string;
  item?: string;
  remove?: string;
  indicator?: string;
  body?: string;
  content?: string;
  header?: string;
  popup?: string | { root?: string; };
}

/** Props with source size (undefined without explicit size), physical placement and normalized items. */
export type TabsSemanticProps = Omit<TabsProps, 'items' | 'size' | 'tabPlacement' | 'nativeElement'> & {
  items: readonly TabsItem[];
  size: ComponentSize | 'medium' | undefined;
  tabPlacement?: TabsPosition;
};

export type TabsSemantic = TabsSlots | ((info: { props: TabsSemanticProps; }) => TabsSlots);

/** Settings ConfigProvider.tabs; nested provider replaces the entire record. */
export interface TabsConfig {
  class?: string;
  style?: string;
  classNames?: TabsSemantic;
  styles?: TabsSemantic;
  indicator?: TabsIndicator;
  addIcon?: TabsContent;
  removeIcon?: TabsContent;
  moreIcon?: TabsContent;
  /** As in 6.6.8, the global uses more only; the rest of the fields do not change the trigger. */
  more?: Omit<TabsMoreProps, 'popupRender'>;
}

/** A set of keyed panels with bind:activeKey, manual keyboard activation and overflow. */
export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'style'> {
  /** A nonempty local prefix takes precedence. Otherwise uses ConfigProvider.prefixCls. */
  prefixCls?: string;
  items: readonly TabsItem[];
  /** Maintenances bind:activeKey. */
  activeKey?: string | undefined;
  /** Initial local value. Later prop changes do not reinitialize state. */
  defaultActiveKey?: string;
  onChange?: (activeKey: string) => void;
  onTabClick?: (key: string, event: MouseEvent) => void;
  /**
   * Only when changing scroll on the current axis; neighboring native events can be combined by the
   * browser.
   */
  onTabScroll?: (info: TabsScrollInfo) => void;
  indicator?: TabsIndicator;
  type?: TabsType;
  /** The starting default: inkBar = true, tabPane = false; true includes both animations. */
  animated?: boolean | TabsAnimatedConfig;
  /** Requests to change items from the owner; add receives the event, remove - key. */
  onEdit?: (target: MouseEvent | KeyboardEvent | string, action: 'add' | 'remove') => void;
  /** Hides the addition only to the editable card. @defaultValue false */
  hideAdd?: boolean;
  /** Falsy value uses the original icon PlusOutlined. */
  addIcon?: TabsContent;
  /** Nullish value uses CloseOutlined; falsy fallback when deleted – “×”. */
  removeIcon?: TabsContent;
  /** By default, the original Add tab/remove; does not replace the available name tablist. */
  locale?: TabsLocale;
  more?: TabsMoreProps;
  /**
   * More icon precedence: global tabs.more.icon ?? tabs.moreIcon. An explicit local more.icon
   * overrides them, including null, false, and undefined.
   */
  moreIcon?: TabsContent;
  /** Absence inherits ConfigProvider; own undefined shuts down inheritance. */
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  /** @defaultValue 'top' */
  tabPlacement?: TabsPlacement;
  /**
   * Centers horizontal headers. The vertical list stretches as in upstream.
   * @defaultValue false
   */
  centered?: boolean;
  /** Space in px before every header except the first and before the add button. */
  tabBarGutter?: number;
  /** CSS-string for the header panel; style still refers to the root of Tabs. */
  tabBarStyle?: string;
  /** In the absence, ConfigProvider.componentSize is used. */
  size?: ComponentSize | 'medium';
  /** @defaultValue false */
  destroyOnHidden?: boolean;
  tabBarExtraContent?: TabsExtraContent;
  /** Snippet receives allowed props and standard navigation with replaceable props. */
  renderTabBar?: TabsRenderTabBar;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  class?: string;
  rootClassName?: string;
  style?: string;
  /** Provider and local classes accumulate; callback receives the allowed props. */
  classNames?: TabsSemantic;
  /** CSS-lines; root style overlaps styles.root, tabBarStyle overlaps styles.header. */
  styles?: TabsSemantic;
  /** bind:nativeElement provides root HTMLDivElement after mount; SSR refs are not filled. */
  nativeElement?: HTMLDivElement;
}
