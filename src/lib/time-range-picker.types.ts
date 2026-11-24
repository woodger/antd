import type { Dayjs } from 'dayjs';
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { DatePickerDisabledTime, DatePickerMode, DatePickerTimeConfig } from './date-picker.types';
import type { PickerModeFooter } from './picker-components.types';
import type {
  RangePickerProps,
  RangePickerInfo,
  RangePickerPart
} from './range-picker.types';
import type {
  TimePickerContent,
  TimePickerCellRenderInfo,
  TimePickerSlots
} from './time-picker.types';

export type TimeRangePickerFocusOptions = FocusOptions & {
  index?: 0 | 1;
  cursor?: 'start' | 'end' | 'all';
};

/** В диапазоне semantic callback получает resolved size/disabled и исходный variant. */
export type TimeRangePickerSemantic<DateType extends object = Dayjs> = TimePickerSlots
  | ((info: { props: TimeRangePickerProps<'time', DateType>; }) => TimePickerSlots | undefined);

/** Пара дат с picker=time; каждая граница подтверждается отдельно, как в rc-picker. */
export interface TimeRangePickerProps<
  Mode extends DatePickerMode = 'time', DateType extends object = Dayjs
> extends Omit<
  RangePickerProps<DateType>,
  'showTime' | 'allowClear' | 'status' | 'disabledDate' | 'disabledTime'
    | 'onPickerValueChange' | 'onPanelChange' | 'prefix' | 'onclick'
    | 'onfocus' | 'onblur' | 'multiple' | 'placeholder' | 'renderExtraFooter' | 'classNames' | 'styles'
    | 'cellRender' | 'picker' | 'mode'
>, Omit<DatePickerTimeConfig<DateType>, 'format' | 'defaultOpenValue'> {
  placeholder?: string | [string, string];
  /** Заполняет только панель и кандидат OK; одиночная дата относится к start. */
  defaultOpenValue?: DateType | [DateType, DateType];
  changeOnScroll?: boolean;
  allowClear?: boolean | { clearIcon?: TimePickerContent; };
  suffixIcon?: TimePickerContent;
  prefix?: TimePickerContent;
  status?: 'error' | 'warning' | 'success' | 'validating';
  classNames?: TimeRangePickerSemantic<DateType>;
  styles?: TimeRangePickerSemantic<DateType>;
  cellRender?: Snippet<[number | 'am' | 'pm', TimePickerCellRenderInfo<DateType>]>;
  panelRender?: Snippet<[Snippet]>;
  renderExtraFooter?: Snippet<[Mode]>;
  disabledDate?: (date: DateType, info: { type: 'time'; from?: DateType | null; }) => boolean;
  disabledTime?: (
    date: DateType,
    partial: RangePickerPart,
    info: { from?: DateType | null; }
  ) => DatePickerDisabledTime;
  onPickerValueChange?(
    value: [DateType, DateType],
    info: RangePickerInfo & { source: 'reset' | 'panel'; mode: [Mode, Mode]; }
  ): void;
  /** Пользовательская панель может изменить режим одной границы. */
  onPanelChange?(value: [DateType | null, DateType | null], modes: [Mode, Mode]): void;
  onclick?: HTMLAttributes<HTMLDivElement>['onclick'];
  onClick?: HTMLAttributes<HTMLDivElement>['onclick'];
  /** Вызывается и для native controls панели; info относится к активной границе. */
  onfocus?: (event: FocusEvent, info: RangePickerInfo) => void;
  onblur?: (event: FocusEvent, info: RangePickerInfo) => void;
  onFocus?: TimeRangePickerProps['onfocus'];
  onBlur?: TimeRangePickerProps['onblur'];
  onKeyDown?: (event: KeyboardEvent) => void;
}

/** Реализация принимает footer обеих публичных сигнатур. */
export type TimeRangePickerRuntimeProps<DateType extends object = Dayjs> = Omit<
  TimeRangePickerProps<DatePickerMode, DateType>, 'renderExtraFooter'
> & { renderExtraFooter?: PickerModeFooter<DatePickerMode>; };
