import type { Snippet } from 'svelte';
import type { ComponentSize, PaginationLocale, SelectOption } from './types';
import type { SelectProps } from './select/select.types';

export type PaginationItemType = 'page' | 'prev' | 'next' | 'jump-prev' | 'jump-next';
export type PaginationContent = string | number | boolean | null | Snippet;

export interface PaginationItemInfo {
  disabled: boolean;
  active: boolean;
  label: string;
  title?: string;
  /** Link to native control if you do not use originalElement. */
  onClick: (event: MouseEvent) => void;
}

export interface PaginationSizeChangerInfo {
  value: number;
  disabled: boolean;
  class: string;
  prefixCls: string;
  options: readonly SelectOption<number>[];
  onChange: (value: number) => void;
}

/** Supported Select props; onChange preserves callback Ant Design. */
export interface PaginationSizeChangerProps extends Omit<Partial<SelectProps<number>>, 'onChange'> {
  onChange?: (value: number, option: SelectOption<number> | undefined) => void;
}

export interface PaginationSlots {
  root?: string;
  item?: string;
}

export type PaginationSemantic = PaginationSlots
  | ((info: { props: PaginationProps; }) => PaginationSlots | undefined);

/** General Pagination settings; local props take precedence. */
export interface PaginationComponentConfig {
  class?: string;
  style?: string;
  classNames?: PaginationSemantic;
  styles?: PaginationSemantic;
  showSizeChanger?: boolean | PaginationSizeChangerProps;
  /** @defaultValue 50 */
  totalBoundaryShowSizeChanger?: number;
}

/** Pagination preserves bind:current/pageSize and the normalization of the numbers of the former API. */
export interface PaginationProps {
  /** @defaultValue 0 */
  total?: number;
  /** Maintenances bind:current. */
  current?: number;
  /** It's read once. @defaultValue 1 */
  defaultCurrent?: number;
  /** Maintenances bind:pageSize. */
  pageSize?: number;
  /** It's read once. @defaultValue 10 */
  defaultPageSize?: number;
  pageSizeOptions?: readonly (number | string)[];
  showSizeChanger?: boolean | PaginationSizeChangerProps;
  /** Threshold automatic size changer. @defaultValue 50 */
  totalBoundaryShowSizeChanger?: number;
  /** @defaultValue false */
  hideOnSinglePage?: boolean;
  showTotal?: Snippet<[total: number, range: [number, number]]>;
  /** By default buffer 2; true sets buffer 1 and jump to 3. @defaultValue false */
  showLessItems?: boolean;
  /** @defaultValue true */
  showPrevNextJumpers?: boolean;
  /** Input accepts digits; goButton=true adds a standard button. @defaultValue false */
  showQuickJumper?: boolean | { goButton?: PaginationContent; };
  /** @defaultValue true */
  showTitle?: boolean;
  /** Objection includes simple mode; readOnly hides editing. @defaultValue false */
  simple?: boolean | { readOnly?: boolean; };
  align?: 'start' | 'center' | 'end';
  /** XS includes a mini without an obvious size; CSS 6.6.8 changes the height only at size=small. */
  responsive?: boolean;
  disabled?: boolean;
  size?: ComponentSize;
  /** Snake_case aliases; locale.page – suffix, config.locale.pagination.page – former label. */
  locale?: Partial<PaginationLocale>;
  onChange?: (page: number, pageSize: number) => void;
  onShowSizeChange?: (current: number, pageSize: number) => void;
  /** OriginalElement – finished native button; info replaces cloneElement/LI click. */
  itemRender?: Snippet<[number, PaginationItemType, Snippet, PaginationItemInfo]>;
  prevIcon?: PaginationContent;
  nextIcon?: PaginationContent;
  jumpPrevIcon?: PaginationContent;
  jumpNextIcon?: PaginationContent;
  components?: { sizeChanger?: Snippet<[PaginationSizeChangerInfo]>; };
  classNames?: PaginationSemantic;
  styles?: PaginationSemantic;
  rootClassName?: string;
  /** Pagination parts local prefix; empty string inherits ConfigProvider. */
  prefixCls?: string;
  /** Prefix for a custom size changer. The built-in Select retains its own classes. */
  selectPrefixCls?: string;
  id?: string;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /** The former class applies to ul; semantic root corresponds to native nav. */
  class?: string;
  style?: string;
  [attribute: `data-${string}`]: unknown;
  [attribute: `aria-${string}`]: unknown;
}
