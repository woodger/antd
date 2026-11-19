/** Read-only identities, selected UI boxes and complete actual inline CSSOM/HTML. */
export function readSelectIcons() {
  raw.iconsObserver ??= { identities: new WeakMap(), next: 0, retained: new Map(), original: {} };
  const observer = raw.iconsObserver, refs = raw.current.readRefs();
  const identity = node => {
    if (!node) return null;
    if (!observer.identities.has(node)) {
      observer.identities.set(node, ++observer.next);
      observer.retained.set(observer.next, node);
    }
    return observer.identities.get(node);
  };
  const describe = (node, geometry = true) => {
    if (!node) return null;
    const style = getComputedStyle(node);
    const infiniteSpin = style.animationName !== 'none' && style.animationIterationCount.split(',').some(value => value.trim() === 'infinite');
    const box = geometry && !infiniteSpin ? node.getBoundingClientRect() : null;
    return { identity: identity(node), connected: node.isConnected, tag: node.tagName, text: node.textContent,
      attributes: [...node.attributes].map(attr => [attr.name, attr.value]), classes: [...node.classList],
      html: node.outerHTML, styleAttribute: node.getAttribute('style'), cssText: node.style.cssText,
      inlineProperties: [...node.style].map(name => ({
        name,
        value: node.style.getPropertyValue(name),
        priority: node.style.getPropertyPriority(name)
      })),
      css: Object.fromEntries(['display', 'position', 'boxSizing', 'width', 'height', 'minWidth', 'maxWidth', 'minHeight',
        'font', 'fontSize', 'lineHeight', 'color', 'backgroundColor', 'opacity', 'visibility', 'pointerEvents',
        'borderColor', 'borderWidth', 'borderStyle', 'padding', 'margin', 'gap', 'flex', 'alignItems',
        'animationName', 'animationDuration', 'animationIterationCount'].map(key => [key, style[key]])),
      box: box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null,
      geometryBoundary: infiniteSpin ? 'live-infinite-animation-phase' : geometry ? 'actual-layout-box' : 'svg-descendant',
      value: 'value' in node ? node.value : null, caret: 'selectionStart' in node ? [node.selectionStart, node.selectionEnd] : null,
      focused: document.activeElement === node, metrics: {
        offsetWidth: node.offsetWidth ?? null,
        clientWidth: node.clientWidth ?? null,
        scrollWidth: node.scrollWidth ?? null,
        offsetHeight: node.offsetHeight ?? null,
        clientHeight: node.clientHeight ?? null,
        scrollHeight: node.scrollHeight ?? null,
        scrollTop: node.scrollTop ?? null,
        scrollLeft: node.scrollLeft ?? null
      } };
  };
  const popup = document.querySelector('.ant-select-dropdown');
  const current = { root: refs.root, editor: refs.editor, suffix: refs.root?.querySelector('.ant-select-suffix'),
    clear: refs.root?.querySelector('.ant-select-clear'), popup, list: popup?.querySelector('.ant-select-dropdown-list') };
  for (const [key, node] of Object.entries(current)) if (node && !observer.original[key]) observer.original[key] = node;
  const selectors = '.ant-select-selection-item,.ant-select-selection-item-remove,.ant-select-item-option,'
    + '.ant-select-item-option-state,[data-select-icons-node],[data-select-icons-component],span.anticon';
  return { current: Object.fromEntries(Object.entries(current).map(([name, node]) => [name, describe(node)])),
    original: Object.fromEntries(Object.entries(observer.original).map(([name, node]) => [name, describe(node)])),
    sameAsOriginal: Object.fromEntries(Object.entries(current).map(([name, node]) => [name, observer.original[name] ? node === observer.original[name] : null])),
    nodes: [...document.querySelectorAll(selectors)].map(node => describe(node)),
    // SVG phase is not a UI layout box: intrinsic spin has an intentionally live clock.
    // Its exact markup/CSSOM and time-independent computed animation properties remain raw.
    svg: [...document.querySelectorAll('.ant-select svg,.ant-select-dropdown svg')].map(node => describe(
      node,
      false
    )),
    publicRefs: { rootMatches: refs.control?.nativeElement === refs.root, authoredRoot: describe(refs.authoredRoot), authoredInput: describe(refs.authoredInput),
      methods: refs.control ? Object.fromEntries(Reflect.ownKeys(refs.control).map(key => [String(key), typeof refs.control[key]])) : null },
    layout: refs.root ? [...refs.root.querySelectorAll('*')].map(node => describe(
      node,
      node.namespaceURI !== 'http://www.w3.org/2000/svg'
    )) : [],
    resources: performance.getEntriesByType('resource').map(entry => ({
      name: entry.name,
      initiatorType: entry.initiatorType
    })),
    formData: document.querySelector('[data-select-icons-form]') ? [...new FormData(document.querySelector('[data-select-icons-form]'))] : null,
    popupCount: document.querySelectorAll('.ant-select-dropdown').length,
    active: { tag: document.activeElement?.tagName, id: document.activeElement?.id, attributes: document.activeElement?.attributes
      ? [...document.activeElement.attributes].map(attr => [attr.name, attr.value]) : [] } };
}
