// Создаёт семейство DatePicker на одном адаптере. Пикеры используют общие Svelte-компоненты
// и передают значения адаптера без промежуточной обёртки.
import type { Component, ComponentConstructorOptions, SvelteComponent } from 'svelte';
import DatePickerRoot from './DatePicker.svelte';
import RangePickerRoot from './RangePicker.svelte';
import { createTimePickerComponent, type TimePanelOptions } from './time-picker.component';
import { pickerAdapterProps } from './picker-adapter-props.engine';
import {
  createPickerDateOperations, type PickerDateOperations
} from './picker-date-operations.engine';
import type {
  DatePickerMode, DatePickerPicker, DatePickerSelectionProps
} from './date-picker.types';
import type { GenerateConfig } from './date-generate.types';
import type { RangePickerProps } from './range-picker.types';
import type { TimeRangeInputParser } from './time-range-picker.engine';
import type { TimeRangePickerProps } from './time-range-picker.types';

type DatePickerHandle = ReturnType<typeof DatePickerRoot>;
type RangePickerHandle = ReturnType<typeof RangePickerRoot>;
type RangePickerBindings = 'nativeElement' | 'startInput' | 'endInput';
interface TimeRangeModeProps<DateType extends object> extends TimeRangePickerProps<'time', DateType> {
  picker: 'time';
}

interface CustomTimeRangeModeProps<DateType extends object> extends
  Omit<TimeRangePickerProps<DatePickerMode, DateType>, 'components'>, TimePanelOptions<DateType> {
  picker: 'time';
}

/** Общий вызов RangePicker принимает настройки календаря либо режима времени. */
interface RangePickerComponent<DateType extends object> {
  (
    anchor: unknown,
    props: RangePickerProps<DateType> | TimeRangeModeProps<DateType>
      | CustomTimeRangeModeProps<DateType>
  ): ReturnType<Component<{}, RangePickerHandle, ''>>;
  z_$$bindings?: RangePickerBindings;
}

type PickerSelectionProps<
  Multiple extends boolean, DateType extends object, DefaultPicker extends DatePickerPicker | undefined
> = DefaultPicker extends DatePickerPicker
  ? Omit<DatePickerSelectionProps<Multiple, DateType>, 'picker'>
  : DatePickerSelectionProps<Multiple, DateType>;

/** Сохраняет вывод multiple в шаблоне через изоморфную декларацию Svelte. */
export interface PickerSelectionComponent<
  DateType extends object, DefaultPicker extends DatePickerPicker | undefined
> {
  new <Multiple extends boolean = false>(
    options: ComponentConstructorOptions<PickerSelectionProps<Multiple, DateType, DefaultPicker>>
  ): SvelteComponent<PickerSelectionProps<Multiple, DateType, DefaultPicker>, {}, {}>
    & DatePickerHandle & { $$bindings?: 'nativeElement'; };
  <Multiple extends boolean = false>(
    anchor: unknown, props: PickerSelectionProps<Multiple, DateType, DefaultPicker>
  ): DatePickerHandle;
  z_$$bindings?: 'nativeElement';
}

/** Вяжет общее поле к адаптеру. Сигнатура mount по умолчанию выбирает одну дату. */
function createDatePickerComponent<
  DateType extends object, DefaultPicker extends DatePickerPicker | undefined = undefined
>(
  dateOperations: PickerDateOperations<DateType>,
  defaultPicker?: DefaultPicker
) {
  /** Передаёт внутреннему полю исходные getter'ы, настройки режима и адаптер. */
  function render<Multiple extends boolean = false>(
    anchor: unknown, props: DatePickerSelectionProps<Multiple, DateType>
  ) {
    return DatePickerRoot<Multiple, DateType>(
      anchor, pickerAdapterProps(props, { dateOperations, defaultPicker })
    );
  }

  // Вызов добавляет все внутренние props DatePickerRoot. Публичная декларация
  // оставляет только props владельца и те же типы ref и binding.
  const component = render as unknown as PickerSelectionComponent<DateType, DefaultPicker>;
  const scalar = component<false>;
  const picker: typeof component & typeof scalar = component;
  return picker;
}

/** Закрепляет конфигурацию для всех полей семейства и трёх календарных специализаций. */
export function createPickerFamily<DateType extends object>(
  dateOperations: PickerDateOperations<DateType>,
  parseTimeInput?: TimeRangeInputParser<DateType>
) {
  const WeekPicker = createDatePickerComponent(dateOperations, 'week');
  const MonthPicker = createDatePickerComponent(dateOperations, 'month');
  const YearPicker = createDatePickerComponent(dateOperations, 'year');
  const TimePicker = createTimePickerComponent(dateOperations);
  const RangePicker: RangePickerComponent<DateType> = (anchor, props) => RangePickerRoot<DateType>(
    anchor, pickerAdapterProps(props, { dateOperations, parseTimeInput })
  );
  const DatePicker = createDatePickerComponent(dateOperations);

  return Object.assign(DatePicker, {
    WeekPicker, MonthPicker, YearPicker, TimePicker, RangePicker
  });
}

/** Создаёт DatePicker и его варианты для типа даты, который обслуживает generateConfig. */
export function generatePicker<DateType extends object>(generateConfig: GenerateConfig<DateType>) {
  return createPickerFamily(createPickerDateOperations(generateConfig));
}
