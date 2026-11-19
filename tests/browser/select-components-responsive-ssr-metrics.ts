/** Complete DOM-free content subtree projection. No data/geometry is invented. */
export function readSelectComponentsResponsiveSSR(html: string) {
  interface Element { tag: string; attributes: string[][]; children: Array<Element | string> }
  // Разбирает числовые и перечисленные именованные HTML-сущности в захваченном SSR-тексте.
  const decode = (text: string) => text.replace(/&#(?:x([\da-f]+)|(\d+));|&(amp|lt|gt|quot|apos);/gi,
    (_all, hex, decimal, named) => hex || decimal ? String.fromCodePoint(parseInt(
      hex ?? decimal,
      hex ? 16 : 10
    ))
      : ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" } as Record<string, string>)[named.toLowerCase()]);
  const root: Element = { tag: '#document', attributes: [], children: [] }, stack = [root], elements: Element[] = [];
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
      .map(attribute => [attribute[1].toLowerCase(), decode(attribute[2] ?? attribute[3] ?? attribute[4] ?? '')]);
    const element: Element = { tag: name, attributes, children: [] };
    stack.at(-1)!.children.push(element);
    elements.push(element);
    if (!voidTags.has(name) && !match[0].endsWith('/>')) stack.push(element);
  }
  if (offset < html.length) stack.at(-1)!.children.push(decode(html.slice(offset)));
  const classes = (element: Element) => element.attributes.find(([key]) => key === 'class')?.[1].split(/\s+/) ?? [];
  return { contents: elements.filter(element => classes(element).includes('ant-select-content')) };
}
