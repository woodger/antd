import assert from 'node:assert/strict';
import { readSelectComponentsSSRFields } from './select-components-ssr-metrics';
import { readSelectIconsSSR } from './select-icons-ssr-metrics';
import { verifySelectComponentsResponsiveSSRLayout } from './select-components-responsive-ssr-assertions';
import { verifyIconGraph } from './select-icons-assertions';
import { normalizedSelectSurfaceAuthoredProps } from './select-surface-assertions';
import { verifySelectComponentsAttributes } from './select-components-assertions';
import { readTagCloseHandleSourceInfo, type TagCloseHandleSSRSerialization, type TagCloseHandleSample } from './select-components-tag-close-handles-reference';
import { verifyNormalTagCalls, verifyTagCloseHandleBodyAliases, type NativeOwner } from './select-components-tag-close-handles-assertions';
export function verifyTagCloseHandleSSR(body: string, actual: NativeOwner, refs: Record<string, boolean>,
  source: TagCloseHandleSSRSerialization, sample: Pick<TagCloseHandleSample, 'id'>, label: string) {
  assert(['select-close-handles-nonclosable', 'select-close-handles-retained'].includes(sample.id));
  assert.equal(source.fatal, null);
  assert.equal(source.domFree, true);
  assert(Object.values(source.resources).every(value => value === 0));
  for (const key of ['model', 'options', 'disabled', 'open', 'alive', 'actionIndex', 'events', 'rawEvents', 'invocations', 'retention', 'lifecycle', 'authoredSample', 'authoredProvider'] as const)
    assert.deepEqual(actual[key], source.state[key], label + '/' + key);
  for (const key of ['rawModel', 'rawOptions', 'rawAuthoredSample', 'rawAuthoredProvider'] as const) verifyIconGraph(
    actual[key],
    source.state[key],
    label + '/' + key
  );
  assert.deepEqual(
    normalizedSelectSurfaceAuthoredProps(actual.authoredProps),
    normalizedSelectSurfaceAuthoredProps(source.state.authoredProps)
  );
  assert.equal(
    Object.hasOwn(normalizedSelectSurfaceAuthoredProps(actual.authoredProps), 'maxTagCount'),
    false
  );
  assert.equal(
    Object.hasOwn(normalizedSelectSurfaceAuthoredProps(source.state.authoredProps), 'maxTagCount'),
    false
  );
  assert.deepEqual(Object.keys(refs), ['control', 'root', 'editor', 'authoredInput']);
  assert(Object.values(refs).every(Boolean));
  assert(Object.values(source.refs).every(Boolean));
  verifyNormalTagCalls(actual.calls, source.state.calls, label);
  verifyTagCloseHandleBodyAliases(actual.calls, actual.bodyActivity, label);
  const bodyInfoIds = new Set(source.state.bodyActivity.map(row => (row.rawInfo.root as { ref: number }).ref));
  const unused = source.state.calls.filter(call => call.kind === 'tagRender' && readTagCloseHandleSourceInfo(call).isMaxTag);
  assert.equal(unused.length, 1, label + ' actual single unused Source SSR rest element');
  const info = readTagCloseHandleSourceInfo(unused[0]);
  assert.equal(info.label, '+ 0 ...');
  const argumentArray = unused[0].rawArgument.objects.find(node => node.id === (unused[0].rawArgument.root as { ref: number }).ref)!;
  const reference = argumentArray.properties!.find(property => property.key === '0')!.value as { ref: number };
  assert(!bodyInfoIds.has(reference.ref), label + ' unused ReactElement info never mounted');
  for (const html of [body, source.rawHtml]) assert(
    !html.includes('data-handles-tag="undefined"'),
    label + ' no fake rest markup'
  );
  verifySelectComponentsResponsiveSSRLayout(
    body,
    source.rawHtml,
    label + ' complete unbounded content DOM',
    { responsiveCustomTag: true, unboundedCustomTag: true }
  );
  assert.deepEqual(
    readSelectComponentsSSRFields(body),
    readSelectComponentsSSRFields(source.rawHtml),
    label + ' entire input attrs/order/value'
  );
  const icons = readSelectIconsSSR(body), originalIcons = readSelectIconsSSR(source.rawHtml);
  assert.deepEqual(icons.svg, originalIcons.svg);
  assert.deepEqual(icons.displayValues, originalIcons.displayValues);
  assert.deepEqual(icons.leaks, []);
  assert.equal(icons.affixes.length, originalIcons.affixes.length);
  icons.affixes.forEach((node, index) => {
    const original = originalIcons.affixes[index];
    assert.equal(original.tag, 'div');
    assert.equal(node.tag, 'span');
    const classes = node.attributes.find(([key]) => key === 'class')![1].split(/\s+/);
    assert.deepEqual(
      classes.filter(name => !/^(?:svelte-[\w-]+|s-[\w-]+)$/.test(name)),
      ['suffix', 'ant-select-suffix']
    );
    assert.deepEqual(
      node.attributes.filter(([key]) => key !== 'class'),
      original.attributes.filter(([key]) => key !== 'class')
    );
    assert.deepEqual(node.children, original.children);
    assert.equal(node.text, original.text);
  });
  const inputs = source.state.calls.filter(call => call.kind === 'components.input');
  assert(inputs.length && actual.componentObservations.length);
  for (const observation of actual.componentObservations) assert(inputs.some(call => {
    try {
    verifySelectComponentsAttributes(observation, call, label);
    return true;
  }
  catch {
    return false;
  }
  }));
  for (const call of inputs) assert(actual.componentObservations.some(observation => {
    try {
    verifySelectComponentsAttributes(observation, call, label);
    return true;
  }
  catch {
    return false;
  }
  }));
}
