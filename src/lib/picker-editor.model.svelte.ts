// Связывает пользовательский DOM редактора с контроллером маски.
import type { DatePickerEditorElement, DatePickerEditorRegistration } from './picker-components.types';
import type { HTMLInputAttributes } from 'svelte/elements';
import type { createPickerMaskInput } from './picker-mask-input.model.svelte';

export type PickerEditorEvent<EventType extends Event> = EventType & {
  currentTarget: EventTarget & DatePickerEditorElement;
};

/** Старые native callbacks и refs принадлежат элементам input. */
export function isPickerInput(element: DatePickerEditorElement | undefined): element is HTMLInputElement {
  return element?.localName === 'input';
}

/** Сужает currentTarget для публичных событий HTMLInputAttributes. */
export function isPickerInputEvent<EventType extends Event>(
  event: PickerEditorEvent<EventType>
): event is EventType & { currentTarget: EventTarget & HTMLInputElement; } {
  return isPickerInput(event.currentTarget);
}

type MaskEvents = Pick<ReturnType<typeof createPickerMaskInput>, 'mousedown' | 'mouseup' | 'paste'>;
type InputEvents = Pick<HTMLInputAttributes, 'onmousedown' | 'onmouseup' | 'onpaste'>;

/** Синхронизирует диапазон выделения маски перед вызовом событий владельца. */
export function pickerEditorMaskEvents(mask: MaskEvents, read: () => InputEvents) {
  return {
    /** Мышь может изменить положение каретки до первого keydown. */
    onmousedown(event: PickerEditorEvent<MouseEvent>) {
      mask.mousedown();
      if (isPickerInputEvent(event)) {
        read().onmousedown?.call(event.currentTarget, event);
      }
    },
    /** Пользовательский callback получает текущий ref даже при маске. */
    onmouseup(event: PickerEditorEvent<MouseEvent>) {
      /** Сохраняет receiver нативного input. */
      const shared = () => {
        if (isPickerInputEvent(event)) {
          read().onmouseup?.call(event.currentTarget, event);
        }
      };
      if (!mask.mouseup(event, shared)) {
        shared();
      }
    },
    /** Форматированная вставка владеет текстом до обработки поля. */
    onpaste(event: PickerEditorEvent<ClipboardEvent>) {
      if (!mask.paste(event) && isPickerInputEvent(event)) {
        read().onpaste?.call(event.currentTarget, event);
      }
    }
  };
}

/** В экземпляре редактора живёт одна регистрация, даже если замена ещё удаляется. */
export function createPickerEditor(attach: (node: DatePickerEditorElement) => () => void) {
  let element = $state.raw<DatePickerEditorElement>();
  let dispose: (() => void) | undefined;

  /** Возвращаемый cleanup действует только для собственной регистрации. */
  function register(registration: DatePickerEditorRegistration) {
    dispose?.();
    const node = 'inputElement' in registration ? registration.inputElement : registration;
    const detach = attach(node);
    element = node;

    /** Общий контроллер может уже принадлежать следующему редактору. */
    function unregister() {
      if (dispose !== unregister) {
        return;
      }
      dispose = undefined;
      element = undefined;
      detach();
    }

    dispose = unregister;
    return unregister;
  }

  return {
    register,
    /** Используется для native focus, выбора текста и FormItem ref. */
    get element() { return element; }
  };
}
