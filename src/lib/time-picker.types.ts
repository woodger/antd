import type { Dayjs } from 'dayjs';
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type {
  DatePickerMode, DatePickerMultipleProps, DatePickerProps, DatePickerTimeConfig
} from './date-picker.types';
import type { PickerModeFooter } from './picker-components.types';
import type { PickerLocale } from './picker-locale.types';
import type { InputContent } from './input.types';

export type TimePickerUnit = 'hour' | 'minute' | 'second' | 'millisecond';
export type TimePickerColumnType = TimePickerUnit | 'meridiem';
export type TimePickerContent = InputContent;
export type TimePickerFocusOptions = FocusOptions & { cursor?: 'start' | 'end' | 'all'; };

/** Словарь из Ant Design; prop locale использует общий DatePickerLocale с timePickerLocale. */
export interface TimePickerLocale {
  placeholder?: string;
  rangePlaceholder?: [string, string];
}

/** OriginNode — native button snippet; остальные поля сохраняют форму rc-picker. */
export interface TimePickerCellRenderInfo<DateType extends object = Dayjs> {
  prefixCls: string;
  originNode: Snippet;
  today: DateType;
  type: 'time';
  subType: TimePickerColumnType;
  range?: 'start' | 'end';
  locale: PickerLocale;
}

export interface TimePickerPreset<DateType extends object = Dayjs> {
  label: string | Snippet;
  value: DateType | (() => DateType);
}

export interface TimePickerPopupSlots {
  root?: string;
  content?: string;
  item?: string;
  footer?: string;
  container?: string;
}

export interface TimePickerSlots {
  root?: string;
  prefix?: string;
  input?: string;
  suffix?: string;
  /** Строка для classNames равнозначна popup.root. */
  popup?: string | TimePickerPopupSlots;
}

/** Как outer TimePicker: локальный callback получает исходные props с разрешённым variant. */
export type TimePickerSemantic<DateType extends object = Dayjs> = TimePickerSlots
  | ((info: { props: TimePickerProps<'time', DateType>; }) => TimePickerSlots | undefined);

/**
 * Объект component config заменяется целиком во вложенном ConfigProvider.
 * Общий semantic callback получает range props в TimeRangePicker runtime, как upstream.
 */
export interface TimePickerConfig {
  class?: string;
  style?: string;
  variant?: DatePickerProps['variant'];
  classNames?: TimePickerSemantic;
  styles?: TimePickerSemantic;
  suffixIcon?: TimePickerContent | true;
  allowClear?: boolean | { clearIcon?: TimePickerContent; };
}

/** Выбор времени через адаптер даты; дата, UTC/timezone и точность не сериализуются компонентом. */
export interface TimePickerProps<
  Mode extends DatePickerMode = 'time', DateType extends object = Dayjs
> extends Omit<
  DatePickerProps<DateType>,
  'showTime' | 'allowClear' | 'status' | 'onCalendarChange' | 'classNames' | 'styles'
    | 'onPanelChange' | 'onPickerValueChange' | 'disabledDate' | 'onChange'
    | 'prefix' | 'onclick' | 'mode' | 'multiple' | 'cellRender' | 'picker' | 'renderExtraFooter'
>, Omit<DatePickerTimeConfig<DateType>, 'format'> {
  /** Самостоятельный TimePicker выбирает одно значение. */
  multiple?: false;
  /** По умолчанию true, как в rc-picker для picker=time. */
  needConfirm?: boolean;
  /** По умолчанию hover; preview не вызывает change/calendarChange. */
  previewValue?: false | 'hover';
  /** Выбирает ближайший разрешённый unit через 300 ms после ручной прокрутки. */
  changeOnScroll?: boolean;
  /** По умолчанию true; объект настраивает иконку очистки. */
  allowClear?: boolean | { clearIcon?: TimePickerContent; };
  suffixIcon?: TimePickerContent | true;
  prefix?: TimePickerContent;
  status?: 'error' | 'warning' | 'success' | 'validating';
  classNames?: TimePickerSemantic<DateType>;
  styles?: TimePickerSemantic<DateType>;
  cellRender?: Snippet<[number | 'am' | 'pm', TimePickerCellRenderInfo<DateType>]>;
  /** Получает snippet стандартной panel layout, сохраняя внешний popup lifecycle. */
  panelRender?: Snippet<[Snippet]>;
  renderExtraFooter?: [Mode] extends ['time'] ? Snippet : Snippet<[Mode]>;
  presets?: readonly TimePickerPreset<DateType>[];
  onclick?: HTMLAttributes<HTMLDivElement>['onclick'];
  /** Совместимый alias; onclick имеет приоритет. */
  onClick?: HTMLAttributes<HTMLDivElement>['onclick'];
  onFocus?: DatePickerProps['onfocus'];
  onBlur?: DatePickerProps['onblur'];
  onKeyDown?: (event: KeyboardEvent) => void;
  disabledDate?: (date: DateType, info: { type: 'time'; }) => boolean;
  /** Третий аргумент SinglePicker — пустой объект после удаления range. */
  onCalendarChange?: (value: DateType | null, dateString: string, info: Record<string, never>) => void;
  /** При полной очистке dateString=null, как в runtime SinglePicker rc-picker. */
  onChange?: (value: DateType | null, dateString: string | null) => void;
  /** Пользовательская панель может запросить календарный режим. */
  onPanelChange?(value: DateType, mode: Mode): void;
  onPickerValueChange?(value: DateType, info: { source: 'reset' | 'panel'; mode: Mode; }): void;
}

/** Набор времени для DatePicker.TimePicker и фабричного Picker.TimePicker. */
export interface TimePickerMultipleProps<DateType extends object = Dayjs> extends Omit<
  TimePickerProps<DatePickerMode, DateType>,
  'multiple' | 'value' | 'defaultValue' | 'onChange' | 'onCalendarChange' | 'onOk'
    | 'classNames' | 'styles'
>, Pick<DatePickerMultipleProps<DateType>, 'order' | 'maxTagCount' | 'tagRender' | 'removeIcon'> {
  multiple: true;
  value?: readonly DateType[] | null;
  defaultValue?: readonly DateType[] | null;
  onChange?: DatePickerMultipleProps<DateType>['onChange'];
  onOk?: DatePickerMultipleProps<DateType>['onOk'];
  onCalendarChange?: (value: DateType[], text: string[], info: Record<string, never>) => void;
  classNames?: TimePickerSlots
    | ((info: { props: TimePickerMultipleProps<DateType>; }) => TimePickerSlots | undefined);
  styles?: TimePickerMultipleProps<DateType>['classNames'];
}

/** Реализация принимает footer обеих публичных сигнатур. */
export type TimePickerRuntimeProps<DateType extends object = Dayjs> = Omit<TimePickerProps<DatePickerMode, DateType>, 'renderExtraFooter'> & {
  renderExtraFooter?: PickerModeFooter<DatePickerMode>;
};
