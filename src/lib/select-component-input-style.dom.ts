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
}

/**
 * attrs.style stays a complete string, so a normal snippet may let Svelte write
 * cssText. Keep Source logical setters on an owner-only CSSOM and project them
 * after that write. No marker, extra context key, prototype patch or DOM move.
 */
export function createSelectComponentInputStyle() {
  // A ref/attachment may be re-registered without replacing its physical editor.
  const editors = new WeakMap<Editor, EditorStyle>();
  let lifetime: SelectComponentInputLifetime;
  let previousMeasurement: { syncWidth: boolean; value: string } | undefined;
  let measured: number | undefined;

  function enter(next: SelectComponentInputLifetime) {
    if (next === lifetime) return;
    lifetime = next;
    previousMeasurement = undefined;
    measured = undefined;
  }

  function editorStyle(editor: Editor, frame: SelectStyleFrame): EditorStyle {
    let state = editors.get(editor);
    if (state) return state;
    const accepted = editor.ownerDocument.createElement('span').style;
    // Preserve the existing DOM-string initialization/SSR parsing boundary.
    // Only owner declarations enter this snapshot; extra snippet inline keys
    // remain outside the controller's projection.
    accepted.cssText = frame.text ?? '';
    state = { accepted, previous: frame,
      writer: createSelectStyleWriter(accepted, frame,
        () => editor.ownerDocument.createElement('span').style) };
    editors.set(editor, state);
    return state;
  }

  return {
    /** A new logical Input exposes undefined before its first layout pass. */
    width(next: SelectComponentInputLifetime): number | undefined {
      return next === lifetime ? measured : undefined;
    },

    /** Call after the normal snippet/intrinsic attributes and value have committed. */
    commit(editor: Editor | undefined, frame: SelectStyleFrame,
      input: SelectComponentInputMeasurement): number | undefined {
      enter(input.lifetime);
      if (!input.lifetime || !editor || !editor.isConnected) return measured;

      const state = editorStyle(editor, frame);
      const managed: SelectStyleProperties = { ...state.previous.properties, ...frame.properties };
      state.writer.update(frame);
      // Includes keys just removed from the frame, rather than a permanent
      // historical union that would keep claiming ownership of removed keys.
      copySelectStyle(state.accepted, editor.style, managed);
      state.previous = frame;

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
