// Combines semantic slots Select settings. The prioritization of the inline layers depends on the
// order, explicit removal of the property and CSS!important.
import { getInlineStyleDeclarations } from '../inline-style.engine';
import { serializeSelectDataStyle } from './select-data-style.engine';
import type {
  SelectClassNames, SelectCSSProperties, SelectPopupClassNames, SelectPopupStyles,
  SelectSemanticValue, SelectStyle, SelectStyles
} from './select.types';

const controlSlots = ['root', 'prefix', 'suffix', 'input', 'placeholder', 'content',
  'item', 'itemContent', 'itemRemove', 'clear'] as const;
const popupSlots = ['root', 'list', 'listItem'] as const;
export interface SelectSemanticMaps { classes?: SelectClassNames; styles?: SelectStyles }

/** Saves Source String(label).trim(), without causing guarded toString from Snippet. */
export function hasSelectDisplayContent(content: unknown): boolean {
  if (typeof content === 'function') {
    return true;
  }
  if (Array.isArray(content)) {
    return content.length > 1 || content.length === 1 && hasSelectDisplayContent(content[0]);
  }
  return content != null && String(content).trim() !== '';
}

/** Popup-only maps preserve color inheritance for the native control. */
export function hasSelectControlSemantics(...maps: readonly SelectSemanticMaps[]): boolean {
  return maps.some(({ classes, styles }) => controlSlots.some(slot =>
    Boolean(classes?.[slot]) || styles?.[slot] != null));
}

// Calculates semantic map for the current props, leaving the returned object to the owner.
export function resolveSelectSemanticValue<Slots, Props>(
  value: SelectSemanticValue<Slots, Props> | undefined,
  info: { props: Props }
): Slots | undefined {
  return typeof value === 'function'
    ? (value as (info: { props: Props }) => Slots | undefined)(info) : value;
}

// Receives only flat CSS properties. Boolean is considered to be an absent value.
function cssObject(style: unknown): SelectCSSProperties | undefined {
  if (style == null) {
    return;
  }
  if (typeof style !== 'object' || Array.isArray(style)) {
    throw new TypeError('Select style must be a CSS object or string');
  }
  const result: Record<string, string | number | null | undefined> = {};
  for (const [key, value] of Object.entries(style)) {
    if (value == null || typeof value === 'string' || typeof value === 'number') {
      result[key] = value;
    }
    else if (typeof value === 'boolean') {
      result[key] = undefined;
    }
    else {
      throw new TypeError('Select CSS property must be a string or number');
    }
  }
  return result;
}

/** CSS keys are combined to serialization: the late own undefined removes an early announcement. */
export function mergeSelectStyle(...layers: readonly unknown[]): SelectStyle | undefined {
  const present = layers.filter(layer => layer != null);
  if (!present.length) {
    return;
  }
  if (present.every(layer => typeof layer !== 'string')) {
    return Object.assign({}, ...present.map(cssObject));
  }
  if (present.every(layer => typeof layer === 'string')) {
    return present.filter(Boolean).join(';') || undefined;
  }

  const declarations = new Map<string, { value: string; priority: '' | 'important' }>();
  for (const layer of present) {
    if (typeof layer === 'string') {
      mergeCssText(layer);
    }
    else {
      mergeCssObject(layer);
    }
  }

  return [...declarations].map(([property, { value, priority }]) =>
    `${property}:${value}${priority ? ' !important' : ''}`).join(';') || undefined;

  // Late!important can replace the previously given!important in string CSS.
  function mergeCssText(layer: string) {
    for (const { property, value, priority } of getInlineStyleDeclarations([layer])) {
      const previous = declarations.get(property);
      if (!previous?.priority || priority) {
        declarations.set(property, { value, priority: priority ? 'important' : '' });
      }
    }
  }

  // The value of the object redefines the usual CSS. An obvious empty value removes the recording.
  function mergeCssObject(layer: NonNullable<unknown>) {
    // Rule 2: present has already ruled out null and undefined, the remaining forms check cssObject.
    const style = cssObject(layer)!;
    for (const [property, value] of Object.entries(style)) {
      const name = property.startsWith('--') ? property : property.replace(/[A-Z]/g, '-$&')
        .toLowerCase().replace(/^ms-/, '-ms-');
      if (value == null || value === '') {
        declarations.delete(name);
        continue;
      }

      const serialized = serializeSelectDataStyle({ [property]: value });
      for (const declaration of getInlineStyleDeclarations([serialized])) {
        const previous = declarations.get(name);
        if (!previous?.priority) {
          declarations.set(name, {
            value: declaration.value,
            priority: declaration.priority ? 'important' : ''
          });
        }
      }
    }
  }
}

export function serializeSelectStyle(style: SelectStyle | undefined): string | undefined {
  return serializeSelectDataStyle(style);
}

export function mergeSelectSemanticMaps(
  context: SelectSemanticMaps,
  local: SelectSemanticMaps,
  contextStyle?: SelectStyle,
  ownStyle?: SelectStyle
) {
  const join = (before: string | undefined, after: string | undefined) =>
    [before, after].filter(Boolean).join(' ') || undefined;
  const classes: SelectClassNames & { popup: SelectPopupClassNames } = { popup: {} };
  const styles: SelectStyles & { popup: SelectPopupStyles } = {
    // Upstream replaces each popup CSS leaf, including explicit undefined. Local and provider
    // declarations within a leaf are not merged recursively.
    popup: { ...context.styles?.popup, ...local.styles?.popup }
  };
  const contextPopup = typeof context.classes?.popup === 'string' ? { root: context.classes.popup } : context.classes?.popup;
  const localPopup = typeof local.classes?.popup === 'string' ? { root: local.classes.popup } : local.classes?.popup;
  for (const slot of controlSlots) {
    classes[slot] = join(context.classes?.[slot], local.classes?.[slot]);
    styles[slot] = mergeSelectStyle(context.styles?.[slot], slot === 'root' ? contextStyle : undefined,
      local.styles?.[slot], slot === 'root' ? ownStyle : undefined);
  }
  for (const slot of popupSlots) {
    classes.popup[slot] = join(
      contextPopup?.[slot],
      localPopup?.[slot]
    );
  }
  return { classes, styles };
}
