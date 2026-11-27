/** Actual DOM/identity/CSSOM only; Source globals and APIs are not patched. */
export function readSelectTagCloseHandleDOM() {
  const refs = raw.current.readRefs();
  raw.handlesDOM ??= { identities: new WeakMap(), next: 0, retained: new Map(), ownedAtFirstObservation: new Map(), original: {} };
  const observer = raw.handlesDOM;
  const ownerRoot = document.querySelector('[data-handles-case]');
  const identity = node => { if (!node) return null; if (!observer.identities.has(node)) {
    const id = ++observer.next; observer.identities.set(node, id); observer.retained.set(id, node);
    observer.ownedAtFirstObservation.set(id, Boolean(ownerRoot && (node === ownerRoot || ownerRoot.contains(node))));
  } return observer.identities.get(node); };
  const describe = node => {
    if (!node) return null;
    const css = getComputedStyle(node), box = node.getBoundingClientRect();
    return { identity: identity(node), tag: node.tagName, connected: node.isConnected, parentIdentity: identity(node.parentElement),
      attributes: [...node.attributes].map(attribute => [attribute.name, attribute.value]), html: node.outerHTML,
      styleAttribute: node.getAttribute('style'), cssText: node.style.cssText,
      inlineProperties: [...node.style].map(name => ({ name, value: node.style.getPropertyValue(name), priority: node.style.getPropertyPriority(name) })),
      css: Object.fromEntries(['display', 'position', 'boxSizing', 'width', 'height', 'minWidth', 'maxWidth', 'font', 'fontSize', 'lineHeight',
        'color', 'backgroundColor', 'borderWidth', 'borderStyle', 'padding', 'margin', 'gap', 'flex', 'opacity', 'pointerEvents'].map(name => [name, css[name]])),
      box: { x: box.x, y: box.y, width: box.width, height: box.height },
      metrics: Object.fromEntries(['offsetWidth', 'clientWidth', 'scrollWidth', 'offsetHeight', 'clientHeight', 'scrollHeight'].map(name => [name, node[name] ?? null])),
      value: 'value' in node ? node.value : null, defaultValue: 'defaultValue' in node ? node.defaultValue : null,
      selection: 'selectionStart' in node ? [node.selectionStart, node.selectionEnd, node.selectionDirection] : null,
      focused: document.activeElement === node, textContent: node.textContent,
      childNodes: [...node.childNodes].map(child => ({ identity: identity(child), type: child.nodeType, name: child.nodeName, text: child.nodeType === 3 ? child.nodeValue : null })) };
  };
  if (refs.root && !observer.original.root) observer.original.root = refs.root;
  if (refs.editor && !observer.original.editor) observer.original.editor = refs.editor;
  return { root: describe(refs.root), editor: describe(refs.editor), sameRoot: refs.root === observer.original.root,
    sameEditor: refs.editor === observer.original.editor, publicRootMatches: refs.control?.nativeElement === refs.root,
    tags: [...document.querySelectorAll('[data-handles-tag]')].map(describe), buttons: [...document.querySelectorAll('[data-handles-action]')].map(describe),
    allRootElements: refs.root ? [refs.root, ...refs.root.querySelectorAll('*')].map(describe) : [],
    activeElement: document.activeElement ? { identity: identity(document.activeElement), tag: document.activeElement.tagName,
      connected: document.activeElement.isConnected, attributes: [...document.activeElement.attributes].map(attribute => [attribute.name, attribute.value]) } : null, popupCount: document.querySelectorAll('.ant-select-dropdown').length,
    ownerCount: document.querySelectorAll('[data-handles-case]').length,
    browserOwnedResourceCounters: { measured: false, observers: null, mutations: null, frames: null, timers: null, ports: null },
    resourceTiming: performance.getEntriesByType('resource').map(entry => entry.toJSON()) };
}
