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
      inlineProperties: [...node.style].map(name => ({ name, value: node.style.getPropertyValue(name), priority: node.style.getPropertyPriority(name) })),
      css: Object.fromEntries(['display', 'position', 'boxSizing', 'width', 'height', 'minWidth', 'maxWidth', 'minHeight',
        'font', 'fontSize', 'lineHeight', 'color', 'backgroundColor', 'opacity', 'visibility', 'pointerEvents',
        'borderColor', 'borderWidth', 'borderStyle', 'padding', 'margin', 'gap', 'flex', 'alignItems',
        'animationName', 'animationDuration', 'animationIterationCount'].map(key => [key, style[key]])),
      box: box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null,
      geometryBoundary: infiniteSpin ? 'live-infinite-animation-phase' : geometry ? 'actual-layout-box' : 'svg-descendant',
      value: 'value' in node ? node.value : null, caret: 'selectionStart' in node ? [node.selectionStart, node.selectionEnd] : null,
      focused: document.activeElement === node, metrics: { offsetWidth: node.offsetWidth ?? null, clientWidth: node.clientWidth ?? null, scrollWidth: node.scrollWidth ?? null, offsetHeight: node.offsetHeight ?? null, clientHeight: node.clientHeight ?? null, scrollHeight: node.scrollHeight ?? null, scrollTop: node.scrollTop ?? null, scrollLeft: node.scrollLeft ?? null } };
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
    svg: [...document.querySelectorAll('.ant-select svg,.ant-select-dropdown svg')].map(node => describe(node, false)),
    publicRefs: { rootMatches: refs.control?.nativeElement === refs.root, authoredRoot: describe(refs.authoredRoot), authoredInput: describe(refs.authoredInput),
      methods: refs.control ? Object.fromEntries(Reflect.ownKeys(refs.control).map(key => [String(key), typeof refs.control[key]])) : null },
    layout: refs.root ? [...refs.root.querySelectorAll('*')].map(node => describe(node, node.namespaceURI !== 'http://www.w3.org/2000/svg')) : [],
    resources: performance.getEntriesByType('resource').map(entry => ({ name: entry.name, initiatorType: entry.initiatorType })),
    formData: document.querySelector('[data-select-icons-form]') ? [...new FormData(document.querySelector('[data-select-icons-form]'))] : null,
    popupCount: document.querySelectorAll('.ant-select-dropdown').length,
    active: { tag: document.activeElement?.tagName, id: document.activeElement?.id, attributes: document.activeElement?.attributes
      ? [...document.activeElement.attributes].map(attr => [attr.name, attr.value]) : [] } };
}

/** Read-only complete responsive item/suffix diagnostics. No DOM write,
 * measurement shim, observer replacement, authored-input readback or coercion. */
export function readSelectResponsiveOverflow() {
  const refs = raw.current.readRefs(), root = refs.root, editor = refs.editor;
  const identities = raw.iconsObserver.identities;
  const describe = node => {
    if (!node) return null;
    const css = getComputedStyle(node), box = node.getBoundingClientRect();
    return { identity: identities.get(node) ?? null, tag: node.tagName, connected: node.isConnected, text: node.textContent,
      attributes: [...node.attributes].map(attribute => [attribute.name, attribute.value]), html: node.outerHTML,
      styleAttribute: node.getAttribute('style'), cssText: node.style.cssText,
      inlineProperties: [...node.style].map(name => ({ name, value: node.style.getPropertyValue(name), priority: node.style.getPropertyPriority(name) })),
      css: Object.fromEntries(['display', 'position', 'top', 'right', 'bottom', 'left', 'insetInlineStart', 'insetInlineEnd',
        'boxSizing', 'width', 'height', 'minWidth', 'maxWidth', 'minHeight',
        'font', 'fontFamily', 'fontSize', 'lineHeight', 'verticalAlign', 'color', 'opacity', 'visibility', 'pointerEvents',
        'padding', 'margin', 'gap', 'flex', 'alignItems', 'order', 'overflow', 'overflowX', 'overflowY'].map(key => [key, css[key]])),
      box: { x: box.x, y: box.y, width: box.width, height: box.height },
      clientRects: [...node.getClientRects()].map(rect => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height })),
      metrics: { offsetWidth: node.offsetWidth, clientWidth: node.clientWidth, scrollWidth: node.scrollWidth,
        offsetHeight: node.offsetHeight, clientHeight: node.clientHeight, scrollHeight: node.scrollHeight,
        scrollLeft: node.scrollLeft, scrollTop: node.scrollTop },
      value: 'value' in node ? node.value : null,
      caret: 'selectionStart' in node ? [node.selectionStart, node.selectionEnd] : null, focused: document.activeElement === node,
      childNodes: [...node.childNodes].map(child => ({ type: child.nodeType,
        tag: child.nodeType === Node.ELEMENT_NODE ? child.tagName : null,
        text: child.nodeType === Node.TEXT_NODE ? child.textContent : null })) };
  };
  const content = root?.querySelector('.ant-select-content');
  const suffix = root?.querySelector('.ant-select-content-item-suffix');
  const adornment = root?.querySelector('[data-select-components-responsive-adornment]');
  const ancestors = [];
  for (let node = root; node; node = node.parentElement) {
    const item = describe(node);
    ancestors.push({ identity: item.identity, tag: item.tag, attributes: item.attributes,
      styleAttribute: item.styleAttribute, cssText: item.cssText, inlineProperties: item.inlineProperties,
      css: item.css, box: item.box, metrics: item.metrics });
  }
  return { root: describe(root), content: describe(content), editor: describe(editor),
    suffix: describe(suffix), adornment: describe(adornment),
    contentChildren: content ? [...content.children].map(describe) : [],
    suffixChildren: suffix ? [...suffix.children].map(describe) : [],
    rests: root ? [...root.querySelectorAll('.ant-select-content-item-rest')].map(describe) : [], ancestors,
    suffixContainsEditor: Boolean(suffix?.contains(editor)), editorIsDirectSuffixChild: editor?.parentElement === suffix,
    rootHasSamePublicEditor: editor === refs.root?.querySelector('input'),
    allRootDescendants: root ? [...root.querySelectorAll('*')].map(describe) : [] };
}

