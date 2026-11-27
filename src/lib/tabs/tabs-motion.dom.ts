// Manages Tabs panel appearance and departure phases. Prior to start hooks commits the status of
// the panels, and the callbacks of outdated transitions are discarded by an audit.
import { getTabsMotionClassName } from './tabs-motion.engine';
import type { TabsMotionEvent, TabsPaneMotion } from './tabs-motion.types';
import { createCssMotionFrame } from '../motion/css-motion-frame.dom';

type MotionStatus = 'appear' | 'enter' | 'leave';
type MotionStep = 'prepare' | 'start' | 'active';

export interface TabsPaneMotionState {
  running: boolean;
  className?: string;
  style?: string;
}

/** CSSMotion phases without React: own end events, two RAF and cancellation stale prepare/deadline. */
export function createTabsPaneMotion(
  node: HTMLDivElement,
  publish: (state: TabsPaneMotionState, commit?: boolean) => void
) {
  const view = node.ownerDocument.defaultView!;
  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  const frames = createCssMotionFrame(view);
  let config: TabsPaneMotion | undefined;
  let enabled = true;
  let previous: boolean | undefined;
  let visible = false;
  let seenVisible = false;
  let notified = false;
  let status: MotionStatus | undefined;
  let step: MotionStep | undefined;
  let style: string | undefined;
  let deadline: number | undefined;
  let visibleTimer: number | undefined;
  let revision = 0;
  let active = true;

  // Allows callbacks over current status, reading the configuration at the time of the phase.
  const handlers = () => {
    const prefix = status === 'appear' ? 'Appear' : status === 'enter' ? 'Enter' : 'Leave';
    return {
      prepare: config?.[`on${prefix}Prepare`],
      start: config?.[`on${prefix}Start`],
      active: config?.[`on${prefix}Active`],
      end: config?.[`on${prefix}End`]
    };
  };
  // Verifies the name CSSMotion, global resolution and setup reduced motion.
  const supported = () => !!config?.motionName && enabled && !reduced.matches;
  // Checks the flag for the current appear, enter, or leave phase. Each phase is enabled by default.
  const allowed = () => config?.[status === 'appear' ? 'motionAppear'
    : status === 'enter' ? 'motionEnter' : 'motionLeave'] !== false;

  // Invalidates pending frames and clears completion and notification timers.
  function cancel() {
    revision++;
    frames.cancel();
    if (deadline !== undefined) view.clearTimeout(deadline);
    if (visibleTimer !== undefined) view.clearTimeout(visibleTimer);
    deadline = undefined;
    visibleTimer = undefined;
  }

  // Publishes classes and phase style with the ability to synchronously combine DOM.
  function update(commit = false) {
    publish(
      {
        running: status !== undefined,
        className: status && step ? getTabsMotionClassName(config?.motionName, status, step) : undefined,
        style
      },
      commit
    );
  }

  // Removes temporary classes and chooses the moment onVisibleChanged according to the method of completion.
  function finish(passive = false) {
    cancel();
    status = undefined;
    step = undefined;
    style = undefined;
    update();
    if ((seenVisible || notified) && config?.onVisibleChanged) {
      const current = revision;
      // Quotes visibility notification only for up-to-date transition after synchronization DOM.
      const notify = () => {
        visibleTimer = undefined;
        if (active && current === revision) config?.onVisibleChanged?.(visible);
      };
      // CSS end callbacks are completed to a passive notification; without motion enough DOM commit.
      if (passive) {
        visibleTimer = view.setTimeout(notify, 0);
      }
      else {
        queueMicrotask(notify);
      }
    }
    notified = true;
  }

  // Postpones the phase change up to two RAF and takes into account the revision of the panel controller.
  function nextFrame(callback: () => void) {
    const current = revision;
    frames.next(() => {
      if (active && current === revision) callback();
    });
  }

  // Accepts the events of its own panel and deadline. End callback can leave the transition active.
  function handleEnd(event: TabsMotionEvent) {
    if (!active || !status || step !== 'active') {
      return;
    }
    if ('target' in event && event.target !== node) {
      return;
    }
    const current = revision;
    const result = handlers().end?.(node, event);
    if (active && current === revision && result !== false) finish(true);
  }

  // Commits prepare and start before active. Each user callback may change the current revision.
  function start() {
    if (!supported()) {
      finish();
      return;
    }
    update();
    const current = revision;
    // First both commit slots and notifications without motion, then layout start hooks.
    queueMicrotask(() => {
      if (!active || current !== revision) {
        return;
      }
      queueMicrotask(() => {
        if (!active || current !== revision) {
          return;
        }
        // React manages to commit prepare even when missed prepare hook.
        step = 'prepare';
        update(true);
        if (!active || current !== revision) {
          return;
        }
        step = 'start';
        const result = handlers().start?.(node, null);
        if (!active || current !== revision) {
          return;
        }
        style = handlers().prepare
          ? ['transition:none', result].filter(Boolean).join(';') : result || undefined;
        update(true);
        if (!active || current !== revision) {
          return;
        }
        nextFrame(() => {
          step = 'active';
          style = handlers().active?.(node, null) || undefined;
          if (!active || current !== revision) {
            return;
          }
          update();
          if (config?.motionDeadline && config.motionDeadline > 0) {
            deadline = view.setTimeout(() => {
              deadline = undefined;
              if (active && current === revision) handleEnd({ deadline: true });
            }, config.motionDeadline);
          }
        });
      });
    });
  }

  // Concludes the movement when the motion is switched on, saving the already waiting prepare phase.
  function reduce() {
    if (reduced.matches && status && step !== 'prepare') finish();
  }

  node.addEventListener('transitionend', handleEnd);
  node.addEventListener('animationend', handleEnd);
  reduced.addEventListener('change', reduce);

  return {
    // Agrees the change in visibility with the configuration. Prepare must be completed before
    // starting the movement phases.
    sync(next: boolean, options: TabsPaneMotion | undefined, motionEnabled: boolean) {
      if (!active) {
        return;
      }
      config = options;
      enabled = motionEnabled;
      seenVisible ||= next;

      if (previous === next) {
        if (status && (!allowed() || !supported() && step !== 'prepare')) {
          finish();
        }
        else if (status) update();
        return;
      }
      const first = previous === undefined;
      previous = next;
      visible = next;
      cancel();
      status = next ? first ? 'appear' : 'enter'
        : !first || config?.motionLeaveImmediately ? 'leave' : undefined;
      step = undefined;
      style = undefined;
      if (!status || !allowed() || !supported() && !handlers().prepare) {
        finish();
        return;
      }
      const prepare = handlers().prepare;
      if (prepare) {
        step = 'prepare';
        update();
        const current = revision;
        queueMicrotask(() => {
          if (!active || current !== revision) {
            return;
          }
          update(true);
          if (!active || current !== revision) {
            return;
          }
          const result = prepare(node);
          if (!active || current !== revision) {
            return;
          }
          nextFrame(() => {
            void Promise.resolve(result).then(() => {
              if (active && current === revision) start();
            });
          });
        });
      }
      else {
        start();
      }
    },
    // Disconnects subscriptions and disables the entire deferred work of the panel.
    destroy() {
      active = false;
      cancel();
      node.removeEventListener('transitionend', handleEnd);
      node.removeEventListener('animationend', handleEnd);
      reduced.removeEventListener('change', reduce);
    }
  };
}
