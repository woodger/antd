/** Public DOM observations only; Source and Native retain their complete independent raw boxes. */
export function readPopupWidth() {
  const host = document.querySelector<HTMLElement>('[data-width-case]')!;
  const family = host.dataset.widthFamily!;
  const active = host.dataset.widthActive ?? 'year';
  const roots: (Document | ShadowRoot)[] = [document];
  for (const node of document.querySelectorAll<HTMLElement>('[data-width-shadow]')) if (node.shadowRoot) roots.push(node.shadowRoot);
  const all = (selector: string) => roots.flatMap(root => [...root.querySelectorAll<HTMLElement>(selector)]);
  const refs: { root?: HTMLElement; anchor?: HTMLElement; editor?: HTMLInputElement | HTMLTextAreaElement;
    control?: Record<string, unknown>; publicRoot?: HTMLElement; publicEditor?: HTMLElement; getterCalls?: unknown[] } = {};
  host.querySelector('[data-width-command]')?.dispatchEvent(new CustomEvent('widthrefs', { detail: refs }));
  const selected = family === 'calendar' ? host.querySelector<HTMLElement>(`.ant-picker-calendar-${active}-select`)
    : family === 'pagination' ? host.querySelector<HTMLElement>('.ant-select')
      : family === 'color-picker' ? document.querySelector<HTMLElement>('.ant-color-picker-format-select')
        ?? host.querySelector<HTMLElement>('.ant-color-picker-trigger')
        : host.querySelector<HTMLElement>('.popup-width-control');
  const root = refs.root ?? selected;
  const anchor = refs.anchor ?? root;
  const editor = refs.editor ?? root?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input[role="combobox"],input,textarea') ?? null;
  const output = (name: string) => {
    const node = host.querySelector(`[data-width-${name}]`);
    return node ? JSON.parse(node.textContent || 'null') : null;
  };
  const box = (node: Element | null | undefined) => {
    if (!node) return null;
    const r = node.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  };
  const visible = (node: HTMLElement) => {
    const style = getComputedStyle(node);
    const r = node.getBoundingClientRect();
    return !node.hidden && style.display !== 'none' && style.visibility !== 'hidden' && r.width > 0 && r.height > 0;
  };
  const popups = all('.ant-select-dropdown');
  const popup = popups.find(visible) ?? null;
  const inline = (node: HTMLElement) => ({ width: node.style.width, minWidth: node.style.minWidth,
    maxWidth: node.style.maxWidth, height: node.style.height, minHeight: node.style.minHeight,
    maxHeight: node.style.maxHeight, boxSizing: node.style.boxSizing });
  const css = (node: HTMLElement) => {
    const s = getComputedStyle(node);
    return { width: s.width, minWidth: s.minWidth, maxWidth: s.maxWidth, height: s.height,
      minHeight: s.minHeight, maxHeight: s.maxHeight, boxSizing: s.boxSizing,
      position: s.position, left: s.left, right: s.right, top: s.top, bottom: s.bottom,
      transform: s.transform, direction: s.direction, display: s.display, visibility: s.visibility,
      overflow: s.overflow, overflowY: s.overflowY, padding: s.padding,
      fontSize: s.fontSize, lineHeight: s.lineHeight };
  };
  const rows = popup ? [...popup.querySelectorAll<HTMLElement>('.ant-select-item-option,.ant-select-tree-treenode,.ant-tree-treenode')]
    .filter(node => !node.classList.contains('ant-select-tree-treenode-motion')) : [];
  const parent = (node: HTMLElement) => {
    const p = node.parentNode;
    if (p instanceof ShadowRoot) return { kind: 'shadow', tag: p.host.tagName };
    if (!(p instanceof HTMLElement)) return null;
    return { kind: p === document.body ? 'body' : p.matches('.ant-picker-calendar-header') ? 'calendar-header'
      : p === root || p === anchor ? 'anchor' : 'element', tag: p.tagName,
      classes: [...p.classList], box: box(p) };
  };
  const editorState = editor ? { value: editor.value, caret: [editor.selectionStart, editor.selectionEnd],
    focused: document.activeElement === editor, readonly: editor.readOnly, disabled: editor.disabled } : null;
  const leaks = [root, editor, ...popups].filter((node): node is HTMLElement => Boolean(node))
    .flatMap(node => [...node.attributes].filter(attr => attr.name.toLowerCase() === 'popupmatchselectwidth')
      .map(attr => ({ tag: node.tagName, name: attr.name, value: attr.value })));
  return {
    view: {
      family, active, receipts: output('receipts'), model: output('model'), query: output('query'), events: output('events'),
      anchor: box(anchor), popup: popup ? { box: box(popup),
        placement: [...popup.classList].filter(name => name.includes('-placement-')),
        computedWidth: getComputedStyle(popup).width,
        stretch: { width: Boolean(popup.style.width), minWidth: Boolean(popup.style.minWidth) } } : null,
      editor: editorState, viewport: { width: innerWidth, height: innerHeight }, leaks
    },
    raw: {
      root: root ? { tag: root.tagName, classes: [...root.classList], box: box(root), css: css(root) } : null,
      anchor: anchor ? { tag: anchor.tagName, box: box(anchor), css: css(anchor) } : null,
      editor: editor ? { tag: editor.tagName, role: editor.getAttribute('role'), box: box(editor), ...editorState } : null,
      publicRoot: refs.publicRoot ? { tag: refs.publicRoot.tagName, box: box(refs.publicRoot), sameRoot: refs.publicRoot === root } : null,
      publicEditor: refs.publicEditor ? { tag: refs.publicEditor.tagName, sameEditor: refs.publicEditor === editor } : null,
      methods: Object.fromEntries(['focus', 'blur', 'scrollTo'].map(name => [name, typeof refs.control?.[name] === 'function'])),
      popups: popups.map(node => ({ tag: node.tagName, visible: visible(node), box: box(node), classes: [...node.classList],
        inline: inline(node), css: css(node), parent: parent(node), offsetParent: node.offsetParent?.tagName ?? null })),
      rows: rows.map(node => ({ text: node.querySelector('.ant-select-item-option-content,.ant-select-tree-title,.ant-tree-title')?.textContent
        ?? node.textContent, box: box(node), css: css(node), role: node.getAttribute('role') })),
      itemContents: popup ? [...popup.querySelectorAll<HTMLElement>('.ant-select-item-option-content')]
        .map(node => ({ text: node.textContent, box: box(node), css: css(node) })) : [],
      holders: popup ? [...popup.querySelectorAll<HTMLElement>('[class*="virtual-list-holder"],[class$="-list-holder"]')]
        .map(node => ({ classes: [...node.classList], box: box(node), css: css(node), top: node.scrollTop,
          scrollHeight: node.scrollHeight, clientHeight: node.clientHeight })) : [],
      ariaLists: popup ? [...popup.querySelectorAll<HTMLElement>('[role="listbox"],[role="tree"]')]
        .map(node => ({ role: node.getAttribute('role'), box: box(node), rows: node.querySelectorAll('[role="option"],[role="treeitem"]').length })) : [],
      getterCalls: refs.getterCalls ?? output('getters') ?? [],
      outerColorPopup: family === 'color-picker' ? all('.ant-color-picker').map(node => ({ box: box(node), css: css(node) })) : [],
      document: { clientWidth: document.documentElement.clientWidth, clientHeight: document.documentElement.clientHeight,
        scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight,
        left: scrollX, top: scrollY }
    }
  };
}
