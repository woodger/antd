// Connects the boundary of the panel with a single gesture. The size of the offer is considered
// from the beginning, and upon completion, the actual result of the controlled or uncontrolled
// update is measured.
import {
  getDrawerPixelSize, getDrawerResizeSize, isDrawerHorizontal
} from './drawer.engine';
import type { DrawerPlacement, DrawerResizableConfig } from './drawer.types';

interface ResizeOptions extends DrawerResizableConfig {
  enabled: boolean;
  placement: DrawerPlacement;
  size: string;
  maxSize?: number;
}

interface Gesture {
  pointerId: number;
  placement: DrawerPlacement;
  origin: number;
  size: number;
}

/** Stores the gesture state only while the handle is connected and the panel accepts events. */
export function connectDrawerResize(
  handle: HTMLElement,
  panel: HTMLElement,
  getOptions: () => ResizeOptions,
  setDragging: (dragging: boolean) => void
) {
  const document = handle.ownerDocument;
  const view = document.defaultView;
  let gesture: Gesture | undefined;

  /** Measures the actual wrapper size on the current side axis. */
  function measure(placement: DrawerPlacement) {
    const bounds = panel.getBoundingClientRect();
    return isDrawerHorizontal(placement) ? bounds.width : bounds.height;
  }

  /** Takes the coordinate on the physical axis, including for RTL. */
  function coordinate(event: PointerEvent, placement: DrawerPlacement) {
    return isDrawerHorizontal(placement) ? event.clientX : event.clientY;
  }

  /** Removes all global listeners of the completed or cancelled gesture. */
  function cancel() {
    if (!gesture) {
      return;
    }

    gesture = undefined;
    document.removeEventListener('pointermove', move, true);
    document.removeEventListener('pointerup', finish, true);
    document.removeEventListener('pointercancel', cancelPointer, true);
    view?.removeEventListener('blur', cancel);
    setDragging(false);
  }

  /** Cancellation by the browser does not publish the user completion of the gesture. */
  function cancelPointer(event: PointerEvent) {
    if (event.pointerId === gesture?.pointerId) cancel();
  }

  /** Checks the current side and openness before calling the handler of the owner. */
  function activeGesture(event: PointerEvent, options: ResizeOptions) {
    const current = gesture;
    if (!current || current.pointerId !== event.pointerId) {
      return undefined;
    }
    if (!options.enabled || current.placement !== options.placement || !handle.isConnected) {
      cancel();
      return undefined;
    }

    return current;
  }

  /** Publishes the proposed value, maintaining the total countdown on repeated move. */
  function move(event: PointerEvent) {
    const options = getOptions();
    const current = activeGesture(event, options);
    if (!current) {
      return;
    }

    const offset = coordinate(event, current.placement) - current.origin;
    const size = getDrawerResizeSize(current.placement, current.size, offset, options.maxSize);
    options.onResize?.(size);
  }

  /** Measures the amount applied by the owner before notification of completion. */
  function finish(event: PointerEvent) {
    const options = getOptions();
    const current = activeGesture(event, options);
    if (!current) {
      return;
    }

    const size = measure(current.placement);
    cancel();
    options.onResizeEnd?.(size);
  }

  /** Fixes the size and coordinate until the state changes, saving the focus inside the panel. */
  function begin(event: PointerEvent) {
    const options = getOptions();
    if (!options.enabled || gesture || event.button !== 0 || !event.isPrimary) {
      return;
    }

    event.preventDefault();
    const { placement } = options;
    const size = getDrawerPixelSize(options.size) ?? measure(placement);
    gesture = {
      pointerId: event.pointerId,
      placement,
      origin: coordinate(event, placement),
      size
    };

    document.addEventListener('pointermove', move, true);
    document.addEventListener('pointerup', finish, true);
    document.addEventListener('pointercancel', cancelPointer, true);
    view?.addEventListener('blur', cancel);
    setDragging(true);
    options.onResizeStart?.(size);
  }

  handle.addEventListener('pointerdown', begin);

  return {
    /** Closing and changing the axis will complete the connection until the next window event. */
    sync(enabled: boolean, placement: DrawerPlacement) {
      if (!enabled || gesture && gesture.placement !== placement) cancel();
    },
    /** Removes both handle and connections of the current gesture. */
    destroy() {
      handle.removeEventListener('pointerdown', begin);
      cancel();
    }
  };
}
