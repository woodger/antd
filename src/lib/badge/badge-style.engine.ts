import {
  getInlineStyleDeclarations as getBadgeStyleDeclarations,
  type InlineStyleLayer as BadgeStyleLayer
} from '../style/inline-style.engine';

export { getInlineStyleDeclarations as getBadgeStyleDeclarations } from '../style/inline-style.engine';
export type { InlineStyleLayer as BadgeStyleLayer } from '../style/inline-style.engine';
export { serializeInlineStyleLayers as serializeBadgeStyleLayers } from '../style/inline-style.engine';

// Finds the winning CSS property value. Later declarations win at equal priority.
export function getBadgeStyleValue(layers: readonly BadgeStyleLayer[], property: string) {
  let result: string | undefined;
  let important = false;

  for (const declaration of getBadgeStyleDeclarations(layers)) {
    if (declaration.property === property && (!important || declaration.priority)) {
      result = declaration.value;
      important = Boolean(declaration.priority);
    }
  }

  return result;
}
