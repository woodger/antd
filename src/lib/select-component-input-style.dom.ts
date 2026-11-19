// rc-select 1.10.1; MIT, vendor/LICENSE.rc-select.
import { copySelectStyle, createSelectStyleWriter } from './select-style.dom';
import type { SelectStyleFrame, SelectStyleProperties } from './select-style.engine';
import { measureSelectSourceInput } from './select-tag-overflow.dom';

type Editor = HTMLInputElement | HTMLTextAreaElement;
/** SelectContent changes component type between these branches; root suppresses both. */
export type SelectComponentInputLifetime = 'single' | 'multiple' | undefined;
export interface SelectComponentInputMeasurement {
  lifetime: SelectComponentInputLifetime;
  syncWidth: boolean;
  /** Input's incoming computed search value, before an element's own value override. */
  value: string;
}

interface EditorStyle {
  accepted: CSSStyleDeclaration;
  writer: ReturnType<typeof createSelectStyleWriter>;
  previous: SelectStyleFrame;
  hydrationPending: boolean;
}

/**
 * attrs.style stays a complete string, so a normal snippet may let Svelte write
 * cssText. Keep Source logical setters on an owner-only CSSOM and project them
 * after that write. No marker, extra context key, prototype patch or DOM move.
 */
export function createSelectComponentInputStyle() {
  // A ref/attachment may be re-registered without replacing its physical editor.
  const editors = new WeakMap<HTMLElement, EditorStyle>();
  let lifetime: SelectComponentInputLifetime;
  let previousMeasurement: { syncWidth: boolean; value: string } | undefined;
  let measured: number | undefined;

  function enter(next: SelectComponentInputLifetime) {
    if (next === lifetime) {
      return;
    }
    lifetime = next;
    previousMeasurement = undefined;
    measured = undefined;
  }

  function editorStyle(
    editor: HTMLElement,
    frame: SelectStyleFrame,
    hydrating = false
  ): EditorStyle {
    let state = editors.get(editor);
    if (state) {
      return state;
    }
    const accepted = editor.ownerDocument.createElement('span').style;
    // При гидратации CSSOM узла сохраняется отдельно от клиентских props.
    const preserveHydration = hydrating && !frame.string;
    if (preserveHydration) {
      copySelectStyle(editor.style, accepted);
    }
    else {
      accepted.cssText = frame.text ?? '';
    }
    const writer = createSelectStyleWriter(accepted, frame,
      () => editor.ownerDocument.createElement('span').style);
    if (!hydrating) writer.initialize();
    state = { accepted, previous: frame, writer, hydrationPending: preserveHydration };
    editors.set(editor, state);
    return state;
  }

  function apply(editor: HTMLElement, frame: SelectStyleFrame, hydrating = false) {
    const state = editorStyle(editor, frame, hydrating);
    const managed: SelectStyleProperties = { ...state.previous.properties, ...frame.properties };
    const before = state.hydrationPending ? [...state.accepted].map(property => ({ property,
      value: state.accepted.getPropertyValue(property), priority: state.accepted.getPropertyPriority(property) })) : undefined;
    state.writer.update(frame);
    const untouched = before !== undefined && before.length === state.accepted.length
      && before.every(({ property, value, priority }, index) => state.accepted.item(index) === property
        && state.accepted.getPropertyValue(property) === value
        && state.accepted.getPropertyPriority(property) === priority);
    // Сохраняем SSR-атрибут до первого изменения CSSOM через writer.
    if (!untouched) {
      // Удаляем прежние ключи, сохраняя чужие inline-стили.
      copySelectStyle(state.accepted, editor.style, managed);
      state.hydrationPending = false;
    }
    state.previous = frame;
    return state;
  }

  return {
    /** Подготовка до публичного ref; повторная регистрация сохраняет историю узла. */
    prepare(editor: HTMLElement | undefined, frame: SelectStyleFrame, hydrating = false) {
      if (editor?.isConnected) apply(editor, frame, hydrating);
    },

    /** A new logical Input exposes undefined before its first layout pass. */
    width(next: SelectComponentInputLifetime): number | undefined {
      return next === lifetime ? measured : undefined;
    },

    /** Call after the normal snippet/intrinsic attributes and value have committed. */
    commit(
      editor: Editor | undefined,
      frame: SelectStyleFrame,
      input: SelectComponentInputMeasurement
    ): number | undefined {
      enter(input.lifetime);
      if (!input.lifetime || !editor || !editor.isConnected) {
        return measured;
      }

      const state = apply(editor, frame);

      const changed = !previousMeasurement
        || previousMeasurement.syncWidth !== input.syncWidth
        || previousMeasurement.value !== input.value;
      if (changed) {
        previousMeasurement = { syncWidth: input.syncWidth, value: input.value };
        if (input.syncWidth) {
          measured = measureSelectSourceInput(editor);
          // Retain the logical owner width in writer.previous. Only the accepted
          // CSSOM setter is cleared, exactly as Source's measurement does.
          state.accepted.width = '';
        }
      }
      return measured;
    }
  };
}
