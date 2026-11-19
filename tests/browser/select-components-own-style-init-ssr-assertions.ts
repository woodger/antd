import assert from 'node:assert/strict';
import { readSelectComponentsResponsiveSSR } from './select-components-responsive-ssr-metrics';
import { readSelectComponentsSSRFields } from './select-components-ssr-metrics';
import { verifySelectIconSSRNodes, verifyIconGraph } from './select-icons-assertions';
import { readSelectIconsSSR } from './select-icons-ssr-metrics';
import { verifySelectComponentsGraph, verifySelectComponentsProducers } from './select-components-producers';
import { verifySelectSurfaceEventGraph, normalizedSelectSurfaceAuthoredProps } from './select-surface-assertions';
import type { NativeOwnStyleOwner } from './select-components-own-style-init-assertions';
import type { OwnStyleInitSSRState, SelectComponentsOwnStyleSample } from './select-components-own-style-init-reference';
function fields(attributes: string[][]) {
  return attributes.flatMap(([name, text]) => {
    if (name === 'class') text = text.split(/\s+/).filter(Boolean).filter(name => !/^(?:svelte-[\w-]+|s-[\w-]+)$/.test(name)).join(' ');
    if (name === 'style') {
      text = text.split(';').map(part => part.trim()).filter(Boolean).map(part => {
        const colon = part.indexOf(':');
        return part.slice(0, colon).trim() + ':' + part.slice(colon + 1).trim();
      }).join(';');
    }
    return name === 'class' && !text ? [] : [[name, text]];
  });
}

type ContentElement = ReturnType<typeof readSelectComponentsResponsiveSSR>['contents'][number];
/** Own-style fixtures use ordinary nonresponsive Select multiple / AC single.
 * Only their inherited, explicitly proven Native annotations cross representation.
 * Every other attr, inline declaration, child/text position and SVG path stays exact.
 */
export function verifyOwnStyleSSRLayout(
  actualHTML: string,
  sourceHTML: string,
  control: SelectComponentsOwnStyleSample['control'],
  label: string
) {
  const actual = readSelectComponentsResponsiveSSR(actualHTML), source = readSelectComponentsResponsiveSSR(sourceHTML);
  assert.equal(source.contents.length, 1, label + ' one measured Source content subtree');
  assert.equal(
    actual.contents.length,
    source.contents.length,
    label + ' complete content subtree count'
  );
  const compare = (actual: ContentElement, source: ContentElement, path: string, itemTitle?: string) => {
    const left = fields(actual.attributes), right = fields(source.attributes);
    const classes = right.find(([key]) => key === 'class')?.[1].split(/\s+/) ?? [];
    let currentAttrs = left, expectedAttrs = right, currentTag = actual.tag;
    const drop = (name: string, expected: string) => {
      assert.equal(
        currentAttrs.filter(([key]) => key === name).length,
        1,
        path + '/' + name + ' exact annotation count'
      );
      assert.equal(
        currentAttrs.find(([key]) => key === name)?.[1],
        expected,
        path + '/' + name + ' exact annotation value'
      );
      assert.equal(
        right.some(([key]) => key === name),
        false,
        path + ' Source has no private annotation'
      );
      currentAttrs = currentAttrs.filter(([key]) => key !== name);
    };
    if (classes.includes('ant-select-content')) {
      assert.equal(source.tag, 'div');
      assert.deepEqual(classes, control === 'select' ? ['ant-select-content']
        : ['ant-select-content', 'ant-select-content-has-value', 'ant-select-content-has-search-value'], path + ' exact measured content kind');
      drop(
        control === 'select' ? 'data-ant-select-content' : 'data-ant-auto-complete-content',
        'true'
      );
    }
    if (classes.includes('ant-select-selection-item')) {
      assert.equal(control, 'select');
      assert.equal(source.tag, 'span');
      itemTitle = right.find(([name]) => name === 'title')?.[1];
      assert.equal(typeof itemTitle, 'string');
      assert.deepEqual(
        right,
        [['title', itemTitle], ['class', 'ant-select-selection-item']],
        path + ' exact Source item attrs/order'
      );
      drop('data-ant-select-selection-item', 'true');
      drop('role', 'presentation');
      // Existing Native wrapper writes class before title. This is a single
      // proven role/order gate, never an unordered attribute comparison.
      expectedAttrs = [['class', 'ant-select-selection-item'], ['title', itemTitle!]];
    }
    if (classes.includes('ant-select-selection-item-remove')) {
      assert.equal(control, 'select');
      assert.equal(source.tag, 'span');
      assert.equal(actual.tag, 'button');
      assert.equal(
        typeof itemTitle,
        'string',
        path + ' the real Source selection supplies the accessible label'
      );
      assert.deepEqual(right, [['class', 'ant-select-selection-item-remove'],
        ['style', 'user-select:none;-webkit-user-select:none'], ['unselectable', 'on'], ['aria-hidden', 'true']], path + ' exact inherited Source TransBtn');
      assert.deepEqual(left, [['type', 'button'], ['data-ant-select-selection-item-remove', 'true'],
        ['class', 'ant-select-selection-item-remove'], ['aria-label', 'Удалить ' + itemTitle]], path + ' exact existing Native removal button');
      currentTag = source.tag;
      // The semantic button already passed its full known markup check. Source's
      // fixed nonselectable TransBtn declarations are retained and checked above.
      currentAttrs = expectedAttrs;
    }
    assert.equal(currentTag, source.tag, path + ' tag');
    assert.deepEqual(
      currentAttrs,
      expectedAttrs,
      path + ' every ordered attribute and inline declaration'
    );
    assert.equal(
      actual.children.length,
      source.children.length,
      path + ' complete child/text topology'
    );
    for (const [index, child] of source.children.entries()) {
      const current = actual.children[index];
      if (typeof current === 'string' || typeof child === 'string') {
        assert.deepEqual(
          current,
          child,
          path + '/' + index + ' exact literal text'
        );
      }
      else {
        compare(current, child, path + '/' + index, itemTitle);
      }
    }
  };
  source.contents.forEach((element, index) => compare(
    actual.contents[index],
    element,
    label + '/content' + index
  ));
}

