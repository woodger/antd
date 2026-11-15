/** rc-trigger 3.10.1 useAlign/util; MIT, vendor/LICENSE.rc-trigger. */
import { treeSelectAlignProjection, type TreeSelectAlignPoint } from './tree-select-align.engine';
import type { getPopupPosition, PopupArea } from './popup-position.engine';
import type { InlineStyleLayer } from './inline-style.engine';

export function treeSelectAlignScrollers(
  element: HTMLElement, from: HTMLElement | null = element.parentElement
) {
  const view = element.ownerDocument.defaultView!;
  const nodes: HTMLElement[] = [];
  let parent = from;
  while (parent) {
    const style = view.getComputedStyle(parent);
    if ([style.overflow, style.overflowX, style.overflowY].some(value =>
      ['hidden', 'scroll', 'clip', 'auto'].includes(value))) nodes.push(parent);
    parent = parent.parentElement;
  }
  return nodes;
}

export function treeSelectAlignVisibleArea(initial: PopupArea, scrollers: readonly HTMLElement[]) {
  const area = { ...initial };
  for (const node of scrollers) {
    const document = node.ownerDocument;
    const view = document.defaultView!;
    if (node === document.body || node === document.documentElement) continue;
    const style = view.getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    const number = (value: string) => Number.parseFloat(value) || 0;
    const left = number(style.borderLeftWidth);
    const right = number(style.borderRightWidth);
    const top = number(style.borderTopWidth);
    const bottom = number(style.borderBottomWidth);
    const scale = (physical: number, css: number) => {
      const value = Math.round(physical / css * 1000) / 1000;
      return Number.isNaN(value) ? 1 : value;
    };
    const sx = scale(rect.width, node.offsetWidth);
    const sy = scale(rect.height, node.offsetHeight);
    const mx = style.overflow === 'clip' ? number(style.overflowClipMargin) * sx : 0;
    const my = style.overflow === 'clip' ? number(style.overflowClipMargin) * sy : 0;
    const l = rect.x + left * sx - mx;
    const t = rect.y + top * sy - my;
    const r = l + rect.width + 2 * mx - (left + right) * sx
      - (node.offsetWidth - node.clientWidth - left - right) * sx;
    const b = t + rect.height + 2 * my - (top + bottom) * sy
      - (node.offsetHeight - node.clientHeight - top - bottom) * sy;
    area.left = Math.max(area.left, l);
    area.top = Math.max(area.top, t);
    area.right = Math.min(area.right, r);
    area.bottom = Math.min(area.bottom, b);
  }
  return area;
}

type Alignment = ReturnType<typeof getPopupPosition>;
const projectedProperties = ['left', 'top', 'right', 'bottom', 'position', 'transform', 'transform-origin',
  'translate', 'rotate', 'scale', 'margin', 'margin-left', 'margin-top', 'margin-right', 'margin-bottom'];

