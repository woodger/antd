/** MIT: vendor/LICENSE.rc-overflow, vendor/LICENSE.rc-resize-observer. */
import { treeSelectComponentOverflow, type TreeSelectComponentOverflowLayout } from './tree-select-component-overflow.engine';

/** Source Overflow: измерение suffix после absolute/shrink-to-fit участвует в следующем проходе. */
export function connectTreeSelectComponentOverflow(
  host: HTMLElement, suffix: HTMLElement, getCount: () => number,
  update: (layout: TreeSelectComponentOverflowLayout) => void,
  selectors: { tag: string; rest: string; prefix: string } = {
    tag: ':scope > [data-tree-choice-tag]', rest: ':scope > [data-tree-choice-rest]',
    prefix: ':scope > [data-tree-choice-overflow-prefix]'
  }
) {
  const view = host.ownerDocument.defaultView!;
  const initialStyle = { position: suffix.style.position, top: suffix.style.top,
    insetInlineStart: suffix.style.insetInlineStart };
  let disposed = false;
  let frame = 0;
  let layout: TreeSelectComponentOverflowLayout | undefined;
  let restWidth = 0;
  let previousRestWidth = 0;
  type Size = {
    width: number;
    height: number;
    offsetWidth: number;
    offsetHeight: number;
    sourceWidth: number
  };
  let restNode: HTMLElement | null = null;
  let restMeasurement: Size | undefined;
  const sizes = new Map<HTMLElement, Size>();
  const observed = new Set<HTMLElement>();
  const resize = new view.ResizeObserver(schedule);
  const mutation = new view.MutationObserver(schedule);

  function schedule() {
    if (!disposed && !frame) frame = view.requestAnimationFrame(measure);
  }
  function sourceSize(node: HTMLElement) {
    // rc-resize-observer сохраняет дробный border box, если DOM offset округлил его.
    const rect = node.getBoundingClientRect();
    const width = Math.floor(rect.width), height = Math.floor(rect.height);
    const { offsetWidth, offsetHeight } = node;
    const previous = sizes.get(node);
    if (previous && previous.width === width && previous.height === height
      && previous.offsetWidth === offsetWidth && previous.offsetHeight === offsetHeight) return previous;
    const size = { width, height, offsetWidth, offsetHeight,
      sourceWidth: offsetWidth === Math.round(rect.width) ? rect.width : offsetWidth };
    sizes.set(node, size);
    return size;
  }
  function measure() {
    frame = 0;
    if (disposed || !host.isConnected) return;
    const tags = [...host.querySelectorAll<HTMLElement>(selectors.tag)];
    const rest = host.querySelector<HTMLElement>(selectors.rest);
    const prefix = host.querySelector<HTMLElement>(selectors.prefix);
    const nodes = new Set([host, suffix, ...tags, ...(rest ? [rest] : []), ...(prefix ? [prefix] : [])]);
    for (const node of observed) if (!nodes.has(node)) {
      resize.unobserve(node);
      observed.delete(node);
      sizes.delete(node);
    }
    for (const node of nodes) if (!observed.has(node)) {
      resize.observe(node);
      observed.add(node);
    }

    const measurement = rest ? sourceSize(rest) : undefined;
    if (restNode !== rest || restMeasurement !== measurement) {
      previousRestWidth = restWidth;
      restWidth = measurement?.sourceWidth ?? 0;
      restMeasurement = measurement;
      restNode = rest;
    }
    const widths = tags.map(node => sourceSize(node).sourceWidth);
    const next = treeSelectComponentOverflow({ containerWidth: host.clientWidth, dataCount: getCount(), widths,
      prefixWidth: prefix ? sourceSize(prefix).sourceWidth : 0, suffixWidth: sourceSize(suffix).sourceWidth,
      restWidth, previousRestWidth, previous: layout });
    const style = next.offset === null ? initialStyle
      : { position: 'absolute', top: '0px', insetInlineStart: `${next.offset}px` };
    for (const key of ['position', 'top', 'insetInlineStart'] as const) {
      if (suffix.style[key] !== style[key]) suffix.style[key] = style[key];
    }
    if (!layout || Object.entries(next).some(([key, value]) => Reflect.get(layout!, key) !== value)) {
      layout = next;
      update(next);
    }
  }

  mutation.observe(host, { subtree: true, childList: true, attributes: true, characterData: true });
  measure();
  return { schedule, destroy() {
    disposed = true;
    resize.disconnect();
    mutation.disconnect();
    if (frame) view.cancelAnimationFrame(frame);
    Object.assign(suffix.style, initialStyle);
  } };
}
