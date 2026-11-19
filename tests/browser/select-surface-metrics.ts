/** Actual public DOM projection shared by independent Source and later Native observers. */
export function readSelectSurface() {
  const owner = document.querySelector<HTMLElement>('[data-surface-case]')!;
  const refs: { root?: HTMLElement; editor?: HTMLInputElement } = {};
  owner.querySelector('[data-surface-command]')?.dispatchEvent(new CustomEvent(
    'surfacerefs',
    { detail: refs }
  ));
  const root = refs.root ?? owner.querySelector<HTMLElement>('.surface-control')!;
  const input = refs.editor ?? root.querySelector<HTMLInputElement>('input[role="combobox"]')!;
  const popups = [...document.querySelectorAll<HTMLElement>('.ant-select-dropdown')];
  const popup = popups.find(node => getComputedStyle(node).display !== 'none' && node.getBoundingClientRect().height > 0) ?? popups.at(-1);
  const box = (node: Element) => {
    const r = node.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  };
  const css = (node: Element) => {
    const style = getComputedStyle(node);
    return Object.fromEntries(['color', 'backgroundColor', 'fontSize', 'fontStyle', 'fontWeight', 'lineHeight', 'display',
      'visibility', 'opacity', 'height', 'minHeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'borderTopColor', 'borderTopStyle', 'borderTopWidth', 'outlineStyle'].map(key => [key, style[key as keyof CSSStyleDeclaration]]));
  };
  const publicAttrs = (node: Element) => [...node.attributes].filter(attr =>
    ['role', 'title', 'disabled', 'aria-label', 'aria-disabled', 'aria-selected', 'aria-expanded'].includes(attr.name))
    .map(attr => [attr.name, attr.value]);
  const projected = (node: HTMLElement) => ({ tag: node.tagName, text: node.textContent,
    authoredClasses: [...node.classList].filter(name => name.startsWith('surface-')),
    attributes: publicAttrs(node), css: css(node), box: box(node) });
  const measure = (node: HTMLElement) => ({ ...projected(node),
    attributes: [...node.attributes].map(attr => [attr.name, attr.value]), outerHTML: node.outerHTML });
  const selectors: Record<string, string> = { prefix: '.ant-select-prefix', suffix: '.ant-select-suffix',
    input: '.ant-select-input', placeholder: '.ant-select-placeholder', content: '.ant-select-content',
    item: '.ant-select-selection-item', itemContent: '.ant-select-selection-item-content',
    itemRemove: '.ant-select-selection-item-remove', clear: '.ant-select-clear' };
  const slots: Record<string, HTMLElement[]> = { root: [root] };
  for (const [key, selector] of Object.entries(selectors)) slots[key] = [...root.querySelectorAll<HTMLElement>(selector)];
  slots['popup.root'] = popup ? [popup] : [];
  slots['popup.list'] = popup ? [...popup.querySelectorAll<HTMLElement>('.ant-select-dropdown-list')] : [];
  slots['popup.listItem'] = popup ? [...popup.querySelectorAll<HTMLElement>('.ant-select-item-option')] : [];
  const extras = popup ? [...popup.querySelectorAll<HTMLElement>('[data-surface-node],[data-surface-popup],[data-surface-header],[data-surface-footer],[data-surface-footer-input],.ant-select-item-group,.ant-select-item-empty')] : [];
  const active = document.activeElement;
  const focus = active === input ? 'editor' : active === owner.querySelector('[data-surface-outside]') ? 'outside'
    : active?.matches('[data-surface-footer]') ? 'footer' : active?.matches('[data-surface-footer-input]') ? 'footer-input' : null;
  const visible = Boolean(popup && getComputedStyle(popup).display !== 'none' && getComputedStyle(popup).visibility !== 'hidden' && box(popup).height > 0);
  const leaks = [root, input, ...popups].flatMap(node => [...node.attributes].filter(attr =>
    ['popupRender', 'classNames', 'styles', 'components'].map(name => name.toLowerCase()).includes(attr.name.toLowerCase()))
    .map(attr => [node.tagName, attr.name, attr.value]));
  return { view: { slots: Object.fromEntries(Object.entries(slots).map(([key, nodes]) => [key, nodes.map(projected)])),
    popup: { present: Boolean(popup), visible, extras: extras.map(projected) },
    editor: { value: input.value, caret: [input.selectionStart, input.selectionEnd], disabled: input.disabled,
      readonly: input.readOnly, expanded: input.getAttribute('aria-expanded') }, focus, leaks },
    raw: { slots: Object.fromEntries(Object.entries(slots).map(([key, nodes]) => [key, nodes.map(measure)])),
      extras: extras.map(measure), active: active ? {
        tag: active.tagName,
        attributes: [...active.attributes].map(attr => [attr.name, attr.value])
      } : null } };
}
