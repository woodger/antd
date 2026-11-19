/** Ant Design 6.6.8 / rc-select 1.10.1; MIT, vendor/LICENSE.ant-design and vendor/LICENSE.rc-select. */
import type { SelectInputRegistration, SelectRootRegistration } from './select-components.types';
import { mergeTreeSelectComponentAttributes } from './tree-select-components.engine';

export function mergeSelectComponentAttributes<Attributes extends object>(
  target: Attributes,
  generated: object,
  own: object | undefined,
  slot: 'root' | 'input'
): Attributes {
  // cloneElement сохраняет позиции own keys и затем заменяет их значения.
  if (slot === 'input') Object.assign(target, own);
  return mergeTreeSelectComponentAttributes(target, generated, own, slot);
}

type ComponentRegistration = SelectRootRegistration<HTMLElement> | SelectInputRegistration<HTMLElement>;

/** Composite без focus не перенаправляет публичный вызов на nativeElement. */
export function focusSelectComponent(
  registration: ComponentRegistration | null | undefined,
  ...args: [options?: FocusOptions]
) {
  registration?.focus?.(...args);
}

export function blurSelectComponent(registration: ComponentRegistration | null | undefined) {
  registration?.blur?.();
}

/** DOM определяется структурно: helper не обращается к browser globals при SSR. */
export function selectComponentNativeElement<Element extends HTMLElement>(
  registration: Element | { nativeElement: Element } | null | undefined
): Element | undefined {
  if (!registration) {
    return undefined;
  }
  return 'nodeType' in registration ? registration : registration.nativeElement;
}

/** Физический editor отделён от ref, на котором вызываются focus/blur. */
export function selectComponentInputElement<Editor extends HTMLElement = HTMLInputElement | HTMLTextAreaElement>(
  registration: HTMLElement | { nativeElement: HTMLElement; inputElement?: Editor } | null | undefined
): Editor | undefined {
  if (registration && !('nodeType' in registration) && registration.inputElement) {
    return registration.inputElement;
  }
  const node = selectComponentNativeElement(registration);
  if (node?.matches('input,textarea')) {
    return node as Editor;
  }
  return node?.querySelector<Editor>('input,textarea') ?? undefined;
}
