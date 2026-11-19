/** c293713 boolean-mode baseline keeps Native DOM bindings and exported method identities stable.
 * Source owns its raw React selector remount/ref observations and separate actual focus counterpart.
 */
export function treeSelectCheckableNativeObserved<Observed extends {
  sameRoot: boolean;
  sameEditor: boolean;
  sameEditorParent: boolean;
  sameFocus: boolean;
  sameBlur: boolean;
  sameScrollTo: boolean;
}>(source: Observed): Observed {
  return { ...source, sameRoot: true, sameEditor: true, sameEditorParent: true,
    sameFocus: true, sameBlur: true, sameScrollTo: true };
}

/** The isolated c293713 CSR baseline pins standard inners and closed Alpha/[5,5].
 * Parsed SSR [0,0] is a separate existing Native caret contract; the strict hydration tests
 * check that parsed caret and retained DOM independently of the old CSR probe.
 */
export function treeSelectCheckableNativeView<View extends {
  open: boolean;
  standardCheckboxCount: number;
  nodes: readonly { checkbox: boolean }[];
  editor: { value: string | null; caret: (number | null)[] | null } | null;
}>(
  source: View,
  id: string,
  phase: 'initial' | 'step' | 'hydrated-initial' = 'step'
): View {
  let view = source;
  if (id === 'strict-only-falsy') {
    view = {
      ...view, standardCheckboxCount: source.nodes.filter(node => node.checkbox).length
    };
  }
  if (id === 'search-live-falsy' && !source.open && source.editor
    && (phase === 'initial' || phase === 'hydrated-initial')) return {
    ...view, editor: {
      ...source.editor,
      value: 'Alpha',
      caret: phase === 'initial' ? [5, 5] : [0, 0]
    }
  };
  return view;
}
