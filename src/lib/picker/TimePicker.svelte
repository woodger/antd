<script lang="ts" generics="DateType extends object">
  import type { PickerDateOperations } from './picker-date-operations.engine';
  import SinglePicker from './SinglePicker.svelte';
  import { timePickerSharedProps } from './time-picker-props.engine';
  import type {
    TimePickerFocusOptions, TimePickerMultipleProps, TimePickerRuntimeProps
  } from './time-picker.types';

  let {
    nativeElement = $bindable(), dateOperations, standaloneTime = false, ...props
  }: (TimePickerRuntimeProps<DateType> | TimePickerMultipleProps<DateType>) & {
    dateOperations: PickerDateOperations<DateType>;
    standaloneTime?: boolean;
  } = $props();
  let multiple = $derived(props.multiple ? props : undefined);
  let time = $derived(props.multiple ? multipleFieldProps(props) : props);
  let shared = $derived(timePickerSharedProps(time));
  let picker = $state<{ focus(options?: TimePickerFocusOptions): void; blur(): void; }>();

  /** Passes the array to a separate model while retaining the shared clock settings. */
  function multipleFieldProps(
    props: TimePickerMultipleProps<DateType>
  ): TimePickerRuntimeProps<DateType> {
    const {
      multiple, value, defaultValue, onChange, onCalendarChange, onOk,
      classNames, styles, order, maxTagCount, tagRender, removeIcon, ...field
    } = props;

    return field;
  }

  export function focus(options?: TimePickerFocusOptions) {
    picker?.focus(options);
  }

  export function blur() {
    picker?.blur();
  }
</script>

<SinglePicker {...shared} {dateOperations} {standaloneTime} {time} timeMultipleProps={multiple}
  bind:nativeElement bind:this={picker} />
