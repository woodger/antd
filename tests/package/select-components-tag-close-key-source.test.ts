import { expect, it } from 'vitest';
import { readSelectTagCloseKeyCounter } from '../browser/select-components-tag-close-key-reference';
it('loads both complete pinned Source archives and their independently equal public key/open/event outcomes', () => {
  const source = readSelectTagCloseKeyCounter();
  expect(source.cases.map(entry => [entry.id, entry.key.which, entry.key.ctrlKey, entry.beforeOpen, entry.immediateOpen, entry.settledOpen, entry.lateOpen])).toEqual([
    ['valid-arrow-down', 40, false, true, true, true, true],
    ['excluded-arrow-up', 38, false, true, true, false, false],
    ['modifier-arrow-down', 40, true, true, true, false, false]
  ]);
  for (const entry of source.cases) {
    expect(Object.keys(entry.key)).toEqual(['key', 'code', 'which', 'keyCode', 'ctrlKey']);
    expect(entry.eventKindsBefore).toEqual(['public-focus']); expect(entry.eventKindsAfterKeyboard).toEqual(['public-focus', 'input-keydown']);
    expect(entry.eventKindsSettled).toEqual(entry.settledOpen ? ['public-focus', 'input-keydown'] : ['public-focus', 'input-keydown', 'open']);
  }
});
