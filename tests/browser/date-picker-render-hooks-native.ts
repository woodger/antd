import type { DatePickerCellRenderInfo } from '@woodger/antd';

export type RenderHooksOwner = 'single-date' | 'single-datetime' | 'range-date' | 'range-datetime';
export interface RenderHooksCellObservation {
  sequence: number;
  current: string | number;
  currentKind: 'dayjs' | 'number' | 'string';
  currentTemporal?: { epoch: number; iso: string; utcOffset: number; fields: number[] };
  keys: string[];
  type: DatePickerCellRenderInfo['type'];
  range?: 'start' | 'end';
  subType?: DatePickerCellRenderInfo['subType'];
  prefixCls: string;
  today: string;
  todayIdentity: number;
  localeIdentity: number;
  locale: DatePickerCellRenderInfo['locale'];
  originKind: string;
}
export interface RenderHooksObservation {
  owner: RenderHooksOwner;
  open: boolean;
  enabled: boolean;
  cells: RenderHooksCellObservation[];
  footers: string[];
  panels: number;
  events: Array<{ name: string; text?: unknown }>;
}
export interface RenderHooksCapture { read?: () => RenderHooksObservation; }
