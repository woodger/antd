// Allows design settings for the same props from the provider and owner of Modal.
import type { HTMLAttributes } from 'svelte/elements';
import { serializeInlineStyleLayers } from './inline-style.engine';
import type { ModalConfig, ModalProps, ModalSemantic, ModalSemanticName, ModalSemanticSlots }
  from './modal.types';

const slots: readonly ModalSemanticName[] = [
  'root', 'wrapper', 'mask', 'container', 'close', 'header', 'title', 'body', 'footer'
];

export interface ModalSemanticBody {
  className?: string;
  style?: string;
}

/** Calculates only the transferred semantic setting option. */
function readSlots(value: ModalSemantic | undefined, info: { props: ModalProps; }) {
  return typeof value === 'function' ? value(info) : value;
}

/** The classes are folded, inline CSS of the owner is located after the provider's settings. */
export function resolveModalSemantics(props: ModalProps, config?: ModalConfig) {
  const info = { props };
  const providerClasses = readSlots(config?.classNames, info);
  const localClasses = readSlots(props.classNames, info);
  const providerStyles = readSlots(config?.styles, info);
  const localStyles = readSlots(props.styles, info);
  const classes: ModalSemanticSlots = {};
  const styles: ModalSemanticSlots = {};

  for (const key of slots) {
    classes[key] = [providerClasses?.[key], localClasses?.[key]].filter(Boolean).join(' ') || undefined;
    styles[key] = serializeInlineStyleLayers([providerStyles?.[key], localStyles?.[key]]);
  }

  return { classes, styles };
}

/** Explicit class and style DOM-parts replace the semantic value of the same name. */
export function resolveModalPart<Node extends HTMLElement>(
  props: Omit<HTMLAttributes<Node>, 'children'> | undefined,
  fallbackClass: HTMLAttributes<Node>['class'],
  fallbackStyle: string | undefined
) {
  const { class: className, style, ...attributes } = props ?? {};
  return {
    classes: props && 'class' in props ? className : fallbackClass,
    style: props && 'style' in props ? style ?? undefined : fallbackStyle,
    attributes
  };
}
