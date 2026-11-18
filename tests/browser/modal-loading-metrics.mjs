/** Read-only physical DOM probe. BODY/HTML never enter owned retained nodes. */
export function initializeModalLoadingProbe() {
  const identities = new WeakMap(), retained = new Map();
  let next = 0;
  const identity = node => {
    if (!node) return null;
    if (!identities.has(node)) identities.set(node, ++next);
    if (node.nodeType !== 1 || !['BODY', 'HTML'].includes(node.tagName)) retained.set(identities.get(node), node);
    return identities.get(node);
  };
  const computedNames = ['display', 'position', 'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'box-sizing', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'justify-content', 'align-items',
    'font-family', 'font-size', 'line-height', 'color', 'background-color', 'border-radius',
    'opacity', 'visibility', 'animation-name', 'animation-duration'];
  const describe = (node, html = true) => {
    if (!node) return null;
    const element = node.nodeType === 1, shallow = element && ['BODY', 'HTML'].includes(node.tagName);
    const style = element ? getComputedStyle(node) : null, rect = element ? node.getBoundingClientRect() : null;
    return { identity: identity(node), nodeType: node.nodeType, name: node.nodeName, connected: node.isConnected,
      attributes: element ? [...node.attributes].map(attribute => [attribute.name, attribute.value]) : null,
      inlineStyle: element ? [...node.style].map(name => [name, node.style.getPropertyValue(name), node.style.getPropertyPriority(name)]) : null,
      cssText: element ? node.style.cssText : null,
      computed: style ? computedNames.map(name => [name, style.getPropertyValue(name)]) : null,
      box: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
      client: element ? [node.clientWidth, node.clientHeight, node.scrollWidth, node.scrollHeight] : null,
      text: shallow ? null : node.textContent, html: html && element && !shallow ? node.outerHTML : null,
      children: element && !shallow ? [...node.childNodes].map(child => ({ identity: identity(child), nodeType: child.nodeType,
        name: child.nodeName, text: child.nodeType === 3 || child.nodeType === 8 ? child.textContent : null })) : null,
      value: element && 'value' in node ? node.value : null, defaultValue: element && 'defaultValue' in node ? node.defaultValue : null,
      selection: element && 'selectionStart' in node ? [node.selectionStart, node.selectionEnd, node.selectionDirection] : null,
      focused: document.activeElement === node };
  };
  raw.modalLoadingProbe = { describe, retained, initial: new Map() };
}
export function readModalLoading() {
  const probe = raw.modalLoadingProbe, refs = raw.current.readRefs(), owner = refs.owner;
  const prefix = raw.current.read().prefixCls;
  const find = selector => owner?.querySelector(selector) ?? null;
  const roles = { owner, dialog: find('.' + prefix), header: find('.' + prefix + '-header'),
    title: find('.' + prefix + '-title'), close: find('.' + prefix + '-close'), body: find('.' + prefix + '-body'),
    footer: find('.' + prefix + '-footer'), authoredBody: refs.body, editor: refs.editor, authoredFooter: refs.footer,
    skeleton: find('.' + prefix + '-body-skeleton'), skeletonTitle: find('.ant-skeleton-title'),
    skeletonParagraph: find('.ant-skeleton-paragraph') };
  const nodes = Object.fromEntries(Object.entries(roles).map(([name, node]) => [name, probe.describe(node)]));
  for (const [name, node] of Object.entries(roles)) if (node && !probe.initial.has(name)) probe.initial.set(name, node);
  return { owner: raw.current.read(), nodes,
    initialIdentity: Object.fromEntries(Object.entries(roles).map(([name, node]) => [name, node ? node === probe.initial.get(name) : null])),
    skeletonRows: roles.skeletonParagraph ? [...roles.skeletonParagraph.children].map(node => probe.describe(node)) : [],
    allElements: owner ? [owner, ...owner.querySelectorAll('*')].map(node => probe.describe(node, false)) : [],
    activeElement: probe.describe(document.activeElement, false),
    browserOwnedResourceCounters: { measured: false, observers: null, mutations: null, frames: null, timers: null, ports: null } };
}
export function readModalLoadingCleanup() {
  return { owner: raw.current.read(),
    refs: Object.fromEntries(Object.entries(raw.current.readRefs()).map(([name, node]) => [name, node == null])),
    retained: [...raw.modalLoadingProbe.retained].map(([identity, node]) => ({ identity, nodeType: node.nodeType, name: node.nodeName, connected: node.isConnected })),
    ownerCount: document.querySelectorAll('[data-modal-loading-owner]').length,
    dialogCount: document.querySelectorAll('[role="dialog"]').length,
    activeElement: raw.modalLoadingProbe.describe(document.activeElement, false),
    browserOwnedResourceCounters: { measured: false, observers: null, mutations: null, frames: null, timers: null, ports: null },
    resourceTiming: performance.getEntriesByType('resource').map(entry => entry.toJSON()) };
}
