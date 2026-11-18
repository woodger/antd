export type DatePickerPresetTransitionAction =
  | { type: 'open' | 'leave' | 'input-focus' | 'input-escape' }
  | { type: 'preset-click'; value: 'candidate' }
  | { type: 'owner-open'; value: boolean }
  | { type: 'format' | 'cell-hover' | 'min-date'; value: string }
  | { type: 'preview'; value: 'hover' | false }
  | { type: 'time-hover'; unit: 'hour' | 'minute' | 'second' | 'millisecond' | 'meridiem';
      value: number | 'am' | 'pm' };
export interface DatePickerPresetTransitionSample {
  id: string; initialValue: string; format: string; preview: 'omitted' | 'hover' | false;
  rejectChange: boolean; pickerOwner: 'omitted' | 'reject' | 'accept'; prefixCls: string | null;
  preset?: { label: string; value: string }; defaultPickerValue?: string;
  initialPickerValue?: string; minDate?: string; maxDate?: string; updatedMinDate?: string;
  alternateFormat?: string; disabledDay?: string; disabledHours?: number[]; needConfirm?: boolean;
  showTime?: boolean | { format: string; hourStep: number; minuteStep: number; secondStep: number;
    millisecondStep: number; showMillisecond: boolean; use12Hours?: boolean };
  actions: DatePickerPresetTransitionAction[];
}
export const datePickerPresetTransitionSamples: DatePickerPresetTransitionSample[];
export const datePickerPresetGeometry: {
  viewport: { width: number; height: number }; root: { left: number; top: number; width: number };
};
export const datePickerPresetTransitionCounts: {
  owners: number; actions: number; logicalPoints: number;
};
