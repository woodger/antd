// Unites local and contextual semantic styles TimeRangePicker. Callbacks get the final size and
// disabled for both fields.
import type { RangePickerConfig } from './range-picker.types';
import type { TimePickerConfig } from './time-picker.types';
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
  // Both provider and local callbacks see the same range props with resolved size and disabled.
  const resolve = (value: TimeRangePickerSemantic<DateType> | undefined) =>
    typeof value === 'function' ? value({ props: filled }) : value;

  return {
    classes: mergePickerSlots([
      resolve(context?.classNames), resolve(props.classNames)
    ], ' '),
    styles: mergePickerSlots([
      resolve(context?.styles), { root: range?.style }, resolve(props.styles)
    ], ';')
  };
}
