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
    // Fixed observation order: CSSOM values, then ordered DOM attributes.
    const cssText = node.style.cssText;
    const inlineProperties = [...node.style].map(name => ({ name, value: node.style.getPropertyValue(name), priority: node.style.getPropertyPriority(name) }));
    const attributes = [...node.attributes].map(attr => [attr.name, attr.value]);
    const infiniteSpin = style.animationName !== 'none' && style.animationIterationCount.split(',').some(value => value.trim() === 'infinite');
    const box = geometry && !infiniteSpin ? node.getBoundingClientRect() : null;
    return { identity: identity(node), connected: node.isConnected, tag: node.tagName, text: node.textContent,
      attributes, classes: [...node.classList],
      html: node.outerHTML, styleAttribute: node.getAttribute('style'), cssText, inlineProperties,
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

/** Public parsed SSR nodes are retained before actual hydrateRoot starts.
 * This observer never writes DOM properties, styles, attributes or listeners. */
export function initializeSelectOwnStyleProbe(kind) {
  const owner = document.querySelector('[data-surface-case]');
  const editor = owner?.querySelector('input:not([type="hidden"]),textarea') ?? null;
  const root = editor?.closest('.ant-select') ?? editor;
  window.ownStyleProbe = { kind, parsed: { owner, root, editor }, commit: null };
  window.raw ??= {};
  raw.iconsObserver ??= { identities: new WeakMap(), next: 0, retained: new Map(), original: {} };
  raw.current ??= { readRefs: () => ({ control: null, root, editor, authoredRoot: null, authoredInput: null }),
    read: () => ({ ownerCommitted: false, events: [], rawEvents: [], calls: [], lifecycle: [], bodyActivity: [] }) };
}

/** Complete actual DOM/CSSOM, computed styles and geometry. No style readback
 * reaches an authored object and no measurement result affects the owner. */
export function readSelectOwnStyleDetails() {
  const observer = raw.iconsObserver, refs = raw.current.readRefs();
  const id = node => {
    if (!node) return null;
    if (!observer.identities.has(node)) {
      observer.identities.set(node, ++observer.next);
      observer.retained.set(observer.next, node);
    }
    return observer.identities.get(node);
  };
  const describe = (node, fullDOM = true) => {
    if (!node) return null;
    const computed = getComputedStyle(node);
    // Keep this order fixed before measurement: CSSOM -> attributes -> HTML.
    const cssText = node.style.cssText;
    const inlineProperties = [...node.style].map(name => ({ name, value: node.style.getPropertyValue(name), priority: node.style.getPropertyPriority(name) }));
    const computedProperties = [...computed].map(name => ({ name, value: computed.getPropertyValue(name), priority: computed.getPropertyPriority(name) }));
    const attributes = [...node.attributes].map(attr => [attr.name, attr.value]);
    const box = node.getBoundingClientRect();
    const selected = ['border', 'borderColor', 'borderWidth', 'borderStyle',
      'borderTop', 'borderTopColor', 'borderTopWidth', 'borderTopStyle',
      'borderRight', 'borderRightColor', 'borderRightWidth', 'borderRightStyle',
      'borderBottom', 'borderBottomColor', 'borderBottomWidth', 'borderBottomStyle',
      'borderLeft', 'borderLeftColor', 'borderLeftWidth', 'borderLeftStyle',
      'borderInlineStartColor', 'borderInlineStartWidth', 'borderInlineStartStyle',
      'borderInlineEndColor', 'borderInlineEndWidth', 'borderInlineEndStyle',
      'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'paddingInline', 'paddingInlineStart', 'paddingInlineEnd', 'paddingBlockStart', 'paddingBlockEnd',
      'boxSizing', 'width', 'height', 'minWidth', 'maxWidth', 'font', 'fontFamily', 'fontSize', 'lineHeight',
      'color', 'display', 'position', 'top', 'left', 'flex', 'alignItems', 'verticalAlign', 'order',
      'overflow', 'overflowX', 'overflowY', 'opacity', 'visibility', 'pointerEvents'];
    return { identity: fullDOM ? id(node) : observer.identities.get(node) ?? null, connected: node.isConnected, tag: node.tagName, namespaceURI: node.namespaceURI,
      attributes, ...(fullDOM ? { html: node.outerHTML, text: node.textContent } : {}), cssText, inlineProperties, computedProperties,
      styleAttribute: node.getAttribute('style'), css: Object.fromEntries(selected.map(name => [name, computed[name]])),
      box: { x: box.x, y: box.y, width: box.width, height: box.height },
      clientRects: [...node.getClientRects()].map(rect => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height })),
      metrics: { offsetWidth: node.offsetWidth ?? null, clientWidth: node.clientWidth ?? null, scrollWidth: node.scrollWidth ?? null,
        offsetHeight: node.offsetHeight ?? null, clientHeight: node.clientHeight ?? null, scrollHeight: node.scrollHeight ?? null,
        scrollLeft: node.scrollLeft ?? null, scrollTop: node.scrollTop ?? null },
      value: 'value' in node ? node.value : null, defaultValue: 'defaultValue' in node ? node.defaultValue : null,
      selection: 'selectionStart' in node ? [node.selectionStart, node.selectionEnd, node.selectionDirection] : null,
      focused: document.activeElement === node,
      childNodes: fullDOM ? [...node.childNodes].map(child => ({ identity: id(child), type: child.nodeType,
        name: child.nodeName, text: child.nodeType === Node.TEXT_NODE || child.nodeType === Node.COMMENT_NODE ? child.textContent : null })) : null };
  };
  const root = refs.root, editor = refs.editor, popup = document.querySelector('.ant-select-dropdown');
  const parsed = window.ownStyleProbe?.parsed;
  const ancestors = [];
  for (let node = root; node; node = node.parentElement) ancestors.push(describe(node, false));
  return { root: describe(root), editor: describe(editor), popup: describe(popup),
    allRootDescendants: root ? [...root.querySelectorAll('*')].map(node => describe(node)) : [],
    allPopupDescendants: popup ? [...popup.querySelectorAll('*')].map(node => describe(node)) : [], ancestors,
    hydration: parsed ? { kind: ownStyleProbe.kind, owner: document.querySelector('[data-surface-case]') === parsed.owner,
      root: root === parsed.root, editor: editor === parsed.editor,
      parsedRoot: describe(parsed.root), parsedEditor: describe(parsed.editor),
      rootConnected: parsed.root?.isConnected ?? false, editorConnected: parsed.editor?.isConnected ?? false } : null };
}

/** Called by the ordinary author's stable callback ref at each actual attach.
 * React has assigned the node; child width layout effects have not run yet. */
export function readSelectOwnStyleAuthoredRef(node) {
  if (!node) return null;
  const computed = getComputedStyle(node);
  const cssText = node.style.cssText;
  const inlineProperties = [...node.style].map(name => ({ name, value: node.style.getPropertyValue(name), priority: node.style.getPropertyPriority(name) }));
  const computedProperties = [...computed].map(name => ({ name, value: computed.getPropertyValue(name), priority: computed.getPropertyPriority(name) }));
  const attributes = [...node.attributes].map(attr => [attr.name, attr.value]);
  const box = node.getBoundingClientRect();
  return { tag: node.tagName, connected: node.isConnected, cssText, inlineProperties, computedProperties,
    attributes, html: node.outerHTML, styleAttribute: node.getAttribute('style'),
    value: node.value, defaultValue: node.defaultValue,
    box: { x: box.x, y: box.y, width: box.width, height: box.height },
    metrics: { offsetWidth: node.offsetWidth, clientWidth: node.clientWidth, scrollWidth: node.scrollWidth,
      offsetHeight: node.offsetHeight, clientHeight: node.clientHeight, scrollHeight: node.scrollHeight } };
}
