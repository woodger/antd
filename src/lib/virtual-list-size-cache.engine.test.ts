import { describe, expect, it } from 'vitest';
import { createVirtualListSizeCache } from './virtual-list-size-cache.engine';

describe('virtual list render size cache', () => {
  const rows = [{ key: 'a' }, { key: 'b' }, { key: 'c' }];
  const key = (row: { key: string; }) => row.key;

  it('retains a queried prefix while reading new measurements for an unqueried key', () => {
    let heights = new Map<string, number>();
    const getSize = createVirtualListSizeCache(rows, key, () => heights, 16);

    expect(getSize('a')).toEqual({ top: 0, bottom: 16 });
    heights = new Map([['a', 32], ['b', 32]]);

    expect(getSize('a')).toEqual({ top: 0, bottom: 16 });
    expect(getSize('b')).toEqual({ top: 16, bottom: 48 });
    expect(getSize('c')).toEqual({ top: 48, bottom: 64 });
  });

  it('starts a new measured frame without changing a retained previous getter', () => {
    let heights = new Map<string, number>();
    const previous = createVirtualListSizeCache(rows, key, () => heights, 16);
    expect(previous('a', 'b')).toEqual({ top: 0, bottom: 32 });

    heights = new Map([['a', 32], ['b', 32]]);
    const current = createVirtualListSizeCache(rows, key, () => heights, 16);

    expect(previous('a', 'b')).toEqual({ top: 0, bottom: 32 });
    expect(current('a', 'b')).toEqual({ top: 0, bottom: 64 });
    expect(previous('c')).toEqual({ top: 32, bottom: 48 });
  });

  it('captures the rows and estimate of each new frame, including an empty reset', () => {
    const heights = new Map<string, number>();
    const previous = createVirtualListSizeCache(rows, key, () => heights, 16);
    const current = createVirtualListSizeCache([...rows].reverse(), key, () => heights, 24);
    const empty = createVirtualListSizeCache([], key, () => heights, 24);

    expect(previous('b')).toEqual({ top: 16, bottom: 32 });
    expect(current('b')).toEqual({ top: 24, bottom: 48 });
    expect(empty('b')).toEqual({ top: 0, bottom: undefined });
    expect(previous('c')).toEqual({ top: 32, bottom: 48 });
  });

  it('keeps unknown keys and either range endpoint unassigned without clamping', () => {
    const heights = new Map([['a', 20], ['b', 40], ['c', 60]]);
    const getSize = createVirtualListSizeCache(rows, key, () => heights, 16);

    expect(getSize('missing')).toEqual({ top: 0, bottom: undefined });
    expect(getSize('a', 'c')).toEqual({ top: 0, bottom: 120 });
    expect(getSize('b', 'missing')).toEqual({ top: 20, bottom: undefined });
    expect(getSize('missing', 'b')).toEqual({ top: 0, bottom: 60 });
    expect(getSize('c', 'a')).toEqual({ top: 60, bottom: 20 });
  });

  it('distinguishes numeric, string and bigint keys with their existing typed heights', () => {
    const keys = [0, '0', 0n] as const;
    const heights = new Map<string | number | bigint, number>([[0, 11], ['0', 17], [0n, 23]]);
    const getSize = createVirtualListSizeCache(keys, value => value, () => heights, 16);

    expect(getSize(0)).toEqual({ top: 0, bottom: 11 });
    expect(getSize('0')).toEqual({ top: 11, bottom: 28 });
    expect(getSize(0n)).toEqual({ top: 28, bottom: 51 });
    expect(getSize(0, '0')).toEqual({ top: 0, bottom: 28 });
  });

  it('uses a measured zero height without replacing it with the estimate', () => {
    const heights = new Map([['a', 0], ['b', 20]]);
    const getSize = createVirtualListSizeCache(rows, key, () => heights, 16);

    expect(getSize('a')).toEqual({ top: 0, bottom: 0 });
    expect(getSize('b', 'c')).toEqual({ top: 0, bottom: 36 });
  });
});
