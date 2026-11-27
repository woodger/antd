// Animates a holder or a separate Form message. When the direction changes, the new movement takes
// the initial values from the current DOM.
interface FormErrorMotion {
  visible: boolean;
  kind: 'holder' | 'message';
  onFinish(visible: boolean): void;
}

/** Web Animations preserves CSS easing and cancels the previous motion when turning or unmount. */
export function formErrorMotion(node: HTMLElement, initial: FormErrorMotion) {
  const view = node.ownerDocument.defaultView!;
  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  let parameters = initial;
  let animation: Animation | undefined;
  let deadline: number | undefined;
  let active = true;
  let generation = 0;

  // Cleans the animation and fallback timer of the previous transition.
  function cancel() {
    view.clearTimeout(deadline);
    deadline = undefined;
    animation?.cancel();
    animation = undefined;
  }

  // Removes the initial geometry until the cancellation of the old transition. Holder only uses
  // transparency.
  function run(appearing: boolean) {
    const current = view.getComputedStyle(node);
    const fromOpacity = appearing ? 0 : current.opacity;
    const fromHeight = appearing ? 0 : node.getBoundingClientRect().height;
    const fromTransform = appearing ? 'translateY(-5px)' : current.transform;
    const token = current.getPropertyValue('--ant-motion-duration-fast').trim();
    const parsed = Number.parseFloat(token) * (token.endsWith('ms') ? 1 : 1000);
    const duration = reduced.matches ? 0 : Number.isFinite(parsed) && parsed >= 0 ? parsed : 100;
    const easing = current.getPropertyValue('--ant-motion-ease-in-out').trim()
      || 'cubic-bezier(0.645, 0.045, 0.355, 1)';
    const visible = parameters.visible;
    const tokenId = ++generation;
    let finished = false;
    cancel();

    // Releases resources before onFinish and suppresses a repeat event or an outdated deadline.
    function finish() {
      if (!active || finished || tokenId !== generation) {
        return;
      }

      finished = true;
      cancel();
      parameters.onFinish(visible);
    }

    if (duration === 0) {
      queueMicrotask(finish);
      return;
    }

    const frames: Keyframe[] = parameters.kind === 'holder'
      ? [{ opacity: fromOpacity }, { opacity: visible ? 1 : 0 }]
      : [
        {
          height: `${fromHeight}px`, opacity: fromOpacity,
          transform: fromTransform, overflow: 'hidden'
        },
        {
          height: `${visible ? node.scrollHeight : 0}px`, opacity: visible ? 1 : 0,
          transform: `translateY(${visible ? 0 : -5}px)`, overflow: 'hidden'
        }
      ];

    animation = node.animate(frames, { duration, easing, fill: 'both' });
    void animation.finished.then(finish, () => {});
    // CSSMotion upstream has the same boundary if the transitionend did not come.
    deadline = view.setTimeout(finish, 500);
  }

  // Bringing the active animation to the end when the reduced motion is enabled.
  function handleReducedMotion() {
    if (reduced.matches) animation?.finish();
  }

  reduced.addEventListener('change', handleReducedMotion);
  run(initial.visible);

  return {
    // Retains current callbacks. Starts the movement again only when the visibility changes.
    update(next: FormErrorMotion) {
      const changed = parameters.visible !== next.visible;
      parameters = next;
      if (changed) run(false);
    },
    // Disables callbacks animations and removes the subscription to the traffic settings.
    destroy() {
      active = false;
      generation++;
      cancel();
      reduced.removeEventListener('change', handleReducedMotion);
    }
  };
}
