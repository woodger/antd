import type { Dayjs } from 'dayjs';
import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLButtonAttributes, HTMLInputAttributes } from 'svelte/elements';
import type { GenerateConfig } from './date-generate.types';
import type {
  DatePickerCellRenderInfo, DatePickerDisabledTime, DatePickerMode, DatePickerTimeConfig
} from './date-picker.types';
import type { InputContent } from './input.types';
import type { PickerLocale } from './picker-locale.types';

export type DatePickerEditorElement = HTMLInputElement | HTMLTextAreaElement;

/** Общие атрибуты текстового редактора, включая события маски и доступное имя. */
export type DatePickerEditorAttributes = Omit<
  HTMLInputAttributes, symbol | `on${string}` | 'children' | 'value' | 'defaultValue'
> & Pick<HTMLAttributes<DatePickerEditorElement>,
  Extract<keyof HTMLAttributes<DatePickerEditorElement>, symbol | `on${string}`>> & {
  value: string;
  defaultValue: string;
  'data-range'?: 'start' | 'end';
};

/** Редактор внутри пользовательской обёртки передаётся по фактическому DOM ref. */
export type DatePickerEditorRegistration = DatePickerEditorElement
  | { inputElement: DatePickerEditorElement; };

/** Передайте attributes и register полю. Для textarea задайте value явно для SSR. */
export interface DatePickerEditorContext {
  attributes: DatePickerEditorAttributes;
  register: (element: DatePickerEditorRegistration) => () => void;
  range?: 'start' | 'end';
}

/** Замена нативного редактора или snippet с собственным оформлением. */
export type DatePickerEditor = 'input' | 'textarea' | Snippet<[DatePickerEditorContext]>;

/** Атрибуты кнопки подтверждения и подпись из текущей локали. */
export interface DatePickerButtonContext {
  attributes: Pick<HTMLButtonAttributes, 'type' | 'disabled' | 'onclick'>;
  children: string;
}

/** Ключ datetime заменяет календарь и колонки времени вместе. */
export type DatePickerPanelMode = DatePickerMode | 'datetime';

/** Содержимое кнопок навигации. Подписи и действия остаются у календаря. */
export interface DatePickerPanelNavigation {
  prevIcon?: InputContent;
  nextIcon?: InputContent;
  superPrevIcon?: InputContent;
  superNextIcon?: InputContent;
}

/** Настройки времени после разрешения формата и активной границы. */
export interface DatePickerPanelTimeConfig extends Omit<DatePickerTimeConfig, 'defaultOpenValue'> {
  defaultOpenValue?: Dayjs | readonly Dayjs[];
  disabledTime?: (date: Dayjs) => DatePickerDisabledTime;
  changeOnScroll?: boolean;
  showNow?: boolean;
}

/** Данные и действия внутри одного экземпляра панели. */
export interface DatePickerPanelContext extends DatePickerPanelNavigation {
  mode: DatePickerPanelMode;
  range?: 'start' | 'end';
  prefixCls: string;
  locale: PickerLocale;
  generateConfig: GenerateConfig<Dayjs>;
  /** Для второй панели диапазона содержит дату её собственного периода. */
  pickerValue: Dayjs;
  value?: Dayjs;
  values: readonly Dayjs[];
  hoverValue: readonly Dayjs[] | null;
  hoverRangeValue: readonly [Dayjs, Dayjs] | null;
  showTime: DatePickerPanelTimeConfig | null;
  showWeek?: boolean;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  disabledDate: (date: Dayjs, info: { type: DatePickerMode; }) => boolean;
  cellRender: Snippet<[Dayjs | number | 'am' | 'pm', DatePickerCellRenderInfo]>;
  /** Меняет дату просмотра. У управляемого поля сообщает предложенное значение. */
  onPickerValueChange: (date: Dayjs) => void;
  onModeChange: (mode: DatePickerMode, date?: Dayjs) => void;
  /** Передаёт выбранный Dayjs в обычную логику черновика и подтверждения. */
  onSelect: (date: Dayjs) => void;
  onHover: (date: Dayjs | null) => void;
}

export type DatePickerPanel = Snippet<[DatePickerPanelContext]>;

/** Внутренний вызов footer поддерживает прежнюю сигнатуру и режим авторской панели. */
export type PickerModeFooter<Mode extends DatePickerMode> = {
  render(mode?: Mode): ReturnType<Snippet>;
}['render'];

/** Замены элементов поля и раскрытой панели. */
export interface DatePickerComponents extends Partial<Record<DatePickerPanelMode, DatePickerPanel>> {
  /** В одиночном поле и в обеих границах диапазона. */
  input?: DatePickerEditor;
  button?: 'button' | Snippet<[DatePickerButtonContext]>;
}
