/** Compact actual Native DOM/public-ref read. Source methods and attributes are not synthesized. */
export function readNativeTimeScroll() {
  const api = window.nativeTimeScroll;
  const raw = window.nativeTimeScrollObservation;
  const recorder = api.getRecorder();
  const id = value => value == null ? null : recorder.identity(value);
  const attributes = node => [...node.attributes].map(attribute => [attribute.name, attribute.value]);
  const box = node => {
    const value = node.getBoundingClientRect();
    return { x: value.x, y: value.y, top: value.top, right: value.right,
      bottom: value.bottom, left: value.left, width: value.width, height: value.height };
  };
  const keys = ['display', 'visibility', 'opacity', 'position', 'box-sizing',
    'width', 'height', 'min-height', 'max-height', 'overflow', 'overflow-y',
    'font-size', 'line-height', 'padding-top', 'padding-bottom',
    'border-top-width', 'border-bottom-width', 'scroll-behavior', 'overscroll-behavior-y'];
  const describe = node => {
    if (node == null) {
      return null;
    }
    const computed = getComputedStyle(node);
    raw.retainedNodes.add(node);
    return { identity: id(node), tag: node.tagName, connected: node.isConnected,
      parentIdentity: id(node.parentNode), attributes: attributes(node), box: box(node),
      css: Object.fromEntries(keys.map(key => [key, computed.getPropertyValue(key)])),
      offsetTop: node.offsetTop, offsetLeft: node.offsetLeft,
      offsetHeight: node.offsetHeight, offsetWidth: node.offsetWidth,
      offsetParentIdentity: id(node.offsetParent), scrollTop: node.scrollTop,
      scrollLeft: node.scrollLeft, scrollHeight: node.scrollHeight, scrollWidth: node.scrollWidth,
      clientHeight: node.clientHeight, clientWidth: node.clientWidth,
      childNodes: [...node.childNodes].map(child => ({ identity: id(child),
        nodeType: child.nodeType, nodeName: child.nodeName,
        data: child.nodeType === 3 || child.nodeType === 8 ? child.data : null })),
      html: node.outerHTML, text: node.textContent };
  };
  const refs = api.readRefs();
  const control = refs.control;
  const root = refs.nativeElement;
  const owner = refs.owner;
  const input = root?.querySelector('input') ?? null;
  if (raw.initialRoot === undefined && root) raw.initialRoot = root;
  if (raw.initialInput === undefined && input) raw.initialInput = input;
  const active = document.activeElement;
  const popups = [...document.querySelectorAll('.ant-picker-dropdown')];
  const popupData = popups.map(popup => {
    const surface = describe(popup);
    const visible = surface.box.width > 0 && surface.box.height > 0
      && surface.css.display !== 'none' && surface.css.visibility !== 'hidden';
    const ancestors = [];
    let ancestor = popup.parentElement;
    while (ancestor && ancestor !== document.documentElement) {
      ancestors.push(describe(ancestor));
      ancestor = ancestor.parentElement;
    }
    return { surface, visible,
      geometryState: visible ? 'visible-layout-observation' : 'hidden-layout-may-be-zero-or-stale',
      ancestors,
      panels: [...popup.querySelectorAll('.ant-picker-panel,.ant-picker-time-panel')].map(describe),
      columns: [...popup.querySelectorAll('ul.ant-picker-time-panel-column')].map(column => ({
        type: column.getAttribute('aria-label'), unitAttribute: 'aria-label', surface: describe(column),
        rows: [...column.querySelectorAll('li')].map(row => ({
          surface: describe(row), valueAttribute: row.getAttribute('data-value'),
          button: describe(row.querySelector('button')),
          selectedClass: row.classList.contains('ant-picker-time-panel-cell-selected'),
          disabledClass: row.classList.contains('ant-picker-time-panel-cell-disabled'),
          offsetFromFirstRow: row.offsetTop - column.querySelector('li').offsetTop
        }))
      }))
    };
  });
  return {
    owner: api.read(),
    refs: {
      owner: owner == null ? null : id(owner),
      control: control == null ? null : {
        identity: id(control), own: recorder.own(control), encoded: recorder.encode(control),
        raw: recorder.raw(control)
      },
      nativeElement: id(root),
      targetA: id(refs.targetA),
      targetB: id(refs.targetB)
    },
    ownerDOM: describe(owner), root: describe(root),
    sameRootAsInitial: root === raw.initialRoot,
    sameInputAsInitial: input === raw.initialInput,
    input: input === null ? null : { ...describe(input), value: input.value,
      defaultValue: input.defaultValue, selectionStart: input.selectionStart,
      selectionEnd: input.selectionEnd, selectionDirection: input.selectionDirection,
      focused: input === active },
    focus: active == null ? null : { identity: id(active), tag: active.tagName,
      attributes: attributes(active), connected: active.isConnected },
    targets: { A: describe(refs.targetA), B: describe(refs.targetB) },
    publicRefBoundary: 'Actual Svelte component exports focus/blur; nativeElement is a separate public binding. No React-shaped current/getters are created.',
    rowBoundary: 'Actual Native LI/BUTTON attrs and aria-label/pressed are retained; absent data-value staysnull. No Source data-type/data-value is added.',
    popups: popupData,
    retained: [...raw.retainedNodes].filter(node => !raw.preMountNodes.has(node)).map(node => ({
      identity: id(node), tag: node.nodeName, connected: node.isConnected,
      parentIdentity: id(node.parentNode), attributes: node.nodeType === 1 ? attributes(node) : null
    })),
    environment: { viewport: { width: innerWidth, height: innerHeight }, scrollX, scrollY,
      devicePixelRatio, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language },
    resources: { timing: performance.getEntriesByType('resource').map(entry => entry.toJSON()),
      timers: null, frames: null, observers: null,
      note: 'No global hook is installed; private resource counts are unmeasured.' }
  };
}
