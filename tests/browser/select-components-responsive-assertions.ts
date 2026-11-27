import assert from 'node:assert/strict';
import type { Page } from '@playwright/test';
import { readSelectIcons, readSelectResponsiveOverflow, type SelectComponentsResponsiveOverflowNode } from './select-components-responsive-metrics.mjs';
import { drainSelectSurface } from './select-surface-driver';
import { verifySelectComponentsModesPoint, type NativeModesPoint } from './select-components-modes-assertions';
import { comparableSelectComponentCSS } from './select-components-layout-assertions';
import type { ModesCase, ModesPoint } from './select-components-modes-reference';
import type { SelectComponentsModesNode } from './select-components-modes-metrics.mjs';
import type { ResponsiveCase, ResponsivePoint, SelectComponentsResponsiveSample } from './select-components-responsive-reference';
import type { NativeComponentsOwner } from './select-components-assertions';
export interface NativeResponsivePoint extends NativeModesPoint { overflow: ResponsivePoint['overflow'] }
export async function settleNativeSelectComponentsResponsive(page: Page): Promise<NativeResponsivePoint> {
  let previous = '', stable = 0;
  for (let index = 0; index < 90; index++) {
    await drainSelectSurface(page);
    const icons = await page.evaluate(readSelectIcons), overflow = await page.evaluate(readSelectResponsiveOverflow);
    const owner = await page.evaluate(() => {
      const detail = {} as { read?: () => NativeComponentsOwner };
      document.querySelector('[data-select-components-fixture-command]')!.dispatchEvent(new CustomEvent(
        'selectcomponentscapture',
        { detail }
      ));
      if (!detail.read) {
        throw Error('Actual responsive owner absent');
      }
      return detail.read();
    });
    const point = { icons, owner, overflow }, key = JSON.stringify(point);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) {
      return point;
    }
    previous = key;
  }
  throw Error('Complete responsive DOM/overflow/owner did not settle');
}
const compilerClass = (name: string) => /^(?:svelte-[\w-]+|s-[\w-]+)$/.test(name);
function attributes(node: SelectComponentsModesNode) {
  return node.attributes.flatMap(([key, value]) => {
    if (key !== 'class') {
      return [[key, value]];
    }
    const classes = value.split(/\s+/).filter(name => name && !compilerClass(name));
    return classes.length ? [[key, classes.join(' ')]] : [];
  });
}
function verifyOverflowWrapper(
  actual: SelectComponentsModesNode,
  source: SelectComponentsModesNode,
  label: string
) {
  let current = attributes(actual);
  const original = attributes(source);
  const rest = source.classes.includes('ant-select-content-item-rest'), suffix = source.classes.includes('ant-select-content-item-suffix');
  const drop = (key: string, value: string) => {
    assert.equal(
      current.find(([name]) => name === key)?.[1],
      value,
      label + '/' + key + ' exact Native measure/accessibility annotation'
    );
    assert.equal(original.some(([name]) => name === key), false);
    current = current.filter(([name]) => name !== key);
  };
  if (!suffix) drop(rest ? 'data-select-rest' : 'data-select-tag', 'true');
  if (current.some(([key]) => key === 'inert')) {
    assert.equal(
      original.find(([key]) => key === 'aria-hidden')?.[1],
      'true',
      label + ' only a hidden Source wrapper suppresses Native buttons'
    );
    drop('inert', '');
  }
  assert.deepEqual(current, original, label + ' complete wrapper attribute order');
  for (const key of ['tag', 'connected', 'text', 'styleAttribute', 'cssText', 'inlineProperties', 'css', 'box',
    'geometryBoundary', 'value', 'caret', 'focused', 'metrics'] as const) {
    assert.deepEqual(
      actual[key],
      source[key],
      label + '/' + key
    );
  }
}
export function verifySelectComponentsResponsivePoint(
  actual: NativeResponsivePoint,
  source: ResponsivePoint,
  owner: ResponsiveCase,
  sample: SelectComponentsResponsiveSample,
  label: string
): string[] {
  const pairs = new Map<number, number>();
  const failures = verifySelectComponentsModesPoint(actual, source as ModesPoint, owner as unknown as ModesCase, sample as never, label,
    (current, original, label) => {
      assert.equal(
        pairs.get(original.identity) ?? current.identity,
        current.identity,
        label + ' one physical counterpart per Source node'
      );
      pairs.set(original.identity, current.identity);
      if (!original.classes.includes('ant-select-content-item')) {
        return false;
      }
      verifyOverflowWrapper(current, original, label);
      return true;
    });
  const check = (name: string, action: () => void) => {
    try {
    action();
  }
  catch (error) {
    failures.push(label + '/' + name + ': ' + String(error));
  }
  };
  check('complete-overflow-css-boxes-and-order', () => {
    assert(actual.icons.current.root && source.icons.current.root);
    pairs.set(source.icons.current.root.identity, actual.icons.current.root.identity);
    const currentNodes = [actual.overflow.root!, ...actual.overflow.allRootDescendants];
    const inspect = (original: SelectComponentsResponsiveOverflowNode | null) => {
      if (!original) {
        return null;
      }
      assert(original.identity !== null);
      const mapped = pairs.get(original.identity);
      assert(mapped, 'every Source overflow node was covered by the full mode comparator');
      const current = currentNodes.find(node => node.identity === mapped);
      assert(current);
      // The Select mode comparison already checked tags and wrappers.
      assert.deepEqual(
        comparableSelectComponentCSS(current.css),
        comparableSelectComponentCSS(original.css),
        'every overflow computed property/order/inset'
      );
      assert.deepEqual(current.box, original.box);
      assert.deepEqual(current.clientRects, original.clientRects);
      const metrics = { ...current.metrics };
      const svg = source.icons.layout.some(node => node.identity === original.identity && node.geometryBoundary === 'svg-descendant');
      if (svg) {
        for (const key of ['offsetWidth', 'offsetHeight'] as const) {
          if (!Object.hasOwn(
            original.metrics,
            key
          ) && Object.hasOwn(
            metrics,
            key
          )) {
            // Playwright retains own undefined; frozen JSON omits it. Only the two
            // absent SVG offset fields cross this serialization boundary.
            assert.equal(metrics[key], undefined);
            delete metrics[key];
          }
        }
      }
      assert.deepEqual(metrics, original.metrics);
      return current;
    };
    inspect(source.overflow.root);
    for (const node of source.overflow.allRootDescendants) inspect(node);
    for (const key of ['content', 'editor', 'suffix', 'adornment'] as const) {
      assert.equal(
        actual.overflow[key]?.identity ?? null,
        inspect(source.overflow[key])?.identity ?? null,
        'exact semantic role uses the compared physical node'
      );
    }
    for (const key of ['contentChildren', 'suffixChildren', 'rests'] as const) {
      assert.equal(
        actual.overflow[key].length,
        source.overflow[key].length,
        'complete ' + key + ' element topology'
      );
      source.overflow[key].forEach((node, index) => assert.equal(
        actual.overflow[key][index].identity,
        inspect(node)!.identity
      ));
    }
    assert.equal(actual.overflow.suffixContainsEditor, source.overflow.suffixContainsEditor);
    assert.equal(
      actual.overflow.editorIsDirectSuffixChild,
      source.overflow.editorIsDirectSuffixChild
    );
    assert.equal(actual.overflow.rootHasSamePublicEditor, source.overflow.rootHasSamePublicEditor);
    const sourceChildren = source.overflow.suffix?.childNodes;
    const input = { type: 1, tag: 'INPUT', text: null }, span = { type: 1, tag: 'SPAN', text: null };
    assert.deepEqual(sourceChildren, sample.renderer === 'forwardRef-fragment-input-adornment' ? [input, span] : [input],
      'frozen ordinary Source suffix has only its authored adjacent elements');
    const comment = { type: 8, tag: null, text: null }, emptyAnchor = {
      type: 3,
      tag: null,
      text: ''
    };
    // Pinned Svelte comment() returns Comment+empty Text. SelectComponent's
    // active render branch uses two such fragments; the caller adds its If
    // comment and the component retains the final comment anchor. This exact
    // CSR topology permits no whitespace/nonempty text or extra/missing node.
    assert.deepEqual(actual.overflow.suffix?.childNodes,
      [comment, comment, ...sourceChildren!, comment, emptyAnchor, emptyAnchor, comment],
      'exact Svelte CSR Snippet/If anchors around the unchanged authored elements');
  });
  check('owner-frame-and-form-typography', () => {
    for (const role of ['form', 'frame']) {
      const find = (point: NativeResponsivePoint | ResponsivePoint) => point.overflow.ancestors.find(node => role === 'form'
        ? node.tag === 'FORM' : node.tag === 'DIV' && node.css.position === 'absolute');
      const current = find(actual), original = find(source);
      assert(current && original);
      for (const key of ['font', 'fontFamily', 'fontSize', 'lineHeight']) {
        assert.equal(
          current.css[key],
          original.css[key],
          role + '/' + key
        );
      }
      assert.deepEqual(current.box, original.box, role + ' actual inherited layout box');
    }
  });
  return failures;
}
