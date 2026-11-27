/** Ant Design 6.6.8 / rc-select 1.10.1; MIT, vendor/LICENSE.ant-design and vendor/LICENSE.rc-select. */
import type { SelectInputRegistration, SelectRootRegistration } from './select-components.types';
import { mergeTreeSelectComponentAttributes } from './tree-select-components.engine';

const inputDefaultAttributes = new Map([['defaultvalue', 'value'], ['defaultchecked', 'checked']]);

/** Dynamic input elements need HTML defaults in SSR. Explicit attributes win regardless of case. */
export function selectInputSsrAttributes(attributes: Record<string, unknown>) {
  const entries = Object.entries(attributes);
  const names = new Set(entries.map(([name]) => name.toLowerCase()));
  const htmlEntries: [string, unknown][] = [];

  for (const [name, value] of entries) {
    const alias = inputDefaultAttributes.get(name.toLowerCase());
    if (alias && names.has(alias)) {
      continue;
    }

    htmlEntries.push([alias ?? name, value]);
  }

  return Object.fromEntries(htmlEntries);
}

export function mergeSelectComponentAttributes<Attributes extends object>(
  target: Attributes,
  generated: object,
  own: object | undefined,
  slot: 'root' | 'input'
): Attributes {
  // cloneElement preserves the own keys and then replaces their values.
  if (slot === 'input') Object.assign(target, own);
  return mergeTreeSelectComponentAttributes(target, generated, own, slot);
}

type ComponentRegistration = SelectRootRegistration<HTMLElement> | SelectInputRegistration<HTMLElement>;

/** Composite without focus does not redirect the public call to nativeElement. */
export function focusSelectComponent(
  registration: ComponentRegistration | null | undefined,
  ...args: [options?: FocusOptions]
) {
  registration?.focus?.(...args);
}

export function blurSelectComponent(registration: ComponentRegistration | null | undefined) {
  registration?.blur?.();
}

/** DOM is determined structurally: helper does not address browser globals at SSR. */
export function selectComponentNativeElement<Element extends HTMLElement>(
  registration: Element | { nativeElement: Element } | null | undefined
): Element | undefined {
  if (!registration) {
    return undefined;
  }
  return 'nodeType' in registration ? registration : registration.nativeElement;
}

/** The physical editor is separated from the ref on which focus/blur is caused. */
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
