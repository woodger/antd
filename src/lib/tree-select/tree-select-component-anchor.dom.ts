/** rc-trigger 3.x useAlign/useWatch; MIT, vendor/LICENSE.rc-trigger. */

/** Source aligns popup at resize/scroll/open, and not with one inline root movement. */
export function createTreeSelectComponentAnchor(
  anchor: HTMLElement,
  popup: HTMLElement,
  right: boolean
) {
  const document = anchor.ownerDocument, view = document.defaultView!;
  let dirty = true;
  let signature = '';
  let frame = 0;
  let cached: DOMRect | undefined;
  let parent: HTMLElement | undefined;
  let parentX = 0, parentY = 0;

  function containingBlock() {
    let node = popup.parentElement;
    while (node) {
      const style = view.getComputedStyle(node);
      if (style.position !== 'static' || style.transform !== 'none' || style.perspective !== 'none'
        || style.filter !== 'none' || /layout|paint|strict|content/.test(style.contain)
        || style.willChange.split(',').some(value => value.trim() === 'transform')) {
        return node;
      }
      if (node === document.documentElement) {
        return;
      }
      node = node.parentElement;
    }
  }
  const scrollers = new Set<Element>();
  for (const element of [anchor, popup]) {
    let node = element.parentElement;
    while (node) {
      const style = view.getComputedStyle(node);
      if ([style.overflow, style.overflowX, style.overflowY].some(value =>
        ['auto', 'scroll', 'hidden', 'clip'].includes(value))) {
        scrollers.add(node);
      }
      node = node.parentElement;
    }
  }
  function invalidate() { dirty = true; }
  const resize = new view.ResizeObserver(() => {
    const rect = anchor.getBoundingClientRect(), bounds = popup.getBoundingClientRect();
    const next = [Math.floor(rect.width), Math.floor(rect.height), anchor.offsetWidth, anchor.offsetHeight,
      Math.floor(bounds.width), Math.floor(bounds.height), popup.offsetWidth, popup.offsetHeight].join(':');
    if (next === signature) {
      return;
    }
    signature = next;
    // Overflow must apply your measured layout before reading the targeted rect.
    if (!frame) {
      frame = view.requestAnimationFrame(() => {
        frame = 0;
        invalidate();
      });
    }
  });
  resize.observe(anchor);
  resize.observe(popup);
  for (const node of scrollers) node.addEventListener('scroll', invalidate, { passive: true });
  view.addEventListener('scroll', invalidate, { passive: true });
  view.addEventListener('resize', invalidate, { passive: true });

  function read(rect: DOMRect) {
    // ShadowRoot remains on the existing Native viewport path.
    if (popup.parentNode instanceof view.ShadowRoot) {
      return rect;
    }
    const block = containingBlock(), blockRect = block?.getBoundingClientRect();
    const x = blockRect ? right ? blockRect.right : blockRect.left : -view.scrollX;
    const y = blockRect?.top ?? -view.scrollY;
    if (!cached || dirty || block !== parent) {
      cached = rect;
      parent = block;
      parentX = x;
      parentY = y;
      dirty = false;
    }
    return new view.DOMRect(
      cached.x + x - parentX,
      cached.y + y - parentY,
      cached.width,
      cached.height
    );
  }
  return { read, destroy() {
    resize.disconnect();
    if (frame) view.cancelAnimationFrame(frame);
    for (const node of scrollers) node.removeEventListener('scroll', invalidate);
    view.removeEventListener('scroll', invalidate);
    view.removeEventListener('resize', invalidate);
  } };
}
