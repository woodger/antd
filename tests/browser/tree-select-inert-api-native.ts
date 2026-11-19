import type { TreeSelectInertApiSample } from './fixtures/tree-select-inert-api-cases';

/** Existing Native dir ownership: provider on default root, native dir on editor. */
export function treeSelectInertApiNativeExpected<View extends {
  root: { dir: string | null; direction?: string };
  editor: { dir: string | null } | null;
}>(
  source: View,
  sample: TreeSelectInertApiSample
): View {
  const expected = structuredClone(source);
  if (sample.slot !== 'root') {
    expected.root.dir = sample.provider;
    if (sample.nativeDir) {
      if ('direction' in expected.root) expected.root.direction = sample.provider;
      if (expected.editor) expected.editor.dir = sample.nativeDir;
    }
  }
  return expected;
}
