// Syncs the Badge DOM with CSSMotion phases. A frame revision bounds work from stale transitions.
export interface BadgeZoomState {
  rendered: boolean;
  className?: string;
}

/** Badge CSSMotion skips appear, uses two RAFs, listens for its own end events, and has a 1000 ms deadline. */
export function createBadgeZoom(
  view: Window,
  getElement: () => HTMLElement | undefined,
  publish: (state: BadgeZoomState) => void
) {
  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  let previous: boolean | undefined;
  let visible = false;
  let rendered = false;
  let status: 'enter' | 'leave' | undefined;
  let step: 'start' | 'active' | 'activated' | undefined;
  let ending = false;
  let frame: number | undefined;
  let deadline: number | undefined;
  let bound: HTMLElement | undefined;
  let revision = 0;
  let alive = true;

  // Publishes node presence and classes for the current transition. Active classes apply after start.
  function update() {
    publish({
      rendered,
      className: status && step
        ? `ant-badge-zoom-${status} ant-badge-zoom-${status}-${step === 'start' ? 'start' : 'active'} ant-badge-zoom`
        : undefined
    });
  }

  // Cancels the scheduled frame and invalidates queued transition callbacks.
  function cancelFrame() {
    revision++;
    if (frame !== undefined) view.cancelAnimationFrame(frame);
    frame = undefined;
  }

  // Waits two frames to separate CSS class changes. Both frames check the current revision.
  function nextFrame(callback: () => void) {
    const current = revision;
    frame = view.requestAnimationFrame(() => {
      if (!alive || current !== revision) {
        return;
      }

      frame = view.requestAnimationFrame(() => {
        frame = undefined;
        if (alive && current === revision) callback();
      });
    });
  }

  // Removes both completion event listeners from the previously attached node.
  function unbind() {
    bound?.removeEventListener('animationend', handleEnd);
    bound?.removeEventListener('transitionend', handleEnd);
    bound = undefined;
  }

  // Resets the transition and publishes actual visibility to render state.
  function finish() {
    cancelFrame();
    status = undefined;
    step = undefined;
    ending = false;
    rendered = visible;
    update();
  }

  // Handles events from the Badge itself. Early completion defers node removal until the required
  // frame.
  function handleEnd(event: Event) {
    if (!alive || !status || !step || step === 'start' || ending
      || event.target !== getElement()) {
      return;
    }

    if (step === 'activated') {
      finish();
      return;
    }

    // CSSMotion keeps the previous render through an early end until STEP_ACTIVATED.
    cancelFrame();
    ending = true;
    nextFrame(finish);
  }

  // Finishes an active transition when reduced motion is enabled.
  function reduce() {
    if (reduced.matches && status) finish();
  }

  reduced.addEventListener('change', reduce);

  return {
    // Syncs mode and visibility. Repeating the same value normally starts no new animation.
    sync(next: boolean, enabled: boolean, normal = true) {
      if (!alive) {
        return;
      }
      visible = next;
      if (!normal) {
        cancelFrame();
        if (deadline !== undefined) view.clearTimeout(deadline);
        deadline = undefined;
        unbind();
        previous = undefined;
        status = undefined;
        step = undefined;
        ending = false;
        rendered = false;
        update();
        return;
      }
      if (previous === next) {
        return;
      }

      const initial = previous === undefined;
      previous = next;
      cancelFrame();
      ending = false;
      if (initial || !enabled || reduced.matches) {
        finish();
        return;
      }

      status = next ? 'enter' : 'leave';
      step = 'start';
      rendered = true;
      update();
      nextFrame(() => {
        step = 'active';
        update();
        const element = getElement();
        if (bound !== element) {
          unbind();
          bound = element;
          bound?.addEventListener('animationend', handleEnd);
          bound?.addEventListener('transitionend', handleEnd);
        }
        if (deadline !== undefined) view.clearTimeout(deadline);
        deadline = view.setTimeout(() => {
          deadline = undefined;
          if (alive && status && !ending && step !== 'start') finish();
        }, 1000);
        nextFrame(() => {
          step = 'activated';
        });
      });
    },
    // Releases the frame, deadline, DOM listeners, and media listener on component destruction.
    destroy() {
      alive = false;
      cancelFrame();
      if (deadline !== undefined) view.clearTimeout(deadline);
      unbind();
      reduced.removeEventListener('change', reduce);
    }
  };
}
