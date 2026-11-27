import type { Dayjs } from 'dayjs';
import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLButtonAttributes, HTMLInputAttributes } from 'svelte/elements';
import type { GenerateConfig } from './date-generate.types';
import type {
  DatePickerCellRenderInfo, DatePickerDisabledTime, DatePickerMode, DatePickerTimeConfig
} from './date-picker.types';
import type { InputContent } from './input/input.types';
import type { PickerLocale } from './picker-locale.types';

export type DatePickerEditorElement = HTMLInputElement | HTMLTextAreaElement;

/** General attributes of the text editor, including masking events and an accessible name. */
export type DatePickerEditorAttributes = Omit<
  HTMLInputAttributes, symbol | `on${string}` | 'children' | 'value' | 'defaultValue'
> & Pick<HTMLAttributes<DatePickerEditorElement>,
  Extract<keyof HTMLAttributes<DatePickerEditorElement>, symbol | `on${string}`>> & {
  value: string;
  defaultValue: string;
  'data-range'?: 'start' | 'end';
};

/** Uses the actual DOM ref for the editor inside a custom wrapper. */
export type DatePickerEditorRegistration = DatePickerEditorElement
  | { inputElement: DatePickerEditorElement; };

/** Pass attributes and register to the field. Set textarea value explicitly for SSR. */
export interface DatePickerEditorContext {
  attributes: DatePickerEditorAttributes;
  register: (element: DatePickerEditorRegistration) => () => void;
  range?: 'start' | 'end';
}

/** Replacement of a native editor or snippet with its own design. */
export type DatePickerEditor = 'input' | 'textarea' | Snippet<[DatePickerEditorContext]>;

/** Confirmation button attributes and label from the current locale. */
export interface DatePickerButtonContext {
  attributes: Pick<HTMLButtonAttributes, 'type' | 'disabled' | 'onclick'>;
  children: string;
}

/** The datetime key replaces the calendar and time columns together. */
export type DatePickerPanelMode = DatePickerMode | 'datetime';

/** Contents of navigation buttons. Signatures and actions remain at the calendar. */
export interface DatePickerPanelNavigation {
  prevIcon?: InputContent;
  nextIcon?: InputContent;
  superPrevIcon?: InputContent;
  superNextIcon?: InputContent;
}

/** Setting time after resolution of the format and active boundary. */
export interface DatePickerPanelTimeConfig<DateType extends object = Dayjs> extends Omit<DatePickerTimeConfig<DateType>, 'defaultOpenValue'> {
  defaultOpenValue?: DateType | readonly DateType[];
  disabledTime?: (date: DateType) => DatePickerDisabledTime;
  changeOnScroll?: boolean;
  showNow?: boolean;
}

/** Data and actions inside a single panel instance. */
export interface DatePickerPanelContext<DateType extends object = Dayjs> extends DatePickerPanelNavigation {
  mode: DatePickerPanelMode;
  range?: 'start' | 'end';
  prefixCls: string;
  locale: PickerLocale;
  generateConfig: GenerateConfig<DateType>;
  /** For the second panel of the range contains the date of its own period. */
  pickerValue: DateType;
  value?: DateType;
  values: readonly DateType[];
  hoverValue: readonly DateType[] | null;
  hoverRangeValue: readonly [DateType, DateType] | null;
  showTime: DatePickerPanelTimeConfig<DateType> | null;
  showWeek?: boolean;
  minDate?: DateType;
  maxDate?: DateType;
  disabledDate: (date: DateType, info: { type: DatePickerMode; }) => boolean;
  cellRender: Snippet<[DateType | number | 'am' | 'pm', DatePickerCellRenderInfo<DateType>]>;
  /** Changing the viewing date. The controlled field communicates the proposed value. */
  onPickerValueChange: (date: DateType) => void;
  onModeChange: (mode: DatePickerMode, date?: DateType) => void;
  /** Passes the selected date to the normal draft and confirmation logic. */
  onSelect: (date: DateType) => void;
  onHover: (date: DateType | null) => void;
}

export type DatePickerPanel<DateType extends object = Dayjs> = Snippet<[DatePickerPanelContext<DateType>]>;

/** The internal footer call supports the existing signature and custom panel mode. */
export type PickerModeFooter<Mode extends DatePickerMode> = {
  render(mode?: Mode): ReturnType<Snippet>;
}['render'];

/** Replacing the field elements and the opened panel. */
export interface DatePickerComponents<DateType extends object = Dayjs> extends Partial<Record<DatePickerPanelMode, DatePickerPanel<DateType>>> {
  /** In a solitary field and at both limits of the range. */
  input?: DatePickerEditor;
  button?: 'button' | Snippet<[DatePickerButtonContext]>;
}
