import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export type StatisticValue = string | number;
export type StatisticContent = string | number | Snippet | null | false;
export type StatisticSemanticSlots = Partial<
  Record<'root' | 'header' | 'title' | 'content' | 'value' | 'prefix' | 'suffix', string>
>;
export interface StatisticSemanticInfo {
  props: StatisticProps & {
    value: StatisticValue;
    loading: boolean;
    decimalSeparator: string;
    groupSeparator: string;
  };
}

/** Accurate display of numerical or string value with formatting and units. */
export interface StatisticProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'title' | 'class' | 'style' | 'children' | 'prefix'
> {
  /** Local CSS prefix; blank line inherits ConfigProvider prefix. */
  prefixCls?: string;
  /** @defaultValue 0 */
  value?: StatisticValue;
  precision?: number;
  /** @defaultValue '.' */
  decimalSeparator?: string;
  /** @defaultValue ',' */
  groupSeparator?: string;
  formatter?: false | 'number' | 'countdown' | ((value: StatisticValue) => StatisticContent);
  title?: StatisticContent;
  prefix?: StatisticContent;
  suffix?: StatisticContent;
  /** @defaultValue false */
  loading?: boolean;
  valueRender?: Snippet<[Snippet]>;
  class?: string;
  rootClassName?: string;
  style?: string;
  classNames?: StatisticSemanticSlots | ((info: StatisticSemanticInfo) => StatisticSemanticSlots);
  styles?: StatisticSemanticSlots | ((info: StatisticSemanticInfo) => StatisticSemanticSlots);
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLDivElement;
}

/** Grades and styles Statistic/StatisticTimer; local semantic slots and style priority. */
export type StatisticConfig = Pick<StatisticProps, 'class' | 'style' | 'classNames' | 'styles'>;
