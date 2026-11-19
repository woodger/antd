import { expect, it } from 'vitest';
import { readSelectComponentsResponsiveTagPrefixCSR } from '../browser/select-components-responsive-tag-prefix-reference';
import { verifyResponsiveTagPrefixPhysicalNode, verifyResponsiveTagPrefixSelection } from '../browser/select-components-responsive-tag-prefix-assertions';
const sample = readSelectComponentsResponsiveTagPrefixCSR().cases[0], source = sample.initial.customTagsPrefix.editor!;
const scope = { id: sample.id, index: 0, path: 'csr' as const };
it('accepts the proved empty unfocused constructor direction only with the exact observed scope', () => {
  const current = structuredClone(source), applied = new Set<string>();
  current.selection = [0, 0, 'none'];

  expect(() => verifyResponsiveTagPrefixSelection(
    current,
    source,
    'constructor',
    { ...scope, applied }
  )).not.toThrow();
  expect([...applied]).toEqual(['empty-unfocused-input-createElement-vs-template-constructor-direction']);
});
it('rejects direction relaxation after editing, with focus/value, or outside the measured caller', () => {
  const current = structuredClone(source);
  current.selection = [0, 0, 'none'];
  for (const changed of [{ ...scope, index: 4 }, { ...scope, id: 'unmeasured-owner' }])
    expect(() => verifyResponsiveTagPrefixSelection(current, source, 'wrong-scope', changed)).toThrow();
  for (const mutation of [(node: typeof current) => {
    node.focused = true;
  }, (node: typeof current) => {
    node.value = 'a';
  },
    (node: typeof current) => {
      node.selection = [0, 0, 'backward'];
    }, (node: typeof current) => {
      node.attributes = node.attributes.filter(([key]) => key !== 'value');
    }]) {
    const changed = structuredClone(current);
    mutation(changed);
    expect(() => verifyResponsiveTagPrefixSelection(changed, source, 'wrong-data', scope)).toThrow();
  }
});
it('keeps each complete input HTML consistent with every recorded attribute', () => {
  expect(() => verifyResponsiveTagPrefixPhysicalNode(source, source, 'unchanged-input')).not.toThrow();
  const changed = structuredClone(source);
  changed.html = changed.html.replace('<input ', '<input data-unexpected="true" ');

  expect(() => verifyResponsiveTagPrefixPhysicalNode(changed, source, 'unrecorded-html-attribute')).toThrow();
});
