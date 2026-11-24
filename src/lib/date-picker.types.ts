import type { Dayjs } from 'dayjs';
import type { HTMLInputAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';
import type { InputContent } from './input.types';
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
/** Видимая панель. Формат поля и окончательный выбор задаёт picker. */
export type DatePickerMode = DatePickerCalendarMode | 'time';
/** Терминальный выбор; decade остаётся только режимом навигации панели. */
export type DatePickerPicker = 'date' | 'week' | 'month' | 'year' | 'quarter';
export type DatePickerFormat<DateType extends object = Dayjs> = string | ((value: DateType) => string);
/** Строковый формат поля; mask включает редактирование числовых разрядов. */
export interface DatePickerFormatConfig { format: string; type?: 'mask'; }
/** Быстрый выбор одной даты: готовое или лениво вычисляемое значение. */
export interface DatePickerPreset<DateType extends object = Dayjs> {
  label: string | Snippet;
  value: DateType | (() => DateType);
}
/** OriginNode сохраняет стандартную native кнопку; renderer заменяет её целиком. */
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
/** Время в календаре: отображение разрядов, шаги, ограничения и начальная дата панели. */
export interface DatePickerTimeConfig<DateType extends object = Dayjs> {
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
  defaultOpenValue?: DateType;
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
  /** Строка задаёт popup.root. */
  popup?: string | DatePickerPopupSlots;
}

/** Произвольный класс или CSS слота. Callback получает props фактического поля. */
export type DatePickerSemantic<Props extends object = DatePickerProps> = DatePickerSlots
  | ((info: { props: Props; }) => DatePickerSlots | undefined);

export type DatePickerAllowClear = boolean | { clearIcon?: InputContent; };

/** Общая семантика DatePicker и RangePicker. Вложенный провайдер заменяет объект. */
export interface DatePickerConfig {
  class?: string;
  style?: string;
  variant?: DatePickerProps['variant'];
  classNames?: DatePickerSemantic<DatePickerProps | DatePickerMultipleProps | RangePickerProps>;
  styles?: DatePickerSemantic<DatePickerProps | DatePickerMultipleProps | RangePickerProps>;
  suffixIcon?: InputContent;
  allowClear?: DatePickerAllowClear;
}
/** Выбор одной даты или datetime через адаптер даты, input и локализованную панель. */
export interface DatePickerProps<DateType extends object = Dayjs> extends Omit<
  HTMLInputAttributes,
  'value' | 'defaultValue' | 'size' | 'type' | 'children' | 'prefix' | 'multiple'
    | 'onchange' | 'oninput' | 'onselect'
>, DatePickerPanelNavigation {
  multiple?: false;
  /** Выбор даты, недели, месяца, года или квартала. @defaultValue 'date' */
  picker?: DatePickerPicker;
  /** Управляемая панель. Компонент предлагает переход через onPanelChange. */
  mode?: DatePickerMode;
  /** Управляемая дата или null; компонент не вводит прикладную UTC-сериализацию. */
  value?: DateType | null;
  /** Начальная дата локального состояния при отсутствии value. */
  defaultValue?: DateType;
  /** Локальный picker owner перекрывает ConfigProvider.prefixCls для поля и panel. */
  prefixCls?: string;
  /** Колонки времени для picker=date; week/month/year/quarter игнорируют настройку. @defaultValue false */
  showTime?: boolean | DatePickerTimeConfig<DateType>;
  /** Номера недель в date/week панели; по умолчанию включены только для picker=week. */
  showWeek?: boolean;
  /** Первый формат задаёт вывод; дополнительные строки допускаются при разборе. Объект type=mask включает числовые разряды. */
  format?: DatePickerFormat<DateType> | DatePickerFormat<DateType>[] | DatePickerFormatConfig;
  /** Начальная дата панели; применяется заново при каждом открытии popup. */
  defaultPickerValue?: DateType;
  /** Управляемая дата панели, независимая от выбранного value. */
  pickerValue?: DateType;
  open?: boolean;
  /** @defaultValue false */
  defaultOpen?: boolean;
  disabledDate?: (date: DateType, info: { type: DatePickerCalendarMode; }) => boolean;
  disabledTime?: (date: DateType) => DatePickerDisabledTime;
  minDate?: DateType;
  maxDate?: DateType;
  /** При включении выбор публикуется после подтверждения OK. */
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
  /** true/undefined — calendar и Form feedback; null/false/'' скрывают suffix. */
  suffixIcon?: InputContent;
  /** Локальное оформление перекрывает Form и ConfigProvider; fallback outlined. */
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
  locale?: DatePickerLocale;
  onChange?: (value: DateType | null, dateString: string) => void;
  onCalendarChange?: (
    value: DateType | null,
    dateString: string,
    info: { source: 'date' | 'time'; }
  ) => void;
  onOk?: (value: DateType) => void;
  onClear?: () => void;
  onPickerValueChange?: (
    value: DateType,
    info: { source: 'reset' | 'panel'; mode: DatePickerMode; }
  ) => void;
  onOpenChange?: (open: boolean) => void;
  onPanelChange?: (value: DateType, mode: DatePickerMode) => void;
  /** Быстрый выбор даты со строковой или Snippet подписью. */
  presets?: readonly DatePickerPreset<DateType>[];
  /** Временное отображение даты при наведении; не меняет выбранное value. @defaultValue 'hover' */
  previewValue?: false | 'hover';
  cellRender?: Snippet<[DateType | number | 'am' | 'pm', DatePickerCellRenderInfo<DateType>]>;
  /** Заменяет отдельные элементы, сохраняя выбор, проверку и подтверждение DatePicker. */
  components?: DatePickerComponents<DateType>;
  /** Полная раскладка панели: пресеты, календарь/время и footer. */
  panelRender?: Snippet<[Snippet]>;
  renderExtraFooter?: Snippet<[DatePickerMode]>;
  /** По умолчанию bottomLeft в LTR и bottomRight в RTL, как rc-picker. */
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  /** Локальный контейнер; undefined наследует ConfigProvider.getPopupContainer. */
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement | ShadowRoot;
  class?: string;
  rootClassName?: string;
  classNames?: DatePickerSemantic<DatePickerProps<DateType>>;
  styles?: DatePickerSemantic<DatePickerProps<DateType>>;
  /** Нативный ref доступен после mount и очищается при unmount. */
  nativeElement?: HTMLDivElement;
}

/** Дата и действия одного выбранного тега. Value сохраняет исходный объект даты. */
export interface DatePickerTagContext<DateType extends object = Dayjs> {
  label: string;
  value: DateType;
  disabled: boolean;
  closable: boolean;
  onClose: (event?: MouseEvent) => void;
}

/** Множественный выбор дат или периодов с отдельным черновиком панели. */
export interface DatePickerMultipleProps<DateType extends object = Dayjs> extends Omit<
  DatePickerProps<DateType>,
  'multiple' | 'value' | 'defaultValue' | 'showTime' | 'onChange'
    | 'onCalendarChange' | 'onOk' | 'classNames' | 'styles'
> {
  multiple: true;
  value?: readonly DateType[] | null;
  defaultValue?: readonly DateType[] | null;
  showTime?: false;
  /** Сортирует изменённый выбор по времени, сохраняя порядок входного value. @defaultValue true */
  order?: boolean;
  maxTagCount?: number | 'responsive';
  tagRender?: Snippet<[DatePickerTagContext<DateType>]>;
  removeIcon?: InputContent;
  onChange?: (value: DateType[] | null, dateStrings: string[] | null) => void;
  onCalendarChange?: (value: DateType[], dateStrings: string[], info: { source: 'date'; }) => void;
  onOk?: (value: DateType[]) => void;
  classNames?: DatePickerSemantic<DatePickerMultipleProps<DateType>>;
  styles?: DatePickerSemantic<DatePickerMultipleProps<DateType>>;
}

type SelectionField = 'value' | 'defaultValue' | 'showTime' | 'onChange'
  | 'onCalendarChange' | 'onOk' | 'classNames' | 'styles';

/** Объявление шаблона выводит тип значения по флагу multiple. */
export type DatePickerSelectionProps<Multiple extends boolean, DateType extends object = Dayjs> = Omit<
  DatePickerProps<DateType>, 'multiple' | SelectionField
> & {
  multiple?: Multiple;
} & {
  [Field in SelectionField]?: Multiple extends true
    ? DatePickerMultipleProps<DateType>[Field] : DatePickerProps<DateType>[Field];
} & Pick<DatePickerMultipleProps<DateType>, 'order' | 'maxTagCount' | 'tagRender' | 'removeIcon'>;
