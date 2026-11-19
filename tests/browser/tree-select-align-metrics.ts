/** Raw CSS belongs in its own block; common geometry always comes from actual DOMRects. */
export function readTreeSelectAlign() {
  const host = document.querySelector<HTMLElement>('[data-align-case]')!;
  const root = host.querySelector<HTMLElement>('[data-align-root]') ?? host.querySelector<HTMLElement>('.ant-select')!;
  const editor = root.querySelector<HTMLInputElement | HTMLTextAreaElement>('[data-align-editor],input,textarea');
  const shadow = document.querySelector('[data-align-shadow]')?.shadowRoot;
  const popup = shadow?.querySelector<HTMLElement>('.ant-tree-select-dropdown') ?? document.querySelector<HTMLElement>('.ant-tree-select-dropdown');
  const visible = Boolean(popup && !popup.hidden && getComputedStyle(popup).display !== 'none' && popup.getClientRects().length);
  // Округляет дробное измерение до тысячных для сравнения снимков.
  const round = (n: number) => Math.round(n * 1000) / 1000;
  // Сохраняет измеренный box в простых числах для передачи из browser realm.
  const rect = (node: Element | null) => {
    if (!node) {
      return null;
    }
    const r = node.getBoundingClientRect();
    return { x: round(r.x), y: round(r.y), width: round(r.width), height: round(r.height) };
  };
  const rootBox = root.getBoundingClientRect(), popupBox = visible ? popup!.getBoundingClientRect() : null;
  const relative = (node: Element) => {
    const r = node.getBoundingClientRect();
    return {
      x: round(r.x - rootBox.x),
      y: round(r.y - rootBox.y),
      width: round(r.width),
      height: round(r.height)
    };
  };
  // Читает сериализованное состояние fixture. Отсутствующий output остаётся null.
  const output = (name: string) => {
    const node = document.querySelector(`[data-align-${name}]`);
    return node ? JSON.parse(node.textContent || 'null') : null;
  };
  const keyNames = ['popupAlign', 'builtinPlacements'];
  const leaks = (node: HTMLElement | null) => node ? {
    attributes: [...node.attributes].filter(attr => keyNames.some(key => key.toLowerCase() === attr.name.toLowerCase())).map(attr => [attr.name, attr.value]),
    ownProperties: keyNames.filter(key => Object.hasOwn(node, key))
  } : null;
  const active = editor ? editor.getRootNode() as Document | ShadowRoot : root.getRootNode() as Document | ShadowRoot;
  const popupStyle = popup ? getComputedStyle(popup) : null;
  const offsetParent = popup?.offsetParent;
  return {
    view: {
      viewport: { width: innerWidth, height: innerHeight },
      root: {
        tag: root.tagName,
        box: rect(root),
        direction: getComputedStyle(root).direction,
        rtlClass: root.classList.contains('ant-select-rtl')
      },
      editor: editor ? { box: relative(editor), value: editor.value, caret: [editor.selectionStart, editor.selectionEnd],
        focused: active.activeElement === editor, expanded: editor.getAttribute('aria-expanded'), readonly: editor.readOnly, disabled: editor.disabled } : null,
      focused: active.activeElement === (editor ?? root),
      popup: popupBox ? { box: rect(popup), relativeRoot: relative(popup!),
        gap: round(popupBox.top - rootBox.bottom), aboveGap: round(rootBox.top - popupBox.bottom),
        endDistance: round(rootBox.right - popupBox.right), rtlClass: popup!.classList.contains('ant-tree-select-dropdown-rtl'),
        direction: popupStyle!.direction } : null,
      host: rect(host),
      scroller: (() => {
        const node = document.querySelector<HTMLElement>('[data-align-scroller]');
        return node ? { top: node.scrollTop, left: node.scrollLeft } : null;
      })(),
      model: output('model'), events: output('events'), semantic: output('semantic'), receivedAttrs: output('received'),
      leakedProps: { root: leaks(root), editor: leaks(editor), popup: leaks(popup) }
    },
    raw: {
      rootDir: root.getAttribute('dir'), editorDir: editor?.getAttribute('dir') ?? null,
      popup: popup ? { visible, position: popupStyle!.position,
        axes: {
          left: popup.style.left,
          right: popup.style.right,
          top: popup.style.top,
          bottom: popup.style.bottom,
          transform: popup.style.transform
        },
        cssWidth: popupStyle!.width, cssHeight: popupStyle!.height, computedTransform: popupStyle!.transform,
        offsetParent: offsetParent ? { tag: offsetParent.tagName, caseHost: offsetParent === host,
          shadowHost: offsetParent === document.querySelector('[data-align-shadow]'), box: rect(offsetParent) } : null,
        parentTag: popup.parentElement?.tagName ?? null,
        container: popup.getRootNode() === shadow ? 'shadow' : host.contains(popup) ? 'host' : 'body',
        placementClasses: [...popup.classList].filter(name => name.includes('-placement-')),
        semanticMarker: popupStyle!.getPropertyValue('--align-semantic').trim() } : null,
      document: { compatMode: document.compatMode, scrollX, scrollY,
        clientWidth: document.documentElement.clientWidth, clientHeight: document.documentElement.clientHeight,
        scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight }
    }
  };
}
