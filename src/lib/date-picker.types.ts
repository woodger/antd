import type { Dayjs } from 'dayjs';
import type { PopupSourceAlign } from './popup-position.engine';
import type { HTMLInputAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';
import type { InputContent } from './input/input.types';
import type { ComponentSize } from './types';
import type { PickerLocale } from './picker-locale.types';
import type { RangePickerProps } from './range-picker.types';
import type { TimePickerColumnType } from './time-picker.types';
import type { DatePickerComponents, DatePickerPanelNavigation } from './picker-components.types';
export type DatePickerLocale = {
  lang: Partial<PickerLocale>;
  timePickerLocale?: { placeholder?: string; rangePlaceholder?: [string, string]; };
};
export type DatePickerCalendarMode = 'date' | 'week' | 'month' | 'year' | 'decade' | 'quarter';
/** Visible panel. picker determines the field format and final selection. */
export type DatePickerMode = DatePickerCalendarMode | 'time';
/** Final selection mode. decade remains available only for panel navigation. */
export type DatePickerPicker = 'date' | 'week' | 'month' | 'year' | 'quarter';
/** Rules for aligning the panel to the field. Percentage offsets refer to the specified rectangle. */
export type DatePickerPopupAlign = Omit<PopupSourceAlign, '_experimental'>;
export type DatePickerFormat<DateType extends object = Dayjs> = string | ((value: DateType) => string);
/** String field format. mask enables editing individual numeric sections. */
export interface DatePickerFormatConfig { format: string; type?: 'mask'; }
/** Shortcut for selecting one date from a supplied or lazy value. */
export interface DatePickerPreset<DateType extends object = Dayjs> {
  label: string | Snippet;
  value: DateType | (() => DateType);
}
/** OriginNode keeps the standard native button. A renderer replaces it entirely. */
export interface DatePickerCellRenderInfo<DateType extends object = Dayjs> {
  prefixCls: string;
  originNode: Snippet;
  today: DateType;
  type: DatePickerMode | 'time';
  locale: PickerLocale;
  range?: 'start' | 'end';
  subType?: TimePickerColumnType;
}
export interface DatePickerDisabledTime {
  disabledHours?: () => number[];
  disabledMinutes?: (hour: number) => number[];
  disabledSeconds?: (hour: number, minute: number) => number[];
  disabledMilliseconds?: (hour: number, minute: number, second: number) => number[];
}
/** Time in the calendar, including visible units, steps, constraints, and the panel's initial date. */
export interface DatePickerTimeConfig<DateType extends object = Dayjs> {
  /** Time panel format. It overrides the field format when determining visible columns. */
  format?: string;
  showHour?: boolean;
  showMinute?: boolean;
  showSecond?: boolean;
  showMillisecond?: boolean;
  /** Defaults to the time or picker format. An explicit value takes precedence. */
  use12Hours?: boolean;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  millisecondStep?: number;
  hideDisabledOptions?: boolean;
  /** In showTime, sets only the time for an empty selection. The panel supplies the date. */
  defaultOpenValue?: DateType;
  disabledTime?: (date: DateType) => DatePickerDisabledTime;
  /** Automatically selects the nearest enabled cell while scrolling the hour column. */
  changeOnScroll?: boolean;
  /** Value for the panel. The field's Now prop governs visibility. */
  showNow?: boolean;
}
export interface DatePickerPopupSlots {
  root?: string;
  header?: string;
  body?: string;
  content?: string;
  item?: string;
  footer?: string;
  container?: string;
}

export interface DatePickerSlots {
  root?: string;
  prefix?: string;
  input?: string;
  suffix?: string;
  /** A string sets popup.root. */
  popup?: string | DatePickerPopupSlots;
}

/** Custom slot class or CSS. The callback receives the actual field props. */
export type DatePickerSemantic<Props extends object = DatePickerProps> = DatePickerSlots
  | ((info: { props: Props; }) => DatePickerSlots | undefined);

export type DatePickerAllowClear = boolean | { clearIcon?: InputContent; };

/** Shared DatePicker and RangePicker semantics. A nested provider replaces the object. */
export interface DatePickerConfig {
  class?: string;
  style?: string;
  variant?: DatePickerProps['variant'];
  classNames?: DatePickerSemantic<DatePickerProps | DatePickerMultipleProps | RangePickerProps>;
  styles?: DatePickerSemantic<DatePickerProps | DatePickerMultipleProps | RangePickerProps>;
  suffixIcon?: InputContent;
  allowClear?: DatePickerAllowClear;
}
/** Selects a single date or datetime using a date adapter, input, and localized panel. */
export interface DatePickerProps<DateType extends object = Dayjs> extends Omit<
  HTMLInputAttributes,
  'value' | 'defaultValue' | 'size' | 'type' | 'children' | 'prefix' | 'multiple'
    | 'onchange' | 'oninput' | 'onselect'
>, DatePickerPanelNavigation, Omit<DatePickerTimeConfig<DateType>, 'format'> {
  multiple?: false;
  /** Calendar period or time selection. @defaultValue 'date' */
  picker?: DatePickerPicker | 'time';
  /** Controlled panel. The component proposes navigation through onPanelChange. */
  mode?: DatePickerMode;
  /** Controlled date or null. The component leaves application UTC serialization to the owner. */
  value?: DateType | null;
  /** Initial local date when value is omitted. */
  defaultValue?: DateType;
  /** The local picker owner overrides ConfigProvider.prefixCls for both the field and panel. */
  prefixCls?: string;
  /** Time columns for picker=date. The week, month, year, and quarter modes ignore this option. @defaultValue false */
  showTime?: boolean | DatePickerTimeConfig<DateType>;
  /** Week numbers in the date or week panel. Enabled by default only for picker=week. */
  showWeek?: boolean;
  /** The first format determines display. Additional string formats are accepted for parsing. A type=mask object enables numeric sections. */
  format?: DatePickerFormat<DateType> | DatePickerFormat<DateType>[] | DatePickerFormatConfig;
  /** Initial panel date, reapplied whenever the popup opens. */
  defaultPickerValue?: DateType;
  /** Controlled panel date, independent of the selected value. */
  pickerValue?: DateType;
  open?: boolean;
  /** @defaultValue false */
  defaultOpen?: boolean;
  disabledDate?(date: DateType, info: { type: DatePickerMode; }): boolean;
  minDate?: DateType;
  maxDate?: DateType;
  /** When enabled, publishes selection after OK confirmation. */
  needConfirm?: boolean;
  /** @defaultValue true */
  allowClear?: DatePickerAllowClear;
  inputReadOnly?: boolean;
  /** @defaultValue false */
  preserveInvalidOnBlur?: boolean;
  /** @defaultValue true */
  showNow?: boolean;
  size?: ComponentSize;
  status?: 'error' | 'warning';
  prefix?: InputContent;
  /** true and undefined show the calendar and Form feedback. null, false, and '' hide the suffix. */
  suffixIcon?: InputContent;
  /** Local styling overrides Form and ConfigProvider. Defaults to outlined. */
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
  locale?: DatePickerLocale;
  onChange?: (value: DateType | null, dateString: string) => void;
  onCalendarChange?: (
    value: DateType | null,
    dateString: string,
    info: { source: 'date' | 'time'; }
  ) => void;
  /** The OK button reports the draft being confirmed before publishing the change. */
  onOk?: (value: DateType) => void;
  onClear?: () => void;
  onPickerValueChange?: (
    value: DateType,
    info: { source: 'reset' | 'panel'; mode: DatePickerMode; }
  ) => void;
  onOpenChange?: (open: boolean) => void;
  onPanelChange?: (value: DateType, mode: DatePickerMode) => void;
  /** Date shortcut with a string or Snippet label. */
  presets?: readonly DatePickerPreset<DateType>[];
  /** Temporarily displays a date on hover without changing the selected value. @defaultValue 'hover' */
  previewValue?: false | 'hover';
  cellRender?: Snippet<[DateType | number | 'am' | 'pm', DatePickerCellRenderInfo<DateType>]>;
  /** Replaces individual elements while preserving DatePicker selection, validation, and confirmation. */
  components?: DatePickerComponents<DateType>;
  /** Complete panel layout: presets, calendar or time, and footer. */
  panelRender?: Snippet<[Snippet]>;
  renderExtraFooter?: Snippet<[DatePickerMode]>;
  /** Defaults to bottomLeft in LTR and bottomRight in RTL, matching rc-picker. */
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  /** Overlays settings on the selected placement entry and replaces its nested overflow object. */
  popupAlign?: DatePickerPopupAlign;
  /** Replaces the built-in placements map, including when passed an empty object. */
  builtinPlacements?: Readonly<Record<string, DatePickerPopupAlign>>;
  /** Local container. undefined inherits ConfigProvider.getPopupContainer. */
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement | ShadowRoot;
  class?: string;
  rootClassName?: string;
  classNames?: DatePickerSemantic<DatePickerProps<DateType>>;
  styles?: DatePickerSemantic<DatePickerProps<DateType>>;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLDivElement;
}

/** Time selection with the root DatePicker's semantics and settings. */
export interface DatePickerTimeProps<DateType extends object = Dayjs>
  extends DatePickerProps<DateType> {
  picker: 'time';
}

/** Date and actions for one selected tag. Value retains the original date object. */
export interface DatePickerTagContext<DateType extends object = Dayjs> {
  label: string;
  value: DateType;
  disabled: boolean;
  closable: boolean;
  onClose: (event?: MouseEvent) => void;
}

/** Multiple period or time selection with a separate panel draft. */
export interface DatePickerMultipleProps<DateType extends object = Dayjs> extends Omit<
  DatePickerProps<DateType>,
  'multiple' | 'value' | 'defaultValue' | 'showTime' | 'onChange'
    | 'onCalendarChange' | 'onOk' | 'classNames' | 'styles'
> {
  multiple: true;
  value?: readonly DateType[] | null;
  defaultValue?: readonly DateType[] | null;
  showTime?: false;
  /** Sorts changed selections by time while preserving the input value order. @defaultValue true */
  order?: boolean;
  maxTagCount?: number | 'responsive';
  tagRender?: Snippet<[DatePickerTagContext<DateType>]>;
  removeIcon?: InputContent;
  onChange?: (value: DateType[] | null, dateStrings: string[] | null) => void;
  onCalendarChange?(
    value: DateType[], dateStrings: string[], info: { source: 'date' | 'time'; }
  ): void;
  onOk?: (value: DateType[]) => void;
  classNames?: DatePickerSemantic<DatePickerMultipleProps<DateType>>;
  styles?: DatePickerSemantic<DatePickerMultipleProps<DateType>>;
}

type SelectionField = 'value' | 'defaultValue' | 'showTime' | 'onChange'
  | 'onCalendarChange' | 'onOk' | 'classNames' | 'styles';

/** The template declaration infers the value type from multiple. */
export type DatePickerSelectionProps<Multiple extends boolean, DateType extends object = Dayjs> = Omit<
  DatePickerProps<DateType>, 'multiple' | SelectionField
> & {
  multiple?: Multiple;
} & {
  [Field in SelectionField]?: Multiple extends true
    ? DatePickerMultipleProps<DateType>[Field] : DatePickerProps<DateType>[Field];
} & Pick<DatePickerMultipleProps<DateType>, 'order' | 'maxTagCount' | 'tagRender' | 'removeIcon'>;
