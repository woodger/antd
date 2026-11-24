<script lang="ts" generics="Multiple extends boolean = false">
  import SinglePicker from './SinglePicker.svelte';
  import type {
    DatePickerMultipleProps, DatePickerProps, DatePickerSelectionProps
  } from './date-picker.types';

  let { nativeElement = $bindable(), ...props }: DatePickerSelectionProps<Multiple> = $props();
  // После вывода generic у владельца конкретный runtime режим задаёт multiple.
  let ownerProps = $derived(props as DatePickerProps | DatePickerMultipleProps);
  let dateProps = $derived(ownerProps.multiple ? undefined : ownerProps);
  let multipleOptions = $derived(ownerProps.multiple ? ownerProps : undefined);
  let shared = $derived.by(() => {
    if (!multipleOptions) {
      return dateProps;
    }

    const {
      multiple, value, defaultValue, onChange, onCalendarChange, onOk,
      classNames, styles, order, maxTagCount, tagRender, removeIcon, ...sharedProps
    } = multipleOptions;
    return sharedProps;
  });
  let picker = $state<{
    focus(options?: FocusOptions & { cursor?: 'start' | 'end' | 'all'; }): void;
    blur(): void;
  }>();

  export function focus(options?: FocusOptions & { cursor?: 'start' | 'end' | 'all'; }) {
    picker?.focus(options);
  }

  export function blur() {
    picker?.blur();
  }
</script>

<SinglePicker
  {...shared}
  {dateProps}
  {multipleOptions}
  bind:nativeElement
  bind:this={picker}
/>
