import { untrack } from 'svelte';
import type { InlineStyleLayer } from './inline-style.engine';
import type { SelectStyle } from './select.types';
import { resolveSelectStyleFrame, type SelectStyleFrame } from './select-style.engine';
import { copySelectStyle, createSelectStyleWriter } from './select-style.dom';
import type { TooltipPosition } from './tooltip.engine';

const ssrAttribute = 'data-ant-native-select-style-ssr';
/** Только spread: отсутствующий client key сохраняет SSR marker до public attachment. */
export function selectStyleAttributes(style: unknown) {
  return typeof document === 'undefined' && style != null && typeof style === 'object'
    && Object.keys(style).length ? { [ssrAttribute]: '' } : {};
}
function takeSSRStyle(node: HTMLElement | SVGElement) {
  const parsed = node.hasAttribute(ssrAttribute);
  node.removeAttribute(ssrAttribute);
  return parsed;
}

/** Initial attr нужен SSR; последующие object updates не проходят через cssText Svelte. */
export function createSelectStyle(getStyle: () => SelectStyle | undefined,
  getBefore?: () => readonly InlineStyleLayer[], getAfter?: () => readonly InlineStyleLayer[]) {
  let initial: SelectStyleFrame | undefined;
  const read = () => resolveSelectStyleFrame(getStyle(), getBefore?.(), getAfter?.());
  return {
    initialStyle() {
      initial = read();
      return initial.text;
    },
    attach(node: HTMLElement | SVGElement) {
      const writer = createSelectStyleWriter(node.style, initial ?? untrack(read),
        () => node.ownerDocument.createElement('span').style);
      if (!takeSSRStyle(node)) writer.initialize();
      $effect(() => { writer.update(read()); });
    }
  };
}

/** Каждый физический tag/row получает собственную историю, без общего mutable snapshot. */
export function selectStyle(getStyle: () => SelectStyle | undefined,
  getBefore?: () => readonly InlineStyleLayer[], getAfter?: () => readonly InlineStyleLayer[]) {
  return createSelectStyle(getStyle, getBefore, getAfter).attach;
}

export interface SelectOverlayStyleOptions {
  style: () => SelectStyle | undefined;
  after?: () => readonly InlineStyleLayer[];
}

/** Один writer объединяет owner styles с координатами и projection контроллера. */
export function createSelectOverlayStyle(getLayers: () => readonly InlineStyleLayer[],
  sourceWidthVariable: string | undefined, getSourceOpen: (() => boolean) | undefined,
  options: SelectOverlayStyleOptions) {
  let element = $state.raw<HTMLElement>();
  let accepted: CSSStyleDeclaration | undefined;
  let writer: ReturnType<typeof createSelectStyleWriter> | undefined;
  let position: InlineStyleLayer;
  let projection: InlineStyleLayer;
  let targetWidth: string | undefined;

  function read() {
    const frame = resolveSelectStyleFrame(options.style(), [position, ...getLayers()],
      [...options.after?.() ?? [], projection]);
    if (!sourceWidthVariable) {
      return frame;
    }
    if (getSourceOpen?.()) {
      const current = element?.style.getPropertyValue(sourceWidthVariable).trim();
      if (current) targetWidth = current;
    }
    if (!targetWidth) {
      return frame;
    }
    const properties = { ...frame.properties };
    let changed = false;
    for (const key of ['width', 'minWidth']) {
      if (!frame.authored.has(key) && properties[key] === `var(${sourceWidthVariable})`) {
        properties[key] = targetWidth;
        changed = true;
      }
    }
    // Stretch Source хранит измеренный px, а не живую ссылку на Native variable.
    return changed ? { ...frame, properties } : frame;
  }

  function update(reconcile = false) {
    const frame = read();
    writer?.update(frame, reconcile);
  }

  $effect(() => {
    void element;
    getSourceOpen?.();
    // После первого real node закрытые props продолжают обновлять detached CSSOM;
    // SSR и ещё не открывавшийся control не создают DOM/parser resources.
    update();
  });

  return {
    initialStyle() {
      if (!writer) {
        return read().text;
      }
      update();
      return (element?.style ?? accepted)?.cssText || undefined;
    },
    attach(node: HTMLElement) {
      element = node;
      accepted ??= node.ownerDocument.createElement('span').style;
      if (writer) {
        copySelectStyle(accepted, node.style, untrack(read).properties);
        writer.target(node.style);
      }
      else {
        writer = createSelectStyleWriter(node.style, untrack(read),
          () => node.ownerDocument.createElement('span').style);
        if (!takeSSRStyle(node)) writer.initialize();
      }
      $effect(() => { update(true); });
      return () => {
        copySelectStyle(node.style, accepted!);
        writer!.target(accepted!);
        element = undefined;
      };
    },
    position(value: TooltipPosition, projected?: InlineStyleLayer) {
      projection = projected;
      position = [
        ['left', `${value.left}px`], ['top', `${value.top}px`],
        ['--arrow-x', `${value.arrowX}px`], ['--arrow-y', `${value.arrowY}px`]
      ];
      update(true);
    }
  };
}
