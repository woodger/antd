<script lang="ts">
  import { dayjsPickerDates } from './picker-date-operations.engine';
  import { parseTimeRangeInput } from './time-range-picker.engine';
  import RangePickerCore from './RangePickerCore.svelte';
  import { timeRangeSharedProps } from './time-range-picker-props.engine';
  import type {
    TimeRangePickerFocusOptions,
    TimeRangePickerRuntimeProps
  } from './time-range-picker.types';

  let {
    nativeElement = $bindable(),
    startInput = $bindable(),
    endInput = $bindable(),
    ...props
  }: TimeRangePickerRuntimeProps = $props();
  let shared = $derived(timeRangeSharedProps(props));
  let value = $derived(props.value);
  let picker = $state<{
    focus(options?: TimeRangePickerFocusOptions): void;
    blur(): void;
  }>();

  /** Index по умолчанию 0; число 0/1 — совместимый shorthand rc-picker. */
  export function focus(options?: TimeRangePickerFocusOptions | 0 | 1) {
    picker?.focus(typeof options === 'number' ? { index: options } : { index: 0, ...options });
  }

  export function blur() {
    picker?.blur();
  }
</script>

<RangePickerCore
  {...shared}
  {value}
  time={props}
  dateOperations={dayjsPickerDates}
  parseTimeInput={parseTimeRangeInput}
  bind:nativeElement
  bind:startInput
  bind:endInput
  bind:this={picker}
/>
