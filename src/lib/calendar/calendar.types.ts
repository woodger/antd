import type { Dayjs } from 'dayjs';
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { GenerateConfig } from '../picker/date-generate.types';
import type { PickerLocale } from '../picker/picker-locale.types';

export type CalendarMode = 'year' | 'month';
export type CalendarSelectInfo = { source: 'year' | 'month' | 'date' | 'customize'; };
export type CalendarGenerateConfig<DateType> = GenerateConfig<DateType>;

/** React ref shape. In Svelte, bind:nativeElement exposes the div. */
export interface CalendarRef {
  nativeElement: HTMLDivElement;
}

/** Locale for the shared rc-picker panel. */
export type CalendarLang = PickerLocale;

/** Merges lang fields with ConfigProvider.locale.calendar and the base locale. */
export interface CalendarLocale {
  lang?: Partial<CalendarLang>;
  timePickerLocale?: { placeholder?: string; };
}

/** OriginNode is a Svelte snippet for rc-picker's original inner content. Week cells skip the renderer. */
export interface CalendarCellRenderInfo<DateType = Dayjs> {
  prefixCls: string;
  originNode: Snippet;
  today: DateType;
  type: 'date' | 'month';
  /** Includes filled rc-picker formats in date mode and the original lang in month mode. */
  locale: CalendarLang;
}

/** onChange selects a date with source=customize. onTypeChange calls only onPanelChange. */
export interface CalendarHeaderRenderInfo<DateType = Dayjs> {
  value: DateType;
  type: CalendarMode;
  onChange: (value: DateType) => void;
  onTypeChange: (mode: CalendarMode) => void;
}

export type CalendarSlots = Partial<Record<
  'root' | 'header' | 'body' | 'content' | 'item' | 'itemContent',
  string
>>;
/** Props keep the caller's mode and showWeek. fullscreen defaults to true. */
export type CalendarSemantic<DateType = Dayjs> = CalendarSlots
  | ((info: { props: CalendarProps<DateType>; }) => CalendarSlots | undefined);

/** The nested calendar config is replaced in full. Root style follows the context styles.root. */
export interface CalendarConfig {
  class?: string;
  style?: string;
  // The shared ConfigProvider does not know the custom date adapter's type, as in upstream CalendarProps<any>.
  classNames?: CalendarSemantic<any>;
  styles?: CalendarSemantic<any>;
}

/** Ant Design 6.6.8 Calendar. Props and callbacks control value and mode without bind:value. */
export interface CalendarProps<DateType = Dayjs> extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'class' | 'style'
> {
  /** Controlled values change only in response to the owner. Without value, uses defaultValue or getNow(). */
  value?: DateType;
  /** Initial value only. Time, milliseconds, and timezone retain their original precision. */
  defaultValue?: DateType;
  /** Controlled mode. The initial mode is month when the prop is omitted. */
  mode?: CalendarMode;
  /** Defaults to true. false enables the mini calendar and small header controls. */
  fullscreen?: boolean;
  /** Extra week column in month mode. Selecting a week reports the first day of its row with source=date. */
  showWeek?: boolean;
  /** Inclusive bounds at the original timestamp precision. The header restricts available years and months. */
  validRange?: [DateType, DateType];
  /** Applies to panel cells only. A month is disabled when its first and last days are both disabled. */
  disabledDate?: (date: DateType) => boolean;
  onChange?: (date: DateType) => void;
  onPanelChange?: (date: DateType, mode: CalendarMode) => void;
  /** Also called on reselect, after onPanelChange and onChange if needed. */
  onSelect?: (date: DateType, info: CalendarSelectInfo) => void;
  locale?: CalendarLocale;
  headerRender?: Snippet<[CalendarHeaderRenderInfo<DateType>]>;
  cellRender?: Snippet<[DateType, CalendarCellRenderInfo<DateType>]>;
  fullCellRender?: Snippet<[DateType, CalendarCellRenderInfo<DateType>]>;
  class?: string;
  rootClassName?: string;
  /** The local picker prefix overrides ConfigProvider. Calendar appends -calendar. */
  prefixCls?: string;
  /** Applied after context and semantic root styles. */
  style?: string;
  classNames?: CalendarSemantic<DateType>;
  styles?: CalendarSemantic<DateType>;
  /** Root div in place of React CalendarRef.nativeElement. Cleared on unmount. */
  nativeElement?: HTMLDivElement;
}
