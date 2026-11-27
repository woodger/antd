// Creates a temporary aria-hidden thumb and returns the completion function. Without valid
// measurements or the duration of DOM remains the same. Moves a temporary Segmented indicator
// between measured points. Changing geometry or motion settings completes the transition.
export function animateSegmentedThumb(
  group: HTMLElement,
  from: HTMLElement,
  to: HTMLElement,
  vertical: boolean,
  start: () => void,
  finish: () => void,
  prefix = 'ant-segmented'
): () => void {
  const view = group.ownerDocument.defaultView!;
  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  const style = view.getComputedStyle(group);
  const durationText = style.getPropertyValue('--ant-motion-duration-slow').trim();
  const duration = Number.parseFloat(durationText) * (durationText.endsWith('ms') ? 1 : 1000);
  if (reduced.matches
    || !from.getClientRects().length
    || !to.getClientRects().length
    || !(duration > 0)) {
    // In this branch, a temporary indicator and subscriptions have not yet been created.
    return () => { };
  }

  // Reads the local layout-coordinations of the item, so that the scale of the parent does not fall into account.
  function geometry(node: HTMLElement) {
    // The MotionThumb benchmark measures the layout, not scaled-up screen rects.
    return {
      x: node.offsetLeft,
      y: node.offsetTop,
      width: node.clientWidth,
      height: node.clientHeight
    };
  }
  const first = geometry(from);
  const last = geometry(to);
  // Compares the group and both ends of the transition with a single geometry key for ResizeObserver.
  function signature() {
    return JSON.stringify([group.clientWidth, group.clientHeight, geometry(from), geometry(to)]);
  }
  const baseline = signature();
  const thumb = group.ownerDocument.createElement('div');
  thumb.className = `${prefix}-thumb`;
  thumb.setAttribute('data-ant-segmented-thumb', '');
  thumb.setAttribute('aria-hidden', 'true');
  Object.assign(
    thumb.style,
    {
      left: '0px',
      right: 'auto',
      top: '0px',
      width: `${last.width}px`,
      height: `${last.height}px`
    }
  );
  group.prepend(thumb);
  start();

  const animation = thumb.animate([
    {
      transform: `translate(${first.x}px, ${vertical
        ? first.y
        : 0}px)`,
      width: `${first.width}px`
    },
    { transform: `translate(${last.x}px, ${vertical ? last.y : 0}px)`, width: `${last.width}px` }
  ], {
    duration,
    easing: style.getPropertyValue('--ant-motion-ease-in-out').trim() || 'ease-in-out',
    fill: 'both'
  });
  let active = true;
  const observer = new view.ResizeObserver(() => {
    if (signature() !== baseline)
      stop();
  });
  observer.observe(group);
  observer.observe(from);
  observer.observe(to);
  reduced.addEventListener('change', stop);

  // Releases an indicator and subscriptions once prior to calling the finish.
  function stop() {
    if (!active) {
      return;
    }

    active = false;
    observer.disconnect();
    reduced.removeEventListener('change', stop);
    animation.cancel();
    thumb.remove();
    finish();
  }

  void animation.finished.then(stop, stop);
  return stop;
}
