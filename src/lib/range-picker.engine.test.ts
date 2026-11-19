import dayjs from 'dayjs';
import 'dayjs/locale/en-gb.js';
import { describe, expect, it } from 'vitest';
import {
  rangePair,
  rangeFlags,
  sameRange,
  orderedRange,
  validRange,
  rangeFrom
} from './range-picker.engine';
describe('RangePicker source value semantics', () => {
  it('validates locked same-week reverse dates with requested locale and preserves full timestamp order', () => {
    const sunday = dayjs('2021-01-03T16:37:59.456');
    const monday = dayjs('2020-12-28T08:23:45.678');
    const pair: [typeof sunday, typeof monday] = [sunday, monday];
    const locked = orderedRange(pair, true, [true, false]);

    expect(locked[0]).toBe(sunday);
    expect(locked[1]).toBe(monday);
    expect(validRange(locked, [false, false], true, [true, false], () => false, 'week', 'en_GB'))
      .toBe(true);
    expect(validRange(locked, [false, false], true, [true, false], () => false, 'week', 'en_US'))
      .toBe(false);
    const ordered = orderedRange(pair, true, [false, false]);
    expect(ordered[0]).toBe(monday);
    expect(ordered[1]).toBe(sunday);
    expect(orderedRange(pair, false, [false, false])).toEqual([sunday, monday]);
    expect(sameRange(pair, [sunday, sunday])).toBe(false);
    expect(sameRange(pair, [sunday.clone(), monday.clone()])).toBe(true);
    expect(sunday.locale()).toBe('en');
    expect(monday.format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2020-12-28 08:23:45.678');
  });
  it('validates locked reverse hidden dates by quarter without changing timestamp sorting or aliases', () => {
    const start = dayjs('2024-05-20T16:37:59.456');
    const end = dayjs('2024-04-10T00:00:00.000');
    const pair: [typeof start, typeof end] = [start, end];
    const locked = orderedRange(pair, true, [true, false]);

    expect(locked[0]).toBe(start);
    expect(locked[1]).toBe(end);
    expect(validRange(locked, [false, false], true, [true, false], () => false, 'quarter'))
      .toBe(true);
    expect(validRange(locked, [false, false], true, [true, false], () => false, 'month'))
      .toBe(false);
    expect(validRange([start, end.month(2)], [false, false], true,
      [true, false], () => false, 'quarter')).toBe(false);
    const ordered = orderedRange(pair, true, [false, false]);
    expect(ordered[0]).toBe(end);
    expect(ordered[1]).toBe(start);
    expect(orderedRange(pair, false, [false, false])).toEqual([start, end]);
    expect(sameRange(pair, [start.clone(), end.clone()])).toBe(true);
    expect(sameRange(pair, [start, end.hour(1)])).toBe(false);
    expect(start.format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2024-05-20 16:37:59.456');
  });
  it('permits reversed hidden values in the same terminal period with a disabled field', () => {
    const later = dayjs('2024-05-20T16:37:59.456');
    const earlier = dayjs('2024-05-10T08:23:45.678');
    const pair: [typeof later, typeof earlier] = [later, earlier];

    expect(orderedRange(pair, true, [true, false])).toEqual(pair);
    expect(validRange(pair, [false, false], true, [true, false], () => false, 'month')).toBe(true);
    expect(validRange(pair, [false, false], true, [true, false], () => false)).toBe(false);
    expect(validRange([later, earlier.month(1)], [false, false], true,
      [true, false], () => false, 'year')).toBe(true);
    expect(validRange([later, earlier.year(2023)], [false, false], true,
      [true, false], () => false, 'year')).toBe(false);
    expect(validRange([later, earlier.year(2023)], [false, false], false,
      [false, false], () => false, 'year')).toBe(true);
    expect(orderedRange(pair, true, [false, false])).toEqual([earlier, later]);
  });

  const start = dayjs('2026-10-10T12:30');
  const end = dayjs('2026-10-20T08:30');
  it('normalizes missing boundaries to null and retains Dayjs identity', () => {
    expect(rangePair([start, undefined])).toEqual([start, null]);
    expect(rangePair(null)).toEqual([null, null]);
    expect(rangePair([start, end])[0]).toBe(start);
    expect(rangeFlags([true, false])).toEqual([true, false]);
  });
  it(
    'sorts submitted boundaries by timestamp only with order enabled and no disabled field',
    () => {
      expect(orderedRange([end, start], true, [false, false])).toEqual([start, end]);
      expect(orderedRange([end, start], false, [false, false])).toEqual([end, start]);
      expect(orderedRange([end, start], true, [true, false])).toEqual([end, start]);
    }
  );
  it('passes the first visited valued field as from only to the other field', () => {
    expect(rangeFrom([start, end], [1, 0], 0)).toBe(end);
    expect(rangeFrom([start, end], [1, 0], 1)).toBeUndefined();
    expect(rangeFrom([null, end], [0, 1], 0)).toBe(end);
  });
  it(
    'requires boundaries unless allowEmpty is set and validates endpoints rather than the interior',
    () => {
      expect(validRange([start, null], [false, false], true, [false, false], () => false)).toBe(
        false
      );
      expect(
        validRange([null, end], [true, false], true, [false, false], date => date.date() === 13)
      ).toBe(
        true
      );
      expect(
        validRange(
          [start, end],
          [false, false],
          true,
          [false, false],
          date => date.date() === 13
        )
      ).toBe(
        true
      );
    }
  );
  it(
    'retains same-calendar-day ordering validation when sorting is disabled by a locked field',
    () => {
      const earlier = start.hour(1);

      expect(validRange([start, earlier], [false, false], true, [true, false], () => false)).toBe(
        true
      );
      expect(validRange([end, start], [false, false], true, [true, false], () => false)).toBe(
        false
      );
      expect(sameRange([start, end], [start.clone(), end.clone()])).toBe(true);
    }
  );
});
