/** DOM-free token reader. Raw complete HTML is retained by the SSR spec. */
export function readSelectIconsSSR(html: string) {
  interface Element { tag: string; attributes: Array<[string, string]>; children: Array<Element | string> }
  // Разбирает числовые и перечисленные именованные HTML-сущности в захваченном SSR-тексте.
  const decode = (text: string) => text.replace(/&#(?:x([\da-f]+)|(\d+));|&(amp|lt|gt|quot|apos);/gi,
    (_all, hex, decimal, named) => hex || decimal ? String.fromCodePoint(parseInt(
      hex ?? decimal,
      hex ? 16 : 10
    ))
      : ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" } as Record<string, string>)[named.toLowerCase()]);
  const root: Element = { tag: '#document', attributes: [], children: [] }, stack = [root], elements: Element[] = [];
  const parents = new Map<Element, Element>();
  const voidTags = new Set(['input', 'br', 'hr', 'img', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr']);
  let offset = 0;
  for (const match of html.matchAll(/<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>/g)) {
    if (match.index! > offset) stack.at(-1)!.children.push(decode(html.slice(offset, match.index)));
    offset = match.index! + match[0].length;
    if (match[0].startsWith('<!--')) continue;
    const name = /^<\/?([A-Za-z][\w:-]*)/.exec(match[0])![1].toLowerCase();
    if (match[0].startsWith('</')) {
      if (stack.at(-1)?.tag === name) stack.pop();
      continue;
    }
    const body = match[0].slice(
      match[0].indexOf(name) + name.length,
      match[0].length - (match[0].endsWith('/>') ? 2 : 1)
    );
    const attributes = [...body.matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g)]
      .map(a => [a[1], decode(a[2] ?? a[3] ?? a[4] ?? '')] as [string, string]);
    const element: Element = { tag: name, attributes, children: [] };
    parents.set(element, stack.at(-1)!);
    stack.at(-1)!.children.push(element);
    elements.push(element);
    if (!voidTags.has(name) && !match[0].endsWith('/>')) stack.push(element);
  }
  if (offset < html.length) stack.at(-1)!.children.push(decode(html.slice(offset)));
  const text = (e: Element): string => e.children.map(child => typeof child === 'string' ? child : text(child)).join('');
  const descriptor = (e: Element): unknown => ({ tag: e.tag, attributes: e.attributes,
    children: e.children.filter(child => typeof child !== 'string' || child !== '').map(child => typeof child === 'string' ? child : descriptor(child)) });
  const classes = (e: Element) => e.attributes.find(([key]) => key === 'class')?.[1].split(/\s+/) ?? [];
  const displayText = (e: Element): string => e.children.map(child => typeof child === 'string' ? child
    : child.tag === 'input' || child.tag === 'textarea' || classes(child).includes('ant-select-placeholder') ? '' : displayText(child)).join('');
  const feedback = (e: Element) => {
    let parent = parents.get(e);
    while (parent) {
      if (parent.attributes.some(([key]) => key === 'data-form-feedback-glyph')) {
        return true;
      }
      parent = parents.get(parent);
    }
    return false;
  };
  const svg = elements.filter(e => e.tag === 'svg');
  return {
    authored: elements.filter(e => e.attributes.some(([key]) => key === 'data-select-icons-node')).map(descriptor),
    svg: svg.map(descriptor),
    feedbackSVGIndices: svg.flatMap((element, index) => feedback(element) ? [index] : []),
    affixes: elements.filter(e => classes(e).some(c => c === 'ant-select-suffix' || c === 'ant-select-clear' || c === 'ant-select-selection-item-remove'))
      .map(e => ({
        tag: e.tag,
        attributes: e.attributes,
        text: text(e),
        children: e.children.map(child => typeof child === 'string' ? child : descriptor(child))
      })),
    editors: elements.filter(e => e.attributes.some(([key, value]) => key === 'role' && value === 'combobox'))
      .map(e => ({ tag: e.tag, attributes: e.attributes, text: text(e) })),
    displayValues: elements.filter(e => classes(e).includes('ant-select-content')).map(displayText),
    leaks: elements.flatMap(e => e.attributes.filter(([key]) => ['suffixicon', 'loadingicon', 'menuitemselectedicon', 'removeicon', 'optionrender', 'labelrender', 'tagrender', 'popuprender', 'classnames', 'styles', 'components'].includes(key.toLowerCase()))
      .map(([key, value]) => ({ tag: e.tag, key, value })))
  };
}
