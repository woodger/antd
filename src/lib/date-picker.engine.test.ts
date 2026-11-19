import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { describe, expect, it } from 'vitest';
import { dayjsGenerateConfig as adapter } from './date-picker-dayjs.engine';
import {
  calendarCells,
  pickerCalendarValue,
  samePickerPanelValue,
  pickerFormats,
  parsePicker,
  formatPicker,
  pickerDateDisabled,
  pickerTimeDisabled,
  timeColumns,
  validPickerTime
} from './date-picker.engine';
dayjs.extend(utc);
describe('DatePicker date adapter and input', () => {
  it('strictly parses configured formats and rejects overflow, including leap days', () => {
    expect(parsePicker('2024-02-29', 'en_US', ['YYYY-MM-DD'])?.date()).toBe(29);
    expect(parsePicker('2025-02-29', 'en_US', ['YYYY-MM-DD'])).toBeNull();
    expect(parsePicker('2024-13-01', 'en_US', ['YYYY-MM-DD'])).toBeNull();
    expect(
      parsePicker('29.02.2024', 'ru_RU', ['YYYY-MM-DD', 'DD.MM.YYYY'])?.format('YYYY-MM-DD')
    )
      .toBe(
        '2024-02-29'
      );
  });
  it('keeps Dayjs UTC mode and hidden milliseconds during calendar and time operations', () => {
    const value = dayjs.utc('2026-10-29T10:20:30.123Z');
    const moved = adapter.addDate(value, 1);

    expect(moved.isUTC()).toBe(true);
    expect(moved.toISOString()).toBe('2026-10-30T10:20:30.123Z');
    expect(adapter.setMinute(moved, 45).millisecond()).toBe(123);
    expect(formatPicker(value, 'en_US', ['YYYY-MM-DD HH:mm:ss'])).toBe('2026-10-29 10:20:30');
    expect(value.millisecond()).toBe(123);
  });
  it('fills only the viewed calendar time while preserving its date and UTC mode', () => {
    const value = dayjs.utc('2024-06-13T18:30:20.500Z');
    const template = dayjs('2000-01-01T09:12:34.567');
    const empty = pickerCalendarValue(value);
    const filled = pickerCalendarValue(value, template);

    expect(empty.toISOString()).toBe('2024-06-13T00:00:00.000Z');
    expect(filled.toISOString()).toBe('2024-06-13T09:12:34.567Z');
    expect(filled.isUTC()).toBe(true);
    expect(value.toISOString()).toBe('2024-06-13T18:30:20.500Z');
    expect(template.format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2000-01-01 09:12:34.567');
    expect(filled).not.toBe(value);
    expect(filled).not.toBe(template);
  });
  it('compares panel dates and datetime wall fields independently of offset', () => {
    const value = dayjs.utc('2024-06-13T18:30:20.500Z');
    const otherTime = value.hour(9);
    const otherOffset = value.utcOffset(60, true);

    expect(samePickerPanelValue(value, otherTime, false)).toBe(true);
    expect(samePickerPanelValue(value, value.add(1, 'day'), false)).toBe(false);
    expect(samePickerPanelValue(value, otherTime, true)).toBe(false);
    expect(samePickerPanelValue(value, value.add(1, 'millisecond'), true)).toBe(false);
    expect(otherOffset.valueOf()).not.toBe(value.valueOf());
    expect(samePickerPanelValue(value, otherOffset, true)).toBe(true);
  });
  it('builds 42-day grids using locale week starts and navigates month/year panels', () => {
    const date = dayjs('2026-11-15');
    const en = calendarCells(date, 'date', 'en_US');
    const ru = calendarCells(date, 'date', 'ru_RU');

    expect(en).toHaveLength(42);
    expect(en[0].day()).toBe(0);
    expect(ru[0].day()).toBe(1);
    expect(calendarCells(date, 'month', 'en_US')[11].month()).toBe(11);
    expect(calendarCells(date, 'year', 'en_US').map(date => date.year())).toEqual(
      Array.from({ length: 12 }, (_, n) => 2019 + n)
    );
  });
  it('keeps the source leap-day clamp when building year and decade cells', () => {
    const value = dayjs('2024-02-29T18:30:45.678');
    const years = calendarCells(value, 'year', 'en_US');
    const decades = calendarCells(value, 'decade', 'en_US');

    expect(years[0].format('YYYY-MM-DD')).toBe('2019-02-28');
    expect(years[1].format('YYYY-MM-DD')).toBe('2020-02-28');
    expect(years[5].format('YYYY-MM-DD')).toBe('2024-02-28');
    expect(decades[1].format('YYYY-MM-DD')).toBe('2000-02-28');
    expect(years[1].format('HH:mm:ss.SSS')).toBe('18:30:45.678');
  });
  it(
    'checks date bounds at calendar-day precision and passes the panel mode to disabledDate',
    () => {
      const options = { minDate: dayjs('2026-10-10T20:00'), maxDate: dayjs('2026-10-20T04:00') };

      expect(pickerDateDisabled(dayjs('2026-10-10'), options)).toBe(false);
      expect(pickerDateDisabled(dayjs('2026-10-09'), options)).toBe(true);
      expect(pickerDateDisabled(dayjs('2026-10-20T23:00'), options)).toBe(false);
      expect(
        pickerDateDisabled(
          dayjs('2026-10-20'),
          { disabledDate: (_date, info) => info.type === 'month' },
          'month'
        )
      ).toBe(
        true
      );
    }
  );
  it('checks dependent time restrictions without truncating millisecond precision', () => {
    const value = dayjs('2026-10-29T10:20:30.123');

    expect(
      pickerTimeDisabled(
        value,
        {
          showTime: true,
          disabledTime: () => ({
            disabledMinutes: hour => hour === 10
              ? [20]
              : []
          })
        }
      )
    ).toBe(
      true
    );
    expect(
      pickerTimeDisabled(
        value,
        { showTime: true, disabledTime: () => ({ disabledMilliseconds: () => [123] }) }
      )
    ).toBe(
      true
    );
    expect(
      pickerTimeDisabled(
        value,
        { showTime: false, disabledTime: () => ({ disabledHours: () => [10] }) }
      )
    ).toBe(
      false
    );
  });
  it('defaults formats and exposes configured time units and steps', () => {
    expect(pickerFormats({ showTime: true })).toEqual(['YYYY-MM-DD HH:mm:ss']);
    expect(pickerFormats({ showTime: { format: 'HH:mm' } })).toEqual(['YYYY-MM-DD HH:mm:ss']);
    expect(pickerFormats({ showTime: { showSecond: false } })).toEqual(['YYYY-MM-DD HH:mm']);
    expect(pickerFormats({ showTime: { use12Hours: true } })).toEqual(['YYYY-MM-DD hh:mm:ss A']);
    expect(pickerFormats({ showTime: true }, { fieldDateTimeFormat: 'DD.MM.YYYY HH:mm' })).toEqual(
      ['DD.MM.YYYY HH:mm']
    );
    expect(
      timeColumns({ showHour: true, showMinute: true, minuteStep: 15 }, 'HH:mm:ss').map(
        item => [item.unit, item.step]
      )
    ).toEqual(
      [['hour', 1], ['minute', 15]]
    );
  });
});


it(
  'aligns hidden milliseconds and dependent units exactly like rc-picker panel selection',
  () => {
    const value = dayjs.utc('2026-10-29T10:25:30.123Z');

    expect(validPickerTime(value).toISOString()).toBe('2026-10-29T10:25:30.100Z');
    expect(validPickerTime(value, { minuteStep: 15 }).toISOString()).toBe(
      '2026-10-29T10:15:30.100Z'
    );
    expect(
      validPickerTime(
        value,
        {},
        () => ({ disabledHours: () => [10], disabledMinutes: hour => hour === 9 ? [25] : [] })
      ).toISOString()
    ).toBe(
      '2026-10-29T09:24:30.100Z'
    );
    expect(validPickerTime(value, { millisecondStep: 1 }).millisecond()).toBe(123);
    expect(value.millisecond()).toBe(123);
  }
);
