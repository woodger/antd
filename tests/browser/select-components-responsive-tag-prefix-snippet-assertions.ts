import assert from 'node:assert/strict';
import type { SelectCustomTagPrefixNode } from './select-components-responsive-tag-prefix-metrics.mjs';
export type ResponsiveTagPrefixRenderer = 'vite-hmr' | 'no-hmr';
const child = (
  type: number,
  text: string | null = '',
  identity: number | null = null,
  tag: string | null = null
) => ({
  identity,
  type,
  tag,
  text
});
const comment = () => child(8), text = (value: string | null) => child(3, value), element = (node: SelectCustomTagPrefixNode) => child(
  1,
  null,
  node.identity,
  node.tag
);
const fields = (node: SelectCustomTagPrefixNode) => Object.fromEntries(Object.entries(node).filter(([key]) => !['identity', 'parentIdentity', 'html', 'childNodes'].includes(key)));
function parts(node: SelectCustomTagPrefixNode) {
  const first = node.html.indexOf('>') + 1, last = node.html.lastIndexOf('</');
  assert(first > 0 && last >= first);
  return {
    open: node.html.slice(0, first),
    inner: node.html.slice(first, last),
    close: node.html.slice(last)
  };
}
export function verifyResponsiveTagPrefixLabel(actual: SelectCustomTagPrefixNode, source: SelectCustomTagPrefixNode,
  renderer: ResponsiveTagPrefixRenderer, label: string) {
  assert(
    renderer === 'vite-hmr' || renderer === 'no-hmr',
    label + ' explicit expected renderer, never inferred from DOM'
  );
  assert.equal(source.tag, 'SPAN');
  assert.equal(actual.tag, 'SPAN');
  assert.equal(typeof source.text, 'string');
  const role = source.attributes.find(([key]) => key === 'data-custom-tag-label')?.[1];
  assert.equal(typeof role, 'string');
  assert.deepEqual(
    source.childNodes,
    [text(source.text)],
    label + ' Source has exactly its authored Text'
  );
  assert.deepEqual(
    fields(actual),
    fields(source),
    label + ' every physical attribute/CSSOM/value/box/metric'
  );
  const hmr = renderer === 'vite-hmr' && role !== 'rest';
  assert.deepEqual(actual.childNodes, [...(hmr ? [comment()] : []), comment(), text(source.text), text(''), ...(hmr ? [text('')] : []), comment()],
    label + ' exact compiler-owned empty anchors and authored Text positions');
  const current = parts(actual), original = parts(source);
  assert.equal(current.open, original.open);
  assert.equal(current.close, original.close);
  assert.equal(actual.html, original.open + '<!---->'.repeat(hmr ? 2 : 1) + original.inner + '<!---->' + original.close,
    label + ' complete original markup with only the exact proven anchor positions');
}
export function verifyResponsiveTagPrefixSingleTag(actual: SelectCustomTagPrefixNode, source: SelectCustomTagPrefixNode,
  actualLabels: SelectCustomTagPrefixNode[], sourceLabels: SelectCustomTagPrefixNode[], actualButtons: SelectCustomTagPrefixNode[],
  sourceButtons: SelectCustomTagPrefixNode[], renderer: ResponsiveTagPrefixRenderer, label: string) {
  const key = source.attributes.find(([name]) => name === 'data-custom-tag')?.[1];
  assert.equal(typeof key, 'string');
  const rest = key === 'rest';
  const find = (nodes: SelectCustomTagPrefixNode[], marker: string) => nodes.filter(node => node.attributes.some(([name, value]) => name === marker && value === key));
  const sl = find(sourceLabels, 'data-custom-tag-label'), al = find(
    actualLabels,
    'data-custom-tag-label'
  );
  assert.equal(sl.length, 1);
  assert.equal(al.length, 1);
  verifyResponsiveTagPrefixLabel(al[0], sl[0], renderer, label + '/label');
  assert.equal(sl[0].parentIdentity, source.identity);
  assert.equal(al[0].parentIdentity, actual.identity);
  const sb = find(sourceButtons, 'data-custom-tag-close'), ab = find(
    actualButtons,
    'data-custom-tag-close'
  );
  assert.equal(sb.length, rest ? 0 : 1);
  assert.equal(ab.length, rest ? 0 : 1);
  if (!rest) {
    assert.equal(sb[0].parentIdentity, source.identity);
    assert.equal(ab[0].parentIdentity, actual.identity);
    assert.deepEqual(fields(ab[0]), fields(sb[0]));
    assert.deepEqual(ab[0].childNodes, sb[0].childNodes);
    assert.equal(ab[0].html, sb[0].html);
  }
  assert.deepEqual(source.childNodes, [element(sl[0]), ...(rest ? [] : [element(sb[0])])]);
  assert.deepEqual(actual.childNodes, [element(al[0]), comment(), comment(), ...(rest ? [] : [element(ab[0])]), text(''), comment()],
    label + ' exact mapped physical label/button order and empty anchor contour');
  assert.deepEqual(fields(actual), fields(source));
  const original = parts(source), current = parts(actual);
  assert.equal(current.open, original.open);
  assert.equal(current.close, original.close);
  assert.equal(source.html, original.open + sl[0].html + (sb[0]?.html ?? '') + original.close);
  assert.equal(
    actual.html,
    original.open + al[0].html + '<!----><!---->' + (ab[0]?.html ?? '') + '<!---->' + original.close
  );
}
