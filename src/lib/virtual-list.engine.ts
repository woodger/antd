// Вычисляет окно и положение строк виртуального списка. Неизмеренные высоты получают estimate, а
// scrollTo учитывает незавершённые измерения.
// Расчёты @rc-component/virtual-list1.5.1; MIT, vendor/LICENSE.rc-virtual-list.
export type VirtualScrollAlign = 'top' | 'bottom' | 'auto';

// Выбирает видимый интервал по суммарному префиксу высот и добавляет одну строку после конца.
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
    // Итоговая секция может целиком занять viewport после последней строки.
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

// Собирает верхнюю и нижнюю границы по ключам в порядке строк.
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

    // getKey вызывается при чтении высоты и публикации границ в исходном порядке.
    const sizeKey = getKey(row);
    sizes.set(sizeKey, { top, bottom });
    top = bottom;
  }
  return sizes;
}

// Рассчитывает один проход scrollTo. unknown запрашивает повторное измерение в вызывающей модели.
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
