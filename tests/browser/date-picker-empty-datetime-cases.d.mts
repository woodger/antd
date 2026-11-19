import type { DatePickerTimeConfig } from 'antd-svelte';
import type { EmptyDatetimeOwner } from './date-picker-empty-datetime-native-types';
export interface EmptyDatetimeAuthoring {
  defaultPickerValue: string; defaultOpenValue: string; format: string; clock: Omit<DatePickerTimeConfig, 'defaultOpenValue'>;
}
export type EmptyDatetimeAction = { type: 'input-open' | 'input-escape' | 'template-button' }
  | { type: 'date-hover' | 'date-click'; value: string }
  | { type: 'hour-hover' | 'hour-click'; value: number };
export const authoring: EmptyDatetimeAuthoring;
export const actions: readonly EmptyDatetimeAction[];
export const samples: ReadonlyArray<EmptyDatetimeAuthoring & {
  id: EmptyDatetimeOwner;
  actions: readonly EmptyDatetimeAction[]
}>;
export const counts: {
  owners: number;
  actions: number;
  initialAndSettledPoints: number;
  inputEscapeCloses: number;
  wholeUnmounts: number
};
