// Связывает портал picker с опорным DOM и переносит клавиатурный фокус при смене панели.
import { tick, untrack } from 'svelte';
import { createPopupContainer } from './popup-container.model.svelte.js';
import { getPopupActiveElement } from './popup.dom';
import { getTooltipPosition, type TooltipRect } from './tooltip.engine';
import type { DatePickerMode, DatePickerProps } from './date-picker.types';

interface PickerPopupContainerOptions {
  open: boolean;
  reference?: HTMLElement;
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement | ShadowRoot;
  themeStyle?: string;
}

/** Открытая панель принимает фокус на текущий доступный день или элемент времени. */
export function focusPickerPanel(popup: HTMLElement | undefined, mode: DatePickerMode, date: string) {
  if (!popup) {
    return false;
  }
  const preferred = mode === 'time'
    ? '[data-picker-time-cell-selected] button:not(:disabled)'
    : mode === 'date' || mode === 'week' ? `[data-picker-date="${date}"]:not(:disabled)`
    : 'button[data-picker-date][tabindex="0"]:not(:disabled)';
  const fallback = mode === 'time'
    ? '[data-picker-time-value] button:not(:disabled)' : 'button[data-picker-date]:not(:disabled)';
  const control = popup.querySelector<HTMLButtonElement>(preferred)
    ?? popup.querySelector<HTMLButtonElement>(fallback);

  control?.focus();
  return control !== null;
}

interface PickerPanelFocusOptions {
  popup?: HTMLElement;
  mode: DatePickerMode;
  date: string;
  controlled: boolean;
  editor?: HTMLElement;
}

/** Переводит фокус только при удалении ранее сфокусированной ячейки текущего popup. */
export function preservePickerPanelFocus(read: () => PickerPanelFocusOptions) {
  let previous = untrack(() => {
    const { mode, controlled } = read();
    return { mode, controlled };
  });
  let movingFrom: Element | undefined;
  $effect.pre(() => {
    const { popup, mode, controlled } = read();
    const old = previous;
    previous = { mode, controlled };
    if (!(controlled || old.controlled) || mode === old.mode || !popup) {
      return;
    }
    const active = getPopupActiveElement(popup);
    if (!active?.closest('[data-picker-date], [data-picker-time-value]') || !popup.contains(active)) {
      return;
    }
    movingFrom = active;
    void tick().then(() => {
      if (movingFrom !== active) {
        return;
      }
      movingFrom = undefined;

      const current = read();
      if (!popup.isConnected || current.popup !== popup || active.isConnected) {
        return;
      }
      const focused = getPopupActiveElement(popup);
      if (!focused || focused === popup.ownerDocument.body) {
        if (!focusPickerPanel(popup, current.mode, current.date)) {
          current.editor?.focus();
        }
      }
    });
  });

  return {
    /** Удаление ячейки может вызвать focusout до передачи фокуса новой панели. */
    get moving() {
      return movingFrom !== undefined;
    }
  };
}

/** Rc-picker пересоздаёт panel при смене portal target, сохраняя его при смене callback. */
export function createPickerPopup(getOptions: () => PickerPopupContainerOptions) {
  let target = $state<HTMLElement | ShadowRoot>();

  function resolve(trigger?: HTMLElement) {
    // До root ref вызывается только getter с нулевой арностью, как rc-trigger.
    const next = getOptions().getPopupContainer!(trigger!);
    target = next;
    return next;
  }

  $effect.pre(() => {
    const { open, reference, getPopupContainer } = getOptions();
    if (!getPopupContainer) {
      target = undefined;
    }
    else if (open && !reference && !getPopupContainer.length) resolve(undefined);
  });

  const portal = createPopupContainer(() => {
    const options = getOptions();
    return {
      ...options,
      rendered: options.open,
      getPopupContainer: options.getPopupContainer ? resolve : undefined
    };
  });

  return { portal, get target() { return target; } };
}

export function getPickerPopupPosition(
  reference: TooltipRect,
  popup: TooltipRect,
  viewport: TooltipRect,
  placement: NonNullable<DatePickerProps['placement']>
) {
  const position = getTooltipPosition(
    reference,
    popup,
    viewport,
    placement.startsWith('top') ? 'top' : 'bottom',
    true,
    placement.endsWith('Right') ? 'right' : 'left',
    4
  );

  // useAlign округляет offset вниз при scale=1; размеры native panel могут быть дробными.
  return { ...position, left: Math.floor(position.left), top: Math.floor(position.top) };
}
