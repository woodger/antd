/** Actual DOM/CSSOM plus read-only identities; observer state never writes DOM/style. */
export function readSelectSurfaceOmission() {
  const refs = raw.current.readRefs(), owner = document.querySelector('[data-surface-case]');
  raw.omissionObserver ??= { identities: new WeakMap(), nextIdentity: 0, original: {} };
  const observer = raw.omissionObserver;
  const identity = node => {
    if (!node) {
      return null;
    }
    if (!observer.identities.has(node)) observer.identities.set(node, ++observer.nextIdentity);
    return observer.identities.get(node);
  };
  const measure = node => {
    if (!node) {
      return null;
    }
    const computed = getComputedStyle(node), box = node.getBoundingClientRect();
    return { identity: identity(node), connected: node.isConnected, tag: node.tagName, text: node.textContent,
      attributes: [...node.attributes].map(attr => [attr.name, attr.value]), classes: [...node.classList],
      styleAttribute: node.getAttribute('style'), cssText: node.style.cssText,
      inlineProperties: [...node.style].map(name => ({
        name,
        value: node.style.getPropertyValue(name),
        priority: node.style.getPropertyPriority(name)
      })),
      inputWidthVariable: node.style.getPropertyValue('--select-input-width'),
      legacyInputWidthVariable: node.style.getPropertyValue('--input-width'),
      css: Object.fromEntries(['width', 'minWidth', 'maxWidth', 'height', 'font', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
        'letterSpacing', 'lineHeight', 'boxSizing', 'display', 'visibility', 'opacity', 'color', 'backgroundColor',
        'paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'].map(key => [key, computed[key]])),
      box: { x: box.x, y: box.y, width: box.width, height: box.height },
      scrollWidth: node.scrollWidth, clientWidth: node.clientWidth, offsetWidth: node.offsetWidth,
      value: 'value' in node ? node.value : null,
      caret: 'selectionStart' in node ? [node.selectionStart, node.selectionEnd] : null, outerHTML: node.outerHTML };
  };
  const current = { root: refs.root, editor: refs.editor, popupShell: document.querySelector('.ant-select-dropdown'),
    wrap: document.querySelector('[data-surface-omission-wrap]'), footer: document.querySelector('[data-surface-omission-footer]'),
    footerInput: document.querySelector('[data-surface-footer-input]'), list: document.querySelector('.ant-select-dropdown-list') };
  for (const [name, node] of Object.entries(current)) {
    if (node && !observer.original[name]) observer.original[name] = node;
  }
  return { ownerAttributes: [...owner.attributes].map(attr => [attr.name, attr.value]),
    current: Object.fromEntries(Object.entries(current).map(([name, node]) => [name, measure(node)])),
    original: Object.fromEntries(Object.keys(current).map(name => [name, measure(observer.original[name])])),
    sameAsOriginal: Object.fromEntries(Object.entries(current).map(([name, node]) =>
      [name, observer.original[name] ? node === observer.original[name] : null])),
    publicRefs: { rootMatches: refs.control?.nativeElement === refs.root, footerMatches: refs.footerInput === current.footerInput,
      wrapMatches: refs.wrap === current.wrap }, popupCount: document.querySelectorAll('.ant-select-dropdown').length,
    footerCount: document.querySelectorAll('[data-surface-footer-input]').length };
}
