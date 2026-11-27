interface HtmlNode {
  tag: string;
  opening: string;
  start: number;
  end: number;
  parent?: HtmlNode;
}

/** DOM-free public HTML projection shared by the independent Source renderer and package SSR. */
export function readTreeSelectSuffixLayoutSSR(html: string) {
  const nodes: HtmlNode[] = [];
  const stack: HtmlNode[] = [];
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  for (const token of html.matchAll(/<!--[\s\S]*?-->|<\/?([A-Za-z][\w:-]*)\b[^>]*>/g)) {
    if (!token[1]) continue;
    const tag = token[1].toLowerCase();
    if (token[0].startsWith('</')) {
      const node = stack.pop();
      if (node) node.end = token.index!;
      continue;
    }
    const node: HtmlNode = { tag, opening: token[0], start: token.index! + token[0].length,
      end: token.index! + token[0].length, parent: stack.at(-1) };
    nodes.push(node);
    if (!voidTags.has(tag) && !token[0].endsWith('/>')) stack.push(node);
  }
  const decode = (value: string) => value.replace(/&(?:amp|lt|gt|quot|#39|#x27);/g,
    entity => ({
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&#x27;': "'"
    })[entity]!);
  const attribute = (node: HtmlNode | undefined, name: string) => {
    if (!node) {
      return null;
    }
    const pattern = new RegExp(`\\s${name}(?:="([^"]*)"|(?=[\\s>]))`);
    const match = pattern.exec(node.opening);
    return match ? decode(match[1] ?? '') : null;
  };
  const marked = (node: HtmlNode, marker: string) => attribute(node, marker) !== null;
  const text = (node: HtmlNode) => decode(html.slice(node.start, node.end).replace(/<[^>]*>/g, ''));
  const visible = (node: HtmlNode) => {
    for (let current: HtmlNode | undefined = node; current; current = current.parent) {
      if (attribute(current, 'aria-hidden') === 'true' || attribute(current, 'inert') !== null) {
        return false;
      }
    }
    return true;
  };
  const editor = nodes.find(node => marked(node, 'data-suffix-layout-editor'))!;
  const rest = nodes.find(node => marked(node, 'data-suffix-layout-rest'));
  let suffix = editor?.parent;
  while (suffix && !attribute(suffix, 'class')?.split(/\s+/).includes('ant-select-content-item-suffix')) suffix = suffix.parent;
  const readOutput = (marker: string) => {
    const node = nodes.find(node => marked(node, marker))!;
    return JSON.parse(text(node));
  };
  return {
    editor: {
      tag: editor.tag.toUpperCase(), id: attribute(editor, 'id'), role: attribute(editor, 'role'),
      value: editor.tag === 'textarea' ? text(editor) : attribute(editor, 'value') ?? '',
      name: attribute(editor, 'name'), expanded: attribute(editor, 'aria-expanded'),
      disabled: attribute(editor, 'disabled') !== null, readonly: attribute(editor, 'readonly') !== null
    },
    prefixCount: nodes.filter(node => marked(node, 'data-suffix-layout-prefix')).length,
    wrapperCount: nodes.filter(node => marked(node, 'data-suffix-layout-wrapper')).length,
    visibleTags: nodes.filter(node => marked(node, 'data-suffix-layout-tag') && visible(node))
      .map(node => attribute(node, 'data-suffix-layout-tag')),
    rest: { present: Boolean(rest), visible: Boolean(rest && visible(rest)),
      omitted: rest ? attribute(rest, 'data-suffix-layout-omitted') : null },
    suffix: {
      present: Boolean(suffix),
      fixed: /(?:^|;)\s*position\s*:\s*absolute/.test(attribute(suffix, 'style') ?? '')
    },
    values: readOutput('data-suffix-layout-model'), events: readOutput('data-suffix-layout-events')
  };
}
