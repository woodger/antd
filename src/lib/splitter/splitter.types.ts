import type { Snippet } from 'svelte';

export type SplitterOrientation = 'horizontal' | 'vertical';
export type SplitterSize = number | string;
export type SplitterContent = string | number | boolean | null | Snippet;
export type SplitterIconVisibility = boolean | 'auto';

/** Svelte-descriptor React Splitter.Panel; the elements are saved by position, not by key. */
export interface SplitterPanelProps {
  children?: SplitterContent;
  /** Monitors the entire group, if at least one panel size is not null/undefined. */
  size?: SplitterSize;
  /** Is read only when creating Splitter; by default, the balance is divided between the panels. */
  defaultSize?: SplitterSize;
  /** Number in px or percentage line. */
  min?: SplitterSize;
  max?: SplitterSize;
  /** Both adjacent panels must allow resize; by default true. */
  resizable?: boolean;
  /** By default false; at object showCollapsibleIcon by default auto. */
  collapsible?: boolean | {
    start?: boolean;
    end?: boolean;
    showCollapsibleIcon?: SplitterIconVisibility;
  };
  /** Redefines Splitter.destroyOnHidden; false stores hidden content. */
  destroyOnHidden?: boolean;
  class?: string;
  /** Geometric flex-basis/flex-grow is set after style. */
  style?: string;
}

export interface SplitterClassSlots {
  root?: string;
  panel?: string;
  /** The string is equivalent to { default: value }. */
  dragger?: string | { default?: string; active?: string; };
}

export interface SplitterStyleSlots {
  root?: string;
  panel?: string;
  /** As in pinned SplitBar, default is applied; the active field is accepted but not used. */
  dragger?: { default?: string; active?: string; };
}

/** Callback receives authorized orientation and vertical; CSS styles are transmitted by strings. */
export type SplitterSemantic<Value> = Value
  | ((info: { props: SplitterProps; }) => Value | undefined);

/** Inherited root/panel/dragger styles; nested config is replaced entirely. */
export interface SplitterConfig {
  class?: string;
  style?: string;
  classNames?: SplitterSemantic<SplitterClassSlots>;
  styles?: SplitterSemantic<SplitterStyleSlots>;
}

/** Splitter with original size rules, drag/lazy and Ant Design 6.6.8. */
export interface SplitterProps {
  /** Local CSS prefix. Empty and undefined values inherit ConfigProvider.prefixCls. */
  prefixCls?: string;
  /** A clear replacement of the analysis React children/Panel; the contents are given scalar or Snippet. */
  items?: SplitterPanelProps[];
  /** Priority: orientation, boolean vertical, horizontal. */
  orientation?: SplitterOrientation;
  vertical?: boolean;
  /** Lazy changes sizes only on release and causes onResizeEnd without onResize. */
  lazy?: boolean;
  /** By default, the contents of the panels remain in DOM. */
  destroyOnHidden?: boolean;
  collapsible?: {
    /** CSS transition; by default false, for the duration of the drag is disabled. */
    motion?: boolean;
    icon?: { start?: SplitterContent; end?: SplitterContent; };
  };
  /** undefined leaves the original spinner; null/false creates an empty custom wrapper. */
  draggerIcon?: SplitterContent;
  /** Is also caused by resizable = false; the second mousedown within 300ms does not start drag. */
  onDraggerDoubleClick?: (index: number) => void;
  onResizeStart?: (sizes: number[]) => void;
  /** The proposed dimensions in px, including rejection controlled; split also causes a callback. */
  onResize?: (sizes: number[]) => void;
  /** Normal drag reports current sizes, lazy and collapse — proposed. */
  onResizeEnd?: (sizes: number[]) => void;
  /** After onResize and onResizeEnd; collapsed is determined via abs(size) < Number.EPSILON. */
  onCollapse?: (collapsed: boolean[], sizes: number[]) => void;
  class?: string;
  rootClassName?: string;
  style?: string;
  classNames?: SplitterSemantic<SplitterClassSlots>;
  styles?: SplitterSemantic<SplitterStyleSlots>;
  /** bind:nativeElement replaces React SplitterRef and is purified at unmount. */
  nativeElement?: HTMLDivElement;
}
