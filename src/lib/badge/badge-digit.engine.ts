interface BadgeDigitState {
  units: { key: number; value: string | number; offset: number; current: boolean; }[];
  transform: string | undefined;
}

/** SingleNumber 6.6.8 plan with target units and container offsets in hundreds of percent. */
export function getBadgeDigitState(
  originValue: string,
  originCount: number,
  previousValue: number,
  previousCount: number
): BadgeDigitState {
  const value = Number(originValue);
  const count = Math.abs(originCount);
  if (previousValue === value || Number.isNaN(value) || Number.isNaN(previousValue)) {
    return {
      units: [{ key: value, value: originValue, offset: 0, current: true }],
      transform: undefined
    };
  }

  const candidates = Array.from({ length: 11 }, (_, index) => value + index);
  const direction = previousCount < count ? 1 : -1;
  const previousIndex = candidates.findIndex(candidate => candidate % 10 === previousValue);
  const selected = direction < 0
    ? candidates.slice(0, previousIndex + 1) : candidates.slice(previousIndex);
  let cursor = previousValue;
  let offset = 0;
  while ((cursor + 10) % 10 !== value) {
    cursor += direction;
    offset += direction;
  }

  return {
    units: selected.map((candidate, index) => ({
      key: candidate,
      value: candidate % 10,
      offset: direction < 0 ? index - previousIndex : index,
      // Upstream current compares the index after slice with the original previousIndex.
      current: index === previousIndex
    })),
    transform: `translateY(${-offset}00%)`
  };
}
