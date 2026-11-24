<script lang="ts" generics="DateType extends object">
  // Разрешает настройки часов перед передачей в общий редактор диапазона.
  // Оформление получает исходные props режима, включая вложенный showTime.
  import type { PickerDateOperations } from './picker-date-operations.engine';
  import RangePickerCore from './RangePickerCore.svelte';
  import { mergeShowTime, splitPickerClock } from './time-picker-props.engine';
  import { timeRangeSharedProps } from './time-range-picker-props.engine';
  import type { TimeRangeInputParser } from './time-range-picker.engine';
  import type { TimeRangePickerModeOptions, TimeRangePickerRuntimeProps }
    from './time-range-picker.types';
  import type { RangePickerProps, RangePickerTimeConfig } from './range-picker.types';

  type TimeModeProps = TimeRangePickerRuntimeProps<DateType> & TimeRangePickerModeOptions<DateType>;

  let {
    nativeElement = $bindable(),
    startInput = $bindable(),
    endInput = $bindable(),
    dateOperations,
    parseTimeInput,
    ...props
  }: (RangePickerProps<DateType> | TimeModeProps) & {
    dateOperations: PickerDateOperations<DateType>;
    parseTimeInput?: TimeRangeInputParser<DateType>;
  } = $props();
  let rootTimeProps = $derived(props.picker === 'time' ? props : undefined);
  let dateProps = $derived(props.picker === 'time' ? undefined : props);
  let time = $derived(rootTimeProps && timeOptions(rootTimeProps));
  let clockFormat = $derived(typeof rootTimeProps?.showTime === 'object'
    ? rootTimeProps.showTime?.format : undefined);
  let shared = $derived(time && rootTimeProps
    ? { ...timeRangeSharedProps(time), showNow: rootTimeProps.showNow }
    : dateProps && calendarOptions(dateProps));
  let picker = $state<{
    focus(options?: FocusOptions & { index?: 0 | 1; cursor?: 'start' | 'end' | 'all'; }): void;
    blur(): void;
  }>();

  /** Обе пустые границы datetime берут время из пары шаблонов, как в rc-picker. */
  function calendarOptions(props: RangePickerProps<DateType>) {
    const { clock, field } = splitPickerClock(props);
    const { defaultOpenValue, disabledTime, showTime, ...calendar } = field;
    const templates = Array.isArray(defaultOpenValue) ? defaultOpenValue : undefined;
    const settings = mergeShowTime<RangePickerTimeConfig<DateType>>({
      ...clock, defaultOpenValue: templates, disabledTime, showNow: calendar.showNow
    }, showTime);

    return {
      ...calendar,
      showTime: settings,
      disabledTime: settings ? settings.disabledTime : disabledTime
    };
  }

  /** Объединяет настройки часов. Формат панели разрешается отдельно от формата поля. */
  function timeOptions(props: TimeModeProps): TimeRangePickerRuntimeProps<DateType> {
    const { picker, showTime, ...options } = props;
    if (!showTime || typeof showTime !== 'object') {
      return options;
    }

    const { format, ...clock } = showTime;
    return { ...options, ...clock };
  }

  export function focus(
    options?: FocusOptions & { index?: 0 | 1; cursor?: 'start' | 'end' | 'all'; }
  ) {
    picker?.focus(options);
  }

  export function blur() {
    picker?.blur();
  }
</script>

<RangePickerCore {...shared} {dateOperations} {parseTimeInput} {dateProps} {rootTimeProps}
  {time} {clockFormat}
  bind:nativeElement bind:startInput bind:endInput bind:this={picker} />
