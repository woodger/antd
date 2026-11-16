/** Прямые наблюдения actual DOM/публичного владельца; не вычисляет ожидаемые labels. */
export function readSelectValue() {
  const owner = document.querySelector<HTMLElement>('[data-select-value-case]')!;
  const refs: { root?: HTMLElement; editor?: HTMLInputElement; control?: Record<string, unknown>;
    publicRoot?: HTMLElement; publicEditor?: HTMLInputElement } = {};
  owner.querySelector('[data-select-value-command]')?.dispatchEvent(new CustomEvent('valuerefs', { detail: refs }));
  const root = refs.root ?? owner.querySelector<HTMLElement>('.select-value-control')!;
  const editor = refs.editor ?? root.querySelector<HTMLInputElement>('input[role="combobox"]')!;
  const state: Record<string, unknown> = {};
  owner.querySelector('[data-select-value-command]')?.dispatchEvent(new CustomEvent('valueread', { detail: state }));
  const output = (name: string) => {
    if (Object.hasOwn(state, name)) return state[name];
    const node = owner.querySelector(`[data-select-value-${name}]`);
    return node ? JSON.parse(node.textContent || 'null') : null;
  };
  const box = (node: Element) => {
    const rect = node.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  };
  const css = (node: HTMLElement) => {
    const style = getComputedStyle(node);
    return Object.fromEntries(['color', 'backgroundColor', 'fontStyle', 'fontWeight', 'fontSize', 'lineHeight',
      'height', 'minHeight', 'display', 'visibility', 'width', 'paddingTop', 'paddingBottom'].map(key =>
      [key, style[key as keyof CSSStyleDeclaration]]));
  };
  const attrs = (node: Element) => [...node.attributes].map(attr => [attr.name, attr.value]);
  const measure = (node: HTMLElement) => ({ tag: node.tagName, attributes: attrs(node),
    box: box(node), css: css(node), outerHTML: node.outerHTML });
  const valueContent = root.querySelector<HTMLElement>('.ant-select-content');
  const styledValue = root.querySelector<HTMLElement>('.ant-select-content-value');
  const items = [...root.querySelectorAll<HTMLElement>('.ant-select-selection-item')];
  const nodes = [...document.querySelectorAll<HTMLElement>('.ant-select-dropdown')];
  const popup = nodes.find(node => {
    const style = getComputedStyle(node), rect = node.getBoundingClientRect();
    return !node.hidden && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  });
  const rows = popup ? [...popup.querySelectorAll<HTMLElement>('.ant-select-item-option,.ant-select-item-group')]
    .map(node => ({ text: node.querySelector('.ant-select-item-option-content')?.textContent ?? node.textContent,
      group: node.classList.contains('ant-select-item-group'), active: node.classList.contains('ant-select-item-option-active'),
      selected: node.classList.contains('ant-select-item-option-selected'), disabled: node.classList.contains('ant-select-item-option-disabled'),
      title: node.getAttribute('title'), box: box(node) })) : [];
  const leaks = [root, editor, ...nodes].flatMap(node => [...node.attributes]
    .filter(attr => ['labelinvalue', 'optionlabelprop', 'labelrender', 'fieldnames'].includes(attr.name.toLowerCase()))
    .map(attr => ({ tag: node.tagName, name: attr.name, value: attr.value })));
  return { view: { receipts: output('receipts'), model: output('model'), query: output('query'), events: output('events'),
    producers: output('producers'), content: { text: valueContent?.textContent ?? null,
      title: valueContent?.getAttribute('title') ?? null,
      hasValue: valueContent?.classList.contains('ant-select-content-has-value') ?? false,
      hasSearch: valueContent?.classList.contains('ant-select-content-has-search-value') ?? false,
      hasOptionStyle: valueContent?.classList.contains('ant-select-content-has-option-style') ?? false },
    styledValue: styledValue ? { text: styledValue.textContent, title: styledValue.getAttribute('title'),
      classes: [...styledValue.classList].filter(name => !name.startsWith('css-')), css: css(styledValue) } : null,
    selected: items.map(node => ({ text: node.querySelector('.ant-select-selection-item-content')?.textContent ?? null,
      title: node.getAttribute('title'), disabled: node.classList.contains('ant-select-selection-item-disabled'),
      remove: Boolean(node.querySelector('.ant-select-selection-item-remove')) })),
    rich: [...root.querySelectorAll<HTMLElement>('[data-select-value-node]')].map(node =>
      ({ token: node.dataset.selectValueNode!, tag: node.tagName, text: node.textContent })),
    editor: { value: editor.value, caret: [editor.selectionStart, editor.selectionEnd], focused: document.activeElement === editor,
      readonly: editor.readOnly, expanded: editor.getAttribute('aria-expanded'), controls: editor.getAttribute('aria-controls'),
      activeDescendant: editor.getAttribute('aria-activedescendant') }, rootBox: box(root),
    popup: popup ? { box: box(popup), rows } : null, leaks },
  raw: { root: measure(root), editor: measure(editor), content: valueContent ? measure(valueContent) : null,
    styledValue: styledValue ? measure(styledValue) : null, selected: items.map(measure),
    eventArguments: output('rawEvents'), producerCalls: output('producerCalls'),
    publicRoot: refs.publicRoot ? { tag: refs.publicRoot.tagName, sameRoot: refs.publicRoot === root } : null,
    publicEditor: refs.publicEditor ? { tag: refs.publicEditor.tagName, sameEditor: refs.publicEditor === editor } : null,
    methods: Object.fromEntries(['focus', 'blur', 'scrollTo'].map(name => [name, typeof refs.control?.[name] === 'function'])) } };
}
