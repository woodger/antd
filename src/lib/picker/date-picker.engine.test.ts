import dayjs from 'dayjs';
import 'dayjs/locale/en-gb.js';
import 'dayjs/locale/zh-cn.js';
import utc from 'dayjs/plugin/utc.js';
import { describe, expect, it } from 'vitest';
import { dayjsGenerateConfig as adapter } from './date-picker-dayjs.engine';
import {
  calendarCells,
  pickerCalendarValue,
  samePickerPanelValue,
  offsetPickerPanel,
  samePickerPanel,
  samePickerQuarter,
  samePickerWeek,
  pickerPanelDateDisabled,
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
  it('uses scalar object formats for display and parsing without changing the authored date', () => {
    const value = dayjs('2020-12-31T16:37:59.456');
    const formats = pickerFormats({ format: { format: 'YYYY-MM-DD HH:mm:ss.SSS', type: 'mask' } });

    expect(formats).toEqual(['YYYY-MM-DD HH:mm:ss.SSS']);
    expect(formatPicker(value, 'en_US', formats)).toBe('2020-12-31 16:37:59.456');
    expect(parsePicker('2024-02-29 11:12:13.345', 'en_US', formats)?.toISOString())
      .toBe(dayjs('2024-02-29T11:12:13.345').toISOString());
    expect(pickerFormats({ format: { format: 'YYYY/MM/DD' } })).toEqual(['YYYY/MM/DD']);
    expect(value.format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2020-12-31 16:37:59.456');
  });
  it('formats locale weeks and preserves the Source Jan1 weekday when parsing ordinals', () => {
    const value = dayjs('2020-12-31T16:37:59.456');
    const formats = pickerFormats({ picker: 'week', showTime: true });

    expect(formats).toEqual(['gggg-wo']);
    expect(pickerFormats({ picker: 'week' }, { fieldWeekFormat: '' })).toEqual(['gggg-wo']);
    expect(pickerFormats({ picker: 'week' }, { fieldWeekFormat: '[Week ]wo gggg' }))
      .toEqual(['[Week ]wo gggg']);
    expect(formatPicker(value, 'en_US', formats)).toBe('2021-1st');
    expect(formatPicker(value, 'en_GB', formats)).toBe('2020-53rd');
    expect(parsePicker('2021-2nd', 'en_US', formats)?.format('YYYY-MM-DD HH:mm:ss.SSS'))
      .toBe('2021-01-08 00:00:00.000');
    const gb = parsePicker('2020-53rd', 'en_GB', formats)!;

    expect(gb.format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2020-12-30 00:00:00.000');
    expect(gb.day()).toBe(dayjs('2020-01-01').day());
    expect(gb.locale()).toBe('en-gb');
    expect(parsePicker('2021-1st', 'en_GB', formats)?.format('YYYY-MM-DD'))
      .toBe('2021-01-08');
    expect(parsePicker('2021-99th', 'en_GB', formats)).toBeNull();
    expect(value.format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2020-12-31 16:37:59.456');
    expect(value.locale()).toBe('en');
    expect(dayjs.locale()).toBe('en');
  });
  it('parses the requested Russian week year and rejects a week absent from that year', () => {
    const formats = pickerFormats({ picker: 'week' });

    const lastWeek = parsePicker('2023-52', 'ru_RU', formats);
    const week53 = parsePicker('2020-53', 'ru_RU', formats);

    expect(lastWeek?.format('gggg-wo')).toBe('2023-52');
    expect(lastWeek?.format('YYYY-MM-DD')).toMatch(/^2023-12-(2[5-9]|3[01])$/);
    expect(week53?.format('gggg-wo')).toBe('2020-53');
    expect(parsePicker('2021-53', 'ru_RU', formats)).toBeNull();
  });
  it('retains calendar-year input when the format uses YYYY with an ordinal week', () => {
    const value = parsePicker('2021-53', 'ru_RU', ['YYYY-wo']);

    expect(value?.format('YYYY-MM-DD')).toBe('2021-01-01');
  });
  it('aligns six week rows with the requested locale without changing candidate own locale', () => {
    const panel = dayjs('2020-12-31T16:37:59.456');
    const us = calendarCells(pickerCalendarValue(panel), 'week', 'en_US');
    const gb = calendarCells(pickerCalendarValue(panel), 'week', 'en_GB');

    expect(us).toHaveLength(42);
    expect(gb).toHaveLength(42);
    expect(us[0].format('YYYY-MM-DD')).toBe('2020-11-29');
    expect(gb[0].format('YYYY-MM-DD')).toBe('2020-11-30');
    expect(gb[41].format('YYYY-MM-DD')).toBe('2021-01-10');
    expect(gb.every(value => value.locale() === 'en')).toBe(true);
    expect(gb.every(value => value.hour() === 0 && value.millisecond() === 0)).toBe(true);
    expect(panel.format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2020-12-31 16:37:59.456');
  });
  it('compares picker values by requested locale week and offsets range panels by months', () => {
    const sunday = dayjs('2021-01-03T16:37:59.456');
    const monday = dayjs('2020-12-28T08:23:45.678');

    expect(samePickerWeek(sunday, monday, 'en_GB')).toBe(true);
    expect(samePickerWeek(sunday, monday, 'en_US')).toBe(false);
    expect(samePickerPanelValue(sunday, monday, true, 'week', 'en_GB')).toBe(true);
    expect(samePickerPanelValue(sunday, monday, false, 'week', 'en_US')).toBe(false);
    expect(samePickerPanel(sunday, monday, 'week')).toBe(false);
    expect(offsetPickerPanel(dayjs('2020-12-31T16:37:59.456'), 'week', 1)
      .format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2021-01-31 16:37:59.456');
    expect(offsetPickerPanel(dayjs('2021-01-08'), 'week', -1).format('YYYY-MM-DD'))
      .toBe('2020-12-08');
    expect(sunday.locale()).toBe('en');
  });
  it('checks each actual week candidate once and permits partial boundary weeks', () => {
    const minDate = dayjs('2020-12-30T18:30:20.500');
    const maxDate = dayjs('2021-01-05T09:12:34.567');
    const calls: Array<{ date: typeof minDate; type: string }> = [];
    const disabledDate = (date: typeof minDate, info: { type: string }) => {
      calls.push({ date, type: info.type });
      return date.year() === 2021 && date.month() === 0 && date.date() === 1;
    };
    const prefix = dayjs('2020-12-28T00:00:00.000');

    expect(pickerPanelDateDisabled(prefix, { minDate, maxDate, disabledDate }, 'week', 'en_GB'))
      .toBe(false);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({ date: prefix, type: 'week' });
    expect(calls[0].date).toBe(prefix);
    expect(pickerPanelDateDisabled(
      dayjs('2021-01-01'),
      { minDate, maxDate, disabledDate },
      'week',
      'en_GB'
    ))
      .toBe(true);
    expect(pickerDateDisabled(dayjs('2021-01-10'), { minDate, maxDate }, 'week', 'en_GB')).toBe(false);
    expect(pickerDateDisabled(dayjs('2021-01-10'), { minDate, maxDate }, 'week', 'en_US')).toBe(true);
    expect(pickerDateDisabled(dayjs('2021-01-11'), { minDate, maxDate }, 'week', 'en_GB')).toBe(true);
  });
  it.each([
    ['ru_RU', '2024-01-03', '2024-12-30'],
    ['zh_CN', '2024-01-03', '2024-12-30'],
    ['en_US', '2023-01-03', '2023-12-31']
  ])('rejects a different week with the same number outside either bound in %s', (
    locale,
    earlierDate,
    laterDate
  ) => {
    const earlierWeek = dayjs(earlierDate);
    const laterWeek = dayjs(laterDate);

    const beforeMin = pickerDateDisabled(earlierWeek, { minDate: laterWeek }, 'week', locale);
    const afterMax = pickerDateDisabled(laterWeek, { maxDate: earlierWeek }, 'week', locale);

    expect(beforeMin).toBe(true);
    expect(afterMax).toBe(true);
  });
  it('formats and parses terminal quarters with existing Dayjs support and locale overrides', () => {
    const value = dayjs.utc('2024-05-20T16:37:59.456Z');

    expect(pickerFormats({ picker: 'quarter', showTime: true })).toEqual(['YYYY-[Q]Q']);
    expect(pickerFormats({ picker: 'quarter' }, { fieldQuarterFormat: 'YYYY/[Q]Q' }))
      .toEqual(['YYYY/[Q]Q']);
    expect(pickerFormats({ picker: 'quarter', format: '[Quarter ]Q YYYY' }))
      .toEqual(['[Quarter ]Q YYYY']);
    expect(formatPicker(value, 'en_US', pickerFormats({ picker: 'quarter' }))).toBe('2024-Q2');
    expect(parsePicker('2025-Q2', 'en_US', ['YYYY-[Q]Q'])?.format('YYYY-MM-DD HH:mm:ss.SSS'))
      .toBe('2025-04-01 00:00:00.000');
    expect(parsePicker('2025-Q5', 'en_US', ['YYYY-[Q]Q'])).toBeNull();
    expect(value.toISOString()).toBe('2024-05-20T16:37:59.456Z');
  });
  it('builds four quarters from January and keeps each source clamp and full timestamp', () => {
    const panel = dayjs.utc('2024-01-31T16:37:59.456Z');
    const cells = calendarCells(pickerCalendarValue(panel), 'quarter', 'en_US');

    expect(cells.map(value => value.toISOString())).toEqual([
      '2024-01-31T00:00:00.000Z', '2024-04-30T00:00:00.000Z',
      '2024-07-31T00:00:00.000Z', '2024-10-31T00:00:00.000Z'
    ]);
    expect(cells.every(value => value.isUTC())).toBe(true);
    const later = dayjs.utc('2024-05-20T16:37:59.456Z');
    const earlier = dayjs.utc('2024-04-10T08:23:45.678Z');

    expect(samePickerQuarter(later, earlier)).toBe(true);
    expect(samePickerPanelValue(later, earlier, true, 'quarter')).toBe(true);
    expect(samePickerPanelValue(later, earlier.year(2025), false, 'quarter')).toBe(false);
    expect(samePickerPanel(later, later.month(11), 'quarter')).toBe(true);
    expect(offsetPickerPanel(cells[3].year(2025), 'quarter', -1).toISOString())
      .toBe('2024-10-31T00:00:00.000Z');
    expect(offsetPickerPanel(panel, 'quarter', 1).toISOString())
      .toBe('2025-01-31T16:37:59.456Z');
    expect(panel.toISOString()).toBe('2024-01-31T16:37:59.456Z');
  });
  it('checks the actual quarter candidate once and permits partial boundary quarters', () => {
    const cells = calendarCells(dayjs.utc('2024-01-31T00:00:00.000Z'), 'quarter', 'en_US');
    const calls: { value: typeof cells[number]; type: string; }[] = [];
    const first = (value: typeof cells[number], info: { type: string; }) => {
      calls.push({ value, type: info.type });
      return value.month() === 6;
    };

    expect(pickerPanelDateDisabled(cells[2], { disabledDate: first }, 'quarter')).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].value).toBe(cells[2]);
    expect(calls[0].type).toBe('quarter');
    calls.length = 0;

    expect(pickerPanelDateDisabled(cells[2], { disabledDate: (value, info) => {
      calls.push({ value, type: info.type });
      return value.month() === 8;
    } }, 'quarter')).toBe(false);
    expect(calls).toHaveLength(1);
    expect(calls[0].value).toBe(cells[2]);
    const limits = {
      minDate: dayjs.utc('2024-02-15T18:30:20.500Z'),
      maxDate: dayjs.utc('2025-10-05T09:12:34.567Z')
    };

    expect(pickerDateDisabled(cells[0], limits, 'quarter')).toBe(false);
    expect(pickerDateDisabled(cells[3].year(2025), limits, 'quarter')).toBe(false);
    expect(pickerDateDisabled(cells[3].year(2023), limits, 'quarter')).toBe(true);
    expect(pickerDateDisabled(cells[0].year(2026), limits, 'quarter')).toBe(true);
  });
  it('uses terminal period defaults and preserves explicit formats', () => {
    expect(pickerFormats({ picker: 'month', showTime: true })).toEqual(['YYYY-MM']);
    expect(pickerFormats({ picker: 'year', showTime: true })).toEqual(['YYYY']);
    expect(pickerFormats({ picker: 'month' }, { fieldMonthFormat: 'YYYY/MM' }))
      .toEqual(['YYYY/MM']);
    expect(pickerFormats({ picker: 'year' }, { fieldYearFormat: '[Y ]YYYY' }))
      .toEqual(['[Y ]YYYY']);
    expect(pickerFormats({ picker: 'month', format: 'MM/YYYY' })).toEqual(['MM/YYYY']);
  });
  it('compares picker values by terminal grain while retaining complete timestamps', () => {
    const value = dayjs.utc('2024-05-20T16:37:59.456Z');
    const earlier = value.date(10).hour(8);

    expect(samePickerPanelValue(value, earlier, false, 'month')).toBe(true);
    expect(samePickerPanelValue(value, earlier.month(1), false, 'year')).toBe(true);
    expect(samePickerPanelValue(value, earlier, false)).toBe(false);
    expect(samePickerPanelValue(value, value.add(1, 'year'), false, 'year')).toBe(false);
    expect(value.toISOString()).toBe('2024-05-20T16:37:59.456Z');
  });
  it('offsets terminal panels by a month, year or decade without clearing hidden fields', () => {
    const value = dayjs.utc('2024-02-29T16:37:59.456Z');

    expect(offsetPickerPanel(value, 'date', 1).toISOString()).toBe('2024-03-29T16:37:59.456Z');
    expect(offsetPickerPanel(value, 'month', 1).toISOString()).toBe('2025-02-28T16:37:59.456Z');
    expect(offsetPickerPanel(value, 'year', 1).toISOString()).toBe('2034-02-28T16:37:59.456Z');
    expect(samePickerPanel(value, value.month(11), 'month')).toBe(true);
    expect(samePickerPanel(value, value.year(2029), 'year')).toBe(true);
    expect(samePickerPanel(value, value.year(2030), 'year')).toBe(false);
    expect(value.toISOString()).toBe('2024-02-29T16:37:59.456Z');
  });
  it('disables a whole period only when both boundary probes reject it', () => {
    const value = dayjs('2024-02-29T00:00:00.000');
    const calls: string[] = [];
    const reject = (date: typeof value) => {
      calls.push(date.format('YYYY-MM-DD'));
      return true;
    };

    expect(pickerPanelDateDisabled(value, { disabledDate: reject }, 'month')).toBe(true);
    expect(calls).toEqual(['2024-02-01', '2024-02-29']);
    calls.length = 0;

    expect(pickerPanelDateDisabled(value, { disabledDate: date => {
      calls.push(date.format('YYYY-MM-DD'));
      return false;
    } }, 'year')).toBe(false);
    expect(calls).toEqual(['2024-01-01']);
    expect(pickerDateDisabled(value.date(1), { minDate: value.date(15) }, 'month')).toBe(false);
    expect(pickerPanelDateDisabled(value, { minDate: value.year(2022) }, 'decade')).toBe(false);
  });

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
  it('validates the original time with a start context on the natural field receiver', () => {
    const value = dayjs('2020-12-31T16:37:59.456').locale('en');
    const observed: Array<{ receiver: unknown; args: unknown[]; }> = [];
    const props = {
      showTime: true,
      disabledTime(this: unknown, _date: typeof value) {
        observed.push({ receiver: this, args: Array.from(arguments) });
        return {
          disabledMilliseconds: (hour: number, minute: number, second: number) =>
            hour === 16 && minute === 37 && second === 59 ? [456] : []
        };
      }
    };

    expect(pickerTimeDisabled(value, props)).toBe(true);
    expect(observed).toHaveLength(1);
    expect(observed[0].receiver).toBe(props);
    expect(observed[0].args).toHaveLength(3);
    expect(observed[0].args[0]).toBe(value);
    expect(observed[0].args[1]).toBe('start');
    const info = observed[0].args[2];
    if (info === null || typeof info !== 'object') {
      throw Error('Time validation info missing');
    }
    expect(Object.keys(info)).toEqual(['from']);
    expect(Object.hasOwn(info, 'from')).toBe(true);
    expect(info).toEqual({ from: undefined });
    expect(value.format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2020-12-31 16:37:59.456');
  });
  it('keeps panel time alignment on its one-argument disabledTime path', () => {
    const value = dayjs('2020-12-31T16:37:59.456').locale('en');
    const observed: Array<{ receiver: unknown; args: unknown[]; }> = [];
    const disabledTime = function (this: unknown, _date: typeof value) {
      observed.push({ receiver: this, args: Array.from(arguments) });
      return {};
    };

    const next = validPickerTime(value, { millisecondStep: 1 }, disabledTime);

    expect(observed).toHaveLength(1);
    expect(observed[0].receiver).toBeUndefined();
    expect(observed[0].args).toHaveLength(1);
    expect(observed[0].args[0]).toBe(value);
    expect(next.valueOf()).toBe(value.valueOf());
    expect(value.format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2020-12-31 16:37:59.456');
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
