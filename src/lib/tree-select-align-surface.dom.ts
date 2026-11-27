/** rc-trigger 3.10.1 useAlign/util; MIT, vendor/LICENSE.rc-trigger. */
import { treeSelectAlignProjection, type TreeSelectAlignPoint } from './tree-select-align.engine';
import type { getPopupPosition } from './popup-position.engine';
import { clipPopupArea } from './popup-geometry.dom';
import type { InlineStyleLayer } from './inline-style.engine';
import {
  createTreeSelectMotionFrame,
  type TreeSelectMotionFrameState,
  type TreeSelectMotionTransitionEnd
} from './tree-select-motion-frame.dom';

type Alignment = ReturnType<typeof getPopupPosition>;
export interface TreeSelectAlignBorderBox {
  readonly size: ResizeObserverSize;
  readonly width: string;
  readonly height: string;
  readonly boxSizing: string;
  readonly writingMode: string;
}
const projectedProperties = ['left', 'top', 'right', 'bottom', 'position', 'transform', 'transform-origin',
  'translate', 'rotate', 'scale', 'margin', 'margin-left', 'margin-top', 'margin-right', 'margin-bottom',
  'offset-path', 'offset-distance', 'offset-position', 'offset-anchor', 'offset-rotate',
  'transition-property', 'transition-duration', 'transition-delay', 'transition-timing-function',
  'transition-behavior'];

