/** Actual read-only public DOM; text nodes are retained because labelRender can return scalars. */
export function readAutocompleteLabelTitle() {
  const refs = raw.current.readRefs();
  raw.labelTitleObserver ??= { ids: new WeakMap(), nextId: 0, original: {} };
  const observer = raw.labelTitleObserver;
  const identity = node => {
    if (!node) return null;
    if (!observer.ids.has(node)) observer.ids.set(node, ++observer.nextId);
    return observer.ids.get(node);
  };
  const describe = node => {
    if (!node) return null;
    const style = getComputedStyle(node), box = node.getBoundingClientRect();
    return { identity: identity(node), connected: node.isConnected, tag: node.tagName,
      attributes: [...node.attributes].map(attr => [attr.name, attr.value]), text: node.textContent,
      html: node.outerHTML, innerHTML: node.innerHTML, title: node.getAttribute('title'), classes: [...node.classList],
      cssText: node.style.cssText, inlineProperties: [...node.style].map(name => ({
        name,
        value: node.style.getPropertyValue(name),
        priority: node.style.getPropertyPriority(name)
      })),
      css: Object.fromEntries(['display', 'position', 'visibility', 'opacity', 'color', 'backgroundColor', 'font', 'fontSize', 'fontWeight',
        'lineHeight', 'boxSizing', 'width', 'height', 'minWidth', 'minHeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].map(key => [key, style[key]])),
      box: { x: box.x, y: box.y, width: box.width, height: box.height },
      value: 'value' in node ? node.value : null, caret: 'selectionStart' in node ? [node.selectionStart, node.selectionEnd] : null };
  };
  const current = { root: refs.root, editor: refs.editor, child: refs.child,
    content: refs.root?.querySelector('.ant-select-content'), popup: document.querySelector('.ant-select-dropdown') };
  for (const [key, node] of Object.entries(current)) if (node && !observer.original[key]) observer.original[key] = node;
  return { current: Object.fromEntries(Object.entries(current).map(([key, node]) => [key, describe(node)])),
    original: Object.fromEntries(Object.entries(observer.original).map(([key, node]) => [key, describe(node)])),
    sameAsOriginal: Object.fromEntries(Object.entries(current).map(([key, node]) => [key, observer.original[key] ? node === observer.original[key] : null])),
    contentChildren: [...current.content?.childNodes ?? []].map(node => ({ identity: identity(node), nodeType: node.nodeType,
      nodeName: node.nodeName, text: node.textContent, html: node.nodeType === 1 ? node.outerHTML : null, isEditor: node === refs.editor })),
    publicRefs: {
      rootMatches: refs.control?.nativeElement === refs.root,
      childIsEditor: refs.child ? refs.child === refs.editor : null
    },
    focus: {
      tag: document.activeElement?.tagName,
      id: document.activeElement?.id,
      isEditor: document.activeElement === refs.editor
    },
    popupCount: document.querySelectorAll('.ant-select-dropdown').length,
    resources: performance.getEntriesByType('resource').map(entry => ({
      name: entry.name,
      initiatorType: entry.initiatorType
    })) };
}
