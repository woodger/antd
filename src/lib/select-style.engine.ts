import { getInlineStyleDeclarations, serializeInlineStyleLayers, type InlineStyleLayer } from './inline-style.engine';
import { serializeSelectDataStyle } from './select-data-style.engine';
import type { SelectStyle } from './select.types';

export type SelectStyleValue = string | number | null | undefined;
export type SelectStyleProperties = Readonly<Record<string, SelectStyleValue>>;
export interface SelectStylePatch { property: string; value: SelectStyleValue }
export interface SelectStyleFrame {
  readonly properties: SelectStyleProperties;
  readonly priorities: Readonly<Record<string, '' | 'important'>>;
  readonly authored: ReadonlySet<string>;
  readonly string: boolean;
  readonly text: string | undefined;
}

/** Puts an inherited layer at its own undefined in zIndex objects. */
export function resolveSelectPopupRootStyle(
  style: SelectStyle | undefined,
  inheritedZIndex: number | undefined
) {
  if (inheritedZIndex === undefined || style == null || typeof style === 'string') {
    return style;
  }

  if (Object.hasOwn(style, 'zIndex') && style.zIndex === undefined) {
    return { ...style, zIndex: inheritedZIndex };
  }

  return style;
}

export function selectStyleName(property: string): string {
  return property.startsWith('--') ? property : property.replace(/[A-Z]/g, '-$&')
    .toLowerCase().replace(/^ms-/, '-ms-');
}

/** Uses the same Source formatter as the raw option, without CSSOM-normalizing the value. */
export function selectStyleValue(property: string, value: SelectStyleValue): string {
  const serialized = serializeSelectDataStyle({ [property]: value });
  return serialized?.slice(selectStyleName(property).length + 1) ?? '';
}

export function snapshotSelectStyle(style: unknown): SelectStyleProperties {
  const result: Record<string, SelectStyleValue> = {};
  if (style == null) {
    return result;
  }
  if (typeof style !== 'object' || Array.isArray(style)) {
    throw new TypeError('Select style must be a CSS object');
  }
  for (const [property, value] of Object.entries(style)) {
    if (value == null || typeof value === 'string' || typeof value === 'number') {
      result[property] = value;
    }
    else if (typeof value === 'boolean') {
      result[property] = undefined;
    }
    else {
      throw new TypeError('Select CSS property must be a string or number');
    }
  }
  return result;
}

/** Source first removes the disappeared keys, then records the changed in order next props. */
export function diffSelectStyle(
  previous: SelectStyleProperties,
  next: SelectStyleProperties
): SelectStylePatch[] {
  const patches: SelectStylePatch[] = [];
  for (const property of Object.keys(previous)) {
    if (!Object.hasOwn(next, property)) patches.push({ property, value: undefined });
  }
  for (const [property, value] of Object.entries(next)) {
    if (previous[property] !== value) patches.push({ property, value });
  }
  return patches;
}

function logicalName(property: string): string {
  if (property.startsWith('--')) {
    return property;
  }
  return property.replace(/^-ms-/, 'ms-').replace(
    /-([a-z])/g,
    (_, letter: string) => letter.toUpperCase()
  );
}

/** Framework layers are combined with the source object to setter diff, including its own undefined. */
export function resolveSelectStyleFrame(
  style: SelectStyle | undefined,
  before: readonly InlineStyleLayer[] = [],
  after: readonly InlineStyleLayer[] = []
): SelectStyleFrame {
  const properties: Record<string, SelectStyleValue> = {};
  const priorities: Record<string, '' | 'important'> = {};
  const authored = new Set<string>();
  function append(layers: readonly InlineStyleLayer[], owner: boolean) {
    for (const { property, value, priority } of getInlineStyleDeclarations(layers)) {
      const key = logicalName(property);
      if (priorities[key] && !priority) continue;
      properties[key] = value;
      priorities[key] = priority ? 'important' : '';
      if (owner) {
        authored.add(key);
      }
      else {
        authored.delete(key);
      }
    }
  }
  append(before, false);
  if (typeof style === 'string') {
    append([style], true);
  }
  else {
    for (const [property, value] of Object.entries(snapshotSelectStyle(style))) {
      properties[property] = value;
      priorities[property] = '';
      authored.add(property);
    }
  }
  append(after, false);
  const text = typeof style === 'string'
    ? serializeInlineStyleLayers([...before, style, ...after])
    : Object.entries(properties).flatMap(([property, value]) => {
      const formatted = selectStyleValue(property, value);
      return formatted ? [`${selectStyleName(property)}:${formatted}${priorities[property] ? ' !important' : ''}`] : [];
    }).join(';') || undefined;
  return { properties, priorities, authored, string: typeof style === 'string', text };
}
