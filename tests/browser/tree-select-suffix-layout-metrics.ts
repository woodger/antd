import type { TreeSelectSuffixLayoutPoint } from './fixtures/tree-select-suffix-layout-cases';

/** Same physical probes in Source and Native; no forced click or target normalization. */
export function treeSelectSuffixLayoutPoint(point: TreeSelectSuffixLayoutPoint) {
  const host = document.querySelector('[data-suffix-layout-case]')!;
  const root = host.querySelector<HTMLElement>('.ant-select')!;
  const editor = root.querySelector<HTMLElement>('[data-suffix-layout-editor]')!;
  const prefix = root.querySelector<HTMLElement>('[data-suffix-layout-prefix]');
  const popup = document.querySelector<HTMLElement>('.ant-tree-select-dropdown');
  const box = (point === 'root-edge' ? root : editor).getBoundingClientRect();
  const x = box.x + (point === 'root-edge' ? 1 : Math.min(3, box.width / 2));
  const y = box.y + (point === 'root-edge' ? box.height / 2
    : point === 'editor-bottom' ? Math.max(1, box.height - 2) : Math.min(4, box.height / 2));
  const hit = document.elementFromPoint(x, y);
  const region = hit && editor.contains(hit) ? 'editor' : hit && prefix?.contains(hit) ? 'prefix'
    : hit && popup?.contains(hit) ? 'popup' : hit && root.contains(hit) ? 'selector' : 'outside';
  return { x, y, hit: region };
}

export function readTreeSelectSuffixLayout() {
  const host = document.querySelector('[data-suffix-layout-case]')!;
  const root = host.querySelector<HTMLElement>('.ant-select')!;
  const content = root.querySelector<HTMLElement>('.ant-select-content')!;
  const editor = root.querySelector<HTMLInputElement | HTMLTextAreaElement>('[data-suffix-layout-editor]')!;
  const suffix = editor.closest<HTMLElement>('.ant-select-content-item-suffix,[data-ant-tree-choice-input-suffix]')!;
  const prefix = root.querySelector<HTMLElement>('[data-suffix-layout-prefix]');
  const wrapper = root.querySelector<HTMLElement>('[data-suffix-layout-wrapper]');
  const restLabel = content.querySelector<HTMLElement>('[data-suffix-layout-rest]');
  const rest = restLabel?.closest<HTMLElement>('.ant-select-content-item-rest,[data-tree-choice-rest]') ?? null;
  const base = content.getBoundingClientRect(), rootBox = root.getBoundingClientRect();
  // Rounds the fractional dimension to the thousandth for comparing images.
  const round = (value: number) => Math.round(value * 1000) / 1000;
  // Saves the measured box in prime numbers to transmit from browser realm.
  function box(node: HTMLElement | null) {
    if (!node) {
      return null;
    }
    const rect = node.getBoundingClientRect(), style = getComputedStyle(node);
    return { x: round(rect.x - base.x), y: round(rect.y - base.y), width: round(rect.width), height: round(rect.height),
      offsetWidth: node.offsetWidth, offsetHeight: node.offsetHeight,
      clientWidth: node.clientWidth, clientHeight: node.clientHeight, scrollWidth: node.scrollWidth, scrollHeight: node.scrollHeight,
      position: style.position, display: style.display, overflowX: style.overflowX, overflowY: style.overflowY };
  }
  const visible = (node: HTMLElement) => !node.closest('[aria-hidden="true"],[inert]');
  const items = [...content.querySelectorAll<HTMLElement>(
    ':scope > .ant-select-content-item:not(.ant-select-content-item-suffix):not(.ant-select-content-item-rest):not(.ant-select-content-item-prefix),:scope > [data-tree-choice-tag]'
  )];
  const labels: Record<string, string> = { One: 'a', Two: 'b', Three: 'c', Four: 'd' };
  const tags = items.map(node => {
    const value = node.querySelector('[data-suffix-layout-tag]')?.getAttribute('data-suffix-layout-tag')
      ?? labels[node.querySelector('.ant-select-selection-item-content')?.textContent?.trim() ?? node.textContent?.trim() ?? ''] ?? '?';
    return { value, visible: visible(node), box: box(node) };
  });
  const popup = document.querySelector<HTMLElement>('.ant-tree-select-dropdown');
  const popupVisible = Boolean(popup && popup.getClientRects().length && getComputedStyle(popup).visibility !== 'hidden');
  const direction = getComputedStyle(root).direction;
  const popupBox = popup?.getBoundingClientRect();
  const region = (x: number, y: number) => {
    const hit = document.elementFromPoint(x, y);
    return hit && editor.contains(hit) ? 'editor' : hit && prefix?.contains(hit) ? 'prefix'
      : hit && popup?.contains(hit) ? 'popup' : hit && root.contains(hit) ? 'selector' : 'outside';
  };
  const editorBox = editor.getBoundingClientRect();
  const x = editorBox.x + Math.min(3, editorBox.width / 2);
  const suffixStyle = getComputedStyle(suffix);
  return { direction, query: editor.value, focused: document.activeElement === editor,
    selection: [editor.selectionStart, editor.selectionEnd], variable: editor.style.getPropertyValue('--select-input-width'),
    open: root.classList.contains('ant-select-open'),
    root: box(root), content: box(content), suffix: {
      ...box(suffix)!,
      top: suffixStyle.top,
      inlineStart: suffixStyle.insetInlineStart
    },
    editor: box(editor), prefix: box(prefix), wrapper: box(wrapper),
    tags, rendered: tags.map(tag => tag.value), visible: tags.filter(tag => tag.visible).map(tag => tag.value),
    rest: rest ? {
      visible: visible(rest),
      omitted: restLabel!.getAttribute('data-suffix-layout-omitted')?.split(',').filter(Boolean) ?? [],
      box: box(rest)
    } : null,
    popup: popupVisible && popupBox && popup ? { width: round(popupBox.width), height: round(popupBox.height),
      clientWidth: popup.clientWidth, clientHeight: popup.clientHeight, scrollWidth: popup.scrollWidth, scrollHeight: popup.scrollHeight,
      x: round(popupBox.x - rootBox.x), y: round(popupBox.y - rootBox.y), gap: round(popupBox.top - rootBox.bottom),
      inlineStart: round(direction === 'rtl' ? rootBox.right - popupBox.right : popupBox.left - rootBox.left) } : null,
    hit: { editorStart: region(x, editorBox.y + Math.min(4, editorBox.height / 2)),
      editorBottom: region(x, editorBox.y + Math.max(1, editorBox.height - 2)),
      rootEdge: region(rootBox.x + 1, rootBox.y + rootBox.height / 2) },
    model: JSON.parse(host.querySelector('[data-suffix-layout-model]')!.textContent!),
    events: JSON.parse(host.querySelector('[data-suffix-layout-events]')!.textContent!) };
}
