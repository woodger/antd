import type { Snippet } from 'svelte';
import type { AriaAttributes, HTMLAttributes } from 'svelte/elements';
import type { DropdownClickInfo, DropdownProps } from '../dropdown/dropdown.types';

export type BreadcrumbContent = string | number | boolean | null | Snippet;
export type BreadcrumbSlots = Partial<Record<'root' | 'item' | 'separator', string>>;
export type BreadcrumbSemantic<
  Params extends Record<string, unknown> = Record<string, unknown>
> = BreadcrumbSlots | ((info: { props: BreadcrumbProps<Params>; }) => BreadcrumbSlots);

/** Shared defaults with the same semantic callbacks as local Props. */
export interface BreadcrumbConfig<
  Params extends Record<string, unknown> = Record<string, unknown>
> {
  class?: string;
  style?: string;
  classNames?: BreadcrumbSemantic<Params>;
  styles?: BreadcrumbSemantic<Params>;
  separator?: BreadcrumbContent;
  dropdownIcon?: BreadcrumbContent;
}
export interface BreadcrumbMenuItem {
  key?: string | number;
  title?: BreadcrumbContent;
  label?: BreadcrumbContent;
  path?: string;
  href?: string;
  disabled?: boolean;
  danger?: boolean;
  onClick?: (info: DropdownClickInfo) => void;
}
export interface BreadcrumbItem extends AriaAttributes {
  key?: string | number;
  href?: string;
  path?: string;
  title?: BreadcrumbContent;
  menu?: { items?: readonly BreadcrumbMenuItem[]; onClick?: (info: DropdownClickInfo) => void; };
  dropdownProps?: Partial<Omit<DropdownProps, 'children' | 'menu'>>;
  class?: string;
  style?: string;
  onClick?: (event: MouseEvent) => void;
  type?: 'separator';
  separator?: BreadcrumbContent;
  [key: `data-${string}`]: string | undefined;
}
/** Breadcrumb navigation with native links, separators, and item menus. */
export interface BreadcrumbProps<
  Params extends Record<string, unknown> = Record<string, unknown>
> extends Omit<
  HTMLAttributes<HTMLElement>,
  'children' | 'class' | 'style'
> {
  /** Local CSS prefix. Empty and undefined values inherit ConfigProvider.prefixCls. */
  prefixCls?: string;
  items?: readonly BreadcrumbItem[];
  params?: Params;
  separator?: BreadcrumbContent;
  dropdownIcon?: BreadcrumbContent;
  itemRender?: Snippet<[BreadcrumbItem, Params, readonly BreadcrumbItem[], readonly string[]]>;
  classNames?: BreadcrumbSemantic<Params>;
  /** Root: context semantic → context style → local semantic → local style. */
  styles?: BreadcrumbSemantic<Params>;
  class?: string;
  rootClassName?: string;
  style?: string;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLElement;
}
