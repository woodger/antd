<script lang="ts" generics="Multiple extends boolean, DateType extends object">
  // Passes the calendar or clock mode to SinglePicker. DatePicker still owns the semantic slots and
  // events when clock settings are present.
  import type { PickerDateOperations } from './picker-date-operations.engine';
  import SinglePicker from './SinglePicker.svelte';
  import { mergeShowTime, splitPickerClock, timePickerSharedProps } from './time-picker-props.engine';
  import type { TimePickerRuntimeProps } from './time-picker.types';
  import type {
    DatePickerMultipleProps, DatePickerPicker, DatePickerProps, DatePickerSelectionProps,
    DatePickerTimeConfig
  } from './date-picker.types';

  let {
    nativeElement = $bindable(), dateOperations, defaultPicker, ...props
  }: DatePickerSelectionProps<Multiple, DateType> & {
    dateOperations: PickerDateOperations<DateType>;
    defaultPicker?: DatePickerPicker;
  } = $props();
  // Once the owner infers the generic type, multiple determines the runtime mode.
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
        showNow: rootTimeProps.showNow,
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

  /** Keeps the shared editor settings and handles the list and its events separately. */
  function multipleFieldProps(props: DatePickerMultipleProps<DateType>): DatePickerProps<DateType> {
    const {
      multiple, value, defaultValue, onChange, onCalendarChange, onOk,
      classNames, styles, order, maxTagCount, tagRender, removeIcon, ...field
    } = props;

    return field;
  }

  /** Passes shared clock settings to the calendar through showTime and keeps field attributes separate. */
  function calendarOptions(props: DatePickerProps<DateType>) {
    const { clock, field } = splitPickerClock(props);
    const { picker, defaultOpenValue, disabledTime, showTime, ...calendar } = field;
    const settings = mergeShowTime<DatePickerTimeConfig<DateType>>({
      ...clock, defaultOpenValue, disabledTime, showNow: calendar.showNow
    }, showTime);

    return {
      ...calendar,
      showTime: settings,
      disabledTime: settings ? settings.disabledTime : disabledTime
    };
  }

  /** Clock settings come from props and showTime. DatePicker owns the slots and events. */
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
