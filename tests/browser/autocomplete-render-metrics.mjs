/** Read-only actual DOM observer; no expected values or style writes. */
export function readAutocompleteRender() {
  const refs = raw.current.readRefs();
  raw.acRenderObserver ??= { ids: new WeakMap(), nextId: 0, original: {} };
  const observer = raw.acRenderObserver;
  const identity = value => {
    if (!value || !['function', 'object'].includes(typeof value)) return null;
    if (!observer.ids.has(value)) observer.ids.set(value, ++observer.nextId);
    return observer.ids.get(value);
  };
  const measure = node => {
    if (!node) return null;
    const css = getComputedStyle(node), box = node.getBoundingClientRect();
    return { identity: identity(node), tag: node.tagName, connected: node.isConnected,
      text: node.textContent, innerHTML: node.innerHTML, outerHTML: node.outerHTML,
      attributes: [...node.attributes].map(attr => [attr.name, attr.value]), classes: [...node.classList],
      cssText: node.style.cssText, inlineStyle: [...node.style].map(name => ({
        name,
        value: node.style.getPropertyValue(name),
        priority: node.style.getPropertyPriority(name)
      })),
      css: Object.fromEntries(['display', 'position', 'visibility', 'opacity', 'width', 'height', 'minWidth', 'minHeight',
        'maxWidth', 'boxSizing', 'font', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color', 'backgroundColor',
        'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
        'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'].map(key => [key, css[key]])),
      box: { x: box.x, y: box.y, width: box.width, height: box.height },
      scrollTop: node.scrollTop, scrollLeft: node.scrollLeft, scrollWidth: node.scrollWidth, scrollHeight: node.scrollHeight,
      clientWidth: node.clientWidth, clientHeight: node.clientHeight, offsetWidth: node.offsetWidth, offsetHeight: node.offsetHeight,
      value: 'value' in node ? node.value : null, caret: 'selectionStart' in node ? [node.selectionStart, node.selectionEnd] : null };
  };
  const current = { root: refs.root, editor: refs.editor, child: refs.child,
    popup: document.querySelector('.ant-select-dropdown'), list: document.querySelector('.ant-select-dropdown-list') };
  for (const [key, node] of Object.entries(current)) if (node && !observer.original[key]) observer.original[key] = node;
  const options = [...document.querySelectorAll('.ant-select-item-option')];
  return { current: Object.fromEntries(Object.entries(current).map(([key, node]) => [key, measure(node)])),
    original: Object.fromEntries(Object.keys(current).map(key => [key, measure(observer.original[key])])),
    sameAsOriginal: Object.fromEntries(Object.entries(current).map(([key, node]) => [key, observer.original[key] ? node === observer.original[key] : null])),
    publicRefs: { rootMatches: refs.control?.nativeElement === refs.root, childIsEditor: refs.child ? refs.child === refs.editor : null,
      controlIdentity: identity(refs.control), focusIdentity: identity(refs.control?.focus), blurIdentity: identity(refs.control?.blur),
      scrollToIdentity: identity(refs.control?.scrollTo), methodOwnKeys: refs.control ? Reflect.ownKeys(refs.control) : [] },
    rows: options.map(node => ({ node: measure(node), content: measure(node.querySelector('.ant-select-item-option-content')),
      authored: [...node.querySelectorAll('[data-ac-render-result]')].map(measure) })),
    groups: [...document.querySelectorAll('.ant-select-item-group')].map(measure),
    labels: [...document.querySelectorAll('[data-ac-render-label]')].map(measure),
    focus: { tag: document.activeElement?.tagName, id: document.activeElement?.id, role: document.activeElement?.getAttribute('role'),
      isEditor: document.activeElement === refs.editor, isRoot: document.activeElement === refs.root },
    popupCount: document.querySelectorAll('.ant-select-dropdown').length,
    resources: performance.getEntriesByType('resource').map(entry => ({
      name: entry.name,
      initiatorType: entry.initiatorType
    })) };
}
