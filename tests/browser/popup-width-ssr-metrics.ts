/** Actual rendered HTML receipts only. No DOM, virtual layout or geometry prediction. */
export function readPopupWidthSSR(html: string) {
  const decode = (value: string) => value.replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, entity =>
    ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'" })[entity]!);
  const output = (name: string) => {
    const match = new RegExp(`<output(?=[^>]*\\bdata-width-${name}(?:[=\\s>]))[^>]*>([\\s\\S]*?)<\\/output>`).exec(html);
    return match ? JSON.parse(decode(match[1].replace(/<!--[\s\S]*?-->/g, ''))) : null;
  };
  const tags = [...html.matchAll(/<[A-Za-z][\w:-]*\b[^>]*>/g)].map(match => match[0]);
  return { receipts: output('receipts'), model: output('model'), query: output('query'), events: output('events'),
    getters: output('getters'), popupPresent: tags.some(tag => /\bant-select-dropdown\b/.test(tag)),
    leakedAttributes: tags.flatMap(tag => /\spopupmatchselectwidth(?:=|[\s/>])/i.test(tag)
      ? [{ tag: tag.slice(1).split(/[\s>]/)[0].toUpperCase(), name: 'popupMatchSelectWidth' }] : []) };
}
