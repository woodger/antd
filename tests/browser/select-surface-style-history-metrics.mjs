/** Actual CSSOM getter observations; never writes inline styles. */
export function readSelectSurfaceStyleHistory() {
  const owner = document.querySelector('[data-surface-case]'), refs = {};
  owner.querySelector('[data-surface-command]').dispatchEvent(new CustomEvent(
    'surfacerefs',
    { detail: refs }
  ));
  const root = refs.root, input = refs.editor;
  const allPopups = [...document.querySelectorAll('.ant-select-dropdown')];
  const popup = allPopups.find(node => getComputedStyle(node).display !== 'none') ?? allPopups.at(-1);
  const measure = node => {
    const computed = getComputedStyle(node), rect = node.getBoundingClientRect();
    const properties = ['display', 'visibility', 'opacity', 'boxSizing', 'color', 'height', 'width',
      ...['Top', 'Right', 'Bottom', 'Left'].flatMap(side => [`border${side}Color`, `border${side}Style`, `border${side}Width`])];
    return { tag: node.tagName, attributes: [...node.attributes].map(attr => [attr.name, attr.value]),
      styleAttribute: node.getAttribute('style'), inlineCssText: node.style.cssText,
      inlineProperties: [...node.style].map(name => ({
        name,
        value: node.style.getPropertyValue(name),
        priority: node.style.getPropertyPriority(name)
      })),
      inlineBorder: Object.fromEntries(['border', 'border-color', 'border-style', 'border-width',
        ...['top', 'right', 'bottom', 'left'].flatMap(side => [`border-${side}`, `border-${side}-color`, `border-${side}-style`, `border-${side}-width`])]
        .map(name => [name, node.style.getPropertyValue(name)])),
      computed: Object.fromEntries(properties.map(name => [name, computed[name]])),
      box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, outerHTML: node.outerHTML };
  };
  return { root: measure(root), input: measure(input), popup: popup ? measure(popup) : null };
}
