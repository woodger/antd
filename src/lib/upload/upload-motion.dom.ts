// Manages the appearance and deletion of one Upload item. Finish removes temporary styles prior to
// the list of care.
export interface UploadItemMotionState {
  className?: string;
  style?: string;
}

/** CSSMotion Upload: measured height or CSS keyframes, two RAF and canceled deadline. */
export function createUploadMotion(
  node: HTMLDivElement,
  publish: (state: UploadItemMotionState) => void,
  onLeaveEnd: () => void,
  previousVisible?: boolean
) {
  const view = node.ownerDocument.defaultView!;
  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  let active = true;
  let previous = previousVisible;
  let name = '';
  let collapse = false;
  let status: 'appear' | 'enter' | 'leave' | undefined;
  let step: 'start' | 'active' | undefined;
  let style: string | undefined;
  let frame: number | undefined;
  let deadline: number | undefined;
  let revision = 0;

  // Stops the planned frame and deadline, disabling the callbacks of the previous movement.
  function cancel() {
    revision++;
    if (frame !== undefined) view.cancelAnimationFrame(frame);
    if (deadline !== undefined) view.clearTimeout(deadline);
    frame = undefined;
    deadline = undefined;
  }

  // Publishes class CSSMotion and measured inline style for the current phase.
  function update() {
    publish({
      className: status ? `${name}-${status} ${name}-${status}-${step} ${name}` : undefined,
      style
    });
  }

  // Resets the phase. Upon completed care, the control of deletion of the string to the calling list is given.
  function finish() {
    cancel();
    status = undefined;
    step = undefined;
    style = undefined;
    update();
    if (previous === false) onLeaveEnd();
  }

  // Finishes the active phase only on the event of its own node.
  function handleEnd(event: Event) {
    if (active && status && step === 'active' && event.target === node) finish();
  }

  // Interrupting the current animation when switching to reduced motion.
  function reduce() {
    if (reduced.matches && status) finish();
  }

  node.addEventListener('transitionend', handleEnd);
  node.addEventListener('animationend', handleEnd);
  reduced.addEventListener('change', reduce);

  return {
    // Aligns classes with new visibility and measures heights only for collapse mode.
    sync(options: {
      visible: boolean;
      motionName: string;
      collapse: boolean;
      enabled: boolean;
      appear: boolean;
    }) {
      if (!active) {
        return;
      }
      const { visible, motionName, enabled, appear } = options;
      name = motionName;
      collapse = options.collapse;
      if (previous === visible) {
        if (status && (!enabled || reduced.matches)) {
          finish();
        }
        else if (status) update();
        return;
      }

      const first = previous === undefined;
      previous = visible;
      cancel();
      if (!enabled || reduced.matches || first && (!visible || !appear)) {
        finish();
        return;
      }

      status = visible ? first ? 'appear' : 'enter' : 'leave';
      step = 'start';
      style = !collapse ? undefined
        : visible ? 'height:0px;'
          + 'opacity:0' : `height:${node.offsetHeight}px`;
      update();
      const current = revision;
      frame = view.requestAnimationFrame(() => {
        if (!active || current !== revision) {
          return;
        }
        frame = view.requestAnimationFrame(() => {
          frame = undefined;
          if (!active || current !== revision) {
            return;
          }
          step = 'active';
          style = !collapse ? undefined : visible
            ? `height:${node.scrollHeight}px;`
              + `opacity:1` : 'height:0px;'
              + 'opacity:0';
          update();
          deadline = view.setTimeout(() => {
            deadline = undefined;
            if (active && current === revision) finish();
          }, 2000);
        });
      });
    },
    // Cancels the remaining work and removes listeners without notifying the list of care.
    destroy() {
      active = false;
      cancel();
      node.removeEventListener('transitionend', handleEnd);
      node.removeEventListener('animationend', handleEnd);
      reduced.removeEventListener('change', reduce);
    }
  };
}
