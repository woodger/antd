/** Actual scoped Native DOM/public-ref observation. No picker callbacks or state setters. */
export function readNativeEmptyDatetime() {
  const api = window.nativeEmptyDatetime, observation = window.nativeEmptyDatetimeObservation;
  const recorder = api.getRecorder(), refs = api.readRefs();
  // Связывает повторный снимок с тем же объектом в recorder. Отсутствующее значение остаётся
  // null.
  const id = value => value == null ? null : recorder.identity(value);
  // Сохраняет полный фактический список пар имя и значение в порядке DOM.
  const attributes = node => [...node.attributes].map(item => [item.name, item.value]);
  const cssKeys = ['display', 'visibility', 'opacity', 'position', 'overflow', 'overflow-y'];
  // Снимает геометрию, атрибуты и стиль. Ссылка остаётся в журнале для повторного чтения после
  // unmount.
  const describe = node => {
    if (node == null) {
      return null;
    }
    observation.retainedNodes.add(node);
    const rect = node.getBoundingClientRect(), style = getComputedStyle(node);
    return { identity: id(node), tag: node.tagName, connected: node.isConnected,
      parentIdentity: id(node.parentNode), attributes: attributes(node), html: node.outerHTML,
      text: node.textContent, box: { x: rect.x, y: rect.y, top: rect.top, right: rect.right,
        bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height },
      css: Object.fromEntries(cssKeys.map(key => [key, style.getPropertyValue(key)])),
      scrollTop: node.scrollTop, scrollLeft: node.scrollLeft, scrollHeight: node.scrollHeight,
      scrollWidth: node.scrollWidth, clientHeight: node.clientHeight, clientWidth: node.clientWidth,
      offsetTop: node.offsetTop, offsetLeft: node.offsetLeft, offsetHeight: node.offsetHeight,
      offsetWidth: node.offsetWidth, offsetParentIdentity: id(node.offsetParent),
      children: [...node.childNodes].map(child => ({ identity: id(child), nodeType: child.nodeType,
        name: child.nodeName, data: child.nodeType === 3 || child.nodeType === 8 ? child.data : null })) };
  };
  const inputs = [...(refs.root?.querySelectorAll('input') ?? [])], active = document.activeElement;
  if (!observation.initialOwner && refs.owner) observation.initialOwner = refs.owner;
  if (!observation.initialRoot && refs.root) observation.initialRoot = refs.root;
  if (!observation.initialInputs && inputs.length) observation.initialInputs = inputs;
  const popups = [...document.querySelectorAll('[data-picker-popup]')].map(popup => {
    const surface = describe(popup);
    const visible = surface.box.width > 0 && surface.box.height > 0
      && surface.css.display !== 'none' && surface.css.visibility !== 'hidden';
    const ancestors = [];
    for (let node = popup.parentElement; node && node !== document.body
      && node !== document.documentElement; node = node.parentElement) {
      ancestors.push(describe(node));
    }
    return { surface, visible, geometryState: visible ? 'visible-layout' : 'hidden-layout-may-be-zero-or-stale',
      ancestors, panels: [...popup.querySelectorAll('.ant-picker-panel,.ant-picker-date-panel,.ant-picker-time-panel')].map(describe),
      dateCells: [...popup.querySelectorAll('.ant-picker-date-panel td[title]')].map(node => ({
        surface: describe(node), button: describe(node.querySelector('button')),
        title: node.getAttribute('title'), selected: node.classList.contains('ant-picker-cell-selected'),
        rangeStart: node.classList.contains('ant-picker-cell-range-start'),
        rangeEnd: node.classList.contains('ant-picker-cell-range-end'),
        disabled: node.classList.contains('ant-picker-cell-disabled') })),
      columns: [...popup.querySelectorAll('ul.ant-picker-time-panel-column')].map(column => ({
        type: column.getAttribute('aria-label'), unitAttribute: 'aria-label',
        sourceDataTypeAttribute: column.getAttribute('data-type'), surface: describe(column),
        rows: [...column.children].map(node => ({ surface: describe(node),
          button: describe(node.querySelector('button')), valueAttribute: node.getAttribute('data-value'),
          nativeValueAttribute: node.getAttribute('data-picker-time-value'),
          selected: node.classList.contains('ant-picker-time-panel-cell-selected'),
          disabled: node.classList.contains('ant-picker-time-panel-cell-disabled') })) })) };
  });
  return { owner: api.read(), refs: { owner: id(refs.owner), root: id(refs.root),
      control: refs.control == null ? null : { identity: id(refs.control), own: recorder.own(refs.control),
        encoded: recorder.encode(refs.control), raw: recorder.raw(refs.control),
        focusIdentity: id(refs.control.focus), blurIdentity: id(refs.control.blur) } },
    publicRefBoundary: 'Actual component control exports focus/blur; actual bind:nativeElement root is separate. No React-shaped control property or getter is synthesized.',
    ownerDOM: describe(refs.owner), root: describe(refs.root),
    sameOwnerAsInitial: refs.owner === observation.initialOwner,
    sameRootAsInitial: refs.root === observation.initialRoot,
    inputs: inputs.map((node, index) => ({ ...describe(node), value: node.value, defaultValue: node.defaultValue,
      selectionStart: node.selectionStart, selectionEnd: node.selectionEnd, selectionDirection: node.selectionDirection,
      focused: node === active, sameAsInitial: node === observation.initialInputs[index] })),
    focus: active == null ? null : { identity: id(active), tag: active.tagName,
      connected: active.isConnected, attributes: attributes(active) }, popups, events: [...observation.events],
    retained: [...observation.retainedNodes].filter(node => !observation.preMountNodes.has(node)).map(node => ({
      identity: id(node), tag: node.nodeName, connected: node.isConnected,
      parentIdentity: id(node.parentNode), attributes: attributes(node) })),
    environment: { viewport: { width: innerWidth, height: innerHeight }, scrollX, scrollY,
      devicePixelRatio, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language, dateNow: Date.now() },
    resources: { timing: performance.getEntriesByType('resource').map(entry => entry.toJSON()),
      timers: null, frames: null, observers: null,
      note: 'Private resource counters unmeasured. One removable document capture event observer; no global timer/frame/observer hooks.' } };
}
