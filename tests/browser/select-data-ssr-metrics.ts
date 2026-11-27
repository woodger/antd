/** HTML-observations of the owner without DOM and layout at Source/Native SSR. */
export function readSelectDataSSR(html: string) {
  const decode = (text: string) => text.replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const output = (name: string) => {
    const match = html.match(new RegExp(`<output[^>]*data-select-data-${name}(?:="[^"]*")?[^>]*>([\\s\\S]*?)<\\/output>`));
    return match ? JSON.parse(decode(match[1].replace(/<!--[^]*?-->/g, ''))) : null;
  };
  const attributes = [...html.matchAll(/\s(virtual|listheight|listitemheight|showscrollbar|onactive|fieldnames|optionrender|labelinvalue)=/gi)]
    .map(match => match[1].toLowerCase());
  return { receipts: output('receipts'), model: output('model'), query: output('query'),
    events: output('events'), offsets: output('offsets'),
    popupPresent: /class="[^"]*ant-select-dropdown/.test(html), leakedAttributes: attributes };
}
