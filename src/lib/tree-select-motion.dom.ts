/** rc-motion1.3.3 useStatus/useStepQueue, Trigger3.10.1 Popup; MIT, vendor licenses. */
import { createCssMotionFrame } from './css-motion-frame.dom';
import type { TreeSelectMotionFrameState } from './tree-select-motion-frame.dom';

type MotionStatus = NonNullable<TreeSelectMotionFrameState['status']>;
type MotionStep = NonNullable<TreeSelectMotionFrameState['step']>;

export interface TreeSelectPopupMotionState extends TreeSelectMotionFrameState {
  running: boolean;
  present: boolean;
  renderReady: boolean;
  className?: string;
  style?: string;
}

/** Visible changes drive phases; name/context updates preserve an already active Source phase. */
export function createTreeSelectPopupMotion(
  node: HTMLElement,
  options: {
    publish: (state: TreeSelectPopupMotionState, commit?: boolean) => void;
    prepare: () => void | Promise<unknown>;
    visibleChanged: (visible: boolean) => void;
  }
) {
  const frames = createCssMotionFrame(node.ownerDocument.defaultView!);
  let active = true;
  let revision = 0;
  let previous: boolean | undefined;
  let visible = false;
  let seen = false;
  let name = '';
  let enabled = true;
  let status: MotionStatus | undefined;
  let step: MotionStep | undefined;
  let rendered: Pick<TreeSelectPopupMotionState, 'present' | 'className' | 'style'> = {
    present: false
  };

  const supported = () => Boolean(name) && enabled;
  const preparing = () => status === 'appear' || status === 'enter';

  function publish(commit = false) {
    const renderReady = Boolean(status) || step !== 'start' && step !== 'active';
    const suffix = step === 'activated' ? 'active' : step;
    const className = status && suffix
      ? name ? `${name}-${status} ${name}-${status}-${suffix} ${name}` : undefined
      : undefined;
    // CSSMotion memoizes its children until the style belongs to the current step. An end
    // during ACTIVE clears the internal status immediately, but keeps that painted frame
    // until the queued ACTIVATED step makes the stable children ready again.
    if (renderReady) {
      rendered = {
        present: visible || Boolean(status),
        className,
        style: preparing() && step === 'start' ? 'transition:none' : undefined
      };
    }
    options.publish({
      ...rendered,
      revision,
      status,
      step,
      renderReady,
      running: Boolean(status)
    }, commit);
  }

  function finish() {
    frames.cancel();
    status = undefined;
    if (step !== 'active') step = undefined;
    publish(true);
    const current = revision;
    if (step === 'active') {
      frames.next(() => {
        if (active && current === revision) advance('activated');
      });
    }
    queueMicrotask(() => {
      if (active && current === revision && seen) options.visibleChanged(visible);
    });
  }

  function process() {
    if (!active || !status || !step || step === 'activated') {
      return;
    }
    const current = revision;
    const queue: readonly (MotionStep | 'prepared')[] = supported()
      ? ['prepare', 'start', 'active', 'activated'] : ['prepare', 'prepared'];
    const next = queue[queue.indexOf(step) + 1];

    if (step === 'prepare' && !preparing()) {
      if (next === 'prepared' || !next) finish();
      else advance(next);
      return;
    }

    const prepared = step === 'prepare' ? options.prepare() : undefined;
    frames.next(() => {
      void Promise.resolve(prepared).then(() => {
        if (!active || revision !== current) {
          return;
        }
        if (next === 'prepared') finish();
        else if (next) advance(next);
      });
    });
  }

  function advance(next: MotionStep) {
    step = next;
    publish(true);
    process();
  }

  function complete(current = revision) {
    if (!active || current !== revision || !status
      || step !== 'active' && step !== 'activated') {
      return;
    }
    finish();
  }

  function handleEnd(event: Event) {
    if (event.target === node) complete();
  }
  node.addEventListener('animationend', handleEnd);
  node.addEventListener('transitionend', handleEnd);

  return {
    complete,
    sync(next: boolean, nextName: string, motionEnabled: boolean) {
      if (!active) {
        return;
      }
      name = nextName;
      enabled = motionEnabled;
      if (previous === next) {
        publish();
        return;
      }

      previous = next;
      visible = next;
      revision++;
      frames.cancel();
      status = next ? seen ? 'enter' : 'appear' : seen && supported() ? 'leave' : undefined;
      seen ||= next;
      step = status ? 'prepare' : undefined;
      publish();
      const current = revision;
      queueMicrotask(() => {
        if (!active || current !== revision) {
          return;
        }
        if (status) process();
        else if (seen) finish();
      });
    },
    destroy() {
      active = false;
      revision++;
      frames.cancel();
      node.removeEventListener('animationend', handleEnd);
      node.removeEventListener('transitionend', handleEnd);
    }
  };
}
