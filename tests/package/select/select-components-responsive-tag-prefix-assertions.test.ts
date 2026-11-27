import { expect, it } from 'vitest';
import { readSelectComponentsResponsiveTagPrefixCSR } from '../../browser/select-components-responsive-tag-prefix-reference';
import { verifyResponsiveTagPrefixPoint, verifyResponsiveTagPrefixPhysicalNode } from '../../browser/select-components-responsive-tag-prefix-assertions';
it('accepts all twenty unmodified Source points without Native-only fabricated refs or producer counts', () => {
  const cases = readSelectComponentsResponsiveTagPrefixCSR().cases;
  for (const owner of cases) {
    for (const [index, point] of [owner.initial, ...owner.steps].entries())
      expect(verifyResponsiveTagPrefixPoint(point, point, owner.id + '/' + index)).toEqual([]);
  }
});
it('rejects a changed authored custom-tag width and an extra literal child', () => {
  const source = readSelectComponentsResponsiveTagPrefixCSR().cases[0].initial.customTagsPrefix.customLabels[0];

  expect(source).toBeTruthy();
  const width = structuredClone(source);
  width.box.width += 1;

  expect(() => verifyResponsiveTagPrefixPhysicalNode(width, source, 'negative-width')).toThrow();
  const extra = structuredClone(source);
  extra.childNodes.push({ identity: null, type: 3, tag: null, text: ' ' });

  expect(() => verifyResponsiveTagPrefixPhysicalNode(extra, source, 'negative-whitespace')).toThrow();
});
