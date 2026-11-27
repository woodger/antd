/** Ant Design 6.6.8 / @rc-component/overflow 1.0.1; MIT, vendor/LICENSE.rc-overflow. */
export interface TreeSelectComponentOverflowLayout {
  renderCount: number;
  visibleCount: number;
  omittedStart: number;
  restReady: boolean;
  offset: number | null;
}

/** Source Overflow retains the size of the previous rest and measures the Switched suffix again. */
export function treeSelectComponentOverflow({
  containerWidth, dataCount, widths, prefixWidth = 0, suffixWidth, restWidth, previousRestWidth,
  previous
}: {
  containerWidth: number;
  dataCount: number;
  widths: readonly (number | undefined)[];
  prefixWidth?: number;
  suffixWidth: number;
  restWidth: number;
  previousRestWidth: number;
  previous?: TreeSelectComponentOverflowLayout;
}): TreeSelectComponentOverflowLayout {
  const renderCount = Math.min(dataCount, Math.trunc(containerWidth / 10));
  const current = previous ?? {
    renderCount: 0,
    visibleCount: 0,
    omittedStart: 1,
    restReady: false,
    offset: null
  };
  let result = {
    ...current,
    renderCount,
    visibleCount: Math.min(current.omittedStart, renderCount)
  };
  function update(omittedStart: number, offset: number | null | undefined, notReady = false) {
    // Source updateDisplayCount does not update restReady at the previous count/offset.
    const unchanged = previous && previous.omittedStart === omittedStart
      && (offset === undefined || previous.offset === offset);
    result = { ...result, visibleCount: Math.min(omittedStart, renderCount), omittedStart,
      restReady: unchanged || notReady ? result.restReady : omittedStart < dataCount,
      offset: offset === undefined ? result.offset : offset };
  }
  if (!containerWidth) {
    return result;
  }
  if (!renderCount) {
    update(1, null);
    return result;
  }

  const reservedRest = Math.max(previousRestWidth, restWidth);
  let total = prefixWidth + suffixWidth;
  for (let index = 0; index < renderCount; index++) {
    const current = widths[index];
    if (current === undefined) {
      update(index, undefined, true);
      break;
    }
    total += current;
    if (renderCount === 1 && total <= containerWidth
      || index === renderCount - 2 && total + widths[renderCount - 1]! <= containerWidth) {
      update(renderCount, null);
      break;
    }
    if (total + reservedRest > containerWidth) {
      update(index, total - current - suffixWidth + restWidth);
      break;
    }
  }
  if (widths[0]! + suffixWidth > containerWidth) result.offset = null;
  return result;
}
