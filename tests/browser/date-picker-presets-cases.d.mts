import type { DatePickerTimeConfig } from '@woodger/antd';
export type DatePickerPresetAction = { type: 'open' | 'leave' | 'escape' | 'outside' | 'clear' }
  | { type: 'preset-hover' | 'preset-click' | 'cell-hover'; value: string }
  | { type: 'preview'; value: 'hover' | false };
export interface DatePickerPresetProfile {
  id: string; label: string; value?: string; sequence?: string[]; customLabel?: boolean;
}
export interface DatePickerPresetSample {
  id: string; initialValue: string | null; defaultPickerValue: string; format: string;
  preview: 'omitted' | 'hover' | false; prefixCls: string | null; rejectChange: boolean;
  showTime: DatePickerTimeConfig | null; needConfirm: boolean | null;
  disabledDay?: string; minDate?: string; maxDate?: string;
  presets: DatePickerPresetProfile[]; actions: DatePickerPresetAction[];
}
export const datePickerPresetSamples: DatePickerPresetSample[];
export const datePickerPresetGeometry: {
  viewport: { width: number; height: number };
  root: { left: number; top: number; width: number }
};
