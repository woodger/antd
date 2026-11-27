/** DOM′-free observant of owned outputs and prohibited SSR browser surfaces. */
export function readSelectValueSSR(body: string) {
  const output = (name: string) => {
    const match = body.match(new RegExp(`<output[^>]*data-select-value-${name}[^>]*>([\\s\\S]*?)<\\/output>`));
    if (!match) throw Error(`Missing Select value SSR output ${name}`);
    return JSON.parse(match[1].replace(/<!--[^]*?-->/g, '').replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'"));
  };
  return { receipts: output('receipts'), model: output('model'), query: output('query'), events: output('events'),
    producers: output('producers'), popupPresent: /class="[^"]*ant-select-dropdown/.test(body),
    leakedAttributes: [...body.matchAll(/\s(labelinvalue|optionlabelprop|labelrender|fieldnames)=/gi)].map(match => match[1]) };
}
