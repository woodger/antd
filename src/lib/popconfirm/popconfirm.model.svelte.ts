// Ties the execution of the confirmation to the specific opening of the card.
export function createPopconfirmAction(getSession: () => object | null, handlers: {
  onSuccess: () => void;
  onError: (error: unknown) => void;
}) {
  let active = $state.raw<{ session: object; }>();
  let disposed = false;

  function isCurrent(task: NonNullable<typeof active>) {
    return !disposed && active === task && getSession() === task.session;
  }

  function finish(task: NonNullable<typeof active>, success: boolean, error?: unknown) {
    if (!isCurrent(task)) {
      return;
    }

    active = undefined;
    if (success) {
      handlers.onSuccess();
    }
    else {
      handlers.onError(error);
    }
  }

  return {
    get loading() {
      return active !== undefined && isCurrent(active);
    },
    /** Returns the control of the button after the action is started or its synchronous completion. */
    run(action: () => void | PromiseLike<unknown>, afterAction?: () => void): void | Promise<void> {
      const session = getSession();

      if (disposed || !session || active && isCurrent(active)) {
        return;
      }

      const task = { session };
      active = task;
      let result: void | PromiseLike<unknown>;

      try {
        result = action();
      }
      catch (error) {
        finish(task, false, error);
        return;
      }

      if (result === undefined || result === null) {
        finish(task, true);
        afterAction?.();
        return;
      }

      const pending = Promise.resolve(result).then(
        () => finish(task, true),
        (error: unknown) => finish(task, false, error)
      );
      // Completion of Promise is already connected to the session, even if the button handler throws away an error.
      afterAction?.();
      return pending;
    },
    dispose() {
      disposed = true;
      active = undefined;
    }
  };
}
