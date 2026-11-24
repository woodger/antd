<script lang="ts" generics="DateType extends object">
  import type { PickerDateOperations } from './picker-date-operations.engine';
  import RangePickerCore from './RangePickerCore.svelte';
  import { timeRangeSharedProps } from './time-range-picker-props.engine';
  import type { TimeRangeInputParser } from './time-range-picker.engine';
  import type { TimeRangePickerRuntimeProps } from './time-range-picker.types';
  import type { RangePickerProps } from './range-picker.types';

  let {
    nativeElement = $bindable(),
    startInput = $bindable(),
    endInput = $bindable(),
    dateOperations,
    parseTimeInput,
    ...props
  }: (RangePickerProps<DateType> | (TimeRangePickerRuntimeProps<DateType> & { picker: 'time'; })) & {
    dateOperations: PickerDateOperations<DateType>;
    parseTimeInput?: TimeRangeInputParser<DateType>;
  } = $props();
  let time = $derived(props.picker === 'time' ? props : undefined);
  let dateProps = $derived(props.picker === 'time' ? undefined : props);
  let shared = $derived(time ? timeRangeSharedProps(time) : dateProps);
  let picker = $state<{
    focus(options?: FocusOptions & { index?: 0 | 1; cursor?: 'start' | 'end' | 'all'; }): void;
    blur(): void;
  }>();

  export function focus(
    options?: FocusOptions & { index?: 0 | 1; cursor?: 'start' | 'end' | 'all'; }
  ) {
    picker?.focus(options);
  }

  export function blur() {
    picker?.blur();
  }
</script>

<RangePickerCore {...shared} {dateOperations} {parseTimeInput} {dateProps} {time}
  bind:nativeElement bind:startInput bind:endInput bind:this={picker} />
