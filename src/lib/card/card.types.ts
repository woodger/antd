import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { ComponentSize } from '../types';
import type { TabsContent, TabsExtraContent, TabsItem, TabsProps } from '../tabs/tabs.types';

export type CardContent = TabsContent;
/** Card settings. An explicit nested record replaces the parent's record in full. */
export interface CardConfig {
  variant?: CardProps['variant'];
  class?: string;
  style?: string;
  classNames?: CardSemantic;
  styles?: CardSemantic;
}
/** ConfigProvider.cardMeta settings are independent of Card and follow the same record replacement rule. */
export interface CardMetaConfig {
  class?: string;
  style?: string;
  classNames?: CardMetaSemantic;
  styles?: CardMetaSemantic;
}
export type CardSlots = Partial<
  Record<'root' | 'header' | 'body' | 'extra' | 'title' | 'actions' | 'cover', string>
>;
export type CardMetaSlots = Partial<
  Record<'root' | 'section' | 'avatar' | 'title' | 'description', string>
>;
/** The Card callback receives resolved size and variant and the existing native defaults for other Props. */
export type CardSemantic = CardSlots | ((info: { props: CardProps; }) => CardSlots);
/** The Meta callback receives current Props. root is the outer CardMeta div. */
export type CardMetaSemantic = CardMetaSlots | ((info: { props: CardMetaProps; }) => CardMetaSlots);
export interface CardTabItem extends Omit<TabsItem, 'label'> {
  label?: TabsContent;
}
/** Card with title, extra, actions, and tabs. Content is retained while loading. */
export interface CardProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'title' | 'class' | 'style'
> {
  children?: Snippet;
  /** A nonempty local prefix takes precedence. Otherwise uses ConfigProvider.prefixCls. */
  prefixCls?: string;
  title?: CardContent;
  extra?: CardContent;
  cover?: CardContent;
  actions?: readonly CardContent[];
  /** @defaultValue false */
  loading?: boolean;
  /** @defaultValue false */
  hoverable?: boolean;
  size?: ComponentSize;
  type?: 'inner';
  /** A local variant overrides Form and ConfigProvider. */
  variant?: 'outlined' | 'borderless';
  containGrid?: boolean;
  tabList?: readonly CardTabItem[];
  /** Supports bind:activeTabKey. */
  activeTabKey?: string;
  /** Initial local value. Later prop changes do not reinitialize state. */
  defaultActiveTabKey?: string;
  tabBarExtraContent?: TabsExtraContent;
  tabProps?: Partial<Omit<TabsProps, 'items'>>;
  onTabChange?: (key: string) => void;
  classNames?: CardSemantic;
  /** Root: context semantic → context style → local semantic → local style. */
  styles?: CardSemantic;
  class?: string;
  rootClassName?: string;
  style?: string;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLDivElement;
}
/** Card grid cell with configurable hover and native HTML attributes. */
export interface CardGridProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'class' | 'style'
> {
  children?: Snippet;
  /** Base Card prefix. undefined inherits the owning Card's prefix. An empty string uses ConfigProvider. */
  prefixCls?: string;
  /** @defaultValue true */
  hoverable?: boolean;
  class?: string;
  style?: string;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLDivElement;
}
/** Avatar, title, and description section inside Card. */
export interface CardMetaProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'title' | 'class' | 'style'
> {
  avatar?: CardContent;
  /** Base Card prefix. undefined inherits the owning Card's prefix. An empty string uses ConfigProvider. */
  prefixCls?: string;
  title?: CardContent;
  description?: CardContent;
  classNames?: CardMetaSemantic;
  /** Root: context semantic → context style → local semantic → local style. */
  styles?: CardMetaSemantic;
  class?: string;
  style?: string;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLDivElement;
}
