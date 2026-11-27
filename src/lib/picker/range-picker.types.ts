import type { Dayjs } from 'dayjs';
import type { Snippet } from 'svelte';
import type { HTMLInputAttributes } from 'svelte/elements';
import type {
  DatePickerProps,
  DatePickerTimeConfig,
  DatePickerDisabledTime,
  DatePickerCalendarMode,
  DatePickerMode,
  DatePickerPicker,
  DatePickerSemantic
} from './date-picker.types';
export type RangePickerValue<DateType extends object = Dayjs> = [DateType | null, DateType | null];
export type RangePickerInputValue<DateType extends object = Dayjs> = [DateType | null | undefined, DateType | null | undefined];
export type RangePickerPart = 'start' | 'end';
/** Visible panels at the initial and finite limits of the range. */
export type RangePickerMode = [start: DatePickerMode, end: DatePickerMode];
export interface RangePickerInfo {
  range: RangePickerPart;
}
/** Range time settings; initial panel values are set for both boundaries. */
export interface RangePickerTimeConfig<DateType extends object = Dayjs> extends Omit<
  DatePickerTimeConfig<DateType>, 'defaultOpenValue' | 'disabledTime'
> {
  /** In showTime set the time of empty borders, saving the current date of each panel. */
  defaultOpenValue?: [DateType, DateType];
  disabledTime?: (
    date: DateType,
    partial: RangePickerPart,
    info: { from?: DateType; }
  ) => DatePickerDisabledTime;
}
export interface RangePickerPreset<DateType extends object = Dayjs> {
  label: string | Snippet;
  value: RangePickerInputValue<DateType> | (() => RangePickerInputValue<DateType>);
}
/** Settings of the general range-wrapper; nested ConfigProvider replaces the whole object. */
export interface RangePickerConfig {
  class?: string;
  style?: string;
  variant?: DatePickerProps['variant'];
  separator?: string | Snippet;
}
/** A pair of dates with a common range panel, time and boundary confirmation. */
export interface RangePickerProps<DateType extends object = Dayjs> extends Omit<
  DatePickerProps<DateType>,
  'picker'
  | 'value'
  | 'multiple'
  | 'mode'
  | 'defaultValue'
  | 'defaultOpenValue'
  | 'showTime'
  | 'disabled'
  | 'id'
  | 'placeholder'
  | 'disabledDate'
  | 'disabledTime'
  | 'onChange'
  | 'onCalendarChange'
  | 'onOk'
  | 'pickerValue'
  | 'defaultPickerValue'
  | 'onPickerValueChange'
  | 'onPanelChange'
  | 'presets'
  | 'classNames'
  | 'styles'
> {
  picker?: DatePickerPicker;
  multiple?: HTMLInputAttributes['multiple'];
  /** Managed boundary panels. onPanelChange offers the next pair. */
  mode?: Readonly<RangePickerMode>;
  /** Managed pair of dates; format and accuracy follow calendar and showTime. */
  value?: RangePickerInputValue<DateType> | null;
  /** Initial local range in the absence of value. */
  defaultValue?: RangePickerInputValue<DateType>;
  disabled?: boolean | [boolean, boolean];
  /** @defaultValue false */
  allowEmpty?: boolean | [boolean, boolean];
  /** @defaultValue true */
  order?: boolean;
  id?: string | { start?: string; end?: string; };
  placeholder?: [string, string];
  /** Time columns for picker=date. The week, month, year, and quarter modes ignore this option. @defaultValue false */
  showTime?: boolean | RangePickerTimeConfig<DateType>;
  /** The initial time of the empty boundaries of datetime is set by a pair of values. */
  defaultOpenValue?: DateType | [DateType, DateType];
  disabledDate?: (date: DateType, info: { type: DatePickerCalendarMode; from?: DateType; }) => boolean;
  disabledTime?: RangePickerTimeConfig<DateType>['disabledTime'];
  /** Initial panel dates; used when opened without a controlled pickerValue. */
  defaultPickerValue?: [DateType, DateType] | DateType | null;
  pickerValue?: [DateType, DateType] | DateType | null;
  onChange?: (value: RangePickerValue<DateType> | null, dateStrings: [string, string] | null) => void;
  onCalendarChange?: (
    value: RangePickerValue<DateType>,
    dateStrings: [string, string],
    info: RangePickerInfo
  ) => void;
  /** OK active boundary is reported by the current draft of the range. */
  onOk?: (value: RangePickerValue<DateType>) => void;
  onPickerValueChange?: (
    value: [DateType, DateType],
    info: RangePickerInfo & { source: 'reset' | 'panel'; mode: RangePickerMode; }
  ) => void;
  onPanelChange?: (value: RangePickerValue<DateType>, modes: RangePickerMode) => void;
  separator?: string | Snippet;
  classNames?: DatePickerSemantic<RangePickerProps<DateType>>;
  styles?: DatePickerSemantic<RangePickerProps<DateType>>;
  presets?: readonly RangePickerPreset<DateType>[];
  /** @defaultValue 'hover' */
  previewValue?: false | 'hover';
  /** Maintenances bind:startInput. */
  startInput?: HTMLInputElement;
  /** Maintenances bind:endInput. */
  endInput?: HTMLInputElement;
}
