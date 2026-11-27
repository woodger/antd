import assert from 'node:assert/strict';
import reference from './fixtures/ant-design-auto-complete-editor-height-reference.json' with { type: 'json' };

assert.equal(reference.version, '6.6.8');
assert.equal(reference.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
assert.equal(reference.react, '18.3.1');
assert.equal(reference.archiveSha256, '8eb361740b62dc79762f21d036dea685d5e7c1d714315ea3247b9aa5d2269dfa');
assert.equal(reference.passes.length, 2);
assert.deepEqual(reference.passes[0], reference.passes[1]);

type Capture = typeof reference.passes[number][number];
export type AutoCompleteEditorState = Capture['before'] | Capture['first']['state']
  | Capture['closed'] | Capture['second']['state'];

/** Reads the real React measurements for a single editor option. */
export function readAutoCompleteEditorHeightCase(id: string) {
  const match = reference.passes[0]?.find(entry => entry.profile.id === id);
  if (!match) throw new Error(`Missing React editor height case: ${id}`);

  return match;
}
