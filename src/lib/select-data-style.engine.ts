import { serializeCssProperties } from './inline-style.engine';

/** Raw option style accepts CSS object Source and existing Native CSS line. */
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
