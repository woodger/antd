// React DOM 18.3.1; MIT, vendor/LICENSE.react-dom.
const unitlessNames = [
  'animationIterationCount', 'aspectRatio', 'borderImageOutset', 'borderImageSlice',
  'borderImageWidth', 'boxFlex', 'boxFlexGroup', 'boxOrdinalGroup', 'columnCount', 'columns',
  'flex', 'flexGrow', 'flexPositive', 'flexShrink', 'flexNegative', 'flexOrder', 'gridArea',
  'gridRow', 'gridRowEnd', 'gridRowSpan', 'gridRowStart', 'gridColumn', 'gridColumnEnd',
  'gridColumnSpan', 'gridColumnStart', 'fontWeight', 'lineClamp', 'lineHeight', 'opacity',
  'order', 'orphans', 'tabSize', 'widows', 'zIndex', 'zoom', 'fillOpacity', 'floodOpacity',
  'stopOpacity', 'strokeDasharray', 'strokeDashoffset', 'strokeMiterlimit', 'strokeOpacity',
  'strokeWidth'
];
const unitless = new Set(unitlessNames);

for (const property of unitlessNames) {
  for (const prefix of ['Webkit', 'ms', 'Moz', 'O']) {
    unitless.add(`${prefix}${property[0].toUpperCase()}${property.slice(1)}`);
  }
}

/** Raw option style принимает CSS object Source и существующую Native CSS-строку. */
export function serializeSelectDataStyle(style: unknown): string | undefined {
  if (style == null) return undefined;
  if (typeof style === 'string') return style;
  if (typeof style !== 'object') throw new TypeError('Option style must be an object or CSS string');

  const declarations: string[] = [];
  for (const [property, value] of Object.entries(style)) {
    if (value == null || typeof value === 'boolean' || value === '') continue;

    const custom = property.startsWith('--');
    const name = custom ? property : property.replace(/[A-Z]/g, '-$&')
      .toLowerCase().replace(/^ms-/, '-ms-');
    const text = !custom && typeof value === 'number' && value !== 0 && !unitless.has(property)
      ? `${value}px` : String(value).trim();
    if (text) declarations.push(`${name}:${text}`);
  }

  return declarations.length ? declarations.join(';') : undefined;
}
