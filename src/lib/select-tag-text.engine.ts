/**
 * rc-select считает UTF-16 units. Сохраняем его slice/ellipsis, но не разрываем
 * существующую surrogate pair: иначе корректный emoji превращается в invalid text.
 */
export function getSelectTagText(text: string, maxLength?: number): string;
export function getSelectTagText<Content>(text: Content, maxLength?: number): Content | string;
export function getSelectTagText(text: unknown, maxLength?: number): unknown {
  if (typeof text !== 'string' && typeof text !== 'number') {
    return text;
  }
  const label = String(text);
  if (typeof maxLength !== 'number' || !(label.length > maxLength)) {
    return text;
  }

  const shortened = label.slice(0, maxLength);
  const high = label.charCodeAt(shortened.length - 1);
  const low = label.charCodeAt(shortened.length);
  const splitsPair = high >= 0xD800 && high <= 0xDBFF && low >= 0xDC00 && low <= 0xDFFF;
  return `${splitsPair ? shortened.slice(0, -1) : shortened}...`;
}
