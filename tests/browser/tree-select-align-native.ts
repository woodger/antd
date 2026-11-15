import type { readTreeSelectAlign } from './tree-select-align-metrics';
import editorReference from './fixtures/tree-select-align-native-editor-reference.json' with { type: 'json' };

type AlignView = ReturnType<typeof readTreeSelectAlign>['view'];
type EditorBox = NonNullable<AlignView['editor']>['box'];
const native805EditorBoxes: Readonly<Record<string, EditorBox>> = editorReference.boxes;

/** Only the established default multiple editor flow differs from the Source counterpart. */
export function treeSelectAlignNativeExpected(source: AlignView, id: string): AlignView {
  if (id !== 'multiple-choice-live') return source;
  if (!source.editor) throw Error('Expected the Source multiple editor');
  const box = native805EditorBoxes[JSON.stringify(source.model)];
  if (!box) throw Error('Missing independently captured Native805 editor geometry');
  return { ...source, editor: { ...source.editor, box } };
}
