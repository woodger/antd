export type InlineStyleLayer = string | undefined
  | readonly (readonly [string, string, ('' | 'important')?])[];

// Numerical CSS properties without units in React DOM 18.3.1, MIT, vendor/LICENSE.react-dom.
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

/** Converts Source CSS object in declarations with units React DOM. */
export function serializeCssProperties(style: object) {
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

export function serializeInlineStyleLayers(layers: readonly InlineStyleLayer[]) {
  return layers.map(layer => typeof layer === 'string' ? layer
    : layer?.filter(([, value]) => value !== '')
      .map(([property, value, priority]) => `${property}:${value}${priority ? ` !${priority}` : ''}`).join(';'))
    .filter(Boolean).join(';') || undefined;
}

/** Saves declaration keys, strings, comments and function values without shorthand deployment. */
export function* getInlineStyleDeclarations(layers: readonly InlineStyleLayer[]) {
  for (const layer of layers) {
    if (typeof layer !== 'string') {
      for (const [property, value, priority] of layer ?? [])
        yield { property, value, priority: priority ?? '' };
      continue;
    }
    let declaration = '';
    let depth = 0;
    let quote = '';
    let escaped = false;
    let comment = false;
    const source = `${layer ?? ''};`;

    for (let index = 0; index < source.length; index++) {
      const character = source[index];
      if (comment) {
        if (character === '*' && source[index + 1] === '/') {
          comment = false;
          index++;
        }
        continue;
      }
      if (escaped) {
        declaration += character;
        escaped = false;
        continue;
      }
      if (character === '\\') {
        declaration += character;
        escaped = true;
        continue;
      }
      if (quote) {
        declaration += character;
        if (character === quote) quote = '';
        continue;
      }
      if (character === '/' && source[index + 1] === '*') {
        declaration += ' ';
        comment = true;
        index++;
        continue;
      }
      if (character === '"' || character === "'") quote = character;
      if ('([{'.includes(character)) depth++;
      if (')]}'.includes(character)) depth--;
      if (character !== ';' || depth !== 0) {
        declaration += character;
        continue;
      }

      const separator = declaration.indexOf(':');
      const name = declaration.slice(0, separator).trim()
        .replace(/\\([\da-f]{1,6}\s?|[^\n\r\f])/gi, (_, escape: string) => {
          if (!/^[\da-f]/i.test(escape)) {
            return escape;
          }
          const code = Number.parseInt(escape, 16);
          return String.fromCodePoint(code > 0 && code <= 0x10ffff ? code : 0xfffd);
        });
      const value = declaration.slice(separator + 1).trim();
      const priority = /\s*!\s*important\s*$/i.test(value);
      const content = value.replace(/\s*!\s*important\s*$/i, '').trim();
      if (separator >= 0 && content) {
        yield {
          property: name.startsWith('--') ? name : name.toLowerCase(),
          value: content,
          priority: priority ? 'important' : ''
        };
      }
      declaration = '';
    }
  }
}
