// Connects Splitter measurements and gestures to DOM. For lazy dread, the intermediate offset
// remains a preview.
import { getSplitterPreviewOffset } from './splitter.engine';

/** Repeat rounding and microtask delivery @rc-component/resize-observer 1.1.2. */
// Deduplicates the dimensions and publishes the size of the current axis after the microtask.
export function observeSplitterSize(
  root: HTMLDivElement,
  getVertical: () => boolean,
  publish: (size: number) => void
) {
  const view = root.ownerDocument.defaultView!;
  let active = true;
  let previous: number[] = [-1, -1, -1, -1];
  const observer = new view.ResizeObserver(() => {
    if (!active) {
      return;
    }

    const { width, height } = root.getBoundingClientRect();
    const { offsetWidth, offsetHeight } = root;
    const next = [Math.floor(width), Math.floor(height), offsetWidth, offsetHeight];

    if (next.every((value, index) => value === previous[index])) {
      return;
    }

    previous = next;
    const measuredWidth = offsetWidth === Math.round(width) ? width : offsetWidth;
    const measuredHeight = offsetHeight === Math.round(height) ? height : offsetHeight;

    void Promise.resolve().then(() => {
      if (active)
        publish(getVertical() ? measuredHeight : measuredWidth);
    });
  });
  observer.observe(root);

  return () => {
    active = false;
    observer.disconnect();
  };
}

export interface SplitterDragOptions {
  index: number;
  vertical: boolean;
  reverse: boolean;
  lazy: boolean;
  resizable: boolean;
  container: number;
  now: number;
  min: number;
  max: number;
}

export interface SplitterDragCallbacks {
  start: (index: number) => void;
  update: (index: number, offset: number, lazyEnd: boolean) => void;
  end: (lazyEnd: boolean) => void;
  preview: (offset: number) => void;
  doubleClick: (index: number) => void;
}

// Retains the beginning of the gesture and settings of the active divider to release.
export function connectSplitterDrag(
  node: HTMLDivElement,
  getOptions: () => SplitterDragOptions,
  callbacks: SplitterDragCallbacks
) {
  const view = node.ownerDocument.defaultView!;
  let active = true;
  let start: readonly [number, number] | undefined;
  let captured: SplitterDragOptions | undefined;
  let preview = 0;
  let lastClick = 0;

  // Delegates offset or preview using the current axis for lazy drag.
  function move(x: number, y: number) {
    if (!active || !start || !captured) {
      return;
    }

    const dx = x - start[0];
    const dy = y - start[1];

    if (captured.lazy) {
      const current = getOptions();
      preview = getSplitterPreviewOffset(
        current.container,
        current.now,
        current.min,
        current.max,
        current.vertical ? dy : dx
      );
      callbacks.preview(preview);
    }
    else {
      const offset = captured.vertical ? dy : dx;
      callbacks.update(captured.index, captured.reverse ? -offset : offset, false);
    }
  }

  // Transmits mouse coordinates in the same system as the beginning of drag.
  function handleMouseMove(event: MouseEvent) {
    move(event.pageX, event.pageY);
  }

  // Takes into account the movement of only one active touch.
  function handleTouchMove(event: TouchEvent) {
    if (event.touches.length === 1)
      move(event.touches[0].pageX, event.touches[0].pageY);
  }

  // Removes the listeners of the current gesture, leaving the listeners on dragger.
  function detach() {
    view.removeEventListener('mousemove', handleMouseMove);
    view.removeEventListener('mouseup', finish);
    view.removeEventListener('touchmove', handleTouchMove);
    view.removeEventListener('touchend', finish);
  }

  // Publishes the lazy result before clearing the preview and completes the gesture connection.
  function finish() {
    if (!active || !start || !captured) {
      return;
    }

    if (captured.lazy) {
      const current = getOptions();
      callbacks.update(current.index, current.reverse ? -preview : preview, true);
      preview = 0;
      callbacks.preview(0);
      callbacks.end(true);
    }
    else {
      callbacks.end(false);
    }

    start = undefined;
    detach();
  }

  // Reminder gesture settings before subscribing to window events.
  function attach() {
    captured = { ...getOptions() };
    view.addEventListener('mousemove', handleMouseMove);
    view.addEventListener('mouseup', finish);
    view.addEventListener('touchmove', handleTouchMove);
    view.addEventListener('touchend', finish);
  }

  // Begins an accessible gesture and takes into account the possible disconnection from the start callback.
  function begin(x: number, y: number) {
    const options = getOptions();

    if (!active || !options.resizable) {
      return;
    }

    detach();
    start = [x, y];
    callbacks.start(options.index);

    if (active && start)
      attach();
  }

  // Skips the second close mousedown, which relates to doubleClick.
  function handleMouseDown(event: MouseEvent) {
    event.stopPropagation();

    const now = Date.now();
    const gap = now - lastClick;

    if (gap > 0 && gap < 300) {
      return;
    }

    lastClick = now;
    begin(event.pageX, event.pageY);
  }

  // Opens the gesture only for one touch, saving the coordinates of the page.
  function handleTouchStart(event: TouchEvent) {
    if (event.touches.length === 1)
      begin(event.touches[0].pageX, event.touches[0].pageY);
  }

  // Transmits doubleClick to the current divider by index.
  function handleDoubleClick() {
    if (active)
      callbacks.doubleClick(getOptions().index);
  }

  node.addEventListener('mousedown', handleMouseDown);
  node.addEventListener('touchstart', handleTouchStart);
  node.addEventListener('dblclick', handleDoubleClick);

  return {
    // Updates the captured settings if the active boundary or lazy changes during the gesture.
    sync(index: number, lazy: boolean) {
      if (active && start && captured
        && (captured.index !== index || captured.lazy !== lazy)) {
        detach();
        attach();
      }
    },
    // Disables temporary and permanent listeners and releases the position of the beginning of the gesture.
    destroy() {
      active = false;
      start = undefined;
      detach();
      node.removeEventListener('mousedown', handleMouseDown);
      node.removeEventListener('touchstart', handleTouchStart);
      node.removeEventListener('dblclick', handleDoubleClick);
    }
  };
}