export function verifyOwnStyleSSR(
  html: string,
  actual: NativeOwnStyleOwner,
  refs: Record<string, boolean>,
  source: OwnStyleInitSSRState,
  sample: SelectComponentsOwnStyleSample,
  label: string
) {
  for (const key of ['settings', 'model', 'open', 'query', 'profile', 'phase', 'authoredProvider', 'authoredInnerProvider',
    'authoredInputProps', 'inputOwnKeys', 'inputOwnDescriptors', 'inputHasOwnStyle'] as const) {
    assert.deepEqual(
      actual[key],
      (source.state as unknown as Record<string, unknown>)[key],
      label + '/' + key
    );
  }
  for (const key of ['rawSettings', 'rawAuthoredInputProps', 'rawAuthoredInputStyle'] as const) {
    verifyIconGraph(
      actual[key],
      (source.state as unknown as Record<string, unknown>)[key],
      label + '/' + key,
      []
    );
  }
  const a = normalizedSelectSurfaceAuthoredProps(actual.authoredProps), b = normalizedSelectSurfaceAuthoredProps(source.state.authoredProps);
  delete a.components;
  delete b.components;
  assert.deepEqual(a, b, label + ' all caller fields');
  verifySelectSurfaceEventGraph(actual.rawModel, source.state.rawModel, label + ' raw model');
  verifySelectComponentsGraph(
    actual.rawAuthoredProps,
    source.state.rawAuthoredProps,
    label + ' complete raw caller',
    [],
    true
  );
  verifyIconGraph(
    actual.rawAuthoredProvider,
    source.state.rawAuthoredProvider,
    label + ' raw provider',
    []
  );
  verifyIconGraph(
    actual.rawAuthoredInnerProvider,
    source.state.rawAuthoredInnerProvider,
    label + ' raw inner provider',
    []
  );
  verifySelectComponentsProducers(
    actual.calls,
    source.state.calls,
    label + ' all producers',
    [],
    true
  );
  assert.deepEqual(actual.calls, []);
  assert.deepEqual(actual.componentObservations ?? [], []);
  for (const key of ['events', 'rawEvents', 'lifecycle', 'bodyActivity'] as const) {
    assert.deepEqual(
      actual[key],
      source.state[key] ?? [],
      label + '/' + key
    );
  }
  assert(Object.values(refs).every(Boolean), label + ' SSR has no live DOM refs');
  verifyOwnStyleSSRLayout(html, source.rawHtml, sample.control, label + '/content-layout');
  verifySelectIconSSRNodes(
    readSelectIconsSSR(html),
    readSelectIconsSSR(source.rawHtml),
    source.state,
    sample as never,
    label + '/inherited-icons'
  );
  const native = readSelectComponentsSSRFields(html), original = readSelectComponentsSSRFields(source.rawHtml);
  assert.equal(native.fields.length, original.fields.length);
  for (const [index, field] of native.fields.entries()) {
    const expected = original.fields[index];
    assert.equal(field.tag, expected.tag);
    assert.equal(field.value, expected.value);
    assert.equal(field.content, expected.content);
    assert.deepEqual(
      fields(field.attributes),
      fields(expected.attributes),
      label + '/field' + index + ' full ordered attrs/declarations'
    );
  }
  assert.equal(native.prefixBodies, original.prefixBodies);
}
