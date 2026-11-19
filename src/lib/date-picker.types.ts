import type { Dayjs } from 'dayjs';
import type { HTMLInputAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';
import type { InputContent } from './input.types';
import type { ComponentSize } from './types';
import type { PickerLocale } from './picker-locale.types';
import type { TimePickerColumnType } from './time-picker.types';
export type DatePickerLocale = {
  lang: Partial<PickerLocale>;
  timePickerLocale?: { placeholder?: string; rangePlaceholder?: [string, string]; };
};
export type DatePickerMode = 'date' | 'week' | 'month' | 'year' | 'decade' | 'quarter';
/** Терминальный выбор; decade остаётся только режимом навигации панели. */
export type DatePickerPicker = 'date' | 'week' | 'month' | 'year' | 'quarter';
export type DatePickerFormat = string | ((value: Dayjs) => string);
/** Строковый формат поля; mask включает редактирование числовых разрядов. */
export interface DatePickerFormatConfig { format: string; type?: 'mask'; }
/** Быстрый выбор одной даты: готовое или лениво вычисляемое значение. */
export interface DatePickerPreset {
  label: string | Snippet;
  value: Dayjs | (() => Dayjs);
}
/** OriginNode сохраняет стандартную native кнопку; renderer заменяет её целиком. */
export interface DatePickerCellRenderInfo {
  prefixCls: string;
  originNode: Snippet;
  today: Dayjs;
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
/** Время в календаре: отображение разрядов, шаги, ограничения и начальная дата панели. */
export interface DatePickerTimeConfig {
  /** Формат time panel; для определения колонок имеет приоритет над format поля. */
  format?: string;
  showHour?: boolean;
  showMinute?: boolean;
  showSecond?: boolean;
  showMillisecond?: boolean;
  /** При отсутствии выводится из time/picker format; явное значение имеет приоритет. */
  use12Hours?: boolean;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  millisecondStep?: number;
  hideDisabledOptions?: boolean;
  /** В showTime задаёт только время пустого выбора; дата остаётся датой панели. */
  defaultOpenValue?: Dayjs;
}
/** Общие настройки DatePicker/RangePicker; local props имеют приоритет. */
export interface DatePickerConfig {
  variant?: DatePickerProps['variant'];
  suffixIcon?: InputContent;
}
/** Выбор одной даты или datetime через Dayjs, input и локализованную панель. */
export interface DatePickerProps extends Omit<
  HTMLInputAttributes,
  'value' | 'defaultValue' | 'size' | 'type' | 'children' | 'onchange' | 'oninput' | 'onselect'
> {
  /** Выбор даты, недели, месяца, года или квартала. @defaultValue 'date' */
  picker?: DatePickerPicker;
  /** Управляемый Dayjs или null; компонент не вводит прикладную UTC-сериализацию. */
  value?: Dayjs | null;
  /** Начальная дата локального состояния при отсутствии value. */
  defaultValue?: Dayjs;
  /** Локальный picker owner перекрывает ConfigProvider.prefixCls для поля и panel. */
  prefixCls?: string;
  /** Колонки времени для picker=date; week/month/year/quarter игнорируют настройку. @defaultValue false */
  showTime?: boolean | DatePickerTimeConfig;
  /** Номера недель в date/week панели; по умолчанию включены только для picker=week. */
  showWeek?: boolean;
  /** Первый формат задаёт вывод; дополнительные строки допускаются при разборе. Объект type=mask включает числовые разряды. */
  format?: DatePickerFormat | DatePickerFormat[] | DatePickerFormatConfig;
  /** Начальная дата панели; применяется заново при каждом открытии popup. */
  defaultPickerValue?: Dayjs;
  /** Управляемая дата панели, независимая от выбранного value. */
  pickerValue?: Dayjs;
  open?: boolean;
  /** @defaultValue false */
  defaultOpen?: boolean;
  disabledDate?: (date: Dayjs, info: { type: DatePickerMode; }) => boolean;
  disabledTime?: (date: Dayjs) => DatePickerDisabledTime;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  /** При включении выбор публикуется после подтверждения OK. */
  needConfirm?: boolean;
  /** @defaultValue true */
  allowClear?: boolean;
  inputReadOnly?: boolean;
  /** @defaultValue false */
  preserveInvalidOnBlur?: boolean;
  /** @defaultValue true */
  showNow?: boolean;
  size?: ComponentSize;
  status?: 'error' | 'warning';
  /** true/undefined — calendar и Form feedback; null/false/'' скрывают suffix. */
  suffixIcon?: InputContent;
  /** Локальное оформление перекрывает Form и ConfigProvider; fallback outlined. */
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
  locale?: DatePickerLocale;
  onChange?: (value: Dayjs | null, dateString: string) => void;
  onCalendarChange?: (
    value: Dayjs | null,
    dateString: string,
    info: { source: 'date' | 'time'; }
  ) => void;
  onOk?: (value: Dayjs) => void;
  onClear?: () => void;
  onPickerValueChange?: (
    value: Dayjs,
    info: { source: 'reset' | 'panel'; mode: DatePickerMode; }
  ) => void;
  onOpenChange?: (open: boolean) => void;
  onPanelChange?: (value: Dayjs, mode: DatePickerMode) => void;
  /** Быстрый выбор даты со строковой или Snippet подписью. */
  presets?: readonly DatePickerPreset[];
  /** Временное отображение даты при наведении; не меняет выбранное value. @defaultValue 'hover' */
  previewValue?: false | 'hover';
  cellRender?: Snippet<[Dayjs | number | 'am' | 'pm', DatePickerCellRenderInfo]>;
  /** Полная раскладка панели: пресеты, календарь/время и footer. */
  panelRender?: Snippet<[Snippet]>;
  renderExtraFooter?: Snippet<[DatePickerMode]>;
  /** По умолчанию bottomLeft в LTR и bottomRight в RTL, как rc-picker. */
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  /** Локальный контейнер; undefined наследует ConfigProvider.getPopupContainer. */
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement | ShadowRoot;
  class?: string;
  rootClassName?: string;
  /** Класс popup; остальные semantic slots пока не перенесены. */
  classNames?: { popup?: { root?: string; }; };
  /** Нативный ref доступен после mount и очищается при unmount. */
  nativeElement?: HTMLDivElement;
}
