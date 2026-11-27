import { expect, it } from 'vitest';
import examples from '../../browser/fixtures/select-components-responsive-tag-prefix-snippet-contours.json';
import type { SelectCustomTagPrefixNode } from '../../browser/select-components-responsive-tag-prefix-metrics.mjs';
import { verifyResponsiveTagPrefixLabel, verifyResponsiveTagPrefixSingleTag } from '../../browser/select-components-responsive-tag-prefix-snippet-assertions';
const source = examples.source, hmr = examples.hmr, off = examples.noHmr;
it('checks the exact independently recorded HMR and no-HMR role contours explicitly', () => {
  for (const [renderer, actual] of [['vite-hmr', hmr], ['no-hmr', off]] as const) {
    expect(() => verifyResponsiveTagPrefixLabel(
      actual.normalLabel,
      source.normalLabel,
      renderer,
      'normal'
    )).not.toThrow();
    expect(() => verifyResponsiveTagPrefixLabel(
      actual.restLabel,
      source.restLabel,
      renderer,
      'rest'
    )).not.toThrow();
    expect(() => verifyResponsiveTagPrefixSingleTag(
      actual.normalTag,
      source.normalTag,
      [actual.normalLabel],
      [source.normalLabel],
      [actual.button],
      [source.button],
      renderer,
      'tag'
    )).not.toThrow();
    expect(() => verifyResponsiveTagPrefixSingleTag(
      actual.restTag,
      source.restTag,
      [actual.restLabel],
      [source.restLabel],
      [],
      [],
      renderer,
      'rest-tag'
    )).not.toThrow();
  }
  expect(() => verifyResponsiveTagPrefixLabel(
    hmr.normalLabel,
    source.normalLabel,
    'no-hmr',
    'wrong-hmr'
  )).toThrow();
  expect(() => verifyResponsiveTagPrefixLabel(
    off.normalLabel,
    source.normalLabel,
    'vite-hmr',
    'wrong-no-hmr'
  )).toThrow();
});
it('rejects unknown comments, missing/extra anchors, nonempty Text and changed literal HTML', () => {
  for (const mutate of [
    (node: SelectCustomTagPrefixNode) => { node.childNodes[0].text = 'authored comment'; },
    (node: SelectCustomTagPrefixNode) => { node.childNodes.splice(3, 1); },
    (node: SelectCustomTagPrefixNode) => {
      node.childNodes.splice(3, 0, { identity: null, type: 3, tag: null, text: '' });
    },
    (node: SelectCustomTagPrefixNode) => { node.childNodes[3].text = ' '; },
    (node: SelectCustomTagPrefixNode) => {
      node.html = node.html.replace('<!---->', '<!--authored-->');
    },
    (node: SelectCustomTagPrefixNode) => { node.html = node.html.replace('<!---->', ''); }
  ]) {
    const actual = structuredClone(hmr.normalLabel);
    mutate(actual);
    expect(() => verifyResponsiveTagPrefixLabel(
      actual,
      source.normalLabel,
      'vite-hmr',
      'malformed-anchor'
    )).toThrow();
  }
});
it('keeps every Source attribute, inline/computed value and physical box strict', () => {
  for (const mutate of [
    (node: SelectCustomTagPrefixNode) => {
      node.html = node.html.replace('Alpha', 'Changed Source');
    },
    (node: SelectCustomTagPrefixNode) => { node.attributes.reverse(); },
    (node: SelectCustomTagPrefixNode) => { node.css.display = 'grid'; },
    (node: SelectCustomTagPrefixNode) => { node.box.width += 1; }
  ]) {
    const changed = structuredClone(source.normalLabel);
    mutate(changed);
    expect(() => verifyResponsiveTagPrefixLabel(
      hmr.normalLabel,
      changed,
      'vite-hmr',
      'changed-source'
    )).toThrow();
  }
});
it('rejects a rest-only extra HMR pair and a changed physical label/button order', () => {
  const rest = structuredClone(hmr.restLabel);
  rest.childNodes.unshift({ identity: null, type: 8, tag: null, text: '' });
  rest.childNodes.splice(-1, 0, { identity: null, type: 3, tag: null, text: '' });

  expect(() => verifyResponsiveTagPrefixLabel(
    rest,
    source.restLabel,
    'vite-hmr',
    'rest-no-imported-component'
  )).toThrow();
  const tag = structuredClone(hmr.normalTag);
  [tag.childNodes[0], tag.childNodes[3]] = [tag.childNodes[3], tag.childNodes[0]];

  expect(() => verifyResponsiveTagPrefixSingleTag(
    tag,
    source.normalTag,
    [hmr.normalLabel],
    [source.normalLabel],
    [hmr.button],
    [source.button],
    'vite-hmr',
    'reordered-elements'
  )).toThrow();
});
