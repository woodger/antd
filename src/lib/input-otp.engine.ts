// Distributes the input and insertion by cells OTP. The total signal depends on the occupancy and
// changes of the cells.
/** Insertion replaces the tail; the formatter sees the gaps of the empty cells to the length limit. */
export function patchOTPCells(
  cells: readonly string[],
  index: number,
  text: string,
  length: number,
  formatter?: (value: string) => string
): string[] {
  let next = [...cells];
  for (let before = 0; before < index; before++) {
    if (!next[before]) next[before] = '';
  }

  if (text.length <= 1) {
    next[index] = text;
  }
  else {
    next = next.slice(0, index).concat(text.split(''));
  }

  while (next.length && !next[next.length - 1]) next.pop();

  const joined = next.map(cell => cell || ' ').join('');
  const formatted = formatter ? formatter(joined) : joined;
  return (formatted || '').split('').map((cell, position) =>
    cell === ' ' && !next[position] ? next[position] : cell
  ).slice(0, length);
}

// Allows callback when filling all the cells and the difference from the previous value.
export function isOTPCompleteChange(
  previous: readonly string[],
  next: readonly string[],
  length: number
): boolean {
  return next.length === length
    && next.every(cell => Boolean(cell))
    && next.some((cell, index) => previous[index] !== cell);
}