/** A disposable CSS surface observes the Source frame without moving real popup contents or refs. */
export function createTreeSelectAlignSurface(
  popup: HTMLElement, getStyle: () => string | undefined, getParent: () => HTMLElement | ShadowRoot
) {
  const document = popup.ownerDocument;
  const view = document.defaultView!;
  const proxy = popup.cloneNode(false) as HTMLElement;
  proxy.removeAttribute('id');
  proxy.removeAttribute('popover');
  proxy.removeAttribute('hidden');
  proxy.setAttribute('aria-hidden', 'true');
  const points = Array.from({ length: 4 }, () => document.createElement('i'));
  proxy.append(...points);
  let previous: Alignment | undefined;

  function prepare() {
    proxy.className = popup.className;
    for (const attribute of popup.attributes) {
      if (!['id', 'popover', 'hidden', 'style', 'class'].includes(attribute.name))
        proxy.setAttribute(attribute.name, attribute.value);
    }
    proxy.style.cssText = popup.style.cssText;
    for (const property of projectedProperties) proxy.style.removeProperty(property);
    proxy.style.position = 'absolute';
    proxy.style.cssText += `;${getStyle() ?? ''}`;
    // Existing Native sizing remains owned by its authored layers/stretch. Only the CSS frame is virtual.
    const style = view.getComputedStyle(popup);
    proxy.style.width = style.width;
    proxy.style.height = style.height;
    proxy.style.minWidth = '0';
    proxy.style.maxWidth = 'none';
    proxy.style.minHeight = '0';
    proxy.style.maxHeight = 'none';
    proxy.style.setProperty('visibility', 'hidden', 'important');
    proxy.style.setProperty('pointer-events', 'none', 'important');
    proxy.style.overflow = 'hidden';
    const parent = getParent();
    if (popup.parentNode === parent) parent.insertBefore(proxy, popup);
    else parent.append(proxy);
  }

  function withSurface<T>(read: () => T): T {
    prepare();
    try {
      return read();
    } finally {
      proxy.remove();
    }
  }

  function geometry(anchor: HTMLElement, scrollers: readonly HTMLElement[]) {
    return withSurface(() => {
      // Source keeps the previous popup's scroll extent while measuring its zero-origin frame.
      if (previous) applyAlignment(previous);
      const placeholder = document.createElement('div');
      proxy.parentElement?.append(placeholder);
      placeholder.style.left = `${proxy.offsetLeft}px`;
      placeholder.style.top = `${proxy.offsetTop}px`;
      placeholder.style.position = view.getComputedStyle(proxy).position;
      placeholder.style.height = `${proxy.offsetHeight}px`;
      placeholder.style.width = `${proxy.offsetWidth}px`;
      try {
        proxy.style.left = '0';
        proxy.style.top = '0';
        proxy.style.right = 'auto';
        proxy.style.bottom = 'auto';
        const rect = proxy.getBoundingClientRect();
        const style = view.getComputedStyle(proxy);
        const target = anchor.getBoundingClientRect();
        const html = document.documentElement;
        const visible = treeSelectAlignVisibleArea({
          left: 0, top: 0, right: html.clientWidth, bottom: html.clientHeight
        }, scrollers);
        const scroll = treeSelectAlignVisibleArea({
          left: -html.scrollLeft, top: -html.scrollTop,
          right: html.scrollWidth - html.scrollLeft, bottom: html.scrollHeight - html.scrollTop
        }, scrollers);
        const scale = (physical: number, css: string) => {
          const value = Math.round(physical / Number.parseFloat(css) * 1000) / 1000;
          return Number.isNaN(value) ? 1 : value;
        };
        const scaleX = scale(rect.width, style.width);
        const scaleY = scale(rect.height, style.height);
        proxy.style.left = 'auto';
        proxy.style.top = 'auto';
        proxy.style.right = '0';
        proxy.style.bottom = '0';
        const mirror = proxy.getBoundingClientRect();
        return {
          target: { left: target.x, top: target.y, width: target.width, height: target.height },
          popup: { left: rect.x, top: rect.y, width: rect.width, height: rect.height },
          mirror: { right: mirror.right, bottom: mirror.bottom },
          visible, scroll, scaleX, scaleY
        };
      } finally {
        placeholder.remove();
      }
    });
  }

  function applyAlignment(alignment: Alignment) {
    const point = alignment.align.points[0];
    const dynamic = alignment.align.dynamicInset || alignment.align._experimental?.dynamicInset;
    proxy.style.left = dynamic && point[1] === 'r' ? 'auto' : `${alignment.x}px`;
    proxy.style.right = dynamic && point[1] === 'r' ? `${alignment.right}px` : 'auto';
    proxy.style.top = dynamic && point[0] === 'b' ? 'auto' : `${alignment.y}px`;
    proxy.style.bottom = dynamic && point[0] === 'b' ? `${alignment.bottom}px` : 'auto';
  }

  function present(alignment: Alignment) {
    previous = alignment;
    return withSurface(() => {
      applyAlignment(alignment);
      // Source author styles follow useOffsetStyle, including authored axes/margins/transforms.
      const width = proxy.style.width;
      const height = proxy.style.height;
      proxy.style.cssText += `;${getStyle() ?? ''}`;
      proxy.style.width = width;
      proxy.style.height = height;
      proxy.style.minWidth = '0';
      proxy.style.maxWidth = 'none';
      proxy.style.minHeight = '0';
      proxy.style.maxHeight = 'none';
      proxy.style.setProperty('visibility', 'hidden', 'important');
      const positions = [[0, 0], [100, 0], [100, 100], [0, 100]];
      const corners = points.map((node, index) => {
        node.style.cssText = 'all:initial!important;position:absolute!important;width:0!important;height:0!important;margin:0!important;padding:0!important;border:0!important;transform:none!important;visibility:hidden!important;pointer-events:none!important;';
        node.style.setProperty('left', `${positions[index][0] - proxy.clientLeft}px`, 'important');
        node.style.setProperty('top', `${positions[index][1] - proxy.clientTop}px`, 'important');
        const rect = node.getBoundingClientRect();
        return { x: rect.x, y: rect.y };
      }) as [TreeSelectAlignPoint, TreeSelectAlignPoint, TreeSelectAlignPoint, TreeSelectAlignPoint];
      const rect = proxy.getBoundingClientRect();
      const matrix = treeSelectAlignProjection(corners);
      const declarations = [['position', 'fixed'], ['left', '0px'], ['top', '0px'],
        ['right', 'auto'], ['bottom', 'auto'], ['margin', '0px'], ['translate', 'none'], ['rotate', 'none'],
        ['scale', 'none'], ['transform-origin', '0px 0px'], ['transform', `matrix3d(${matrix.join(',')})`]];
      const style: InlineStyleLayer = declarations.map(([name, value]) => `${name}:${value} !important`).join(';');
      return { left: rect.x, top: rect.y, style };
    });
  }

  function signature() {
    const values: unknown[] = [getStyle(), popup.parentNode, popup.className];
    const container = getParent();
    let parent: Element | null = container instanceof view.ShadowRoot ? container.host : container;
    while (parent) {
      const rect = parent.getBoundingClientRect();
      const style = view.getComputedStyle(parent);
      values.push(rect.x, rect.y, rect.width, rect.height, parent.scrollLeft, parent.scrollTop);
      // A rotation can preserve the bounding box while changing the entire CSS plane.
      values.push(style.transform, style.transformOrigin, style.translate, style.rotate, style.scale,
        style.perspective, style.perspectiveOrigin, style.position, style.filter, style.backdropFilter,
        style.contain, style.willChange, parent.clientLeft, parent.clientTop,
        parent.clientWidth, parent.clientHeight);
      const root = parent.getRootNode();
      parent = parent.parentElement ?? (root instanceof view.ShadowRoot ? root.host : null);
    }
    const css = view.getComputedStyle(popup);
    values.push(css.width, css.height, css.padding, css.borderWidth);
    for (const name of popup.style) if (name.startsWith('--')) values.push(name, popup.style.getPropertyValue(name));
    return values.map(value => String(value)).join(':');
  }
  return { geometry, present, signature, destroy() { proxy.remove(); } };
}
