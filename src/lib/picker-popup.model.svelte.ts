// Связывает портал picker с опорным DOM и переносит клавиатурный фокус при смене панели.
import { tick, untrack } from 'svelte';
import { createPopupContainer } from './popup-container.model.svelte.js';
import { getPopupActiveElement } from './popup.dom';
import type { DatePickerMode } from './date-picker.types';
import type { DatePickerPanel } from './picker-components.types';

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
  const control = popup.querySelector<HTMLElement>(preferred)
    ?? popup.querySelector<HTMLElement>(fallback)
    ?? popup.querySelector<HTMLElement>([
      '[data-picker-authored-panel] :is(button, input, textarea, select):not(:disabled)',
      '[data-picker-authored-panel] :is(a[href], [tabindex]):not([tabindex="-1"])'
    ].join(','));

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

/** При замене содержимого оставляет фокус в панели до удаления старой кнопки. */
export function retainPickerReplacementFocus<DateType extends object>(getOptions: () => {
  popup?: HTMLElement;
  panel?: DatePickerPanel<DateType>;
  count: number;
  prefix: string;
}) {
  let previous = untrack(getOptions);
  $effect.pre(() => {
    const current = getOptions();
    const { popup, panel, count, prefix } = current;
    const replaced = popup === previous.popup && (panel !== previous.panel
      || panel && count < previous.count);
    previous = current;
    if (!replaced || !popup?.isConnected) {
      return;
    }
    const active = getPopupActiveElement(popup);
    const owners = Array.from(popup.getElementsByClassName(`${prefix}-panel`));
    if (active && owners.some(owner => owner.contains(active))) {
      const first = owners[0];
      if (first instanceof HTMLElement) {
        untrack(() => first.focus({ preventScroll: true }));
      }
    }
  });
}

/** Авторские панели и редакторы сами управляют фокусом своих controls. */
export function keepPickerEditorFocus(
  event: PointerEvent, popup: HTMLElement | undefined, allowNestedEditors: boolean
) {
  for (const target of event.composedPath()) {
    if (target === popup) break;
    if (!(target instanceof HTMLElement)) continue;
    if (target.hasAttribute('data-picker-authored-panel')
      || allowNestedEditors
        && (target.matches('input, textarea, select') || target.isContentEditable)) {
      return false;
    }
  }
  return true;
}
