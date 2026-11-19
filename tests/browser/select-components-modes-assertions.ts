import assert from 'node:assert/strict';
import type { Page } from '@playwright/test';
import { readSelectIcons, type SelectComponentsModesDOM, type SelectComponentsModesNode } from './select-components-modes-metrics.mjs';
import { drainSelectSurface } from './select-surface-driver';
import { verifySelectComponentsDOMAttributes, verifySelectComponentsPoint, type NativeComponentsOwner } from './select-components-assertions';
import { decodeSelectSurface } from './select-surface-receipts';
import type { ModesCase, ModesPoint, SelectComponentsModesSample } from './select-components-modes-reference';
import type { ComponentsCase } from './select-components-reference';
import { selectComponentsModesPopupSource } from './select-components-modes-key-collision';
export interface NativeModesPoint { icons: SelectComponentsModesDOM; owner: NativeComponentsOwner }
export async function settleNativeSelectComponentsModes(page: Page): Promise<NativeModesPoint> {
  let previous = '', stable = 0;
  for (let attempt = 0; attempt < 90; attempt++) {
    await drainSelectSurface(page);
    const icons = await page.evaluate(readSelectIcons), owner = await page.evaluate(() => {
      const detail = {} as { read?: () => NativeComponentsOwner };
      document.querySelector('[data-select-components-fixture-command]')!.dispatchEvent(new CustomEvent(
        'selectcomponentscapture',
        { detail }
      ));
      if (!detail.read) {
        throw Error('Actual mode owner absent');
      }
      return detail.read();
    });
    const point = { icons, owner }, next = JSON.stringify(point);
    stable = previous === next ? stable + 1 : 0;
    if (stable >= 3) {
      return point;
    }
    previous = next;
  }
  throw Error('Actual mode owner/geometry/complete raw ledgers did not settle');
}
const compilerClass = (value: string) => /^(?:svelte-[\w-]+|s-[\w-]+)$/.test(value);
const classes = (node: SelectComponentsModesNode) => node.classes.filter(name => !compilerClass(name));
const has = (node: SelectComponentsModesNode, name: string) => node.classes.includes(name);
function attributes(node: SelectComponentsModesNode) {
  return node.attributes.flatMap(([key, value]) => {
    if (key !== 'class') {
      return [[key, value]];
    }
    const current = value.split(/\s+/).filter(Boolean).filter(name => !compilerClass(name));
    return current.length ? [[key, current.join(' ')]] : [];
  });
}
function role(node: SelectComponentsModesNode, dom: SelectComponentsModesDOM) {
  if (node.identity === dom.current.editor?.identity) {
    return 'editor';
  }
  const authored = node.attributes.find(([key]) => key === 'data-select-icons-node')?.[1];
  if (authored) {
    return 'authored:' + authored;
  }
  for (const name of ['ant-select-content-item-suffix', 'ant-select-content-item', 'ant-select-selection-item-remove',
    'ant-select-selection-item-content', 'ant-select-selection-item', 'ant-select-content', 'ant-select-placeholder',
    'ant-select-suffix', 'ant-select-clear', 'ant-select-item-option-state', 'ant-select-item-option', 'anticon-close', 'anticon-down']) {
    if (has(node, name)) {
      return name;
    }
  }
  return node.tag.toLowerCase() === 'svg' || node.tag.toLowerCase() === 'path' ? node.tag.toLowerCase()
    : node.tag + ':' + classes(node).join(' ');
}
/** Existing default Native buttons/annotations remain explicit. CSS and geometry are never rewritten. */
function verifyNode(actual: SelectComponentsModesNode, source: SelectComponentsModesNode, label: string,
  rootDisabled: boolean, removeLabel?: string) {
  let currentAttrs = attributes(actual), originalAttrs = attributes(source), currentTag = actual.tag, currentValue = actual.value;
  let sourceStyle = source.styleAttribute, sourceText = source.cssText, sourceInline = source.inlineProperties;
  const get = (values: string[][], key: string) => values.find(([name]) => name === key)?.[1];
  const drop = (key: string, value: string | undefined, original = false) => {
    const values = original ? originalAttrs : currentAttrs;
    assert.equal(get(values, key), value, label + '/' + key + ' exact existing wrapper');
    if (original) originalAttrs = values.filter(([name]) => name !== key); else currentAttrs = values.filter(([name]) => name !== key);
  };
  const privateClass = (name: string) => {
    assert(actual.classes.includes(name), label + ' exact existing Native class');
    currentAttrs = currentAttrs.map(([key, value]) => [key, key === 'class' ? value.split(/\s+/).filter(c => c !== name).join(' ') : value]);
  };
  let wrapper = false;
  if (has(source, 'ant-select-selection-item')) {
    wrapper = true;
    drop('data-ant-select-selection-item', 'true');
    drop('role', 'presentation');
    const individuallyDisabled = has(source, 'ant-select-selection-item-disabled');
    drop(
      'data-ant-select-selection-item-disabled',
      individuallyDisabled || rootDisabled ? 'true' : undefined
    );
    if (rootDisabled && !individuallyDisabled) privateClass('ant-select-selection-item-disabled');
  }
  else if (has(source, 'ant-select-selection-item-remove')) {
    wrapper = true;
    assert.equal(actual.tag, 'BUTTON');
    assert.equal(source.tag, 'SPAN');
    currentTag = source.tag;
    drop('type', 'button');
    drop('data-ant-select-selection-item-remove', 'true');
    drop('aria-label', removeLabel);
    drop('aria-hidden', undefined);
    drop('unselectable', undefined);
    drop('aria-hidden', 'true', true);
    drop('unselectable', 'on', true);
    // The old Native removal button does not need TransBtn's fixed nonselectable
    // inline declaration. Every authored declaration, computed field and box stays exact.
    assert.deepEqual(sourceInline[0], { name: 'user-select', value: 'none', priority: '' });
    sourceInline = sourceInline.slice(1);
    sourceText = sourceText.replace(/^user-select: none;\s*/, '');
    sourceStyle = sourceText || null;
    originalAttrs = originalAttrs.flatMap(([key, value]) => key === 'style' ? sourceStyle ? [[key, sourceStyle]] : [] : [[key, value]]);
    assert.equal(actual.value, '');
    assert.equal(source.value, null);
    currentValue = null;
  }
  else if (has(source, 'ant-select-content')) {
    wrapper = true;
    drop('data-ant-select-content', 'true');
    const empty = actual.attributes.find(([key]) => key === 'data-select-source-empty-input');
    if (empty) {
      assert.equal(empty[1], 'true');
      assert.equal(source.text, 'Choose icon value');
      drop(empty[0], empty[1]);
    }
  }
  else if (has(source, 'ant-select-placeholder')) {
    wrapper = true;
    drop('data-ant-select-placeholder', 'true');
    drop('aria-hidden', 'true');
  }
  else if (has(source, 'ant-select-suffix')) {
    wrapper = true;
    assert.equal(actual.tag, 'SPAN');
    assert.equal(source.tag, 'DIV');
    currentTag = source.tag;
    privateClass('suffix');
  }
  else if (has(source, 'ant-select-clear')) {
    wrapper = true;
    privateClass('clear');
  }
  else if (has(source, 'ant-select-item-option')) {
    wrapper = true;
    assert.equal(actual.tag, 'BUTTON');
    assert.equal(source.tag, 'DIV');
    currentTag = source.tag;
    drop('type', 'button');
    drop('tabindex', '-1');
    drop('data-ant-select-item', 'true');
    drop('disabled', get(originalAttrs, 'aria-disabled') === 'true' ? '' : undefined);
    assert.equal(actual.value, '');
    assert.equal(source.value, null);
    currentValue = null;
  }
  else if (has(source, 'ant-select-item-option-state')) {
    assert.deepEqual(
      currentAttrs.filter(([key]) => key !== 'style'),
      originalAttrs.filter(([key]) => key !== 'style')
    );
    assert.equal(get(currentAttrs, 'style'), get(originalAttrs, 'style'));
    currentAttrs = originalAttrs;
  }
  assert.equal(currentTag, source.tag, label + '/tag');
  assert.equal(currentValue, source.value, label + '/value');
  if (wrapper) {
    assert.deepEqual(
      Object.fromEntries(currentAttrs),
      Object.fromEntries(originalAttrs),
      label + ' complete existing wrapper attributes'
    );
  }
  else verifySelectComponentsDOMAttributes(actual, source, currentAttrs, originalAttrs, label);
  assert.equal(actual.styleAttribute, sourceStyle, label + '/styleAttribute');
  assert.equal(actual.cssText, sourceText, label + '/cssText');
  assert.deepEqual(
    actual.inlineProperties,
    sourceInline,
    label + ' complete authored inline declaration order'
  );
  for (const key of ['connected', 'text', 'css', 'box', 'geometryBoundary', 'caret', 'focused', 'metrics'] as const)
    assert.deepEqual(actual[key], source[key], label + '/' + key);
  if (source.tag.toLowerCase() === 'svg') {
    assert.equal(
      actual.html.replace(/<!--[\s\S]*?-->/g, ''),
      source.html,
      label + ' full SVG paths'
    );
  }
}
export function verifySelectComponentsModesPoint(actual: NativeModesPoint, source: ModesPoint, owner: ModesCase,
  sample: SelectComponentsModesSample, label: string,
  verifyExtraNode?: (
    actual: SelectComponentsModesNode,
    source: SelectComponentsModesNode,
    label: string
  ) => boolean): string[] {
  // Existing shared helper owns complete caller/provider/model/event graphs,
  // public focus spelling and component definition/context representation.
  const failures = verifySelectComponentsPoint(
    actual,
    source,
    owner as unknown as ComponentsCase,
    sample as never,
    label
  );
  const check = (name: string, work: () => void) => {
    try {
    work();
  }
  catch (error) {
    failures.push(label + '/' + name + ': ' + (error instanceof Error ? error.message : String(error)));
  }
  };
  const settings = decodeSelectSurface(source.owner.settings) as { disabled?: boolean };
  const disabled = settings.disabled === true;
  const compareCollection = (
    name: string,
    current: SelectComponentsModesNode[],
    original: SelectComponentsModesNode[]
  ) => {
    const seen = new Map<string, number>(), used = new Set<SelectComponentsModesNode>();
    for (const node of original) {
      const key = role(node, source.icons), ordinal = seen.get(key) ?? 0;
      seen.set(key, ordinal + 1);
      const candidates = current.filter(n => role(n, actual.icons) === key), match = candidates[ordinal];
      assert(match, label + '/' + name + ' physical Source role exists: ' + key + '/' + ordinal);
      used.add(match);
      const tag = has(node, 'ant-select-selection-item-remove') ? original.slice(
        0,
        original.indexOf(node)
      ).reverse()
        .find(n => has(n, 'ant-select-selection-item')) : undefined;
      const title = tag?.attributes.find(([key]) => key === 'title')?.[1];
      const nodeLabel = label + '/' + name + '/' + key + '/' + ordinal;
      if (!verifyExtraNode?.(match, node, nodeLabel)) {
        verifyNode(
          match,
          node,
          nodeLabel,
          disabled,
          title ? 'Удалить ' + title : undefined
        );
      }
    }
    for (const node of current) {
      if (!used.has(node)) {
        // An inherited wrapper around the default remove glyph has no Source
        // element counterpart. Its exact structure is asserted; all Source
        // ancestors/children/CSS/boxes are still compared above and retained raw.
        assert.equal(node.tag, 'SPAN');
        assert.deepEqual(classes(node), ['ant-select-selection-item-remove-icon']);
        assert.deepEqual(attributes(node), [['class', 'ant-select-selection-item-remove-icon']]);
        assert.equal(node.styleAttribute, null);
        assert.equal(node.cssText, '');
        assert.deepEqual(node.inlineProperties, []);
      }
    }
  };
  check('whole-root-computed-and-scroll', () => {
    assert(actual.icons.current.root && source.icons.current.root);
    assert.deepEqual(
      actual.icons.current.root.css,
      source.icons.current.root.css,
      'every root computed property'
    );
    assert.deepEqual(
      actual.icons.current.root.metrics,
      source.icons.current.root.metrics,
      'actual root scroll/client/offset metrics'
    );
  });
  check(
    'whole-root-layout',
    () => compareCollection('layout', actual.icons.layout, source.icons.layout)
  );
  check('all-physical-node-and-icon-fields', () => {
    const popupSource = selectComponentsModesPopupSource(source, owner);
    const expectedNodes = popupSource?.nodes ?? source.icons.nodes, expectedSVG = popupSource?.svg ?? source.icons.svg;
    const missingClosedPopup = !actual.icons.current.popup && source.icons.current.popup;
    if (missingClosedPopup) {
      // Existing conditional default Select popup lifetime, already recorded in
      // icon/surface tests. The complete Original popup stays in the fixture.
      assert.equal(source.owner.open, false);
      assert.equal(missingClosedPopup.css.display, 'none');
      assert.equal(actual.icons.popupCount, 0);
    }
    const sourcePopupNode = (node: SelectComponentsModesNode, svg = false) => Boolean(missingClosedPopup
      && (popupSource ? (svg ? popupSource.popupSVG : popupSource.popupNodes).has(node) : missingClosedPopup.html.includes(node.html)));
    const nodes: SelectComponentsModesNode[] = [], svg: SelectComponentsModesNode[] = [];
    for (const node of expectedNodes) {
      if (sourcePopupNode(node)) {
        assert(node.box && Object.values(node.box).every(value => value === 0));
      }
      else nodes.push(node);
    }
    for (const node of expectedSVG) {
      if (!sourcePopupNode(node, true)) svg.push(node);
    }
    compareCollection('nodes', actual.icons.nodes, nodes);
    compareCollection('svg', actual.icons.svg, svg);
  });
  check(
    'whole-editor-metrics',
    () => assert.deepEqual(
      actual.icons.current.editor?.metrics,
      source.icons.current.editor?.metrics
    )
  );
  check('public-refs', () => {
    // The existing public Native API exposes DOM through separate bindables,
    // while React includes nativeElement in the imperative handle itself.
    assert.deepEqual(
      source.icons.publicRefs.methods,
      { focus: 'function', blur: 'function', scrollTo: 'function', nativeElement: 'object' }
    );
    const native = actual.icons.publicRefs.methods;
    assert(native);
    for (const key of ['focus', 'blur', 'scrollTo']) {
      assert.equal(
        native[key],
        'function',
        label + ' strict public Native method'
      );
    }
    const framework: Record<string, string> = {
      $destroy: 'function',
      $on: 'function',
      $set: 'function',
      'Symbol(component)': 'boolean'
    };
    for (const [key, type] of Object.entries(native)) {
      if (!['focus', 'blur', 'scrollTo'].includes(key)) {
        // Svelte dev compiler adds legacy_api() throwing stubs, and pop() marks
        // the returned exports with COMPONENT_SYMBOL=true. Raw metadata remains.
        assert(Object.hasOwn(framework, key), label + ' only named Svelte export metadata');
        assert.equal(type, framework[key], label + '/' + key + ' exact framework typeof');
      }
    }
    assert.equal(source.icons.publicRefs.rootMatches, true);
    assert.equal(actual.icons.publicRefs.rootMatches, false);
    if (source.icons.publicRefs.authoredInput) {
      assert(actual.icons.publicRefs.authoredInput);
      assert.equal(
        actual.icons.publicRefs.authoredInput.identity,
        actual.icons.current.editor?.identity
      );
    }
    else assert.equal(actual.icons.publicRefs.authoredInput, null);
  });
  return failures;
}
