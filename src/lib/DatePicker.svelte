<script lang="ts" generics="Multiple extends boolean, DateType extends object">
  // Передаёт SinglePicker сценарий календаря или часов. Настройки часов не заменяют
  // семантические слоты и события владельца DatePicker.
  import type { PickerDateOperations } from './picker-date-operations.engine';
  import SinglePicker from './SinglePicker.svelte';
  import { timePickerSharedProps } from './time-picker-props.engine';
  import type { TimePickerRuntimeProps } from './time-picker.types';
  import type {
    DatePickerMultipleProps, DatePickerPicker, DatePickerProps, DatePickerSelectionProps
  } from './date-picker.types';

  let {
    nativeElement = $bindable(), dateOperations, defaultPicker, ...props
  }: DatePickerSelectionProps<Multiple, DateType> & {
    dateOperations: PickerDateOperations<DateType>;
    defaultPicker?: DatePickerPicker;
  } = $props();
  // После вывода generic у владельца конкретный runtime режим задаёт multiple.
  let ownerProps = $derived(props as DatePickerProps<DateType> | DatePickerMultipleProps<DateType>);
  let multipleOptions = $derived(ownerProps.multiple ? ownerProps : undefined);
  let scalarProps = $derived(ownerProps.multiple ? undefined : ownerProps);
  let fieldProps = $derived(multipleOptions ? multipleFieldProps(multipleOptions) : scalarProps);
  let rootTimeProps = $derived(ownerProps.picker === 'time' ? fieldProps : undefined);
  let dateProps = $derived(ownerProps.picker === 'time' ? undefined : scalarProps);
  let time = $derived(rootTimeProps && timeOptions(rootTimeProps));
  let calendarPicker = $derived(
    ownerProps.picker === 'time' ? defaultPicker : ownerProps.picker ?? defaultPicker
  );
  let shared = $derived.by(() => {
    if (time && rootTimeProps) {
      return {
        ...timePickerSharedProps(time),
        mode: rootTimeProps.mode,
        cellRender: rootTimeProps.cellRender,
        onChange: rootTimeProps.onChange,
        onCalendarChange: rootTimeProps.onCalendarChange
      };
    }
    return fieldProps && calendarOptions(fieldProps);
  });
  let picker = $state<{
    focus(options?: FocusOptions & { cursor?: 'start' | 'end' | 'all'; }): void;
    blur(): void;
  }>();

  /** Оставляет общие настройки редактора, перенося список и его события отдельно. */
  function multipleFieldProps(props: DatePickerMultipleProps<DateType>): DatePickerProps<DateType> {
    const {
      multiple, value, defaultValue, onChange, onCalendarChange, onOk,
      classNames, styles, order, maxTagCount, tagRender, removeIcon, ...field
    } = props;

    return field;
  }

  /** Сохраняет часы внутри showTime у календарного поля и исключает атрибуты самого режима time. */
  function calendarOptions(props: DatePickerProps<DateType>) {
    const {
      picker, showHour, showMinute, showSecond, showMillisecond, use12Hours, hourStep, minuteStep,
      secondStep, millisecondStep, hideDisabledOptions, defaultOpenValue, changeOnScroll,
      ...calendar
    } = props;
    return calendar;
  }

  /** Настройки часов берутся из props и showTime. Слоты и события принадлежат DatePicker. */
  function timeOptions(props: DatePickerProps<DateType>): TimePickerRuntimeProps<DateType> {
    const {
      picker, mode, classNames, styles, showTime, onChange, onCalendarChange, cellRender, onclick,
      ...options
    } = props;

    if (!showTime || typeof showTime !== 'object') {
      return options;
    }

    const { format, ...clock } = showTime;
    return { ...options, ...clock };
  }

  export function focus(options?: FocusOptions & { cursor?: 'start' | 'end' | 'all'; }) {
    picker?.focus(options);
  }

  export function blur() {
    picker?.blur();
  }
</script>

<SinglePicker
  {...shared}
  {dateOperations}
  picker={calendarPicker}
  {dateProps}
  {rootTimeProps}
  {time}
  {multipleOptions}
  bind:nativeElement
  bind:this={picker}
/>
