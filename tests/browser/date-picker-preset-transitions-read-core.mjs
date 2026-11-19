/** Read actual physical DOM only; no Source API, CSS or input mutation. */
export function readDatePickerPresets() {
  const prefix = raw.sample.prefixCls ?? 'ant-picker', refs = raw.current.readRefs();
  const owner = document.querySelector('[data-picker-presets-owner]'), root = refs.root;
  const popups = [...document.querySelectorAll('.' + prefix + '-dropdown')];
  const ancestors = [...new Set(popups.flatMap(popup => {
    const result = [];
    let node = popup.parentElement;
    while (node && node !== document.body && node !== document.documentElement) {
      result.push(node);
      node = node.parentElement;
    }
    return result;
  }))];
  const newPortalAncestors = new Set(ancestors.filter(node => raw.preMountElements && !raw.preMountElements.has(node)));
  raw.pickerProbe ??= {
    ids: new WeakMap(),
    next: 0,
    retained: new Map(),
    owned: new Map(),
    ownershipEvidence: new Map(),
    initial: {}
  };
  const probe = raw.pickerProbe;
  const identity = node => {
    if (!node) {
      return null;
    }
    if (!probe.ids.has(node)) {
      const id = ++probe.next;
      probe.ids.set(node, id);
      probe.retained.set(id, node);
      const withinOwner = Boolean(owner?.contains(node)), withinPopup = popups.some(popup => popup === node || popup.contains(node));
      probe.owned.set(id, withinOwner || withinPopup || newPortalAncestors.has(node));
      probe.ownershipEvidence.set(id, { withinAuthoredOwner: withinOwner, withinPopup, popupAncestor: ancestors.includes(node),
        presentBeforeSourceMount: raw.preMountElements ? raw.preMountElements.has(node) : null,
        postMountSourcePopupAncestor: newPortalAncestors.has(node) });
    }
    return probe.ids.get(node);
  };
  const describe = (node, deep = true) => {
    if (!node) {
      return null;
    }
    const css = getComputedStyle(node), box = node.getBoundingClientRect();
    const properties = ['display', 'position', 'boxSizing', 'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
      'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color', 'backgroundColor', 'borderColor', 'borderWidth', 'borderStyle',
      'padding', 'margin', 'gap', 'flex', 'alignItems', 'justifyContent', 'opacity', 'visibility', 'pointerEvents', 'overflow', 'zIndex', 'cursor',
      ...['Top', 'Right', 'Bottom', 'Left'].flatMap(side => ['border' + side + 'Color', 'border' + side + 'Width', 'border' + side + 'Style', 'padding' + side, 'margin' + side])];
    return { identity: identity(node), tag: node.tagName, connected: node.isConnected, parentIdentity: identity(node.parentElement),
      attributes: [...node.attributes].map(attribute => [attribute.name, attribute.value]),
      styleAttribute: node.getAttribute('style'), cssText: node.style.cssText,
      inlineProperties: [...node.style].map(name => [name, node.style.getPropertyValue(name), node.style.getPropertyPriority(name)]),
      css: properties.map(name => [name, css[name]]), box: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height
      },
      metrics: ['offsetWidth', 'clientWidth', 'scrollWidth', 'offsetHeight', 'clientHeight', 'scrollHeight'].map(name => [name, node[name]]),
      html: deep ? node.outerHTML : null, text: deep ? node.textContent : null,
      children: deep ? [...node.childNodes].map(child => ({
        identity: identity(child),
        type: child.nodeType,
        name: child.nodeName,
        text: child.nodeType === 3 ? child.nodeValue : null
      })) : null,
      value: 'value' in node ? node.value : null, defaultValue: 'defaultValue' in node ? node.defaultValue : null,
      selection: 'selectionStart' in node ? [node.selectionStart, node.selectionEnd, node.selectionDirection] : null,
      focused: document.activeElement === node };
  };
  const input = root?.querySelector('input') ?? document.getElementById('preset-field');
  if (root && !probe.initial.root) probe.initial.root = root;
  if (input && !probe.initial.input) probe.initial.input = input;
  return { owner: raw.current.read(), root: describe(root), input: describe(input), sameRoot: root === probe.initial.root, sameInput: input === probe.initial.input,
    publicRef: { controlPresent: Boolean(refs.control), nativeElementIdentity: identity(refs.root) },
    rootElements: root ? [root, ...root.querySelectorAll('*')].map(node => describe(node)) : [],
    popups: popups.map(node => ({ node: describe(node), visible: getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden',
      allElements: [...node.querySelectorAll('*')].map(child => describe(child)) })),
    popupAncestors: ancestors.map(node => ({ node: describe(node, false), presentBeforeSourceMount: raw.preMountElements ? raw.preMountElements.has(node) : null,
      ownedAsPostMountPopupAncestor: newPortalAncestors.has(node) })),
    presets: popups.flatMap(popup => [...popup.querySelectorAll('.' + prefix + '-presets li')].map(node => describe(node))),
    cells: popups.flatMap(popup => [...popup.querySelectorAll('td[title]')].map(node => describe(node))),
    clear: describe(root?.querySelector('.' + prefix + '-clear')),
    authoredLabels: [...document.querySelectorAll('[data-preset-label]')].map(node => describe(node)),
    activeElement: describe(document.activeElement, false),
    browserOwnedResourceCounters: {
      measured: false,
      observers: null,
      mutations: null,
      frames: null,
      timers: null,
      ports: null
    },
    environment: { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    resourceTiming: performance.getEntriesByType('resource').map(entry => entry.toJSON()) };
}
export function readDatePickerPresetsCleanup() {
  const refs = raw.current.readRefs(), prefix = raw.sample.prefixCls ?? 'ant-picker';
  return { owner: raw.current.read(), refs: Object.fromEntries(Object.entries(refs).map(([name, node]) => [name, node == null])),
    retained: [...raw.pickerProbe.retained].map(([identity, node]) => ({
      identity,
      name: node.nodeName,
      connected: node.isConnected,
      owned: raw.pickerProbe.owned.get(identity),
      ownershipEvidence: raw.pickerProbe.ownershipEvidence.get(identity)
    })),
    ownerCount: document.querySelectorAll('[data-picker-presets-owner]').length, popupCount: document.querySelectorAll('.' + prefix + '-dropdown').length,
    activeElement: document.activeElement ? {
      name: document.activeElement.nodeName,
      connected: document.activeElement.isConnected
    } : null,
    browserOwnedResourceCounters: {
      measured: false,
      observers: null,
      mutations: null,
      frames: null,
      timers: null,
      ports: null
    },
    resourceTiming: performance.getEntriesByType('resource').map(entry => entry.toJSON()) };
}
