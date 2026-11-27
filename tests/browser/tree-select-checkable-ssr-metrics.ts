/** DOM-free parser of real rendered HTML; does not create a browser or infer hidden popup contents. */
export function readTreeSelectCheckableSSR(html: string) {
  const decode = (value: string) => value.replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, entity =>
    ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'" })[entity]!);
  const tags = [...html.matchAll(/<[A-Za-z][\w:-]*\b[^>]*>/g)].map(match => match[0]);
  const attr = (tag: string | undefined, name: string) => {
    if (!tag) return null;
    const match = new RegExp(`\\s${name}(?:="([^"]*)"|(?=[\\s/>]))`).exec(tag);
    return match ? decode(match[1] ?? '') : null;
  };
  const output = (name: string) => {
    const match = new RegExp(`<output(?=[^>]*\\bdata-checkable-${name}(?:[=\\s>]))[^>]*>([\\s\\S]*?)<\\/output>`).exec(html);
    return match ? JSON.parse(decode(match[1].replace(/<!--[\s\S]*?-->/g, ''))) : null;
  };
  const root = tags.find(tag => attr(tag, 'data-checkable-root') !== null)
    ?? tags.find(tag => attr(tag, 'class')?.split(/\s+/).includes('checkable-audit-root'))!;
  const editor = tags.find(tag => attr(tag, 'data-checkable-editor') !== null
    || /^(?:<input|<textarea)\b/.test(tag) && attr(tag, 'role') === 'combobox');
  const tagContents = [...html.matchAll(/<span\b([^>]*\bclass="[^"]*\bant-select-selection-item-content\b[^"]*"[^>]*)>([\s\S]*?)<\/span>/g)]
    .map(match => decode(match[2].replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '')));
  return {
    descriptor: output('descriptor'), model: output('model'), query: output('query'), events: output('events'),
    multiple: Boolean(attr(root, 'class')?.split(/\s+/).includes('ant-select-multiple')),
    rootTag: root.slice(1).split(/[\s>]/)[0].toUpperCase(),
    editor: editor ? { tag: editor.slice(1).split(/[\s>]/)[0].toUpperCase(),
      readonly: attr(editor, 'readonly') !== null, disabled: attr(editor, 'disabled') !== null } : null,
    tags: tagContents,
    semantic: output('semantic'), ignored: output('ignored'), receivedAttrs: output('received'),
    ignoredContentPresent: tags.some(tag => attr(tag, 'data-checkable-ignored-content') !== null),
    popupPresent: tags.some(tag => attr(tag, 'class')?.split(/\s+/).includes('checkable-audit-popup')),
    leakedAttributes: tags.flatMap(tag => /\streeCheckable(?:=|[\s/>])/i.test(tag)
      ? [{ tag: tag.slice(1).split(/[\s>]/)[0].toUpperCase(), name: 'treeCheckable' }] : [])
  };
}
