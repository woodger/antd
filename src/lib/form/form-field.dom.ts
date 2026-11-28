// Resolves registered controls and uses their live elements for focus and scrolling.
import { compute } from '../vendor/compute-scroll-into-view';
import type { FormScrollOptions } from './form.types';

// A control can belong to another document and have a different Element constructor.
function isElement(value: unknown): value is Element {
  if (!value || typeof value !== 'object' || !('ownerDocument' in value)) {
    return false;
  }

  const node = value as Element;
  const view = node.ownerDocument?.defaultView;

  return Boolean(view && typeof view.Element === 'function' && node instanceof view.Element);
}

// A public control handle can supply an element independently of its focus method.
export function getFormFieldElement(instance: unknown): Element | undefined {
  if (instance && typeof instance === 'object' && 'nativeElement' in instance
    && isElement(instance.nativeElement)) {
    return instance.nativeElement;
  }

  return isElement(instance) ? instance : undefined;
}

// A custom focus method keeps its receiver and can work without a DOM element.
export function focusFormField(instance: unknown, fallback?: () => Element | undefined) {
  const target = instance ?? fallback?.();
  if (target && (typeof target === 'object' || typeof target === 'function')
    && 'focus' in target && typeof target.focus === 'function') {
    target.focus();
  }
  else {
    const node = getFormFieldElement(instance) ?? fallback?.();
    if (node && 'focus' in node && typeof node.focus === 'function') node.focus();
  }
}

// Apply the computed scroll outsets once to the transformed border box.
function getFormScrollBounds(node: Element) {
  const bounds = node.getBoundingClientRect();
  const style = node.ownerDocument.defaultView?.getComputedStyle(node);
  if (!style) {
    return bounds;
  }

  const marginTop = Number.parseFloat(style.scrollMarginTop) || 0;
  const marginRight = Number.parseFloat(style.scrollMarginRight) || 0;
  const marginBottom = Number.parseFloat(style.scrollMarginBottom) || 0;
  const marginLeft = Number.parseFloat(style.scrollMarginLeft) || 0;
  if (marginTop === 0 && marginRight === 0 && marginBottom === 0 && marginLeft === 0) {
    return bounds;
  }

  const top = bounds.top - marginTop;
  const right = bounds.right + marginRight;
  const bottom = bounds.bottom + marginBottom;
  const left = bounds.left - marginLeft;

  // A negative margin can reverse the edges. Nearest alignment needs their signed distance.
  return { top, right, bottom, left, height: bottom - top, width: right - left };
}

// Custom behavior receives the same scroll actions that native scrolling would apply.
export function scrollFormField(node: Element, options: FormScrollOptions = {}) {
  if (!node.isConnected) {
    return;
  }

  const { focus: _focus, behavior, ...settings } = options;
  const actions = compute(
    node,
    { scrollMode: 'if-needed', block: 'nearest', ...settings },
    getFormScrollBounds
  );
  if (typeof behavior === 'function') {
    behavior(actions);
    return;
  }

  for (const action of actions) {
    action.el.scroll({
      top: action.top,
      left: action.left,
      behavior
    });
  }
}
