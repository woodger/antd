/** All DOM creation here belongs to the ordinary caller. No library lookup,
 * observer/style setter patch, reparent or shadow CSS injection is performed. */
export function initializeHydrationOwnershipProbe(config) {
  const probe = { scenario: config.scenario, roots: {}, identities: new WeakMap(), retained: new Map(), nextIdentity: 0,
    serverCallerUIDs: config.serverCallerUIDs };
  window.hydrationOwnershipProbe = probe;
  for (const key of config.scenario.environment.owners) {
    let target, host = null;
    if (config.scenario.environment.kind === 'document') {
      target = document.createElement('div'); target.setAttribute('data-ownership-container', key); document.body.append(target);
    } else {
      host = document.createElement('div'); host.setAttribute('data-ownership-host', key); document.body.append(host);
      target = host.attachShadow({ mode: config.scenario.environment.kind === 'shadow-open' ? 'open' : 'closed' });
    }
    target.innerHTML = config.htmlByOwner[key];
    probe.roots[key] = { key, target, host, raw: {}, app: null, committed: null,
      parsed: { owner: target.querySelector('[data-ownership-owner]'), root: target.querySelector('[data-ownership-control]'),
        editor: target.querySelector('[data-ownership-editor]'), outside: target.querySelector('[data-ownership-outside]') } };
  }
}

/** Fixed CSSOM -> ordered attrs read. Full HTML is limited to owned elements. */
export function describeOwnershipNode(node) {
  if (!node) return null;
  const probe = window.hydrationOwnershipProbe;
  const identity = value => {
    if (!value) return null;
    if (!probe.identities.has(value)) {
      const id = ++probe.nextIdentity; probe.identities.set(value, id);
      probe.retained.set(id, { node: value, ownerKey: value.closest?.('[data-ownership-owner]')?.getAttribute('data-ownership-owner') ?? null });
    }
    return probe.identities.get(value);
  };
  const localRoot = node.getRootNode(), isElement = node.nodeType === Node.ELEMENT_NODE;
  const ownerKey = node.closest?.('[data-ownership-owner]')?.getAttribute('data-ownership-owner') ?? null;
  const cssText = isElement ? node.style.cssText : null;
  const inlineProperties = isElement ? [...node.style].map(name => ({ name, value: node.style.getPropertyValue(name), priority: node.style.getPropertyPriority(name) })) : null;
  const attributes = isElement ? [...node.attributes].map(attr => [attr.name, attr.value]) : null;
  const box = isElement && ownerKey ? node.getBoundingClientRect() : null;
  return { identity: identity(node), nodeType: node.nodeType, name: node.nodeName, connected: node.isConnected,
    ownerKey, namespaceURI: node.namespaceURI ?? null, attributes, cssText, inlineProperties,
    styleAttribute: isElement ? node.getAttribute('style') : null,
    html: isElement && ownerKey ? node.outerHTML : null,
    value: 'value' in node ? node.value : null, defaultValue: 'defaultValue' in node ? node.defaultValue : null,
    selection: 'selectionStart' in node ? [node.selectionStart, node.selectionEnd, node.selectionDirection] : null,
    documentFocused: document.activeElement === node, scopeFocused: localRoot.activeElement === node,
    localRoot: { identity: identity(localRoot), nodeType: localRoot.nodeType, name: localRoot.nodeName,
      mode: localRoot instanceof ShadowRoot ? localRoot.mode : null, hostIdentity: localRoot instanceof ShadowRoot ? identity(localRoot.host) : null },
    box: box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null,
    childNodes: isElement && ownerKey ? [...node.childNodes].map(child => ({ identity: identity(child), type: child.nodeType,
      name: child.nodeName, text: [Node.TEXT_NODE, Node.COMMENT_NODE].includes(child.nodeType) ? child.textContent : null })) : null };
}

export function readHydrationOwnership() {
  const probe = window.hydrationOwnershipProbe;
  const identity = node => node ? describeOwnershipNode(node).identity : null;
  const shallow = node => {
    if (!node) return null;
    const described = describeOwnershipNode(node);
    return { identity: described.identity, nodeType: described.nodeType, name: described.name, connected: described.connected,
      attributes: described.attributes, ownerKey: described.ownerKey, localRoot: described.localRoot };
  };
  const roots = {};
  for (const [key, record] of Object.entries(probe.roots)) {
    const target = record.target, refs = record.raw.current?.readRefs() ?? {};
    const physical = { owner: target.querySelector('[data-ownership-owner]'), root: target.querySelector('[data-ownership-control]'),
      editor: target.querySelector('[data-ownership-editor]'), outside: target.querySelector('[data-ownership-outside]') };
    const ancestry = [];
    for (let node = physical.editor; node; node = node.parentNode ?? (node instanceof ShadowRoot ? node.host : null)) ancestry.push(shallow(node));
    const scope = target instanceof ShadowRoot ? target : document;
    const active = scope.activeElement;
    roots[key] = { target: { identity: identity(target), nodeType: target.nodeType, name: target.nodeName,
      shadowMode: target instanceof ShadowRoot ? target.mode : null, host: shallow(record.host),
      hostExposesSavedRoot: record.host ? record.host.shadowRoot === target : null },
      physical: Object.fromEntries(Object.entries(physical).map(([name, node]) => [name, describeOwnershipNode(node)])),
      parsed: Object.fromEntries(Object.entries(record.parsed).map(([name, node]) => [name, describeOwnershipNode(node)])),
      identity: { ownerSameAsParsed: physical.owner === record.parsed.owner, rootSameAsParsed: physical.root === record.parsed.root,
        editorSameAsParsed: physical.editor === record.parsed.editor, outsideSameAsParsed: physical.outside === record.parsed.outside },
      refs: { controlPresent: Boolean(refs.control), rootIdentity: identity(refs.root), editorIdentity: identity(refs.editor),
        authoredInputIdentity: identity(refs.authoredInput), outsideIdentity: identity(refs.outside),
        controlRootMatchesPhysical: Boolean(refs.control && refs.control.nativeElement === physical.root),
        rootMatchesPhysical: refs.root === physical.root, editorMatchesPhysical: refs.editor === physical.editor,
        rootInsideTarget: Boolean(refs.root && target.contains(refs.root)), editorInsideTarget: Boolean(refs.editor && target.contains(refs.editor)),
        editorOwnerKey: refs.editor?.closest('[data-ownership-owner]')?.getAttribute('data-ownership-owner') ?? null,
        methods: refs.control ? Object.fromEntries(Reflect.ownKeys(refs.control).map(name => [String(name), typeof refs.control[name]])) : null },
      focus: { scopeActiveElement: shallow(active), editorIsScopeActive: active === physical.editor,
        editorIsDocumentActive: document.activeElement === physical.editor,
        hostIsDocumentActive: record.host ? document.activeElement === record.host : null,
        ownsScopeFocus: Boolean(active && target.contains(active)) },
      ancestry, ownerState: record.raw.current?.read() ?? null, hydrationCommitted: record.raw.hydrationCommitted === true,
      retainedOwnedConnections: [...probe.retained].filter(([, value]) => value.ownerKey === key).map(([id, value]) => ({ identity: id, connected: value.node.isConnected })) };
  }
  return { scenarioId: probe.scenario.id, roots, documentActiveElement: shallow(document.activeElement),
    resources: { timing: performance.getEntriesByType('resource').map(entry => entry.toJSON()),
      ownedBrowserCounters: { measured: false, observers: null, mutations: null, frames: null, timers: null, ports: null,
        reason: 'Original browser APIs remain unpatched; actual owned counts are not measured' } } };
}
