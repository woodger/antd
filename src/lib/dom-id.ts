/** Encodes an item key for use in matching control and content IDs, including during SSR. */
export function encodeDomIdKey(key: string): string {
  // Rule 2: string iteration yields a nonempty string for each Unicode code point.
  const codePoints = Array.from(key, character => character.codePointAt(0)!.toString(16));
  return codePoints.join('-') || 'empty';
}
