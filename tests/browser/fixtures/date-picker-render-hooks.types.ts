import { DatePicker, RangePicker, TimePicker, TimeRangePicker,
  type DatePickerCellRenderInfo, type DatePickerMode,
  type TimePickerCellRenderInfo, type TimePickerColumnType } from '@woodger/antd';
import type { ComponentProps, Snippet } from 'svelte';
import type { Dayjs } from 'dayjs';

type DateProps = ComponentProps<typeof DatePicker>;
type RangeProps = ComponentProps<typeof RangePicker>;
type TimeProps = ComponentProps<typeof TimePicker>;
type TimeRangeProps = ComponentProps<typeof TimeRangePicker>;
type Hooks = 'cellRender' | 'panelRender' | 'renderExtraFooter';
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<Value extends true> = Value;

export type DatePickerRenderHookContracts = [
  Assert<Equal<DateProps['cellRender'],
    Snippet<[Dayjs | number | 'am' | 'pm', DatePickerCellRenderInfo]> | undefined>>,
  Assert<Equal<Pick<RangeProps, Hooks>, Pick<DateProps, Hooks>>>,
  Assert<Equal<DateProps['panelRender'], Snippet<[Snippet]> | undefined>>,
  Assert<Equal<DateProps['renderExtraFooter'], Snippet<[DatePickerMode]> | undefined>>,
  Assert<Equal<TimeProps['cellRender'],
    Snippet<[number | 'am' | 'pm', TimePickerCellRenderInfo]> | undefined>>,
  Assert<Equal<TimeRangeProps['cellRender'], TimeProps['cellRender']>>,
  Assert<Equal<TimeProps['renderExtraFooter'], Snippet | undefined>>,
  Assert<Equal<TimeRangeProps['renderExtraFooter'], Snippet<['time']> | undefined>>,
  Assert<Equal<Pick<DatePickerCellRenderInfo, 'range' | 'subType' | 'locale' | 'originNode'>, {
    range?: 'start' | 'end'; subType?: TimePickerColumnType;
    locale: TimePickerCellRenderInfo['locale']; originNode: Snippet;
  }>>
];

export function footerCompatibility(
  legacy: Snippet
): [DateProps, RangeProps, TimeProps, TimeRangeProps] {
  return [
    { renderExtraFooter: legacy }, { renderExtraFooter: legacy },
    { renderExtraFooter: legacy }, { renderExtraFooter: legacy }
  ];
}

export function rejectedHookContracts(
  date: Snippet<[DatePickerMode]>,
  time: Snippet<['time']>,
  timeCell: NonNullable<TimeProps['cellRender']>
) {
  // @ts-expect-error Date footer receives date-panel modes, not time.
  const wrongDate: DateProps['renderExtraFooter'] = time;
  // @ts-expect-error Single TimePicker keeps its existing noarg footer.
  const wrongSingleTime: TimeProps['renderExtraFooter'] = date;
  // @ts-expect-error TimeRange footer receives time, not date-panel modes.
  const wrongTimeRange: TimeRangeProps['renderExtraFooter'] = date;
  // @ts-expect-error A time-only renderer cannot accept a Dayjs date cell.
  const wrongCell: DateProps['cellRender'] = timeCell;
  return { wrongDate, wrongSingleTime, wrongTimeRange, wrongCell };
}
