/** Svelte's established public methods retain identity while React recreates its ref wrappers. */
export function treeSelectMotionNativeObserved<
  Observed extends { sameFocus: boolean; sameBlur: boolean; sameScrollTo: boolean }
>(source: Observed): Observed {
  return { ...source, sameFocus: true, sameBlur: true, sameScrollTo: true };
}

/** Hydration retains Native's existing SSR panel and its parsed input caret, rather than mounting a new draft. */
export function treeSelectMotionNativeHydrationExpected<
  View extends { popup: { draft: { selection: (number | null)[] } | null } | null }
>(source: View, initialPanel: boolean): View {
  if (!initialPanel || !source.popup?.draft) return source;
  return {
    ...source,
    popup: { ...source.popup, draft: { ...source.popup.draft, selection: [0, 0] } }
  };
}

/** Existing Native single controls display their selected label in the closed editor. */
export function treeSelectMotionNativeView<
  View extends {
    model: unknown;
    editor: { value: string; selection: (number | null)[]; expanded: string | null } | null;
  }
>(source: View, id: string): View {
  if (id !== 'outside-escape-choice' || source.model !== 'b'
    || source.editor?.expanded !== 'false') return source;
  return { ...source, editor: { ...source.editor, value: 'Beta', selection: [4, 4] } };
}
