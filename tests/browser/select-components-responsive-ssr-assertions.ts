import assert from 'node:assert/strict';
import { readSelectComponentsResponsiveSSR } from './select-components-responsive-ssr-metrics';
type Element = ReturnType<typeof readSelectComponentsResponsiveSSR>['contents'][number];
const classes = (element: Element) => element.attributes.find(([key]) => key === 'class')?.[1].split(/\s+/) ?? [];
function attributes(element: Element) {
  return element.attributes.flatMap(([key, value]) => {
    if (key === 'class') value = value.split(/\s+/).filter(name => name && !/^(?:svelte-[\w-]+|s-[\w-]+)$/.test(name)).join(' ');
    // Only serializer whitespace is irrelevant; declaration values and order
    // remain exact, including the initial MAX_SAFE_INTEGER order value.
    if (key === 'style') value = value.split(';').map(part => part.trim()).filter(Boolean).map(part => {
      const colon = part.indexOf(':'); return part.slice(0, colon).trim() + ':' + part.slice(colon + 1).trim();
    }).join(';');
    return key === 'class' && !value ? [] : [[key, value]];
  });
}
export function verifySelectComponentsResponsiveSSRLayout(actualHTML: string, sourceHTML: string, label: string) {
  const actual = readSelectComponentsResponsiveSSR(actualHTML), source = readSelectComponentsResponsiveSSR(sourceHTML);
  assert.equal(actual.contents.length, source.contents.length, label + ' complete content subtree count');
  const compare = (actual: Element, source: Element, label: string) => {
    assert.equal(actual.tag, source.tag, label + ' tag');
    let left = attributes(actual); const right = attributes(source), names = classes(source);
    const drop = (key: string, expected: string) => {
      assert.equal(left.find(([name]) => name === key)?.[1], expected, label + '/' + key + ' exact Native annotation');
      assert.equal(right.some(([name]) => name === key), false, label + ' Source has no Native annotation');
      left = left.filter(([name]) => name !== key);
    };
    if (names.includes('ant-select-content')) drop('data-ant-select-content', 'true');
    let markedDirectiveWrapper = false;
    if (names.includes('ant-select-content-item')) {
      const rest = names.includes('ant-select-content-item-rest'), suffix = names.includes('ant-select-content-item-suffix');
      if (!suffix) { markedDirectiveWrapper = true; drop(rest ? 'data-select-rest' : 'data-select-tag', 'true'); }
      if (left.some(([key]) => key === 'inert')) {
        assert.equal(right.find(([key]) => key === 'aria-hidden')?.[1], 'true'); drop('inert', '');
      }
    }
    if (names.includes('ant-select-selection-item')) { drop('data-ant-select-selection-item', 'true'); drop('role', 'presentation'); }
    const style = right.find(([key]) => key === 'style');
    const directiveStyleLast = markedDirectiveWrapper && style && right.at(-1)?.[0] !== 'style'
      && right.find(([key]) => key === 'aria-hidden')?.[1] === 'true' && left.at(-1)?.[0] === 'style';
    // Pinned Svelte SSR compiler emits attr_style for style directives after
    // ordinary attrs (compiler/phases/3-transform/server/visitors/shared/element.js). This marked
    // hidden wrapper keeps every other attr/order and every declaration/value.
    if (directiveStyleLast) assert.deepEqual(left, [...right.filter(([key]) => key !== 'style'), style], label + ' exact Svelte SSR directive style-last order');
    else assert.deepEqual(left, right, label + ' complete ordered attributes and style declarations');
    assert.equal(actual.children.length, source.children.length, label + ' complete child topology');
    for (const [index, child] of source.children.entries()) {
      const current = actual.children[index];
      if (typeof current === 'string' || typeof child === 'string') assert.deepEqual(current, child, label + '/' + index + ' literal text');
      else compare(current, child, label + '/' + index);
    }
  };
  source.contents.forEach((element, index) => compare(actual.contents[index], element, label + '/content' + index));
}
