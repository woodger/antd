// Links the custom DOM editor to the mask controller.
import type { DatePickerEditorElement, DatePickerEditorRegistration } from './picker-components.types';
import type { HTMLInputAttributes } from 'svelte/elements';
import type { createPickerMaskInput } from './picker-mask-input.model.svelte';

export type PickerEditorEvent<EventType extends Event> = EventType & {
  currentTarget: EventTarget & DatePickerEditorElement;
};

/** Old native callbacks and refs belong to input elements. */
export function isPickerInput(element: DatePickerEditorElement | undefined): element is HTMLInputElement {
  return element?.localName === 'input';
}

/** Narrowing currentTarget for public events HTMLInputAttributes. */
export function isPickerInputEvent<EventType extends Event>(
  event: PickerEditorEvent<EventType>
): event is EventType & { currentTarget: EventTarget & HTMLInputElement; } {
  return isPickerInput(event.currentTarget);
}

type MaskEvents = Pick<ReturnType<typeof createPickerMaskInput>, 'mousedown' | 'mouseup' | 'paste'>;
type InputEvents = Pick<HTMLInputAttributes, 'onmousedown' | 'onmouseup' | 'onpaste'>;

/** Synchronizes the range of mask selection before calling the owner’s events. */
export function pickerEditorMaskEvents(mask: MaskEvents, read: () => InputEvents) {
  return {
    /** The mouse can change the position of the carriage to the first keydown. */
    onmousedown(event: PickerEditorEvent<MouseEvent>) {
      mask.mousedown();
      if (isPickerInputEvent(event)) {
        read().onmousedown?.call(event.currentTarget, event);
      }
    },
    /** Custom callback gets the current ref even when masked. */
    onmouseup(event: PickerEditorEvent<MouseEvent>) {
      /** Saves the receiver of native input. */
      const shared = () => {
        if (isPickerInputEvent(event)) {
          read().onmouseup?.call(event.currentTarget, event);
        }
      };
      if (!mask.mouseup(event, shared)) {
        shared();
      }
    },
    /** The formated insert owns the text prior to field processing. */
    onpaste(event: PickerEditorEvent<ClipboardEvent>) {
      if (!mask.paste(event) && isPickerInputEvent(event)) {
        read().onpaste?.call(event.currentTarget, event);
      }
    }
  };
}

/** One registration lives in the editor's copy, even if the replacement is still removed. */
export function createPickerEditor(attach: (node: DatePickerEditorElement) => () => void) {
  let element = $state.raw<DatePickerEditorElement>();
  let dispose: (() => void) | undefined;

  /** The returned cleanup is valid only for its own registration. */
  function register(registration: DatePickerEditorRegistration) {
    dispose?.();
    const node = 'inputElement' in registration ? registration.inputElement : registration;
    const detach = attach(node);
    element = node;

    /** The common controller may already belong to the following editor. */
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
    /** Used for native focus, text selection and FormItem ref. */
    get element() { return element; }
  };
}
