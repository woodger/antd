// Manages CSSMotion phases for a DOM surface. Each change invalidates scheduled frames, the
// preparation Promise, the deadline, and notifications from the previous revision.
import { createCssMotionFrame } from './css-motion-frame.dom';
import { getCssMotionClassName, type CssMotionPhase, type CssMotionStep }
  from './css-motion.engine';
import { serializeCssProperties, serializeInlineStyleLayers } from '../style/inline-style.engine';
import type { CssMotionConfig, CssMotionEvent, CssMotionStyle } from './css-motion.types';

export interface CssMotionState {
  phase?: CssMotionPhase;
  step?: CssMotionStep;
  className?: string;
  style?: string;
}

export interface CssMotionInput<Element extends HTMLElement = HTMLElement> {
  motion: CssMotionConfig<Element>;
  present: boolean;
  visible: boolean;
  enabled: boolean;
  inactive?: boolean;
  initialVisibility?: boolean;
  forced?: boolean;
  settleWithoutAnimation?: boolean;
  /** Reports final visibility when settings cancel an active phase. */
  settleOnCutoff?: boolean;
}

/** The upstream object uses the same units as the inline style option. */
export function getCssMotionStyle(value: CssMotionStyle | void) {
  if (typeof value === 'string') {
    return value;
  }

  return value ? serializeCssProperties(value) : undefined;
}

