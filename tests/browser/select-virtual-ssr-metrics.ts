/** HTML-only owner projection; no DOM or layout access during Source or Native SSR. */
export function readSelectVirtualSSR(html: string) {
  const decode = (text: string) => text.replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const output = (name: string) => {
    const match = html.match(new RegExp(`<output[^>]*data-select-virtual-${name}(?:="[^"]*")?[^>]*>([\\s\\S]*?)<\\/output>`));
    return match ? JSON.parse(decode(match[1].replace(/<!--[^]*?-->/g, ''))) : null;
  };
  const attributes = [...html.matchAll(/\s(virtual|listheight|listitemheight|showscrollbar|onactive)=/gi)]
    .map(match => match[1].toLowerCase());
  return { receipts: output('receipts'), model: output('model'), query: output('query'),
    events: output('events'), offsets: output('offsets'), renders: output('renders'),
    popupPresent: /class="[^"]*ant-select-dropdown/.test(html), leakedAttributes: attributes };
}
