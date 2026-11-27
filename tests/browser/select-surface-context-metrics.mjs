/** Public hook outputs plus actual original DOM; no private context reads. */
export function readSelectSurfaceContext() {
  const owner = document.querySelector('[data-surface-context-case]');
  const refs = {};
  owner.querySelector('[data-surface-context-command]').dispatchEvent(new CustomEvent('contextrefs', { detail: refs }));
  const measure = node => {
    const style = getComputedStyle(node), rect = node.getBoundingClientRect();
    return { tag: node.tagName, text: node.textContent, attributes: [...node.attributes].map(attr => [attr.name, attr.value]),
      classes: [...node.classList], css: Object.fromEntries(['color', 'backgroundColor', 'fontSize', 'height', 'display', 'visibility',
        'borderTopStyle', 'borderTopWidth', 'borderTopColor', 'paddingTop', 'paddingBottom'].map(key => [key, style[key]])),
      box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, outerHTML: node.outerHTML,
      value: 'value' in node ? node.value : null, disabled: 'disabled' in node ? node.disabled : null };
  };
  const controls = [...document.querySelectorAll('[data-surface-context-slot]')].map(slot => ({
    slot: slot.getAttribute('data-surface-context-slot'),
    nodes: [...slot.querySelectorAll('.ant-input-affix-wrapper,.ant-input,.ant-select,button')].map(measure) }));
  const status = [...document.querySelectorAll('[data-surface-context-status]')].map(node => ({
    side: node.getAttribute('data-surface-context-status'), value: JSON.parse(node.textContent), raw: measure(node) }));
  return { parent: measure(refs.root), editor: measure(refs.editor), controls, status,
    popup: [...document.querySelectorAll('.ant-select-dropdown')].map(measure),
    active: document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName };
}
