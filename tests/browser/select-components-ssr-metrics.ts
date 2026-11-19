/** DOM-free reader for the actual replacement field; complete raw HTML stays separate. */
export function readSelectComponentsSSRFields(html: string) {
  // Разбирает числовые и перечисленные именованные HTML-сущности в захваченном SSR-тексте.
  const decode = (value: string) => value.replace(/&#(?:x([\da-f]+)|(\d+));|&(amp|lt|gt|quot|apos);/gi,
    (_all, hex, decimal, named) => hex || decimal ? String.fromCodePoint(parseInt(
      hex ?? decimal,
      hex ? 16 : 10
    ))
      : ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" } as Record<string, string>)[named.toLowerCase()]);
  const fields = [...html.matchAll(/<(input|textarea)\b([^>]*)>/gi)].map(match => {
    const tag = match[1].toLowerCase(), attributes = [...match[2].replace(/\/$/, '').matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g)]
      .map(a => [a[1].toLowerCase(), decode(a[2] ?? a[3] ?? a[4] ?? '')] as [string, string]);
    const close = tag === 'textarea' ? html.indexOf('</textarea>', match.index! + match[0].length) : -1;
    const content = close < 0 ? '' : decode(html.slice(match.index! + match[0].length, close).replace(
      /<!--[\s\S]*?-->/g,
      ''
    ));
    return {
      tag,
      attributes,
      content,
      value: tag === 'textarea' ? content : attributes.find(([key]) => key === 'value')?.[1] ?? ''
    };
  });
  return {
    fields,
    prefixBodies: [...html.matchAll(/\bdata-select-icons-prefix-body(?:\s|=|>)/g)].length
  };
}