/** Phases follow rc-motion 1.3.3. MIT, vendor/LICENSE.rc-motion. */
export function createCssMotion<Element extends HTMLElement>(
  view: Window,
  getElement: () => Element | undefined,
  publish: (state: CssMotionState, commit?: boolean) => void
) {
  const frames = createCssMotionFrame(view);
  let active = true;
  let revision = 0;
  let previous: boolean | undefined;
  let initialized = false;
  let input: CssMotionInput<Element>;
  let phase: CssMotionPhase | undefined;
  let step: CssMotionStep | undefined;
  let style: string | undefined;
  let deadline: number | undefined;
  let painted: CssMotionState = {};

  // Stores handlers separately for each phase and reads the current configuration before invoking them.
  function handlers(phase: CssMotionPhase) {
    const key = phase === 'appear' ? 'Appear' : phase === 'enter' ? 'Enter' : 'Leave';
    return {
      prepare: input.motion[`on${key}Prepare`],
      start: input.motion[`on${key}Start`],
      active: input.motion[`on${key}Active`],
      end: input.motion[`on${key}End`]
    };
  }

  // Clears pending work without notification because the previous phase's callback is stale.
  function cancel() {
    revision++;
    frames.cancel();
    if (deadline !== undefined) {
      view.clearTimeout(deadline);
      deadline = undefined;
    }
  }

  // Commits synchronously only before user measurements in a browser callback.
  function paint(commit = false) {
    const className = phase && step
      ? getCssMotionClassName(input.motion.motionName, phase, step) : undefined;
    if (!commit && painted.phase === phase && painted.step === step
      && painted.className === className && painted.style === style) {
      return;
    }

    painted = { phase, step, className, style };
    publish(painted, commit);
  }

  // Removes classes before reporting final visibility.
  function finish(notify: boolean) {
    cancel();
    phase = undefined;
    step = undefined;
    style = undefined;
    if (!input.present && !input.visible) previous = undefined;
    paint();

    if (notify) {
      const current = revision;
      queueMicrotask(() => {
        if (active && current === revision) input.motion.onVisibleChanged?.(input.visible);
      });
    }
  }

  // Ignores descendant animations and allows completion to be deferred.
  function end(event: CssMotionEvent) {
    if (!active || !phase || step !== 'active') {
      return;
    }
    const element = getElement();
    if ('target' in event && event.target !== element) {
      return;
    }

    const current = revision;
    const result = element && handlers(phase).end?.(element, event);
    if (active && revision === current && result !== false) finish(true);
  }

  // Measures the start frame before applying the final style and starts the deadline timer.
  function enterActive(current: number) {
    if (!active || current !== revision || !phase) {
      return;
    }
    const element = getElement();
    const result = element && handlers(phase).active?.(element, null);
    if (!active || current !== revision) {
      return;
    }

    step = 'active';
    style = getCssMotionStyle(result);
    paint();

    const timeout = input.motion.motionDeadline;
    if (timeout && timeout > 0) {
      deadline = view.setTimeout(() => {
        deadline = undefined;
        if (current === revision) end({ deadline: true });
      }, timeout);
    }
    if (input.settleWithoutAnimation) {
      frames.next(() => {
        if (active && current === revision && !getElement()?.getAnimations().length) {
          finish(true);
        }
      });
    }
  }

  // Retains previous classes until the start hook runs and enables the transition after two frames.
  function enterStart(current: number, prepared: boolean) {
    if (!active || current !== revision || !phase) {
      return;
    }
    const element = getElement();
    const result = element && handlers(phase).start?.(element, null);
    if (!active || current !== revision) {
      return;
    }

    step = 'start';
    style = serializeInlineStyleLayers([
      prepared ? 'transition:none' : undefined, getCssMotionStyle(result)
    ]);
    paint();
    frames.next(() => enterActive(current));
  }

  // Preparation remains available with motion disabled and can return a measurement Promise.
  function prepare(current: number) {
    if (!active || current !== revision || !phase) {
      return;
    }
    const callback = handlers(phase).prepare;
    if (!callback) {
      enterStart(current, false);
      return;
    }

    paint(true);
    if (!active || current !== revision) {
      return;
    }
    const element = getElement();
    const pending = element && callback(element);
    if (!active || current !== revision) {
      return;
    }

    frames.next(() => {
      void Promise.resolve(pending).then(() => {
        if (!active || current !== revision) {
          return;
        }
        if (input.enabled && input.motion.motionName) enterStart(current, true);
        else finish(true);
      });
    });
  }

  // Chooses appear, enter, or leave based on whether Motion was present before the visibility change.
  function sync(next: CssMotionInput<Element>) {
    if (!active) {
      return;
    }
    const initial = !initialized;
    const wasEnabled = input?.enabled && Boolean(input.motion.motionName);
    initialized = true;
    input = next;
    if (initial && next.initialVisibility !== undefined) {
      previous = next.initialVisibility;
    }
    if (next.inactive) {
      previous = undefined;
      finish(false);
      return;
    }
    if (!next.present && !next.visible && previous !== true && !phase) {
      previous = undefined;
      return;
    }
    const enabled = next.enabled && Boolean(next.motion.motionName);
    if (previous === next.visible) {
      if (phase && (wasEnabled && !enabled || !allows(phase))) {
        finish(next.settleOnCutoff === true);
      }
      else if (phase) paint();
      return;
    }

    const before = previous;
    previous = next.visible;
    cancel();
    phase = next.visible ? before === undefined && !next.forced ? 'appear' : 'enter'
      : before === true || next.motion.motionLeaveImmediately ? 'leave' : undefined;
    step = undefined;
    style = undefined;

    if (!phase || !allows(phase) || !enabled && !handlers(phase).prepare) {
      finish(before !== undefined || next.visible);
      return;
    }

    step = handlers(phase).prepare ? 'prepare' : undefined;
    paint();
    const current = revision;
    queueMicrotask(() => prepare(current));
  }

  // Each flag enables its own phase. Omitted fields follow CSSMotion defaults.
  function allows(phase: CssMotionPhase) {
    const key = phase === 'appear' ? 'motionAppear' : phase === 'enter' ? 'motionEnter'
      : 'motionLeave';
    return input.motion[key] !== false;
  }

  return {
    sync,
    end,
    // Destroying the owner prevents late DOM measurements and callbacks.
    destroy() {
      active = false;
      cancel();
    }
  };
}
