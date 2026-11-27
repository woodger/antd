/** Scoped physical observation; never calls picker methods or private React state. */
export function readWeekSource() {
  const recorder = raw.current.recorder;
  const id = value => value == null ? null : recorder.identity(value);
  const attributes = node => [...node.attributes].map(item => [item.name, item.value]);
  const cssKeys = ['display', 'visibility', 'opacity', 'position', 'overflow', 'overflow-y',
    'color', 'background-color', 'border-color', 'font-size', 'line-height', 'text-align'];
  const describe = node => {
    if (node == null) return null;
    raw.retainedNodes.add(node);
    const rect = node.getBoundingClientRect(), style = getComputedStyle(node);
    return { identity: id(node), tag: node.tagName, connected: node.isConnected,
      parentIdentity: id(node.parentNode), attributes: attributes(node),
      html: node.outerHTML, text: node.textContent,
      box: { x: rect.x, y: rect.y, top: rect.top, right: rect.right,
        bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height },
      css: Object.fromEntries(cssKeys.map(key => [key, style.getPropertyValue(key)])),
      scrollTop: node.scrollTop, scrollLeft: node.scrollLeft,
      scrollHeight: node.scrollHeight, scrollWidth: node.scrollWidth,
      clientHeight: node.clientHeight, clientWidth: node.clientWidth,
      offsetTop: node.offsetTop, offsetLeft: node.offsetLeft,
      offsetHeight: node.offsetHeight, offsetWidth: node.offsetWidth,
      offsetParentIdentity: id(node.offsetParent),
      children: [...node.childNodes].map(child => ({ identity: id(child),
        nodeType: child.nodeType, name: child.nodeName,
        data: child.nodeType === 3 || child.nodeType === 8 ? child.data : null })) };
  };
  const refs = raw.current.readRefs(), active = document.activeElement;
  const inputs = [...(refs.root?.querySelectorAll('input') ?? [])];
  if (raw.initialInputs === undefined && inputs.length) raw.initialInputs = inputs;
  if (raw.initialOwner === undefined && refs.owner) raw.initialOwner = refs.owner;
  if (raw.initialRoot === undefined && refs.root) raw.initialRoot = refs.root;
  const popups = [...document.querySelectorAll('.ant-picker-dropdown')].map(popup => {
    const surface = describe(popup);
    const visible = surface.box.width > 0 && surface.box.height > 0
      && surface.css.display !== 'none' && surface.css.visibility !== 'hidden';
    const ancestors = [];
    for (let node = popup.parentElement; node && node !== document.documentElement;
      node = node.parentElement) ancestors.push(describe(node));
    return { surface, visible,
      geometryState: visible ? 'visible-layout' : 'hidden-layout-may-be-zero-or-stale',
      ancestors,
      panels: [...popup.querySelectorAll('.ant-picker-panel')].map(describe),
      headers: [...popup.querySelectorAll('.ant-picker-header')].map(describe),
      headerButtons: [...popup.querySelectorAll('.ant-picker-header button')].map(node => ({
        ...describe(node), disabled: node.disabled })),
      footers: [...popup.querySelectorAll('.ant-picker-footer')].map(describe),
      footerControls: [...popup.querySelectorAll('.ant-picker-footer button, .ant-picker-footer a')].map(node => ({
        ...describe(node), disabled: node.disabled ?? null })),
      tables: [...popup.querySelectorAll('.ant-picker-content')].map(table => ({
        surface: describe(table),
        headers: [...table.querySelectorAll('thead tr')].map(row => ({
          surface: describe(row),
          cells: [...row.querySelectorAll(':scope > th')].map(node => ({
            surface: describe(node),
            contents: [...node.querySelectorAll('span')].map(describe)
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
        mode: node.closest('.ant-picker-date-panel, .ant-picker-week-panel, .ant-picker-month-panel, .ant-picker-year-panel, .ant-picker-decade-panel')?.className,
        panelIdentity: id(node.closest('.ant-picker-panel')),
        rowIdentity: id(node.closest('tr')),
        weekNumber: node.classList.contains('ant-picker-cell-week'),
        inRange: node.classList.contains('ant-picker-cell-in-range'),
        surface: describe(node), title: node.getAttribute('title'),
        selected: node.classList.contains('ant-picker-cell-selected'),
        rangeStart: node.classList.contains('ant-picker-cell-range-start'),
        rangeEnd: node.classList.contains('ant-picker-cell-range-end'),
        disabled: node.classList.contains('ant-picker-cell-disabled') })),
      columns: [...popup.querySelectorAll('ul[data-type]')].map(column => ({
        type: column.getAttribute('data-type'), surface: describe(column),
        rows: [...column.querySelectorAll('li[data-value]')].map(node => ({
          surface: describe(node), value: node.getAttribute('data-value'),
          selected: node.classList.contains('ant-picker-time-panel-cell-selected'),
          disabled: node.classList.contains('ant-picker-time-panel-cell-disabled') })) })) };
  });
  return { owner: raw.current.read(),
    refs: { owner: id(refs.owner), root: id(refs.root), control: refs.control == null ? null
      : { identity: id(refs.control), own: recorder.own(refs.control),
        encoded: recorder.encode(refs.control), raw: recorder.raw(refs.control),
        nativeElementIdentity: id(refs.control.nativeElement) } },
    ownerDOM: describe(refs.owner), root: describe(refs.root),
    sameOwnerAsInitial: refs.owner === raw.initialOwner,
    sameRootAsInitial: refs.root === raw.initialRoot,
    inputs: inputs.map((node, index) => ({ ...describe(node), value: node.value,
      defaultValue: node.defaultValue, selectionStart: node.selectionStart,
      selectionEnd: node.selectionEnd, selectionDirection: node.selectionDirection,
      focused: node === active, sameAsInitial: node === raw.initialInputs[index] })),
    focus: active == null ? null : { identity: id(active), tag: active.tagName,
      connected: active.isConnected, attributes: attributes(active) },
    popups, events: [...raw.events],
    retained: [...raw.retainedNodes].filter(node => !raw.preMountNodes.has(node)).map(node => ({
      identity: id(node), tag: node.nodeName, connected: node.isConnected,
      parentIdentity: id(node.parentNode), attributes: attributes(node) })),
    environment: { viewport: { width: innerWidth, height: innerHeight }, scrollX, scrollY,
      devicePixelRatio, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language, dateNow: Date.now() },
    resources: { timing: performance.getEntriesByType('resource').map(entry => entry.toJSON()),
      timers: null, frames: null, observers: null,
      note: 'Global resource counters are unmeasured. The harness owns one removable document event observer; no timer/observer hooks.' } };
}