/** A disposable CSS surface observes the Source frame without moving real popup contents or refs. */
export function createTreeSelectAlignSurface(
  popup: HTMLElement,
  getStyle: () => string | undefined,
  getParent: () => HTMLElement | ShadowRoot,
  getMotion?: () => TreeSelectMotionFrameState | undefined,
  onTransitionEnd?: (detail: TreeSelectMotionTransitionEnd) => void,
  getConstrainX?: () => boolean,
  getBorderBox?: () => TreeSelectAlignBorderBox | undefined
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
  const motion = createTreeSelectMotionFrame(popup, getMotion, onTransitionEnd);
  let previous: Alignment | undefined;
  let transitionStyle: string | undefined;
  const transitionNames = ['transition-property', 'transition-duration', 'transition-delay',
    'transition-timing-function', 'transition-behavior'];
  const transitionParser = document.createElement('span').style;

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
    const measured = getBorderBox?.();
    const vertical = style.writingMode.startsWith('vertical') || style.writingMode.startsWith('sideways');
    // Computed CSS text loses fractional layout precision (317.0625 becomes 317.062).
    // Reusing that text as a width rounds the proxy down by one browser layout unit.
    const exact = style.boxSizing === 'border-box' && measured
      && measured.width === style.width && measured.height === style.height
      && measured.boxSizing === style.boxSizing && measured.writingMode === style.writingMode
      && measured.size.inlineSize > 0 && measured.size.blockSize > 0 ? measured.size : undefined;
    const width = exact ? `${vertical ? exact.blockSize : exact.inlineSize}px` : style.width;
    const height = exact ? `${vertical ? exact.inlineSize : exact.blockSize}px` : style.height;
    proxy.style.setProperty('width', width, 'important');
    proxy.style.setProperty('height', height, 'important');
    proxy.style.setProperty('min-width', '0', 'important');
    proxy.style.setProperty('max-width', 'none', 'important');
    proxy.style.setProperty('min-height', '0', 'important');
    proxy.style.setProperty('max-height', 'none', 'important');
    proxy.style.setProperty('visibility', 'hidden', 'important');
    proxy.style.setProperty('pointer-events', 'none', 'important');
    proxy.style.overflow = 'hidden';
    const parent = getParent();
    if (popup.parentNode === parent) {
      parent.insertBefore(proxy, popup);
    }
    else {
      parent.append(proxy);
    }
    return { width, height };
  }

  function withSurface<T>(read: (size: { width: string; height: string }) => T): T {
    const size = prepare();
    try {
      return read(size);
    } finally {
      proxy.remove();
    }
  }

  function geometry(anchor: Element, scrollers: readonly HTMLElement[]) {
    return withSurface(() => {
      // Source keeps the previous popup's scroll extent while measuring its zero-origin frame.
      if (previous) applyAlignment(previous);
      const frame = motion.sample(proxy, false);
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
        const visible = clipPopupArea({
          left: 0, top: 0, right: html.clientWidth, bottom: html.clientHeight
        }, scrollers);
        const scroll = clipPopupArea({
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
        frame.destroy();
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
    return withSurface(({ width, height }) => {
      applyAlignment(alignment);
      // Source author styles follow useOffsetStyle, including authored axes/margins/transforms.
      proxy.style.cssText += `;${getStyle() ?? ''}`;
      proxy.style.setProperty('width', width, 'important');
      proxy.style.setProperty('height', height, 'important');
      proxy.style.setProperty('min-width', '0', 'important');
      proxy.style.setProperty('max-width', 'none', 'important');
      proxy.style.setProperty('min-height', '0', 'important');
      proxy.style.setProperty('max-height', 'none', 'important');
      proxy.style.setProperty('visibility', 'hidden', 'important');
      const frame = motion.sample(proxy);
      transitionStyle = frame.style;
      try {
      const positions = [[0, 0], [100, 0], [100, 100], [0, 100]];
      const corners = points.map((node, index) => {
        node.style.cssText = (
          'all:initial!important;'
          + 'position:absolute!important;'
          + 'width:0!important;'
          + 'height:0!important;'
          + 'margin:0!important;'
          + 'padding:0!important;'
          + 'border:0!important;'
          + 'transform:none!important;'
          + 'visibility:hidden!important;'
          + 'pointer-events:none!important;'
        );
        node.style.setProperty('left', `${positions[index][0] - proxy.clientLeft}px`, 'important');
        node.style.setProperty('top', `${positions[index][1] - proxy.clientTop}px`, 'important');
        const rect = node.getBoundingClientRect();
        return { x: rect.x, y: rect.y };
      }) as [TreeSelectAlignPoint, TreeSelectAlignPoint, TreeSelectAlignPoint, TreeSelectAlignPoint];
      const rect = proxy.getBoundingClientRect();
      const matrix = treeSelectAlignProjection(corners);
      let left = rect.x;
      if (getConstrainX?.()) {
        const viewport = view.visualViewport;
        const x = viewport?.offsetLeft ?? 0;
        const width = viewport?.width ?? view.innerWidth;
        left = Math.max(x + 8, Math.min(left, x + width - 8 - rect.width));
        const shift = left - rect.x;
        // A physical translation adds delta times the homogeneous denominator to X.
        matrix[0] += shift * matrix[3];
        matrix[4] += shift * matrix[7];
        matrix[12] += shift;
      }
      const declarations = [['position', 'fixed'], ['left', '0px'], ['top', '0px'],
        ['right', 'auto'], ['bottom', 'auto'], ['margin', '0px'], ['translate', 'none'], ['rotate', 'none'],
        ['scale', 'none'], ['offset-path', 'none'], ['transform-origin', '0px 0px'],
        ['transform', `matrix3d(${matrix.join(',')})`]];
      // Keep generated matrix values out of CSSOM text serialization, which rounds them.
      const style: InlineStyleLayer = declarations.map(([name, value]) =>
        [name, value, 'important'] as const);
      return { left, top: rect.y, style };
      } finally {
        frame.destroy();
      }
    });
  }

  function signature() {
    const constrainX = Boolean(getConstrainX?.());
    const values: unknown[] = [getStyle(), popup.parentNode, popup.className,
      motion.signature(), constrainX];
    const measured = getBorderBox?.();
    if (measured) {
      values.push(measured.size.inlineSize, measured.size.blockSize,
        measured.width, measured.height, measured.boxSizing, measured.writingMode);
    }
    if (constrainX) {
      values.push(view.visualViewport?.offsetLeft ?? 0,
        view.visualViewport?.width ?? view.innerWidth);
    }
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
    values.push(css.width, css.height, css.padding, css.borderWidth,
      css.transitionProperty, css.transitionDuration, css.transitionDelay,
      css.transitionTimingFunction, css.transitionBehavior);
    for (const name of popup.style) {
      if (name.startsWith('--')) {
        values.push(
          name,
          popup.style.getPropertyValue(name)
        );
      }
    }
    return values.map(value => String(value)).join(':');
  }

  function commit(write: () => void) {
    if (!transitionStyle) {
      write();
      return;
    }
    const guard = transitionStyle;
    const protect = () => {
      transitionParser.cssText = guard;
      for (const name of transitionNames)
        popup.style.setProperty(name, transitionParser.getPropertyValue(name), 'important');
    };
    protect();
    void popup.offsetWidth;
    try {
      write();
      // Authored inline transition shorthands may have been written by the style reconciler.
      protect();
      void popup.offsetWidth;
    } finally {
      // Between frames the real node keeps the author's transition rules. Active-class changes
      // can then create genuine opacity/width/etc. transitions with their own clocks and events.
      transitionParser.cssText = getStyle() ?? '';
      for (const name of transitionNames) {
        const value = transitionParser.getPropertyValue(name);
        if (value) {
          popup.style.setProperty(name, value, transitionParser.getPropertyPriority(name));
        }
        else {
          popup.style.removeProperty(name);
        }
      }
    }
  }
  return {
    geometry, present, signature, commit,
    destroy() {
      motion.destroy();
      proxy.remove();
    }
  };
}
