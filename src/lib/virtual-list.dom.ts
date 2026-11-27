// Measures the rendered string in the coordinates of the virtual list, including vertical margins.
/** The actual height of rc-virtual-list includes margins but not hidden lines. */
export function measureVirtualListRow(element: HTMLElement) {
  if (!element.offsetParent) {
    return undefined;
  }
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  const top = Number.parseFloat(style?.marginTop ?? '') || 0;
  const bottom = Number.parseFloat(style?.marginBottom ?? '') || 0;
  return element.offsetHeight + top + bottom;
}
