/** The same measured frame projection is used by the independent Source and Native consumers. */
export function readTreeSelectAlignFrame() {
  const host = document.querySelector<HTMLElement>('[data-align-frame-case]')!;
  const root = host.querySelector<HTMLElement>('[data-align-frame-root]')
    ?? host.querySelector<HTMLElement>('.ant-select')!;
  const popup = document.querySelector<HTMLElement>('.ant-tree-select-dropdown');
  // Округляет дробное измерение до тысячных для сравнения снимков.
  const round = (value: number) => Math.round(value * 1000) / 1000;
  // Сохраняет измеренный box в простых числах для передачи из browser realm.
  const rect = (node: Element) => {
    const box = node.getBoundingClientRect();
    return {
      x: round(box.x), y: round(box.y),
      width: round(box.width), height: round(box.height)
    };
  };
  const rootBox = root.getBoundingClientRect();
  const popupStyle = popup ? getComputedStyle(popup) : null;
  const visible = Boolean(popup && !popup.hidden && popupStyle!.display !== 'none'
    && popup.getClientRects().length);
  const output = document.querySelector('[data-align-frame-events]');
  const offsetParent = popup?.offsetParent;
  const active = root.getRootNode() as Document | ShadowRoot;
  return {
    view: {
      viewport: { width: innerWidth, height: innerHeight },
      host: rect(host),
      root: {
        tag: root.tagName,
        marker: root.getAttribute('data-align-frame-root'),
        box: rect(root),
        focused: active.activeElement === root,
        expanded: root.getAttribute('aria-expanded'),
        direction: getComputedStyle(root).direction
      },
      popup: visible ? {
        box: rect(popup!),
        relativeRoot: (() => {
          const box = popup!.getBoundingClientRect();
          return {
            x: round(box.x - rootBox.x), y: round(box.y - rootBox.y),
            width: round(box.width), height: round(box.height)
          };
        })(),
        placementClasses: [...popup!.classList].filter(name => name.includes('-placement-')),
        visible,
        direction: popupStyle!.direction
      } : null,
      events: output ? JSON.parse(output.textContent || '[]') : null
    },
    raw: {
      hostTransform: getComputedStyle(host).transform,
      popupPosition: popupStyle?.position ?? null,
      axes: popup ? {
        left: popup.style.left,
        top: popup.style.top,
        right: popup.style.right,
        bottom: popup.style.bottom,
        transform: popup.style.transform
      } : null,
      offsetParent: offsetParent ? {
        tag: offsetParent.tagName,
        caseHost: offsetParent === host,
        box: rect(offsetParent)
      } : null,
      container: popup ? host.contains(popup) ? 'host' : 'body' : null
    }
  };
}
