// Creates a controller of a single DOM node, choosing a fade or menu offset. Animates the
// visibility of FloatButton or the drop-down list. The audit protects the removal of DOM from the
// completion of the cancelled care.
export function createFloatButtonMotion(
  node: Element,
  menu: boolean,
  remove: () => void,
  initialTarget?: boolean,
  getRootPrefix: () => string = () => 'ant'
) {
  const view = node.ownerDocument.defaultView!;
  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  let active = true;
  let target = initialTarget;
  let animation: Animation | undefined;
  let revision = 0;
  // Cancels the retention of the styles of the current animation and disables its completion.
  function cancel() {
    revision++;
    animation?.cancel();
    animation = undefined;
  }
  // Finishes the current movement when the reduced motion is switched on.
  function reduce() {
    if (reduced.matches)
      animation?.finish();
  }
  reduced.addEventListener('change', reduce);
  return {
    // When changing the direction retains the current calculated styles, and after leaving causes remove.
    sync(visible: boolean) {
      if (!active) {
        return;
      }
      if (target === visible) {
        if (!visible && !animation)
          remove();
        return;
      }
      target = visible;
      const style = view.getComputedStyle(node);
      const from = animation ? {
        opacity: style.opacity,
        ...(menu ? { transform: style.transform } : {})
      } : undefined;
      cancel();
      const token = style.getPropertyValue(
        menu ? '--ant-motion-duration-slow' : '--ant-motion-duration-mid'
      ).trim();
      const parsed = parseFloat(token) * (token.endsWith('ms') ? 1 : 1000);
      const duration = reduced.matches
        ? 0
        : Number.isFinite(parsed) && parsed >= 0 ? parsed : menu ? 300 : 200;
      if (!duration) {
        if (!visible)
          remove();
        return;
      }
      const shift = menu
        ? style.getPropertyValue(`--${getRootPrefix().replace(/\./g, '')}-float-btn-list-transform-start`).trim()
        || 'translate(0,40px)'
        : 'none';
      const current = revision;
      animation = node.animate([
        from ?? {
          opacity: visible ? '0' : '1',
          ...(menu ? { transform: visible ? shift : 'none' } : {})
        },
        {
          opacity: visible ? '1' : '0',
          ...(menu ? { transform: visible ? 'none' : shift } : {})
        }
      ], { duration, easing: menu ? 'ease' : 'linear', fill: 'both' });
      void animation.finished.then(() => {
        if (!active || revision !== current) {
          return;
        }
        cancel();
        if (!visible)
          remove();
      }, () => { });
    },
    // Removes the media listener and cancels the movement when the node is destroyed.
    destroy() {
      active = false;
      cancel();
      reduced.removeEventListener('change', reduce);
    }
  };
}
