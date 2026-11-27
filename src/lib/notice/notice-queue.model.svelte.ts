export type NoticeKey = string | number;
/** Call the handle to close the entry. Await then for completion or silent queue detachment. */
export interface NoticeHandle extends PromiseLike<boolean> {
  (): void;
}
/** Shared options for entries in the Message and Notification queue. */
export interface NoticeConfig {
  key?: NoticeKey;
  duration?: number;
  pauseOnHover?: boolean;
  onClose?: () => void;
  onDismiss?: () => void;
}
export interface NoticeOptions {
  duration?: number;
  maxCount?: number;
  pauseOnHover?: boolean;
}
export type QueueNotice<Config> = Omit<
  Config,
  'onClose'
  | 'duration'
  | 'pauseOnHover'
  | 'onDismiss'
> & {
  readonly id: number;
  readonly version: number;
  readonly closing: boolean;
};

export const noticeQueueKey = Symbol('ant-notice-queue');

/** Queue clock. schedule takes milliseconds and returns a function that cancels the callback. */
export interface NoticeClock {
  now: () => number;
  schedule: (callback: () => void, milliseconds: number) => () => void;
}

interface Entry<Config> {
  notice: QueueNotice<Config>;
  duration: number;
  remaining: number;
  pauseOnHover: boolean;
  hovered: boolean;
  focused: boolean;
  rendered: boolean;
  started: number;
  timerVersion: number;
  cancel?: () => void;
  onClose?: () => void;
  onDismiss?: () => void;
  completion: Promise<boolean>;
  resolve: (closed: boolean) => void;
}

function durationOf(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value >= 0
    ? Math.min(value, Number.MAX_SAFE_INTEGER / 1000) * 1000
    : fallback;
}

function noticeHandle(close: () => void, completion: Promise<boolean>): NoticeHandle {
  // bind preserves the Promise receiver when then is called through the callable handle.
  // oxlint-disable-next-line unicorn/no-thenable -- The public API deliberately supports both close() and awaiting completion.
  return Object.assign(close, { then: completion.then.bind(completion) });
}

