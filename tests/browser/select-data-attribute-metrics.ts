/** Full observer of Source attributes; outerHTML does not set Native DOM contract. */
export function readSelectDataAttributes() {
  const owner = document.querySelector<HTMLElement>('[data-select-data-case]')!;
  const state: Record<string, unknown> = {};
  owner.querySelector('[data-select-data-command]')?.dispatchEvent(new CustomEvent('dataread', { detail: state }));
  const attributes = (node: Element) => [...node.attributes].map(attribute => [attribute.name, attribute.value]);
  const measure = (node: HTMLElement) => {
    const rect = node.getBoundingClientRect();
    const computed = getComputedStyle(node);
    return { tag: node.tagName, attributes: attributes(node), outerHTML: node.outerHTML,
      box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      css: Object.fromEntries(['display', 'visibility', 'height', 'minHeight', 'maxHeight', 'width',
        'paddingTop', 'paddingBottom', 'backgroundColor', 'color', 'fontSize', 'lineHeight',
        'borderTopWidth', 'borderBottomWidth'].map(name => [name, computed[name as keyof CSSStyleDeclaration]])) };
  };
  return { view: { family: owner.dataset.selectDataFamily, model: state.model,
    query: state.query, events: state.events }, raw: { receipts: state.receipts, rawEvents: state.rawEvents,
    popups: [...document.querySelectorAll<HTMLElement>('.ant-select-dropdown')].map(popup => ({
      attributes: attributes(popup),
      physicalRows: [...popup.querySelectorAll<HTMLElement>('.ant-select-item-option,.ant-select-item-group')].map(measure),
      listboxes: [...popup.querySelectorAll<HTMLElement>('[role="listbox"]')].map(listbox => ({
        attributes: attributes(listbox), outerHTML: listbox.outerHTML,
        rows: [...listbox.querySelectorAll<HTMLElement>('[role="option"],[role="presentation"]')].map(measure)
      }))
    })) } };
}
