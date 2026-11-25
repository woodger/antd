// Соединяет границу панели с одним жестом. Размер предложения считается от начала,
// а при завершении измеряется фактический результат controlled или uncontrolled обновления.
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

/** Хранит состояние жеста только пока handle подключён и панель принимает события. */
export function connectDrawerResize(
  handle: HTMLElement,
  panel: HTMLElement,
  getOptions: () => ResizeOptions,
  setDragging: (dragging: boolean) => void
) {
  const document = handle.ownerDocument;
  const view = document.defaultView;
  let gesture: Gesture | undefined;

  /** Измеряет фактический размер wrapper по оси текущей стороны. */
  function measure(placement: DrawerPlacement) {
    const bounds = panel.getBoundingClientRect();
    return isDrawerHorizontal(placement) ? bounds.width : bounds.height;
  }

  /** Берёт координату по физической оси, в том числе для RTL. */
  function coordinate(event: PointerEvent, placement: DrawerPlacement) {
    return isDrawerHorizontal(placement) ? event.clientX : event.clientY;
  }

  /** Снимает все глобальные слушатели завершённого или отменённого жеста. */
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

  /** Отмена браузером не публикует пользовательское завершение жеста. */
  function cancelPointer(event: PointerEvent) {
    if (event.pointerId === gesture?.pointerId) cancel();
  }

  /** Проверяет актуальную сторону и открытость перед вызовом обработчика владельца. */
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

  /** Публикует предлагаемую величину, сохраняя общий отсчёт при повторных move. */
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

  /** Измеряет применённый владельцем размер перед уведомлением о завершении. */
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

  /** Фиксирует размер и координату до изменения state, сохраняя фокус внутри панели. */
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
    /** Закрытие и смена оси завершат соединение до следующего события окна. */
    sync(enabled: boolean, placement: DrawerPlacement) {
      if (!enabled || gesture && gesture.placement !== placement) cancel();
    },
    /** Удаляет и handle, и соединения текущего жеста. */
    destroy() {
      handle.removeEventListener('pointerdown', begin);
      cancel();
    }
  };
}
