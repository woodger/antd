import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { CollapseItemEvents } from './collapse-events.engine';
export type { CollapseItemEvents } from './collapse-events.engine';
import type { ComponentSize } from './types';

export type CollapseTrigger = 'header' | 'icon' | 'disabled';
export type CollapseActiveKey = string | number | readonly (string | number)[];
export type CollapseContent = string | number | boolean | null | Snippet
  | readonly (CollapseContent | undefined)[];
export interface CollapseItemSemanticSlots {
  header?: string;
  title?: string;
  body?: string;
  icon?: string;
}
export interface CollapseSemanticSlots extends CollapseItemSemanticSlots {
  root?: string;
}
export interface CollapseSemanticInfo {
  props: CollapseProps & {
    size: ComponentSize;
    bordered: boolean;
    expandIconPlacement: 'start' | 'end';
  };
}
export type CollapseSemantic = CollapseSemanticSlots
  | ((info: CollapseSemanticInfo) => CollapseSemanticSlots | undefined);

/** Readonly item. The key defaults to the string index, and onChange always receives strings. */
export interface CollapseItem extends Omit<
  HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'style'
>, CollapseItemEvents {
  key?: string | number;
  /** Passive content of the native button. Put interactive controls in extra or children. */
  label?: CollapseContent;
  children?: CollapseContent;
  extra?: CollapseContent;
  collapsible?: CollapseTrigger;
  showArrow?: boolean;
  forceRender?: boolean;
  destroyOnHidden?: boolean;
  id?: string;
  /** Additional class on the outer header wrapper, matching rc-collapse. */
  headerClass?: string;
  /** The callback ref receives a node after mount and null on ref replacement or unmount. SSR does not invoke it. */
  ref?: (node: HTMLDivElement | null) => void;
  class?: string;
  style?: string;
  /** Item slots extend shared classes and override shared styles. */
  classNames?: CollapseItemSemanticSlots;
  styles?: CollapseItemSemanticSlots;
  /** Invoked after updating the binding and calling the shared onChange. Disabled items do not invoke it. */
  onItemClick?: (key: string) => void;
  [attribute: `aria-${string}`]: unknown;
  [attribute: `data-${string}`]: unknown;
}
/** Panel data for expandIcon. A custom snippet does not rotate automatically. */
export interface CollapseExpandIconInfo extends Omit<CollapseItem, 'key' | 'label' | 'ref'> {
  panelKey: string;
  header?: CollapseContent;
  isActive: boolean;
  accordion?: boolean;
  collapsible?: CollapseTrigger;
  showArrow?: boolean;
  prefixCls: string;
  /** Toggles an enabled panel, then calls onChange and item.onItemClick. */
  onItemClick: (key: string) => void;
}
/** Inherited styling and arrow. An explicit record replaces the parent record. */
export interface CollapseConfig extends Pick<
  CollapseProps, 'class' | 'style' | 'expandIcon' | 'classNames' | 'styles'
> {}

/** Independent collapsible panels or an accordion controlled through activeKey. */
export interface CollapseProps {
  items?: readonly CollapseItem[];
  /** Supports bind:activeKey. Numeric keys are compared by their string representation. */
  activeKey?: CollapseActiveKey | undefined;
  /** Initial local value. Later prop changes do not reinitialize state. */
  defaultActiveKey?: CollapseActiveKey;
  onChange?: (activeKey: string[]) => void;
  /** @defaultValue false */
  accordion?: boolean;
  /** @defaultValue 'header' */
  collapsible?: CollapseTrigger;
  /** @defaultValue 'start' */
  expandIconPlacement?: 'start' | 'end';
  /** A local snippet overrides ConfigProvider.collapse.expandIcon. */
  expandIcon?: Snippet<[CollapseExpandIconInfo]>;
  size?: ComponentSize;
  /** @defaultValue true */
  bordered?: boolean;
  /** @defaultValue false */
  ghost?: boolean;
  /** Removes hidden content unless the item sets forceRender. */
  destroyOnHidden?: boolean;
  /** @defaultValue 3 */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  class?: string;
  style?: string;
  /** Local CSS prefix. Omission and an empty string inherit ConfigProvider. */
  prefixCls?: string;
  rootClassName?: string;
  /** The header slot targets the native button and the body slot targets its panel content. */
  classNames?: CollapseSemantic;
  styles?: CollapseSemantic;
  /** bind:nativeElement and bind:ref receive an HTMLDivElement after mount and undefined on unmount. */
  nativeElement?: HTMLDivElement;
  ref?: HTMLDivElement;
  [attribute: `aria-${string}`]: unknown;
  [attribute: `data-${string}`]: unknown;
}