/** New axis only: actual leading affix is outside Overflow. No width is summed
 * or subtracted here; both nodes, their hierarchy, and all raw boxes survive. */
export function readSelectCustomTagPrefix() {
  const refs = raw.current.readRefs(), root = refs.root, content = root?.querySelector('.ant-select-content');
  const identities = raw.iconsObserver.identities;
  const describe = node => {
    if (!node) return null;
    const computed = getComputedStyle(node), box = node.getBoundingClientRect();
    const cssText = node.style.cssText;
    const inlineProperties = [...node.style].map(name => ({ name, value: node.style.getPropertyValue(name), priority: node.style.getPropertyPriority(name) }));
    return { identity: identities.get(node) ?? null, tag: node.tagName, connected: node.isConnected,
      parentIdentity: identities.get(node.parentElement) ?? null, html: node.outerHTML, text: node.textContent,
      cssText, inlineProperties, styleAttribute: node.getAttribute('style'), attributes: [...node.attributes].map(attribute => [attribute.name, attribute.value]),
      css: Object.fromEntries(['display', 'position', 'top', 'left', 'insetInlineStart', 'insetInlineEnd', 'boxSizing', 'width', 'height',
        'minWidth', 'maxWidth', 'font', 'fontFamily', 'fontSize', 'lineHeight', 'whiteSpace', 'verticalAlign', 'color',
        'opacity', 'visibility', 'pointerEvents', 'padding', 'margin', 'gap', 'flex', 'alignItems', 'order', 'overflow', 'overflowX', 'overflowY']
        .map(name => [name, computed[name]])),
      box: { x: box.x, y: box.y, width: box.width, height: box.height },
      clientRects: [...node.getClientRects()].map(rect => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height })),
      metrics: { offsetWidth: node.offsetWidth ?? null, clientWidth: node.clientWidth ?? null, scrollWidth: node.scrollWidth ?? null,
        offsetHeight: node.offsetHeight ?? null, clientHeight: node.clientHeight ?? null, scrollHeight: node.scrollHeight ?? null },
      focused: document.activeElement === node, value: 'value' in node ? node.value : null,
      defaultValue: 'defaultValue' in node ? node.defaultValue : null,
      selection: 'selectionStart' in node ? [node.selectionStart, node.selectionEnd, node.selectionDirection] : null,
      childNodes: [...node.childNodes].map(child => ({ identity: identities.get(child) ?? null, type: child.nodeType,
        tag: child.nodeType === Node.ELEMENT_NODE ? child.tagName : null,
        text: [Node.TEXT_NODE, Node.COMMENT_NODE].includes(child.nodeType) ? child.textContent : null })) };
  };
  const leadingPrefix = root?.querySelector(':scope > .ant-select-prefix');
  const overflowPrefixes = content ? [...content.querySelectorAll(':scope > .ant-select-content-item-prefix')] : [];
  const rootChildren = root ? [...root.children] : [];
  return { root: describe(root), editor: describe(refs.editor), content: describe(content), leadingPrefix: describe(leadingPrefix),
    prefixBody: describe(root?.querySelector('[data-custom-tag-prefix]')),
    prefixTopology: { leadingPrefixIsDirectRootChild: Boolean(leadingPrefix && leadingPrefix.parentElement === root),
      leadingPrefixOutsideOverflow: Boolean(leadingPrefix && content && !content.contains(leadingPrefix)),
      leadingPrefixRootIndex: leadingPrefix ? rootChildren.indexOf(leadingPrefix) : null,
      overflowRootIndex: content ? rootChildren.indexOf(content) : null, overflowPrefixNodes: overflowPrefixes.map(describe) },
    rootChildren: rootChildren.map(describe), contentChildren: content ? [...content.children].map(describe) : [],
    customTags: root ? [...root.querySelectorAll('[data-custom-tag]')].map(describe) : [],
    customLabels: root ? [...root.querySelectorAll('[data-custom-tag-label]')].map(describe) : [],
    customCloseButtons: root ? [...root.querySelectorAll('[data-custom-tag-close]')].map(describe) : [],
    rests: content ? [...content.querySelectorAll(':scope > .ant-select-content-item-rest')].map(describe) : [],
    suffix: describe(content?.querySelector(':scope > .ant-select-content-item-suffix')),
    allRootElements: root ? [root, ...root.querySelectorAll('*')].map(describe) : [],
    frame: describe(document.querySelector('[data-custom-tag-frame]')),
    browserOwnedResourceCounters: { measured: false, observers: null, mutations: null, frames: null, timers: null, ports: null,
      reason: 'Official Original browser globals remain unpatched; actual owned browser resources are not measured' } };
}
