import type { Dayjs } from 'dayjs';
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type {
  DatePickerMode, DatePickerMultipleProps, DatePickerProps, DatePickerTimeConfig
} from './date-picker.types';
import type { PickerModeFooter } from './picker-components.types';
import type { PickerLocale } from './picker-locale.types';
import type { InputContent } from './input/input.types';
import type { TimeRangePickerProps } from './time-range-picker.types';

export type TimePickerUnit = 'hour' | 'minute' | 'second' | 'millisecond';
export type TimePickerColumnType = TimePickerUnit | 'meridiem';
export type TimePickerContent = InputContent;
export type TimePickerFocusOptions = FocusOptions & { cursor?: 'start' | 'end' | 'all'; };

/** Dictionary from Ant Design; prop locale uses a total of DatePickerLocale with timePickerLocale. */
export interface TimePickerLocale {
  placeholder?: string;
  rangePlaceholder?: [string, string];
}

/** OriginNode – native snippet button; the remaining fields retain form rc-picker. */
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
  /** The string for classNames is equivalent to popup.root. */
  popup?: string | TimePickerPopupSlots;
}

/** As outer TimePicker: the local callback receives the original props with the authorized variant. */
export type TimePickerSemantic<DateType extends object = Dayjs> = TimePickerSlots
  | ((info: { props: TimePickerProps<'time', DateType>; }) => TimePickerSlots | undefined);

type TimePickerOwnerProps<DateType extends object> =
  | TimePickerProps<'time', DateType>
  | TimePickerMultipleProps<DateType>
  | TimeRangePickerProps<'time', DateType>;

/** A provider can serve single, multiple and range pickers using different date adapters. */
type TimePickerConfigSemantic = TimePickerSlots | (<DateType extends object>(
  info: { props: TimePickerOwnerProps<DateType> }
) => TimePickerSlots | undefined);

/** A nested ConfigProvider replaces this object. Each picker passes its own props to callbacks. */
export interface TimePickerConfig {
  class?: string;
  style?: string;
  variant?: DatePickerProps['variant'];
  classNames?: TimePickerConfigSemantic;
  styles?: TimePickerConfigSemantic;
  suffixIcon?: TimePickerContent | true;
  allowClear?: boolean | { clearIcon?: TimePickerContent; };
}

/** Choosing time through the date adapter; date, UTC/timezone and accuracy are not serialized by the component. */
export interface TimePickerProps<
  Mode extends DatePickerMode = 'time', DateType extends object = Dayjs
> extends Omit<
  DatePickerProps<DateType>,
  'showTime' | 'allowClear' | 'status' | 'onCalendarChange' | 'classNames' | 'styles'
    | 'onPanelChange' | 'onPickerValueChange' | 'disabledDate' | 'onChange'
    | 'prefix' | 'onclick' | 'mode' | 'multiple' | 'cellRender' | 'picker' | 'renderExtraFooter'
>, Omit<DatePickerTimeConfig<DateType>, 'format'> {
  /** Independent TimePicker selects one value. */
  multiple?: false;
  /** By default true, as at rc-picker for picker=time. */
  needConfirm?: boolean;
  /** By default hover; preview does not cause change/calendarChange. */
  previewValue?: false | 'hover';
  /** Select the nearest authorized unit via 300 ms after manual scrolling. */
  changeOnScroll?: boolean;
  /** Default true; the object configures the clearing icon. */
  allowClear?: boolean | { clearIcon?: TimePickerContent; };
  suffixIcon?: TimePickerContent | true;
  prefix?: TimePickerContent;
  status?: 'error' | 'warning' | 'success' | 'validating';
  classNames?: TimePickerSemantic<DateType>;
  styles?: TimePickerSemantic<DateType>;
  cellRender?: Snippet<[number | 'am' | 'pm', TimePickerCellRenderInfo<DateType>]>;
  /** Receives snippet the standard management panel, saving an external popup lifecycle. */
  panelRender?: Snippet<[Snippet]>;
  renderExtraFooter?: [Mode] extends ['time'] ? Snippet : Snippet<[Mode]>;
  presets?: readonly TimePickerPreset<DateType>[];
  onclick?: HTMLAttributes<HTMLDivElement>['onclick'];
  /** Compatible alias; onclick has priority. */
  onClick?: HTMLAttributes<HTMLDivElement>['onclick'];
  onFocus?: DatePickerProps['onfocus'];
  onBlur?: DatePickerProps['onblur'];
  onKeyDown?: (event: KeyboardEvent) => void;
  disabledDate?: (date: DateType, info: { type: 'time'; }) => boolean;
  /** The third argument SinglePicker is an empty object after removing the range. */
  onCalendarChange?: (value: DateType | null, dateString: string, info: Record<string, never>) => void;
  /** With complete clearing of dateString=null, as in runtime SinglePicker rc-picker. */
  onChange?: (value: DateType | null, dateString: string | null) => void;
  /** The user panel can request calendar mode. */
  onPanelChange?(value: DateType, mode: Mode): void;
  onPickerValueChange?(value: DateType, info: { source: 'reset' | 'panel'; mode: Mode; }): void;
}

/** Time set for DatePicker.TimePicker and factory Picker.TimePicker. */
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

/** The implementation takes the footer of both public signatures. */
export type TimePickerRuntimeProps<DateType extends object = Dayjs> = Omit<TimePickerProps<DatePickerMode, DateType>, 'renderExtraFooter'> & {
  renderExtraFooter?: PickerModeFooter<DatePickerMode>;
};
