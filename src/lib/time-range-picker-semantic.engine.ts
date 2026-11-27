// Unites local and contextual semantic styles TimeRangePicker. Callbacks get the final size and
// disabled for both fields.
import type { RangePickerConfig } from './range-picker.types';
import type { TimePickerConfig, TimePickerProps, TimePickerSemantic } from './time-picker.types';
import type { TimeRangePickerProps, TimeRangePickerSemantic } from './time-range-picker.types';
import { mergePickerSlots } from './time-picker-semantic.engine';

// Leading classes and styles separately, placing the contextual root style of the range in front of the local layer.
export function timeRangeSemantic<DateType extends object>(
  props: TimeRangePickerProps<'time', DateType>,
  context: TimePickerConfig | undefined,
  range: RangePickerConfig | undefined,
  resolved: Pick<TimeRangePickerProps, 'size' | 'disabled'>
) {
  const filled = { ...props, ...resolved };
  // Performs a local callback with a resolution of props range or returns the object of the slots.
  const resolve = (value: TimeRangePickerSemantic<DateType> | undefined) =>
    typeof value === 'function' ? value({ props: filled }) : value;
  // Uses the same allowed props for the total timePicker config, saving the original callback
  // contract.
  const resolveContext = (value: TimePickerSemantic | undefined) => {
    // In upstream, the overall timePicker config is typed single props, but receives range props.
    return typeof value === 'function'
      ? value({ props: filled as unknown as TimePickerProps }) : value;
  };
  return {
    classes: mergePickerSlots([
      resolveContext(context?.classNames), resolve(props.classNames)
    ], ' '),
    styles: mergePickerSlots([
      resolveContext(context?.styles), { root: range?.style }, resolve(props.styles)
    ], ';')
  };
}
