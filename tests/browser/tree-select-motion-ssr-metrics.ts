/** Read emitted SSR attributes and callback receipts without a DOM or assumed geometry. */
export function readTreeSelectMotionSSR(html: string, selectPrefix = 'ant-select') {
  const decode = (value: string) => value.replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, entity =>
    ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'" })[entity]!);
  const tags = [...html.matchAll(/<[A-Za-z][\w:-]*\b[^>]*>/g)].map(match => match[0]);
  const attribute = (tag: string | undefined, name: string) => {
    if (!tag) {
      return null;
    }
    const attributePattern = new RegExp(`\\s${name}(?:="([^"]*)"|(?=[\\s/>]))`, 'i');
    const match = attributePattern.exec(tag);
    return match ? decode(match[1] ?? '') : null;
  };
  const root = tags.find(tag => attribute(tag, 'data-motion-root') !== null)
    ?? tags.find(tag => attribute(tag, 'class')?.split(/\s+/).includes('motion-audit-root'))
    ?? tags.find(tag => attribute(tag, 'class')?.split(/\s+/).includes(selectPrefix));
  if (!root) {
    throw Error('Missing TreeSelect motion SSR root');
  }
  const editor = tags.find(tag => /^(?:<input|<textarea)\b/i.test(tag)
    && (attribute(tag, 'data-motion-editor') !== null || attribute(tag, 'role') === 'combobox'));
  const style = (tag: string | undefined, name: string) => {
    const propertyPattern = new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`);
    const match = propertyPattern.exec(attribute(tag, 'style') ?? '');
    return match?.[1].trim() ?? null;
  };
  const output = (name: string) => {
    const outputPattern = new RegExp(
      `<output(?=[^>]*\\bdata-motion-${name}(?:[=\\s>]))[^>]*>([\\s\\S]*?)<\\/output>`
    );
    const match = outputPattern.exec(html);
    return match ? JSON.parse(decode(match[1].replace(/<!--[\s\S]*?-->/g, ''))) : null;
  };
  const classes = (tag: string) => attribute(tag, 'class')?.split(/\s+/) ?? [];
  const leakedAttributes = tags.flatMap(tag => ['animation', 'transitionName']
    .filter(name => attribute(tag, name) !== null)
    .map(name => ({ tag: tag.slice(1).split(/[\s>]/)[0], name })));

  return {
    root: {
      tag: root.slice(1).split(/[\s>]/)[0].toUpperCase(), id: attribute(root, 'id'),
      dir: attribute(root, 'dir'), role: attribute(root, 'role'),
      expanded: attribute(root, 'aria-expanded'),
      style: {
        width: style(root, 'width'), height: style(root, 'height'), display: style(root, 'display')
      }
    },
    editor: editor ? {
      tag: editor.slice(1).split(/[\s>]/)[0].toUpperCase(), id: attribute(editor, 'id'),
      dir: attribute(editor, 'dir'), role: attribute(editor, 'role'),
      expanded: attribute(editor, 'aria-expanded'),
      readonly: attribute(editor, 'readonly') !== null,
      disabled: attribute(editor, 'disabled') !== null,
      valueAttribute: attribute(editor, 'value')
    } : null,
    popupPresent: tags.some(tag => classes(tag).includes('motion-audit-popup')),
    semantic: output('semantic'), events: output('events'), model: output('model'),
    receivedAttrs: output('received'), leakedAttributes
  };
}

/** The established Native default/input root owns provider dir and its presentation role. */
export function treeSelectMotionNativeSSRExpected<
  View extends {
    root: { dir: string | null; role: string | null };
    editor: { expanded: string | null } | null;
    popupPresent: boolean;
  }
>(
  source: View,
  sample: { slot?: string; defaultOpen?: boolean; initialOpen?: boolean }
): View {
  const expected = structuredClone(source);
  if (!sample.slot?.startsWith('root-')) {
    expected.root.dir = 'ltr';
    expected.root.role = 'presentation';
  }
  // Existing TreeSelect SSR emits its initially open panel hidden and keeps editor ARIA open.
  // tests/package/tree-select/tree-select.ssr.test.ts protects that Native server-rendering contract.
  if (sample.defaultOpen || sample.initialOpen) {
    expected.popupPresent = true;
    if (expected.editor && expected.editor.expanded !== null)
      expected.editor.expanded = 'true';
  }
  return expected;
}
