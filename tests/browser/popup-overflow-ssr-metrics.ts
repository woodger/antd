/** HTML-only receipt parser. Does not allocate DOM or predict popup geometry. */
export function readPopupOverflowSSR(html: string) {
  const decode = (value: string) => value.replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, entity =>
    ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'" })[entity]!);
  const tags = [...html.matchAll(/<[A-Za-z][\w:-]*\b[^>]*>/g)].map(match => match[0]);
  const attr = (tag: string | undefined, name: string) => {
    if (!tag) return null;
    const match = new RegExp(`\\s${name}(?:="([^"]*)"|(?=[\\s/>]))`).exec(tag);
    return match ? decode(match[1] ?? '') : null;
  };
  const output = (name: string) => {
    const match = new RegExp(`<output(?=[^>]*\\bdata-overflow-${name}(?:[=\\s>]))[^>]*>([\\s\\S]*?)<\\/output>`).exec(html);
    return match ? JSON.parse(decode(match[1].replace(/<!--[\s\S]*?-->/g, ''))) : null;
  };
  const host = tags.find(tag => attr(tag, 'data-overflow-case') !== null);
  const editor = tags.find(tag => /^(?:<input|<textarea)\b/.test(tag) && attr(tag, 'role') === 'combobox');
  return {
    family: attr(host, 'data-overflow-family'), context: output('context'), model: output('model'),
    query: output('query'), events: output('events'), getters: output('getters'),
    editor: editor ? { tag: editor.slice(1).split(/[\s>]/)[0].toUpperCase(),
      readonly: attr(editor, 'readonly') !== null, disabled: attr(editor, 'disabled') !== null,
      value: attr(editor, 'value') ?? '' } : null,
    popupPresent: tags.some(tag => attr(tag, 'class')?.split(/\s+/).some(name =>
      ['ant-select-dropdown', 'ant-picker-dropdown', 'ant-tooltip', 'ant-mentions-dropdown'].includes(name))),
    leakedAttributes: tags.flatMap(tag => /\spopupOverflow(?:=|[\s/>])/i.test(tag)
      ? [{ tag: tag.slice(1).split(/[\s>]/)[0].toUpperCase(), name: 'popupOverflow' }] : [])
  };
}
