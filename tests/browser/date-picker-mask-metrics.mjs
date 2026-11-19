/** Actual Native DOM/public refs. No picker callbacks, state setters or Source nodes. */
export function readNativeMask() {
  const api = window.nativeMask, observation = window.nativeMaskObservation;
  const recorder = api.getRecorder(), refs = api.readRefs();
  const id = value => value == null ? null : recorder.identity(value);
  const attributes = node => [...node.attributes].map(item => [item.name, item.value]);
  const cssKeys = ['display', 'visibility', 'opacity', 'position', 'overflow', 'overflow-y',
    'color', 'background-color', 'border-color', 'font-size', 'line-height', 'text-align'];
  const describe = node => {
    if (node == null) return null;
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
      && node !== document.documentElement; node = node.parentElement) ancestors.push(describe(node));
    return { surface, visible, geometryState: visible ? 'visible-layout' : 'hidden-layout-may-be-zero-or-stale',
      ancestors, panels: [...popup.querySelectorAll('.ant-picker-panel')].map(describe),
      headers: [...popup.querySelectorAll('.ant-picker-header')].map(describe),
      headerButtons: [...popup.querySelectorAll('.ant-picker-header button')].map(node => ({
        ...describe(node), disabled: node.disabled })),
      footers: [...popup.querySelectorAll('.ant-picker-footer')].map(describe),
      footerControls: [...popup.querySelectorAll('.ant-picker-footer button, .ant-picker-footer a')].map(node => ({
        ...describe(node), disabled: node.disabled ?? null })),
      tables: [...popup.querySelectorAll('.ant-picker-content')].map(table => ({
        surface: describe(table),
        headers: [...table.querySelectorAll('thead tr')].map(row => ({
          surface: describe(row), cells: [...row.querySelectorAll(':scope > th')].map(node => ({
            surface: describe(node), contents: [...node.querySelectorAll('span')].map(describe)
          }))
        })),
        rows: [...table.querySelectorAll('tbody tr')].map(row => ({
          surface: describe(row),
          selected: row.classList.contains('ant-picker-week-panel-row-selected'),
          hover: row.classList.contains('ant-picker-week-panel-row-hover'),
          rangeStart: row.classList.contains('ant-picker-week-panel-row-range-start'),
          rangeEnd: row.classList.contains('ant-picker-week-panel-row-range-end'),
          rangeHover: row.classList.contains('ant-picker-week-panel-row-range-hover'),
          cells: [...row.querySelectorAll(':scope > td')].map(node => ({
            surface: describe(node), title: node.getAttribute('title'),
            weekNumber: node.classList.contains('ant-picker-cell-week'),
            disabled: node.classList.contains('ant-picker-cell-disabled')
          }))
        }))
      })),
      dateCells: [...popup.querySelectorAll('.ant-picker-content tbody td')].map(node => ({
        mode: node.closest('.ant-picker-week-panel,.ant-picker-date-panel,.ant-picker-month-panel,.ant-picker-year-panel,.ant-picker-decade-panel')?.className,
        panelIdentity: id(node.closest('.ant-picker-panel')), rowIdentity: id(node.closest('tr')),
        weekNumber: node.classList.contains('ant-picker-cell-week'), inRange: node.classList.contains('ant-picker-cell-in-range'),
        surface: describe(node), button: describe(node.querySelector('button')), title: node.getAttribute('title'),
        selected: node.classList.contains('ant-picker-cell-selected'),
        rangeStart: node.classList.contains('ant-picker-cell-range-start'),
        rangeEnd: node.classList.contains('ant-picker-cell-range-end'),
        disabled: node.classList.contains('ant-picker-cell-disabled') })),
      columns: [...popup.querySelectorAll('ul.ant-picker-time-panel-column')].map(column => ({
        type: column.getAttribute('aria-label'), sourceDataTypeAttribute: column.getAttribute('data-type'),
        surface: describe(column), rows: [...column.children].map(node => ({
          surface: describe(node), button: describe(node.querySelector('button')),
          valueAttribute: node.getAttribute('data-value'), nativeValueAttribute: node.getAttribute('data-picker-time-value'),
          selected: node.classList.contains('ant-picker-time-panel-cell-selected'),
          disabled: node.classList.contains('ant-picker-time-panel-cell-disabled') })) })) };
  });
  return { owner: api.read(), refs: { owner: id(refs.owner), root: id(refs.root),
      control: refs.control == null ? null : { identity: id(refs.control), own: recorder.own(refs.control),
        encoded: recorder.encode(refs.control), raw: recorder.raw(refs.control),
        focusIdentity: id(refs.control.focus), blurIdentity: id(refs.control.blur) } },
    publicRefBoundary: 'Actual Native component exports focus/blur; bind:nativeElement root is separate. No Source control.nativeElement getter is synthesized.',
    ownerDOM: describe(refs.owner), root: describe(refs.root), sameOwnerAsInitial: refs.owner === observation.initialOwner,
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
      note: 'Private resource counters unmeasured. One removable document capture observer; no global timer/frame/observer hooks.' } };
}
export function readNativeMaskProducers(cursor = 0) { return window.nativeMask.readProducers(cursor); }
export function readNativeMaskCallbacks(cursor = 0) { return window.nativeMask.readCallbacks(cursor); }
