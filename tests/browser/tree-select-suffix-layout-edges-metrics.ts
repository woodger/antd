/** Shared projector of physical Source/Native observations; no layout expectations. */
export function readTreeSelectSuffixLayoutEdges() {
  const host = document.querySelector<HTMLElement>('[data-suffix-edge-host]')!;
  const root = host.querySelector<HTMLElement>('.ant-select')!;
  const content = root.querySelector<HTMLElement>('.ant-select-content')!;
  const suffix = root.querySelector<HTMLElement>('.ant-select-content-item-suffix,[data-ant-tree-choice-input-suffix]')!;
  const editor = root.querySelector<HTMLInputElement | HTMLTextAreaElement>('[data-suffix-edge-editor]')!;
  const popup = document.querySelector<HTMLElement>('.ant-tree-select-dropdown');
  const rest = content.querySelector<HTMLElement>(':scope > .ant-select-content-item-rest,:scope > [data-tree-choice-rest]');
  const tags = [...content.children].filter((node): node is HTMLElement => node instanceof HTMLElement
    && (node.hasAttribute('data-tree-choice-tag') || node.classList.contains('ant-select-content-item')
      && !['ant-select-content-item-rest', 'ant-select-content-item-suffix', 'ant-select-content-item-prefix'].some(name => node.classList.contains(name))));
  const hostBox = host.getBoundingClientRect();
  const precision = (value: number) => Math.round(value * 1000) / 1000;
  const box = (node: HTMLElement | null) => {
    if (!node) {
      return null;
    }
    const rect = node.getBoundingClientRect();
    return { x: precision(rect.x - hostBox.x), y: precision(rect.y - hostBox.y),
      width: precision(rect.width), height: precision(rect.height) };
  };
  const visible = (node: HTMLElement) => node.getBoundingClientRect().height > 0
    && getComputedStyle(node).opacity !== '0' && getComputedStyle(node).visibility !== 'hidden';
  const hostStyle = getComputedStyle(host);
  return {
    direction: getComputedStyle(root).direction,
    host: { marginTop: hostStyle.marginTop, marginLeft: hostStyle.marginLeft,
      position: hostStyle.position, willChange: hostStyle.willChange },
    root: box(root), content: box(content), suffix: box(suffix), editor: box(editor),
    containerWidth: content.clientWidth,
    tags: tags.map(node => ({ visible: visible(node), box: box(node), text: node.textContent })),
    renderedTags: tags.length, visibleTags: tags.filter(visible).length,
    rest: rest ? { visible: visible(rest), box: box(rest), text: rest.textContent } : null,
    popup: popup ? {
      box: box(popup),
      gap: precision(popup.getBoundingClientRect().top - root.getBoundingClientRect().bottom)
    } : null,
    query: editor.value, focused: document.activeElement === editor,
    selection: [editor.selectionStart, editor.selectionEnd],
    variable: editor.style.getPropertyValue('--select-input-width'),
    model: JSON.parse(host.querySelector('[data-suffix-edge-model]')!.textContent!),
    events: JSON.parse(host.querySelector('[data-suffix-edge-events]')!.textContent!)
  };
}
