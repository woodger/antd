// Applies Badge styles in layers and preserves shorthand and longhand order. Explicit overrides and
// the computed inset border follow input declarations.
import {
  getBadgeStyleDeclarations,
  getBadgeStyleValue,
  serializeBadgeStyleLayers,
  type BadgeStyleLayer
} from './badge-style.engine';

/** React's style diff preserves shorthand and longhand order during reactive updates. */
export function connectBadgeStyle(node: HTMLElement) {
  const parser = node.ownerDocument.createElement('span').style;
  let previous = new Map<string, { value: string; priority: string; }>();
  let initialized = false;

  return applyLayers;

  // On the first call, removes declarations that HTML parsed differently from the DOM setter.
  function applyLayers(
    layers: readonly BadgeStyleLayer[],
    overrides: readonly (readonly [string, string])[] = [],
    insetBorder = false
  ) {
    if (!initialized) {
      initialized = true;
      const raw = layers.filter(layer => typeof layer !== 'string');
      // An HTML style can parse a raw value as declarations. The DOM setter accepts a single value.
      const serialized = serializeBadgeStyleLayers([...raw, overrides]);
      for (const { property } of getBadgeStyleDeclarations([serialized])) {
        node.style.removeProperty(property);
      }
    }

    const next = new Map<string, { value: string; priority: string; }>();
    for (const layer of layers) {
      if (typeof layer === 'string') parser.cssText = layer;
      const resolved = typeof layer === 'string' ? parser.cssText : layer;
      for (const { property, value, priority } of getBadgeStyleDeclarations([resolved])) {
        const previousDeclaration = next.get(property);
        if (!previousDeclaration?.priority || priority) {
          next.set(property, { value, priority });
        }
      }
    }
    for (const [property, value] of overrides) next.set(property, { value, priority: '' });

    const border = insetBorder && getBadgeStyleValue(layers, 'border-color');
    if (border) next.set('box-shadow', { value: `0 0 0 1px ${border} inset`, priority: '' });

    for (const property of previous.keys()) {
      if (!next.has(property)) node.style.removeProperty(property);
    }
    for (const [property, current] of next) {
      const old = previous.get(property);
      if (old?.value !== current.value || old.priority !== current.priority) {
        node.style.setProperty(property, current.value, current.priority);
      }
    }
    previous = next;
  }
}
