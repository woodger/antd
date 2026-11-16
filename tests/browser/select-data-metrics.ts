/** Только публичный DOM и наблюдения владельца; отсутствующие Source keys не выводятся. */
export function readSelectData() {
  const owner = document.querySelector<HTMLElement>('[data-select-data-case]')!;
  const roots: (Document | ShadowRoot)[] = [document];
  for (const host of document.querySelectorAll('[data-select-data-shadow]'))
    if (host.shadowRoot) roots.push(host.shadowRoot);
  const all = (selector: string) => roots.flatMap(root => [...root.querySelectorAll<HTMLElement>(selector)]);
  const refs: { root?: HTMLElement; anchor?: HTMLElement; editor?: HTMLInputElement | HTMLTextAreaElement;
    control?: Record<string, unknown>; publicRoot?: HTMLElement; publicEditor?: HTMLElement; renders?: unknown } = {};
  owner.querySelector('[data-select-data-command]')?.dispatchEvent(new CustomEvent('datarefs', { detail: refs }));
  const root = refs.root ?? owner.querySelector<HTMLElement>('.select-data-control');
  const anchor = refs.anchor ?? root;
  const editor = refs.editor ?? root?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input,textarea') ?? null;
  const state: Record<string, unknown> = {};
  owner.querySelector('[data-select-data-command]')?.dispatchEvent(new CustomEvent('dataread', { detail: state }));
  const output = (name: string) => {
    if (Object.hasOwn(state, name)) return state[name];
    const node = owner.querySelector(`[data-select-data-${name}]`);
    return node ? JSON.parse(node.textContent || 'null') : null;
  };
  const box = (node: Element | null | undefined) => {
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  };
  const css = (node: HTMLElement) => {
    const style = getComputedStyle(node);
    return Object.fromEntries(['width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
      'boxSizing', 'overflow', 'overflowX', 'overflowY', 'padding', 'paddingTop', 'paddingBottom',
      'borderTopWidth', 'borderBottomWidth', 'marginTop', 'marginBottom', 'position',
      'left', 'right', 'top', 'bottom', 'transform', 'display', 'visibility', 'opacity',
      'direction', 'fontSize', 'lineHeight'].map(name => [name, style[name as keyof CSSStyleDeclaration]]));
  };
  const visible = (node: HTMLElement) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return !node.hidden && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  };
  const measure = (node: HTMLElement | null | undefined) => node ? {
    tag: node.tagName, id: node.id, classes: [...node.classList], box: box(node),
    offsetWidth: node.offsetWidth, offsetHeight: node.offsetHeight,
    clientWidth: node.clientWidth, clientHeight: node.clientHeight,
    scrollWidth: node.scrollWidth, scrollHeight: node.scrollHeight,
    scrollTop: node.scrollTop, scrollLeft: node.scrollLeft,
    inlineStyle: node.getAttribute('style'), css: css(node)
  } : null;
  const popupNodes = all('.ant-select-dropdown');
  const popup = popupNodes.find(visible) ?? null;
  const nodes = (popup: HTMLElement | null) => {
    const holder = popup?.querySelector<HTMLElement>('[class$="-list-holder"]') ?? null;
    return { holder, filler: holder?.firstElementChild as HTMLElement | null,
      inner: popup?.querySelector<HTMLElement>('[class$="-list-holder-inner"]') ?? null };
  };
  const rows = (popup: HTMLElement) => [...popup.querySelectorAll<HTMLElement>('.ant-select-item-option,.ant-select-item-group')]
    .map(node => ({ text: node.querySelector('.ant-select-item-option-content')?.textContent ?? node.textContent,
      group: node.classList.contains('ant-select-item-group'),
      active: node.classList.contains('ant-select-item-option-active'),
      selected: node.classList.contains('ant-select-item-option-selected'),
      disabled: node.classList.contains('ant-select-item-option-disabled'),
      role: node.getAttribute('role'), id: node.id,
      ariaSelected: node.getAttribute('aria-selected'), ariaDisabled: node.getAttribute('aria-disabled'),
      renderIndex: node.querySelector('[data-select-data-render]')?.getAttribute('data-select-data-render') ?? null,
      renderKey: node.querySelector('[data-select-data-render]')?.getAttribute('data-select-data-key') ?? null,
      box: box(node) }));
  const aria = (popup: HTMLElement) => [...popup.querySelectorAll<HTMLElement>('[role="listbox"]')].map(node => ({
    id: node.id, box: box(node), options: [...node.querySelectorAll<HTMLElement>('[role="option"]')]
      .map(option => ({ id: option.id, text: option.textContent, label: option.getAttribute('aria-label'),
        selected: option.getAttribute('aria-selected'), disabled: option.getAttribute('aria-disabled') }))
  }));
  const viewport = (popup: HTMLElement) => {
    const { holder, filler, inner } = nodes(popup);
    return { holder: holder ? { box: box(holder), clientHeight: holder.clientHeight, clientWidth: holder.clientWidth,
      scrollTop: holder.scrollTop, scrollLeft: holder.scrollLeft, scrollHeight: holder.scrollHeight,
      maxHeight: getComputedStyle(holder).maxHeight, overflowY: getComputedStyle(holder).overflowY } : null,
    filler: filler ? { box: box(filler), height: getComputedStyle(filler).height } : null,
    inner: inner ? { box: box(inner), transform: getComputedStyle(inner).transform } : null,
    rows: rows(popup), aria: aria(popup),
    scrollbars: [...popup.querySelectorAll<HTMLElement>('[class$="-scrollbar"]')].map(node => ({
      box: box(node), display: getComputedStyle(node).display, opacity: getComputedStyle(node).opacity,
      thumb: box(node.querySelector('[class$="-scrollbar-thumb"]'))
    })) };
  };
  const editorState = editor ? { value: editor.value, caret: [editor.selectionStart, editor.selectionEnd],
    focused: document.activeElement === editor, readonly: editor.readOnly, disabled: editor.disabled,
    controls: editor.getAttribute('aria-controls'), activeDescendant: editor.getAttribute('aria-activedescendant'),
    expanded: editor.getAttribute('aria-expanded') } : null;
  const leakNames = ['virtual', 'listheight', 'listitemheight', 'showscrollbar', 'onactive', 'fieldnames', 'optionrender', 'labelinvalue', 'audittoken', 'ownundefined', 'meta', 'nodes', 'uid'];
  const leaks = [root, editor, ...popupNodes,
    ...popupNodes.flatMap(node => [...node.querySelectorAll<HTMLElement>('.ant-select-item-option,.ant-select-item-group')])]
    .filter((node): node is HTMLElement => Boolean(node))
    .flatMap(node => [...node.attributes].filter(attribute => leakNames.includes(attribute.name.toLowerCase()))
      .map(attribute => ({ tag: node.tagName, name: attribute.name, value: attribute.value })));
  return {
    view: { family: owner.dataset.selectDataFamily!, receipts: output('receipts'), model: output('model'),
      query: output('query'), events: output('events'), offsets: output('offsets'), producers: output('producers'),
      selected: [...(root?.querySelectorAll<HTMLElement>('.ant-select-selection-item') ?? [])].map(node => ({
        label: node.querySelector('.ant-select-selection-item-content')?.textContent ?? null,
        title: node.getAttribute('title'), disabled: node.classList.contains('ant-select-selection-item-disabled'),
        remove: Boolean(node.querySelector('.ant-select-selection-item-remove')) })), anchor: box(anchor),
      popup: popup ? { box: box(popup), placement: [...popup.classList].filter(name => name.includes('-placement-')),
        viewport: viewport(popup) } : null,
      editor: editorState, leaks },
    raw: { root: measure(root), anchor: measure(anchor), editor: editor ? { ...measure(editor), ...editorState } : null,
      selected: [...(root?.querySelectorAll<HTMLElement>('.ant-select-selection-item,.ant-select-content-value') ?? [])]
        .map(node => ({ ...measure(node), text: node.textContent, title: node.getAttribute('title'),
          remove: node.querySelector('.ant-select-selection-item-remove')?.outerHTML ?? null })),
      popups: popupNodes.map(node => ({ ...measure(node), visible: visible(node),
        holder: measure(nodes(node).holder), filler: measure(nodes(node).filler), inner: measure(nodes(node).inner),
        rows: rows(node), aria: aria(node),
        rowStyles: [...node.querySelectorAll<HTMLElement>('.ant-select-item-option,.ant-select-item-group')]
          .map(row => ({ text: row.textContent, style: css(row) })) })),
      publicRoot: refs.publicRoot ? { tag: refs.publicRoot.tagName, sameRoot: refs.publicRoot === root } : null,
      publicEditor: refs.publicEditor ? { tag: refs.publicEditor.tagName, sameEditor: refs.publicEditor === editor } : null,
      methods: Object.fromEntries(['focus', 'blur', 'scrollTo'].map(name => [name, typeof refs.control?.[name] === 'function'])),
      renders: refs.renders ?? output('renders'), producerCalls: output('producerCalls'), eventArguments: output('rawEvents'), document: { width: innerWidth, height: innerHeight, left: scrollX, top: scrollY,
        scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight } }
  };
}
