/** Наблюдения DOM; функция не читает implementation и переносится в page.evaluate. */
export function readTreeSelectInertApi() {
  const host = document.querySelector<HTMLElement>('[data-inert-api-case]')!;
  const root = host.querySelector<HTMLElement>('[data-inert-api-root]') ?? host.querySelector<HTMLElement>('.ant-select')!;
  const editor = root.querySelector<HTMLInputElement | HTMLTextAreaElement>('input[role="combobox"],textarea[role="combobox"]');
  const popup = document.querySelector<HTMLElement>('.ant-tree-select-dropdown');
  const visible = Boolean(popup && !popup.hidden && getComputedStyle(popup).display !== 'none' && popup.getClientRects().length);
  // Читает сериализованное состояние fixture. Отсутствующий output остаётся null.
  const output = (name: string) => {
    const node = host.querySelector(`[data-inert-api-${name}]`);
    return node ? JSON.parse(node.textContent || 'null') : null;
  };
  const names = ['onPopupVisibleChange', 'popupStyle', 'choiceTransitionName', 'direction'];
  const leaks = (node: HTMLElement | null) => node ? {
    attributes: [...node.attributes].filter(attr => names.some(name => name.toLowerCase() === attr.name.toLowerCase())).map(attr => [attr.name, attr.value]),
    ownProperties: names.filter(name => Object.hasOwn(node, name))
  } : null;
  const rootBox = root.getBoundingClientRect(), popupBox = visible ? popup!.getBoundingClientRect() : null;
  // Округляет дробное измерение до тысячных для сравнения снимков.
  const round = (value: number) => Math.round(value * 1000) / 1000;
  const style = getComputedStyle(root);
  return {
    mode: output('mode'), model: output('model'), query: editor?.value ?? null,
    focused: document.activeElement === (editor ?? root), caret: editor ? [editor.selectionStart, editor.selectionEnd] : null,
    root: { tag: root.tagName, dir: root.getAttribute('dir'), direction: style.direction,
      rtlClass: root.classList.contains('ant-select-rtl'), ownStyleMarker: style.getPropertyValue('--inert-api-own-root').trim(),
      semanticStyleMarker: style.getPropertyValue('--inert-api-semantic-root').trim() },
    editor: editor ? { dir: editor.getAttribute('dir'), direction: getComputedStyle(editor).direction,
      expanded: editor.getAttribute('aria-expanded'), readonly: editor.readOnly, disabled: editor.disabled } : null,
    popup: popupBox ? {
      direction: getComputedStyle(popup!).direction, rtlClass: popup!.classList.contains('ant-tree-select-dropdown-rtl'),
      width: round(popupBox.width), x: round(popupBox.left - rootBox.left),
      endDistance: round(rootBox.right - popupBox.right), gap: round(popupBox.top - rootBox.bottom),
      block: popupBox.top >= rootBox.bottom ? 'below' : popupBox.bottom <= rootBox.top ? 'above' : 'overlap',
      outlineWidth: getComputedStyle(popup!).outlineWidth,
      ignoredStyleMarker: getComputedStyle(popup!).getPropertyValue('--inert-api-ignored-popup').trim(),
      semanticStyleMarker: getComputedStyle(popup!).getPropertyValue('--inert-api-semantic-popup').trim()
    } : null,
    leakedProps: { root: leaks(root), editor: leaks(editor), popup: leaks(popup) },
    choiceClasses: [...host.querySelectorAll<HTMLElement>('[class]')].flatMap(node => [...node.classList].filter(name => name.includes('inert-choice'))),
    receivedAttrs: output('received'), semantic: output('semantic'), events: output('events')
  };
}

/** DOM-free HTML projection: никакой геометрии или computed styles из SSR не выводится. */
export function readTreeSelectInertApiSSR(html: string) {
  const decode = (value: string) => value.replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, entity =>
    ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'" })[entity]!);
  const tags = [...html.matchAll(/<[A-Za-z][\w:-]*\b[^>]*>/g)].map(match => match[0]);
  const attr = (tag: string | undefined, name: string) => {
    if (!tag) {
      return null;
    }
    const match = new RegExp(`\\s${name}(?:="([^"]*)"|(?=[\\s/>]))`).exec(tag);
    return match ? decode(match[1] ?? '') : null;
  };
  const root = tags.find(tag => attr(tag, 'data-inert-api-root') !== null)
    ?? tags.find(tag => attr(tag, 'class')?.split(/\s+/).includes('ant-select'))!;
  const editor = tags.find(tag => /^(?:<input|<textarea)\b/.test(tag) && attr(tag, 'role') === 'combobox');
  const output = (name: string) => {
    const match = new RegExp(`<output(?=[^>]*\\bdata-inert-api-${name}(?:[=\\s>]))[^>]*>([\\s\\S]*?)<\\/output>`).exec(html);
    return match ? JSON.parse(decode(match[1].replace(/<!--[\s\S]*?-->/g, ''))) : null;
  };
  const leakedAttributes = tags.flatMap(tag => ['onPopupVisibleChange', 'popupStyle', 'choiceTransitionName', 'direction']
    .filter(name => new RegExp(`\\s${name}(?:=|[\\s/>])`, 'i').test(tag)).map(name => ({
      tag: tag.slice(1).split(/[\s>]/)[0],
      name
    })));
  return {
    mode: output('mode'), model: output('model'), events: output('events'), semantic: output('semantic'), receivedAttrs: output('received'),
    root: { tag: root.slice(1).split(/[\s>]/)[0].toUpperCase(), dir: attr(root, 'dir'),
      rtlClass: Boolean(attr(root, 'class')?.split(/\s+/).includes('ant-select-rtl')),
      ownStyleMarker: /--inert-api-own-root\s*:\s*own/.test(attr(root, 'style') ?? ''),
      semanticStyleMarker: /--inert-api-semantic-root\s*:\s*semantic/.test(attr(root, 'style') ?? '') },
    editor: editor ? { dir: attr(editor, 'dir'), expanded: attr(editor, 'aria-expanded'),
      readonly: attr(editor, 'readonly') !== null, disabled: attr(editor, 'disabled') !== null } : null,
    leakedAttributes,
    choiceClasses: tags.flatMap(tag => (attr(tag, 'class') ?? '').split(/\s+/).filter(name => name.includes('inert-choice')))
  };
}
