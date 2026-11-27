// The default public family uses the Dayjs calendar.
import type { Dayjs } from 'dayjs';
import { createPickerFamily, generatePicker } from './date-picker';
import { dayjsPickerDates } from './picker-date-operations.engine';
import { parseTimeRangeInput } from './time-range-picker.engine';

const DatePicker: ReturnType<typeof createPickerFamily<Dayjs>> & {
  generatePicker: typeof generatePicker;
} = Object.assign(
  createPickerFamily(dayjsPickerDates, parseTimeRangeInput),
  { generatePicker }
);

export default DatePicker;
