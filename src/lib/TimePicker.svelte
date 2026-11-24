<script lang="ts" generics="DateType extends object">
  import type { PickerDateOperations } from './picker-date-operations.engine';
  import SinglePicker from './SinglePicker.svelte';
  import { timePickerSharedProps } from './time-picker-props.engine';
  import type { TimePickerFocusOptions, TimePickerRuntimeProps } from './time-picker.types';

  let {
    nativeElement = $bindable(), dateOperations, standaloneTime = false, ...props
  }: TimePickerRuntimeProps<DateType> & {
    dateOperations: PickerDateOperations<DateType>;
    standaloneTime?: boolean;
  } = $props();
  let shared = $derived(timePickerSharedProps(props));
  let picker = $state<{ focus(options?: TimePickerFocusOptions): void; blur(): void; }>();

  export function focus(options?: TimePickerFocusOptions) {
    picker?.focus(options);
  }

  export function blur() {
    picker?.blur();
  }
</script>

<SinglePicker {...shared} {dateOperations} {standaloneTime} time={props}
  bind:nativeElement bind:this={picker} />
