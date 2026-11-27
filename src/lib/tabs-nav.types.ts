import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { TabsAnimatedConfig } from './tabs-motion.types';
import type {
  TabsContent,
  TabsExtraContent,
  TabsIndicator,
  TabsItem,
  TabsLocale,
  TabsMoreProps,
  TabsPosition,
  TabsScrollInfo,
  TabsSlots
} from './tabs.types';

/** Adding and Deleting Settings in a Standard Header Panel. */
export interface TabsEditableConfig {
  onEdit: (
    action: 'add' | 'remove',
    info: { key?: string; event: MouseEvent | KeyboardEvent; }
  ) => void;
  showAdd?: boolean;
  addIcon?: TabsContent;
  removeIcon?: TabsContent;
}

type TabsBarSlots = Omit<TabsSlots, 'popup'> & { popup?: string; };

/** Header node attributes; the native tab button stays inside. */
export type TabsTabAttributes = HTMLAttributes<HTMLElement>;

export type TabsTabNode = Snippet<[attributes?: TabsTabAttributes]>;

/** Allowed settings TabNavList; popup is already flat, as in the original rc-tabs. */
export interface TabsTabBarProps {
  id: string;
  activeKey: string | undefined;
  animated: TabsAnimatedConfig;
  tabPosition: TabsPosition;
  rtl: boolean;
  mobile: boolean;
  editable?: TabsEditableConfig;
  locale?: TabsLocale;
  /** Replacement in its entirety: the absence of icon returns the text More of the original OperationNode. */
  more?: TabsMoreProps;
  tabBarGutter?: number;
  /** Native choice; KeyboardEvent preserves public MouseEvent contract and contract. */
  onTabClick: (key: string, event: MouseEvent | KeyboardEvent) => void;
  onTabScroll?: (info: TabsScrollInfo) => void;
  extra?: TabsExtraContent;
  className?: string;
  /** Callback-ref of the standard panel; null when replacing ref/unmount, is not called at SSR. */
  ref?: (element: HTMLDivElement | null) => void;
  style?: string;
  /** Permitted container context; override undefined of the standard panel shuts it off. */
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement | ShadowRoot;
  popupClassName?: string;
  indicator?: TabsIndicator;
  /** Permitted semantic slots; popup is a flat line. */
  classNames?: TabsBarSlots;
  /** CSS lines; body/content changes do not change Tabs panels here. */
  styles?: TabsBarSlots;
  /** Analogue renderWrapper/cloneElement: original attributes are available for merge and attachments. */
  children?: Snippet<[node: TabsTabNode, item: TabsItem, attributes: TabsTabAttributes]>;
}

/** Standard Navigation with a Full Set of props; For replacement, use the original props. */
export type TabsDefaultTabBar = Snippet<[props: TabsTabBarProps]>;

/** Custom bar only replaces navigation; the panels and their lifecycle remain in Tabs. */
export type TabsRenderTabBar = Snippet<[
  props: TabsTabBarProps,
  DefaultTabBar: TabsDefaultTabBar
]>;

export interface TabsNavApi {
  readonly element: HTMLDivElement | undefined;
  focusTab: (key: string | undefined) => void;
}

export interface TabsNavContext {
  readonly prefixCls: string;
  readonly rootPrefixCls: string;
  readonly items: readonly TabsItem[];
  readonly root: HTMLDivElement | undefined;
  readonly ownerId: string;
  readonly rootPlacement: TabsPosition;
  readonly centered: boolean;
  readonly card: boolean;
  readonly ariaLabel: string | undefined;
  readonly ariaLabelledby: string | undefined;
  readonly themeClassName: string | undefined;
  readonly themeStyle: string | undefined;
  readonly defaultMoreIcon: TabsContent;
  register: (api: TabsNavApi) => () => void;
}
