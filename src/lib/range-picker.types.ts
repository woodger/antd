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
/** Видимые панели на начальной и конечной границах диапазона. */
export type RangePickerMode = [start: DatePickerMode, end: DatePickerMode];
export interface RangePickerInfo {
  range: RangePickerPart;
}
/** Настройки времени диапазона; начальные значения панели задаются для обеих границ. */
export interface RangePickerTimeConfig<DateType extends object = Dayjs> extends Omit<
  DatePickerTimeConfig<DateType>, 'defaultOpenValue' | 'disabledTime'
> {
  /** В showTime задаёт время пустых границ, сохраняя текущую дату каждой панели. */
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
/** Настройки общей range-обёртки; вложенный ConfigProvider заменяет объект целиком. */
export interface RangePickerConfig {
  class?: string;
  style?: string;
  variant?: DatePickerProps['variant'];
  separator?: string | Snippet;
}
/** Пара дат с общей панелью диапазона, временем и подтверждением границ. */
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
  /** Управляемые панели границ. onPanelChange предлагает следующую пару. */
  mode?: Readonly<RangePickerMode>;
  /** Управляемая пара дат; формат и точность следуют календарю и showTime. */
  value?: RangePickerInputValue<DateType> | null;
  /** Начальный локальный диапазон при отсутствии value. */
  defaultValue?: RangePickerInputValue<DateType>;
  disabled?: boolean | [boolean, boolean];
  /** @defaultValue false */
  allowEmpty?: boolean | [boolean, boolean];
  /** @defaultValue true */
  order?: boolean;
  id?: string | { start?: string; end?: string; };
  placeholder?: [string, string];
  /** Колонки времени для picker=date; week/month/year/quarter игнорируют настройку. @defaultValue false */
  showTime?: boolean | RangePickerTimeConfig<DateType>;
  /** Начальное время пустых границ datetime задаётся парой значений. */
  defaultOpenValue?: DateType | [DateType, DateType];
  disabledDate?: (date: DateType, info: { type: DatePickerCalendarMode; from?: DateType; }) => boolean;
  disabledTime?: RangePickerTimeConfig<DateType>['disabledTime'];
  /** Начальные даты панелей; используются при открытии без управляемого pickerValue. */
  defaultPickerValue?: [DateType, DateType] | DateType | null;
  pickerValue?: [DateType, DateType] | DateType | null;
  onChange?: (value: RangePickerValue<DateType> | null, dateStrings: [string, string] | null) => void;
  onCalendarChange?: (
    value: RangePickerValue<DateType>,
    dateStrings: [string, string],
    info: RangePickerInfo
  ) => void;
  /** OK активной границы сообщает текущий черновик диапазона. */
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
  /** Поддерживает bind:startInput. */
  startInput?: HTMLInputElement;
  /** Поддерживает bind:endInput. */
  endInput?: HTMLInputElement;
}
