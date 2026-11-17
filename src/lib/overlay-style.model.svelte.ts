import { connectInlineStyle } from './inline-style.dom';
import { getInlineStyleDeclarations, serializeInlineStyleLayers, type InlineStyleLayer } from './inline-style.engine';
import type { TooltipPosition } from './tooltip.engine';
import { createSelectOverlayStyle, type SelectOverlayStyleOptions } from './select-style.model.svelte';

/** Root styles следуют после координат rc-trigger, не сбрасывая variables темы и portal. */
export function createOverlayStyle(
  getLayers: () => readonly InlineStyleLayer[], sourceWidthVariable?: string,
  getSourceOpen?: () => boolean, objectStyle?: SelectOverlayStyleOptions
) {
  if (objectStyle) return createSelectOverlayStyle(getLayers, sourceWidthVariable, getSourceOpen, objectStyle);
  let write: ReturnType<typeof connectInlineStyle> | undefined;
  let position: InlineStyleLayer;
  let projection: InlineStyleLayer;
  let element = $state.raw<HTMLElement>();
  let parser: CSSStyleDeclaration | undefined;
  let css: typeof CSS | undefined;
  let targetWidth: string | undefined;
  let inspected: readonly InlineStyleLayer[] | undefined;
  let width: { value: string; priority: '' | 'important' } | undefined;
  let acceptedWidth: typeof width;
  let visited = false;

  function widthHistory(layers: readonly InlineStyleLayer[]): InlineStyleLayer {
    if (!sourceWidthVariable || !parser || !css) return;
    if (!visited) {
      if (!getSourceOpen?.()) return;
      visited = true;
      // Скрытый Native measuring shell появляется раньше Source popup и не должен
      // создавать историю принятой ширины до первого настоящего открытия.
      acceptedWidth = undefined;
      element?.style.removeProperty('width');
    }
    const target = element?.style.getPropertyValue(sourceWidthVariable).trim();
    if (target) targetWidth = target;
    if (layers !== inspected) {
      inspected = layers;
      width = undefined;
      for (const layer of layers) {
        if (typeof layer === 'string') parser.cssText = layer;
        const resolved = typeof layer === 'string' ? parser.cssText : layer;
        for (const declaration of getInlineStyleDeclarations([resolved])) {
          if (declaration.property === 'width' && (!width?.priority || declaration.priority))
            width = { value: declaration.value, priority: declaration.priority ? 'important' : '' };
        }
      }
    }
    if (!width) {
      acceptedWidth = undefined;
      return;
    }
    if (css.supports('width', width.value)) {
      // Source stretch записывает px; сохранённый Native var продолжал бы следовать resize.
      const value = width.value === `var(${sourceWidthVariable})`
        ? targetWidth : width.value;
      if (value) acceptedWidth = { value, priority: width.priority };
      return;
    }
    // Отклонённый React CSS setter оставляет последнее принятое значение.
    // Сохраняем его и при прежнем условном удалении Native Select popup.
    return acceptedWidth ? [['width', acceptedWidth.value, acceptedWidth.priority]] : undefined;
  }

  if (sourceWidthVariable) $effect(() => {
    const node = element;
    const layers = getLayers();
    getSourceOpen?.();
    // Source обновляет стили закрытого popup. Native Select сохраняет условный DOM;
    // между его узлами остаётся только принятое значение ширины.
    if (!node) widthHistory(layers);
  });

  function update() {
    if (write) {
      const layers = getLayers();
      write([position, ...layers, widthHistory(layers), projection]);
    }
  }

  return {
    initialStyle() {
      const layers = getLayers();
      // Первый align должен измерять уже принятую ширину, включая invalid prop при reopen.
      return serializeInlineStyleLayers([...layers, widthHistory(layers)]);
    },
    attach(node: HTMLElement) {
      element = node;
      if (sourceWidthVariable) {
        parser = node.ownerDocument.createElement('span').style;
        css = node.ownerDocument.defaultView!.CSS;
      }
      inspected = undefined;
      write = connectInlineStyle(node, true);
      $effect(update);

      return () => {
        write = undefined;
        element = undefined;
      };
    },
    position(value: TooltipPosition, projected?: InlineStyleLayer) {
      projection = projected;
      position = [
        ['left', `${value.left}px`],
        ['top', `${value.top}px`],
        ['--arrow-x', `${value.arrowX}px`],
        ['--arrow-y', `${value.arrowY}px`]
      ];
      update();
    }
  };
}