export function createNoticeQueue<Config extends NoticeConfig>(
  options: NoticeOptions,
  connectionError: string,
  defaultDuration = 3,
  getList?: (notice: QueueNotice<Config>) => string
) {
  function resolveDefaults(config: NoticeOptions) {
    return {
      duration: durationOf(config.duration, defaultDuration * 1000),
      pauseOnHover: config.pauseOnHover ?? true,
      maxCount: config.maxCount !== undefined
        && Number.isFinite(config.maxCount)
        && config.maxCount >= 1
        ? Math.floor(config.maxCount)
        : Infinity
    };
  }
  let defaults = resolveDefaults(options);
  const entries = new Map<number, Entry<Config>>();
  let notices = $state.raw<readonly QueueNotice<Config>[]>([]);
  let visible = $state(false);
  const hoveredLists = new Set<string | undefined>();
  let timerRevision = $state(0);
  let nextTimerRevision = 0;
  let state: 'fresh' | 'mounted' | 'detached' = 'fresh';
  let clock: NoticeClock | undefined;
  let nextId = 0;

  function publish() {
    notices = [...entries.values()].map((entry) => entry.notice);
  }

  function stop(entry: Entry<Config>) {
    entry.timerVersion++;
    if (entry.cancel) {
      entry.cancel();
      entry.cancel = undefined;
      entry.remaining = Math.max(0, entry.remaining - Math.max(0, clock!.now() - entry.started));
      timerRevision = ++nextTimerRevision;
    }
  }

  function arm(entry: Entry<Config>) {
    if (!clock
      || !visible
      || !entry.rendered
      || entry.notice.closing
      || entry.cancel
      || entry.duration === 0
      || (entry.pauseOnHover
        && (entry.hovered || hoveredLists.has(getList?.(entry.notice))))
      || entry.focused) {
      return;
    }

    const currentClock = clock;
    const id = entry.notice.id;
    const version = entry.notice.version;
    const timerVersion = ++entry.timerVersion;
    entry.started = currentClock.now();
    // Long delays are split into intervals supported by browser setTimeout.
    entry.cancel = currentClock.schedule(() => {
      if (entries.get(id) !== entry
        || entry.notice.version !== version
        || entry.timerVersion !== timerVersion
        || entry.notice.closing) {
        return;
      }

      entry.cancel = undefined;
      entry.remaining = Math.max(
        0,
        entry.remaining - Math.max(0, currentClock.now() - entry.started)
      );
      if (entry.remaining > 0) {
        arm(entry);
      }
      else {
        closeEntries([entry], true);
      }
    }, Math.min(entry.remaining, 2_147_483_647));
    timerRevision = ++nextTimerRevision;
  }

  function complete(id: number, version: number) {
    const entry = entries.get(id);
    if (!entry || !entry.notice.closing || entry.notice.version !== version) {
      return;
    }

    stop(entry);
    entries.delete(id);
    publish();
    entry.resolve(true);
  }

  function closeEntries(requested: readonly Entry<Config>[], dismissed = false) {
    const closing = requested.filter(
      (entry) => entries.get(entry.notice.id) === entry && !entry.notice.closing
    );
    for (const entry of closing) {
      stop(entry);
      entry.notice = { ...entry.notice, closing: true };
    }
    if (closing.length)
      publish();

    const errors: unknown[] = [];
    for (const entry of closing) {
      if (entries.get(entry.notice.id) !== entry)
        continue;
      const callback = entry.onClose;
      const dismiss = dismissed ? entry.onDismiss : undefined;
      entry.onClose = undefined;
      entry.onDismiss = undefined;
      try {
        dismiss?.();
        callback?.();
      }
      catch (error) {
        errors.push(error);
      }
      finally {
        if (!entry.rendered)
          complete(entry.notice.id, entry.notice.version);
      }
    }
    if (errors.length) {
      throw errors[0];
    }
  }

  function handle(entry: Entry<Config>): NoticeHandle {
    const id = entry.notice.id;
    const completion = entry.completion;
    return noticeHandle(() => {
      const current = entries.get(id);
      if (current)
        closeEntries([current]);
    }, completion);
  }

  function open(config: Config): NoticeHandle {
    if (state === 'detached') {
      return noticeHandle(() => { }, Promise.resolve(false));
    }

    let entry = config.key !== undefined
      ? [...entries.values()].find(
        (item) => !item.notice.closing && item.notice.key === config.key
      )
      : undefined;
    const { duration: configuredDuration, pauseOnHover, onClose, onDismiss, ...content } = config;
    const duration = durationOf(configuredDuration, defaults.duration);
    if (entry) {
      stop(entry);
    }
    else {
      let resolve!: (closed: boolean) => void;
      const completion = new Promise<boolean>((done) => {
        resolve = done;
      });
      entry = {
        notice: { ...content, id: ++nextId, version: 0, closing: false },
        duration,
        remaining: duration,
        pauseOnHover: true,
        hovered: false,
        focused: false,
        rendered: false,
        started: 0,
        timerVersion: 0,
        completion,
        resolve
      };
      entries.set(entry.notice.id, entry);
    }

    entry.notice = {
      ...content,
      id: entry.notice.id,
      version: entry.notice.version + 1,
      closing: false
    };
    entry.duration = duration;
    entry.remaining = duration;
    entry.pauseOnHover = pauseOnHover ?? defaults.pauseOnHover;
    entry.onClose = onClose;
    entry.onDismiss = onDismiss;
    publish();
    arm(entry);

    const active = [...entries.values()].filter((item) => !item.notice.closing);
    closeEntries(active.slice(0, Math.max(0, active.length - defaults.maxCount)));
    return handle(entry);
  }

  return {
    open,
    destroy(key?: NoticeKey) {
      closeEntries(
        [...entries.values()].filter((entry) => key === undefined || entry.notice.key === key)
      );
    },
    [noticeQueueKey]: {
      /** New defaults apply to future open calls. Existing entries do not restart. */
      configure(next: NoticeOptions) {
        defaults = resolveDefaults(next);
      },
      get notices() {
        return notices;
      },
      get visible() {
        return visible;
      },
      connect(nextClock: NoticeClock) {
        if (state === 'mounted') {
          throw new Error(connectionError);
        }

        state = 'mounted';
        clock = nextClock;
        let connected = true;
        return () => {
          if (!connected) {
            return;
          }

          connected = false;
          state = 'detached';
          visible = false;
          hoveredLists.clear();
          for (const entry of entries.values()) {
            stop(entry);
            entry.onClose = undefined;
            entry.onDismiss = undefined;
            entry.resolve(false);
          }
          entries.clear();
          clock = undefined;
          publish();
        };
      },
      setVisible(next: boolean) {
        if (visible === next) {
          return;
        }

        visible = next;
        for (const entry of entries.values()) {
          if (next) {
            arm(entry);
          }
          else {
            stop(entry);
          }
        }
      },
      mounted(id: number) {
        const entry = entries.get(id);
        if (entry) {
          entry.rendered = true;
          arm(entry);
        }
      },
      hover(id: number, next: boolean) {
        const entry = entries.get(id);
        if (!entry || entry.notice.closing || entry.hovered === next) {
          return;
        }

        entry.hovered = next;
        if (entry.pauseOnHover && next) {
          stop(entry);
        }
        else {
          arm(entry);
        }
      },
      /** In an expanded stack, pausing applies to entries in that placement. */
      hoverList(next: boolean, list?: string) {
        if (next === hoveredLists.has(list)) {
          return;
        }

        if (next) hoveredLists.add(list);
        else hoveredLists.delete(list);

        for (const entry of entries.values()) {
          if (getList?.(entry.notice) !== list) continue;
          if (next && entry.pauseOnHover) {
            stop(entry);
          }
          else {
            arm(entry);
          }
        }
      },
      /** Progress reads the queue clock, including pauses and the current timer state. */
      timer(id: number) {
        void timerRevision;
        const entry = entries.get(id);
        if (!entry || entry.duration === 0) {
          return undefined;
        }

        const running = Boolean(clock && entry.cancel);
        const elapsed = clock && entry.cancel ? Math.max(0, clock.now() - entry.started) : 0;
        return { remaining: Math.max(0, entry.remaining - elapsed) / entry.duration, running };
      },
      focus(id: number, next: boolean) {
        const entry = entries.get(id);
        if (!entry || entry.notice.closing || entry.focused === next) {
          return;
        }

        entry.focused = next;
        if (next) {
          stop(entry);
        }
        else {
          arm(entry);
        }
      },
      close(id: number) {
        const entry = entries.get(id);
        if (entry)
          closeEntries([entry], true);
      },
      complete
    }
  };
}
