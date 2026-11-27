// Manages decorative BorderBeam layers inside the host. Measured borders belong to that node, and
// CSS variables update from the theme origin.
import {
  getBorderBeamCount,
  getBorderBeamStyle,
  type BorderBeamBorderWidth,
  type BorderBeamRuntimeOptions
} from './border-beam.engine';

// Captures the host's original border widths and creates its decoration controller.
export function createBorderBeamRuntime(host: HTMLElement) {
  const document = host.ownerDocument;
  const view = document.defaultView!;
  const computed = view.getComputedStyle(host);
  // Reads the computed border width as a number. An unparseable value yields zero.
  const parseWidth = (value: string) => {
    const width = parseFloat(value);

    return Number.isNaN(width) ? 0 : width;
  };
  // As with useBorderSize, the snapshot belongs to the node and stays fixed when its style changes.
  const widths: BorderBeamBorderWidth = [
    parseWidth(computed.borderTopWidth),
    parseWidth(computed.borderRightWidth),
    parseWidth(computed.borderBottomWidth),
    parseWidth(computed.borderLeftWidth)
  ];
  const layers: HTMLDivElement[] = [];
  let active = true;
  let current: BorderBeamRuntimeOptions | undefined;
  let origin: HTMLElement | undefined;
  let observer: MutationObserver | undefined;

  // Inherits theme CSS variables, adjusts the number of layers, and updates existing elements'
  // attributes.
  function sync() {
    if (!active || !current) {
      return;
    }
    const inherited: string[] = [];
    if (origin) {
      const source = view.getComputedStyle(origin);
      for (const name of source) {
        if (name.startsWith('--')) inherited.push(`${name}:${source.getPropertyValue(name)}`);
      }
    }
    const options = {
      ...current,
      themeStyle: [...inherited, current.themeStyle].filter(Boolean).join(';')
    };
    const count = getBorderBeamCount(options.count);

    while (layers.length > count)
      layers.pop()!.remove();

    for (let index = 0; index < count; index++) {
      const existing = layers[index];
      const layer = existing ?? document.createElement('div');
      const style = getBorderBeamStyle(options, widths, index);

      if (layer.className !== options.className)
        layer.className = options.className;

      if (options.prefix) {
        layer.setAttribute('data-ant-border-beam-prefix', options.prefix);
      }
      else {
        layer.removeAttribute('data-ant-border-beam-prefix');
      }
      layer.setAttribute(
        'data-ant-border-beam-vars',
        (options.rootPrefix ?? 'ant').replace(/\./g, '')
      );

      if (layer.getAttribute('style') !== style)
        layer.setAttribute('style', style);

      if (!existing) {
        layer.setAttribute('aria-hidden', 'true');
        layers.push(layer);
        host.append(layer);
      }
    }
  }

  return {
    // Reconnects observation only when the theme source changes, then applies the supplied
    // settings.
    configure(options: BorderBeamRuntimeOptions) {
      if (!active) {
        return;
      }

      current = options;
      if (origin !== options.themeOrigin) {
        observer?.disconnect();
        view.removeEventListener('resize', sync);
        origin = options.themeOrigin;
        observer = origin ? new view.MutationObserver(sync) : undefined;
        for (let node = origin; node; node = node.parentElement ?? undefined)
          observer?.observe(node, { attributes: true });
        if (origin) view.addEventListener('resize', sync);
      }
      sync();
    },
    // Disconnects observation and removes the layers owned by this controller.
    destroy() {
      active = false;
      observer?.disconnect();
      view.removeEventListener('resize', sync);

      for (const layer of layers)
        layer.remove();

      layers.length = 0;
    }
  };
}
