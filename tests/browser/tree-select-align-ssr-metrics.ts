import type { TreeSelectAlignSample } from './fixtures/tree-select-align-cases';

/** DOM-free SSR: читаем только emitted attributes и actual callback receipts, без предполагаемой геометрии. */
export function readTreeSelectAlignSSR(html: string) {
  const decode = (value: string) => value.replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, entity =>
    ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'" })[entity]!);
  const tags = [...html.matchAll(/<[A-Za-z][\w:-]*\b[^>]*>/g)].map(match => match[0]);
  const attribute = (tag: string | undefined, name: string) => {
    if (!tag) return null;
    const match = new RegExp(`\\s${name}(?:="([^"]*)"|(?=[\\s/>]))`, 'i').exec(tag);
    return match ? decode(match[1] ?? '') : null;
  };
  const root = tags.find(tag => attribute(tag, 'data-align-root') !== null)
    ?? tags.find(tag => attribute(tag, 'class')?.split(/\s+/).includes('ant-select'));
  if (!root) throw Error('Missing TreeSelect SSR root');
  const editor = tags.find(tag => /^(?:<input|<textarea)\b/i.test(tag)
    && (attribute(tag, 'data-align-editor') !== null || attribute(tag, 'role') === 'combobox'));
  const style = (tag: string | undefined, name: string) => {
    const match = new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`).exec(attribute(tag, 'style') ?? '');
    return match?.[1].trim() ?? null;
  };
  const output = (name: string) => {
    const match = new RegExp(`<output(?=[^>]*\\bdata-align-${name}(?:[=\\s>]))[^>]*>([\\s\\S]*?)<\\/output>`).exec(html);
    return match ? JSON.parse(decode(match[1].replace(/<!--[\s\S]*?-->/g, ''))) : null;
  };
  const classes = (tag: string) => attribute(tag, 'class')?.split(/\s+/) ?? [];
  const leakedAttributes = tags.flatMap(tag => ['popupAlign', 'builtinPlacements']
    .filter(name => attribute(tag, name) !== null).map(name => ({
      tag: tag.slice(1).split(/[\s>]/)[0],
      name
    })));
  return {
    root: { tag: root.slice(1).split(/[\s>]/)[0].toUpperCase(), id: attribute(root, 'id'),
      dir: attribute(root, 'dir'), role: attribute(root, 'role'), expanded: attribute(
        root,
        'aria-expanded'
      ),
      rtlClass: classes(root).includes('ant-select-rtl'), multipleClass: classes(root).includes('ant-select-multiple'),
      style: {
        width: style(root, 'width'),
        height: style(root, 'height'),
        display: style(root, 'display')
      } },
    editor: editor ? { tag: editor.slice(1).split(/[\s>]/)[0].toUpperCase(), id: attribute(
      editor,
      'id'
    ),
      dir: attribute(editor, 'dir'), role: attribute(editor, 'role'), expanded: attribute(
        editor,
        'aria-expanded'
      ),
      readonly: attribute(editor, 'readonly') !== null, disabled: attribute(editor, 'disabled') !== null,
      valueAttribute: attribute(editor, 'value'),
      style: {
        width: style(editor, 'width'),
        height: style(editor, 'height'),
        boxSizing: style(editor, 'box-sizing')
      } } : null,
    popupPresent: tags.some(tag => classes(tag).includes('ant-tree-select-dropdown')),
    prefixCount: tags.filter(tag => attribute(tag, 'data-align-prefix') !== null).length,
    restCount: tags.filter(tag => attribute(tag, 'data-align-rest') !== null).length,
    model: output('model'), events: output('events'), semantic: output('semantic'), receivedAttrs: output('received'),
    leakedAttributes
  };
}

/** Существующий Native default/input root: role=presentation и provider dir; custom root задаёт attrs сам. */
export function treeSelectAlignNativeSSRExpected<View extends { root: {
  dir: string | null;
  role: string | null
} }>(
  source: View, sample: TreeSelectAlignSample
): View {
  const expected = structuredClone(source);
  if (!sample.slot?.startsWith('root-')) {
    expected.root.dir = sample.provider ?? 'ltr';
    expected.root.role = 'presentation';
  }
  return expected;
}
