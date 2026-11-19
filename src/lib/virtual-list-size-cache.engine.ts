// Кэширует накопленные высоты для текущего render. Уже пройденный префикс сохраняет прежние
// измерения.
// Расчёты @rc-component/virtual-list1.5.1/useGetSize; MIT, vendor/LICENSE.rc-virtual-list.
// Возвращает запрос диапазона, лениво дополняющий индекс до найденных границ.
export function createVirtualListSizeCache<Row, Key>(
  rows: readonly Row[],
  getKey: (row: Row) => Key,
  getHeights: () => ReadonlyMap<Key, number>,
  estimate: number
) {
  const key2Index = new Map<Key, number>();
  const bottoms: number[] = [];

  // Измерения дополняют только ещё не запрошенный префикс текущего render.
  return (startKey: Key, endKey = startKey) => {
    let startIndex = key2Index.get(startKey);
    let endIndex = key2Index.get(endKey);

    if (startIndex === undefined || endIndex === undefined) {
      for (let index = bottoms.length; index < rows.length; index++) {
        const key = getKey(rows[index]);
        key2Index.set(key, index);
        const previousBottom = bottoms[index - 1] || 0;
        const heights = getHeights();
        const measured = heights.get(key);
        bottoms[index] = previousBottom + (measured ?? estimate);
        if (key === startKey) startIndex = index;
        if (key === endKey) endIndex = index;
        if (startIndex !== undefined && endIndex !== undefined) break;
      }
    }

    return {
      top: startIndex === undefined ? 0 : bottoms[startIndex - 1] || 0,
      bottom: endIndex === undefined ? undefined : bottoms[endIndex]
    };
  };
}
