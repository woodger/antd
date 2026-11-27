/** Actual public DOM only. Shared by the unmodified Source UMD and Native consumers. */
export function readPopupOverflow() {
  const host = document.querySelector<HTMLElement>('[data-overflow-case]')!;
  const family = host.dataset.overflowFamily!;
  const roots: (Document | ShadowRoot)[] = [document];
  for (const node of document.querySelectorAll<HTMLElement>('[data-overflow-shadow]')) {
    if (node.shadowRoot) roots.push(node.shadowRoot);
  }
  const all = (selector: string) => roots.flatMap(root => [...root.querySelectorAll<HTMLElement>(selector)]);
  const refs: { root?: HTMLElement; anchor?: HTMLElement; editor?: HTMLInputElement | HTMLTextAreaElement;
    control?: Record<string, unknown>; publicRoot?: HTMLElement; publicEditor?: HTMLElement;
    getterCalls?: unknown[] } = {};
  host.querySelector('[data-overflow-command]')?.dispatchEvent(new CustomEvent('overflowrefs', { detail: refs }));
  const root = refs.root ?? (family === 'color-picker'
    ? document.querySelector<HTMLElement>('.ant-color-picker-format-select')
    : ['pagination', 'calendar'].includes(family) ? host.querySelector<HTMLElement>('.ant-select')
      : host.querySelector<HTMLElement>('.popup-overflow-control'))!;
  const anchor = refs.anchor ?? host.querySelector<HTMLElement>('[data-overflow-anchor]') ?? root;
  const editor = refs.editor ?? root?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input[role="combobox"],input,textarea')
    ?? (root?.matches('input,textarea') ? root as HTMLInputElement | HTMLTextAreaElement : null);
  const output = (name: string) => {
    const node = host.querySelector(`[data-overflow-${name}]`);
    return node ? JSON.parse(node.textContent || 'null') : null;
  };
  const box = (node: Element | null | undefined) => {
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  };
  const visible = (node: HTMLElement) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return !node.hidden && style.display !== 'none' && style.visibility !== 'hidden'
      && rect.width > 0 && rect.height > 0;
  };
  const popupSelector = family === 'tooltip' ? '.ant-tooltip'
    : family === 'date-picker' ? '.ant-picker-dropdown'
      : family === 'mentions' ? '.ant-mentions-dropdown'
        : family === 'cascader-panel' ? '[data-overflow-no-popup]' : '.ant-select-dropdown';
  const popups = all(popupSelector);
  const popup = popups.find(visible) ?? null;
  const placement = (node: Element | null) => node ? [...node.classList].filter(name => name.includes('-placement-')) : [];
  const css = (node: HTMLElement | null | undefined) => {
    if (!node) return null;
    const style = getComputedStyle(node);
    return { position: style.position, left: style.left, right: style.right, top: style.top, bottom: style.bottom,
      width: style.width, minWidth: style.minWidth, maxWidth: style.maxWidth,
      height: style.height, transform: style.transform, direction: style.direction,
      display: style.display, visibility: style.visibility, overflow: style.overflow };
  };
  const parent = (node: HTMLElement) => {
    const parent = node.parentNode;
    return parent instanceof ShadowRoot ? { kind: 'shadow', tag: parent.host.tagName }
      : parent instanceof HTMLElement ? { kind: parent === document.body ? 'body'
        : parent.closest('[data-overflow-clip]') ? 'clip' : 'element', tag: parent.tagName } : null;
  };
  const leaks = [root, editor, ...popups].filter((node): node is HTMLElement => Boolean(node))
    .flatMap(node => [...node.attributes].filter(attribute => attribute.name.toLowerCase() === 'popupoverflow')
      .map(attribute => ({ tag: node.tagName, name: attribute.name, value: attribute.value })));
  const clip = host.querySelector<HTMLElement>('[data-overflow-clip]');
  const scroller = clip ? { box: box(clip), left: clip.scrollLeft, top: clip.scrollTop,
    clientWidth: clip.clientWidth, clientHeight: clip.clientHeight,
    scrollWidth: clip.scrollWidth, scrollHeight: clip.scrollHeight } : null;
  const editorState = editor ? { value: editor.value, caret: [editor.selectionStart, editor.selectionEnd],
    focused: document.activeElement === editor, readonly: editor.readOnly, disabled: editor.disabled } : null;
  return {
    view: {
      family, context: output('context'), model: output('model'), query: output('query'), events: output('events'),
      anchor: box(anchor), popup: popup ? { box: box(popup), placement: placement(popup) } : null,
      editor: editorState,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      document: { clientWidth: document.documentElement.clientWidth, clientHeight: document.documentElement.clientHeight,
        scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight,
        left: window.scrollX, top: window.scrollY },
      scroller, leaks
    },
    raw: {
      root: root ? { tag: root.tagName, box: box(root), classes: [...root.classList], css: css(root) } : null,
      anchor: anchor ? { tag: anchor.tagName, box: box(anchor), css: css(anchor) } : null,
      publicRoot: refs.publicRoot ? { tag: refs.publicRoot.tagName, box: box(refs.publicRoot),
        sameRoot: refs.publicRoot === root, sameAnchor: refs.publicRoot === anchor } : null,
      publicEditor: refs.publicEditor ? { tag: refs.publicEditor.tagName, sameEditor: refs.publicEditor === editor } : null,
      methods: Object.fromEntries(['focus', 'blur', 'scrollTo'].map(name => [name, typeof refs.control?.[name] === 'function'])),
      editor: editor ? { tag: editor.tagName, id: editor.id, role: editor.getAttribute('role'), ...editorState,
        box: box(editor) } : null,
      popups: popups.map(node => ({ tag: node.tagName, box: box(node), visible: visible(node),
        hidden: node.hidden, classes: [...node.classList], placement: placement(node), css: css(node),
        parent: parent(node), offsetParent: node.offsetParent?.tagName ?? null })),
      outerColorPopup: family === 'color-picker' ? all('.ant-color-picker').map(node => ({
        box: box(node), visible: visible(node), css: css(node), placement: placement(node) })) : [],
      getterCalls: refs.getterCalls ?? output('getters') ?? []
    }
  };
}
