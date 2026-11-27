/** rc-select leaves the last onActive for microtask; unmount cancels Native callback. */
export function createSelectActive<Value>(getCallback: () => ((value: Value | null) => void) | undefined) {
  let generation = 0;
  let disposed = false;

  $effect(() => () => {
    disposed = true;
    generation++;
  });

  return (value: Value | null) => {
    const current = ++generation;
    const callback = getCallback();
    if (!callback) {
      return;
    }
    void Promise.resolve().then(() => {
      if (!disposed && current === generation) callback(value);
    });
  };
}
