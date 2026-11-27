import type { Dayjs } from 'dayjs';
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { DatePickerDisabledTime, DatePickerMode } from './date-picker.types';
import type { PickerModeFooter } from './picker-components.types';
import type {
  RangePickerProps,
  RangePickerInfo,
  RangePickerPart,
  RangePickerTimeConfig
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

/** In the semantic callback range receives size/disabled and the original variant. */
export type TimeRangePickerSemantic<DateType extends object = Dayjs> = TimePickerSlots
  | ((info: { props: TimeRangePickerProps<'time', DateType>; }) => TimePickerSlots | undefined);

/** A pair of dates with picker=time; each boundary is confirmed separately, as in rc-picker. */
export interface TimeRangePickerProps<
  Mode extends DatePickerMode = 'time', DateType extends object = Dayjs
> extends Omit<
  RangePickerProps<DateType>,
  'showTime' | 'allowClear' | 'status' | 'disabledDate' | 'disabledTime'
    | 'onPickerValueChange' | 'onPanelChange' | 'prefix' | 'onclick'
    | 'onfocus' | 'onblur' | 'multiple' | 'placeholder' | 'renderExtraFooter' | 'classNames' | 'styles'
    | 'cellRender' | 'picker' | 'mode'
> {
  placeholder?: string | [string, string];
  /** Fills only the panel and candidate OK; the single date refers to the start. */
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
  /** The user panel can change the mode of a single boundary. */
  onPanelChange?(value: [DateType | null, DateType | null], modes: [Mode, Mode]): void;
  onclick?: HTMLAttributes<HTMLDivElement>['onclick'];
  onClick?: HTMLAttributes<HTMLDivElement>['onclick'];
  /** Called for the native panel; info refers to the active boundary. */
  onfocus?: (event: FocusEvent, info: RangePickerInfo) => void;
  onblur?: (event: FocusEvent, info: RangePickerInfo) => void;
  onFocus?: TimeRangePickerProps['onfocus'];
  onBlur?: TimeRangePickerProps['onblur'];
  onKeyDown?: (event: KeyboardEvent) => void;
}

/** The implementation takes the footer of both public signatures. */
export type TimeRangePickerRuntimeProps<DateType extends object = Dayjs> = Omit<
  TimeRangePickerProps<DatePickerMode, DateType>, 'renderExtraFooter'
> & { renderExtraFooter?: PickerModeFooter<DatePickerMode>; };

/** The time mode in family DatePicker also accepts nested watch settings. */
export interface TimeRangePickerModeOptions<DateType extends object> {
  picker: 'time';
  showTime?: boolean | (Omit<RangePickerTimeConfig<DateType>, 'disabledTime'> &
    Pick<TimeRangePickerProps<'time', DateType>, 'disabledTime'>);
}
