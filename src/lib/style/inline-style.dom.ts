// Applied layers inline CSS via DOM diff. The condition of the compound stores only the previous
// controlled properties, leaving other styles to the node.
import { getInlineStyleDeclarations, type InlineStyleLayer } from './inline-style.engine';

/** React style diff by declaration declarations; restores layer after DOM-controller. */
export function connectInlineStyle(node: HTMLElement | SVGElement, reconcile = false) {
  const parser = node.ownerDocument.createElement('span').style;
  let previous = new Map<string, { value: string; priority: string; }>();
  let initialized = false;

  return applyLayers;

  // Replaces the declarations of the managed layer, taking into account the cascade!important.
  function applyLayers(layers: readonly InlineStyleLayer[]) {
    if (!initialized) {
      initialized = true;
      const raw = layers.flatMap(layer => typeof layer === 'string' ? [] : layer ?? []);
      // SSR can disassemble raw CSS-value as declarations; setter accepts one value.
      for (const { property } of getInlineStyleDeclarations([
        raw.map(([name, value]) => `${name}:${value}`).join(';')
      ])) {
        node.style.removeProperty(property);
      }
    }

    const next = new Map<string, { value: string; priority: string; }>();
    for (const layer of layers) {
      if (typeof layer === 'string') parser.cssText = layer;
      const resolved = typeof layer === 'string' ? parser.cssText : layer;
      for (const { property, value, priority } of getInlineStyleDeclarations([resolved])) {
        const previousDeclaration = next.get(property);
        if (!previousDeclaration?.priority || priority) {
          next.set(property, { value, priority });
        }
      }
    }

    for (const property of previous.keys()) {
      if (!next.has(property)) node.style.removeProperty(property);
    }
    for (const [property, current] of next) {
      const old = previous.get(property);
      const changed = old?.value !== current.value || old.priority !== current.priority;
      if (changed || reconcile && (node.style.getPropertyValue(property) !== current.value
        || node.style.getPropertyPriority(property) !== current.priority)) {
        node.style.setProperty(property, current.value, current.priority);
      }
    }
    previous = next;
  }
}
