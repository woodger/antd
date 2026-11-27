// Calculates the window and the position of the virtual list strings. Unmeasured heights are
// obtained by estimates, and scrollTo takes into account unfinished measurements. Calculations
// @rc-component/virtual-list1.5.1; MIT, vendor/LICENSE.rc-virtual-list.
export type VirtualScrollAlign = 'top' | 'bottom' | 'auto';

// Selects the visible interval for the total height prefix and adds one line after the end.
export function virtualListWindow<Row, Key>(
  rows: readonly Row[],
  getKey: (row: Row) => Key,
  heights: ReadonlyMap<Key, number>,
  estimate: number,
  height: number | undefined,
  scrollTop: number,
  innerHeight: number,
  enabled = true,
  scrollWidth?: number,
  scrollTail = 0
) {
  const useVirtual = Boolean(enabled && height && estimate);
  const cachedHeight = [...heights.values()].reduce((sum, value) => sum + value, 0);
  const virtual = useVirtual && (Math.max(estimate * rows.length, cachedHeight) > (height ?? 0)
    || Boolean(scrollWidth));
  if (!useVirtual || !virtual) {
    return { useVirtual, virtual, start: 0, end: rows.length - 1, offset: undefined,
      scrollHeight: useVirtual ? innerHeight : undefined };
  }

  let total = 0;
  let start: number | undefined;
  let end: number | undefined;
  let offset: number | undefined;
  rows.forEach((row, index) => {
    const rowKey = getKey(row);
    const measured = heights.get(rowKey);
    const next = total + (measured ?? estimate);
    if (next >= scrollTop && start === undefined) {
      start = index;
      offset = total;
    }
    if (next > scrollTop + (height ?? 0) && end === undefined) end = index;
    total = next;
  });
  if (start === undefined && scrollTail > 0 && rows.length > 0) {
    // The final section can occupy viewport after the last line.
    start = rows.length - 1;
    const lastHeight = heights.get(getKey(rows[start])) ?? estimate;
    offset = total - lastHeight;
  }
  else if (start === undefined) {
    start = 0;
    offset = 0;
    end = Math.ceil((height ?? 0) / estimate);
  }
  if (end === undefined) end = rows.length - 1;

  return { useVirtual, virtual, start, end: Math.min(end + 1, rows.length - 1),
    offset, scrollHeight: total };
}

// Collects the upper and lower borders on the keys in the order of lines.
export function virtualListSizes<Row, Key>(
  rows: readonly Row[],
  getKey: (row: Row) => Key,
  heights: ReadonlyMap<Key, number>,
  estimate: number
) {
  const sizes = new Map<Key, { top: number; bottom: number; }>();
  let top = 0;
  for (const row of rows) {
    const measurementKey = getKey(row);
    const measured = heights.get(measurementKey);
    const bottom = top + (measured ?? estimate);

    // getKey is called when reading the height and publishing the boundaries in the original order.
    const sizeKey = getKey(row);
    sizes.set(sizeKey, { top, bottom });
    top = bottom;
  }
  return sizes;
}

// Calculates a single passage scrollTo. unknown requests a re-measurement in the calling model.
export function virtualListScrollStep<Row, Key>(
  rows: readonly Row[],
  getKey: (row: Row) => Key,
  heights: ReadonlyMap<Key, number>,
  estimate: number,
  index: number,
  align: VirtualScrollAlign | undefined,
  offset: number,
  scrollTop: number,
  height: number
) {
  if (index < 0) {
    return { unknown: true, align };
  }
  const target = Math.min(rows.length - 1, index);
  let itemTop = 0;
  let itemBottom = 0;
  for (let cursor = 0; cursor <= target; cursor++) {
    itemTop = itemBottom;
    const rowKey = getKey(rows[cursor]);
    const measured = heights.get(rowKey);
    itemBottom += measured ?? estimate;
  }

  let remaining = align === 'top' ? offset : height - offset;
  let unknown = false;
  for (let cursor = target; cursor >= 0; cursor--) {
    const rowKey = getKey(rows[cursor]);
    const measured = heights.get(rowKey);
    if (measured === undefined) {
      unknown = true;
      break;
    }
    remaining -= measured;
    if (remaining <= 0) break;
  }
  if (align === 'top') {
    return { top: itemTop - offset, unknown, align };
  }
  if (align === 'bottom') {
    return { top: itemBottom - height + offset, unknown, align };
  }
  if (itemTop < scrollTop) {
    return { unknown, align: 'top' as const };
  }
  if (itemBottom > scrollTop + height) {
    return { unknown, align: 'bottom' as const };
  }
  return { unknown, align };
}
