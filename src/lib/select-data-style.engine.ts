import { serializeCssProperties } from './inline-style.engine';

/** Raw option style принимает CSS object Source и существующую Native CSS-строку. */
export function serializeSelectDataStyle(style: unknown): string | undefined {
  if (style == null) {
    return undefined;
  }
  if (typeof style === 'string') {
    return style;
  }
  if (typeof style !== 'object') {
    throw new TypeError('Option style must be an object or CSS string');
  }

  return serializeCssProperties(style);
}
