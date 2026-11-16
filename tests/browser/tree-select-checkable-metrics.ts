/** Public DOM projection shared by the unmodified Source UMD and Native consumer. */
export function readTreeSelectCheckable() {
  const host = document.querySelector<HTMLElement>('[data-checkable-case]')!;
  const root = host.querySelector<HTMLElement>('[data-checkable-root]')
    ?? host.querySelector<HTMLElement>('.checkable-audit-root')!;
  const editor = root.querySelector<HTMLInputElement>('[data-checkable-editor],input[role="combobox"]');
  const popup = [...document.querySelectorAll<HTMLElement>('.checkable-audit-popup')]
    .find(node => !node.hidden && getComputedStyle(node).display !== 'none') ?? null;
  const output = (name: string) => {
    const node = host.querySelector(`[data-checkable-${name}]`);
    return node ? JSON.parse(node.textContent || 'null') : null;
  };
  const rows = popup ? [...popup.querySelectorAll<HTMLElement>('[role="treeitem"]')] : [];
  const title = (row: Element) => row.querySelector('.ant-select-tree-title,.ant-tree-title')?.textContent ?? null;
  const checkbox = (row: Element) => row.querySelector<HTMLElement>('.ant-select-tree-checkbox,.ant-tree-checkbox');
  const hasClass = (node: Element | null, suffix: string) => Boolean(node && [...node.classList]
    .some(name => name.endsWith(suffix)));
  const searchable = host.getAttribute('data-checkable-searchable') === 'true';
  const multiple = root.classList.contains('ant-select-multiple');
  const tags = [...root.querySelectorAll('.ant-select-selection-item-content')]
    .map(node => node.textContent);
  const leaks = [root, editor, popup].filter((node): node is HTMLElement => Boolean(node))
    .flatMap(node => [...node.attributes].filter(attribute => attribute.name.toLowerCase() === 'treecheckable')
      .map(attribute => ({ tag: node.tagName, name: attribute.name, value: attribute.value })));
  return {
    view: {
      descriptor: output('descriptor'), model: output('model'), query: output('query'),
      multiple, open: Boolean(popup),
      editor: editor ? { readonly: editor.readOnly, disabled: editor.disabled,
        value: searchable ? editor.value : null,
        caret: searchable ? [editor.selectionStart, editor.selectionEnd] : null,
        focused: document.activeElement === editor } : null,
      tags,
      nodes: rows.map(row => ({
        title: title(row), checkbox: Boolean(checkbox(row)),
        checked: hasClass(checkbox(row), '-checkbox-checked'),
        halfChecked: hasClass(checkbox(row), '-checkbox-indeterminate'),
        selected: hasClass(row, '-treenode-selected'),
        disabled: hasClass(row, '-treenode-disabled') || hasClass(checkbox(row), '-checkbox-disabled')
      })),
      standardCheckboxCount: popup?.querySelectorAll('.ant-select-tree-checkbox-inner,.ant-tree-checkbox-inner').length ?? 0,
      ignored: output('ignored'),
      ignoredContentPresent: Boolean(document.querySelector('[data-checkable-ignored-content]')),
      semantic: output('semantic'), receivedAttrs: output('received'), events: output('events'), leaks
    },
    raw: {
      root: { tag: root.tagName, id: root.id, role: root.getAttribute('role'),
        expanded: root.getAttribute('aria-expanded'), classes: [...root.classList] },
      editor: editor ? { tag: editor.tagName, id: editor.id, role: editor.getAttribute('role'),
        expanded: editor.getAttribute('aria-expanded'), value: editor.value,
        caret: [editor.selectionStart, editor.selectionEnd], focused: document.activeElement === editor } : null,
      nodes: rows.map(row => ({ title: title(row), tag: row.tagName,
        role: row.getAttribute('role'), checked: row.getAttribute('aria-checked'),
        selected: row.getAttribute('aria-selected'), classes: [...row.classList],
        checkbox: checkbox(row) ? { tag: checkbox(row)!.tagName,
          role: checkbox(row)!.getAttribute('role'), checked: checkbox(row)!.getAttribute('aria-checked') } : null })),
      semantic: output('raw-semantic')
    }
  };
}
