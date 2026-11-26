import assert from 'node:assert/strict';
import type { Page } from '@playwright/test';
import { readSelectIcons, type SelectComponentsACStyleDOM, type SelectComponentsACStyleNode } from './select-components-ac-style-metrics.mjs';
import { drainSelectSurface } from './select-surface-driver';
import { verifySelectComponentsDOMAttributes, verifySelectComponentsPoint, type NativeComponentsOwner } from './select-components-assertions';
import { verifyIconNode } from './select-icons-assertions';
import { verifySelectSurfaceNode } from './select-surface-assertions';
import { readAutoCompleteEditorHeightCase } from './auto-complete-editor-height-reference';
import type { ComponentsCase } from './select-components-reference';
import type { ACStyleCase, ACStylePoint, SelectComponentsACStyleSample } from './select-components-ac-style-reference';
import {
  comparableSelectComponentCSS,
  verifySelectComponentMetrics
} from './select-components-layout-assertions';
export interface NativeACStylePopupTopology {
  boundRootIdentity: number | null;
  popup: { identity: number | null; parentIdentity: number | null; parentIsPublicRoot: boolean;
    rootContainsPopup: boolean; directChild: boolean; lastElementChild: boolean; connected: boolean;
    rootChildIdentities: Array<number | null>; subtreeIdentities: Array<number | null>;
    popoverAttribute: string | null; popoverProperty: string | null; popoverOpen: boolean; hidden: HTMLElement['hidden'] } | null;
}
export interface NativeACStylePoint {
  icons: SelectComponentsACStyleDOM; owner: NativeComponentsOwner; popupTopology: NativeACStylePopupTopology;
}
export async function settleNativeSelectComponentsACStyle(page: Page): Promise<NativeACStylePoint> {
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
        throw Error('Actual AC style owner absent');
      }
      return detail.read();
    });
    const popupTopology = await page.evaluate(() => {
      const current = (globalThis as unknown as { raw: {
        current: { readRefs: () => { root?: HTMLElement } };
        iconsObserver: { identities: WeakMap<Node, number> };
      } }).raw;
      const root = current.current.readRefs().root;
      const popup = document.querySelector<HTMLElement>('.ant-select-dropdown');
      // The shared frozen reader already assigned every observed node identity.
      // This additional diagnostic reads that map without allocating identities.
      const identity = (node: Node | null | undefined) => node ? current.iconsObserver.identities.get(node) ?? null : null;
      return { boundRootIdentity: identity(root), popup: popup ? {
        identity: identity(popup), parentIdentity: identity(popup.parentElement),
        parentIsPublicRoot: popup.parentElement === root, rootContainsPopup: Boolean(root?.contains(popup)),
        directChild: popup.parentNode === root, lastElementChild: root?.lastElementChild === popup,
        connected: popup.isConnected, rootChildIdentities: [...root?.children ?? []].map(identity),
        subtreeIdentities: [popup, ...popup.querySelectorAll('*')].map(identity),
        popoverAttribute: popup.getAttribute('popover'), popoverProperty: popup.popover,
        popoverOpen: popup.matches(':popover-open'), hidden: popup.hidden
      } : null };
    });
    const point = { icons, owner, popupTopology }, next = JSON.stringify(point);
    stable = previous === next ? stable + 1 : 0;
    if (stable >= 3) {
      return point;
    }
    previous = next;
  }
  throw Error('Actual AC style owner/geometry/complete raw ledgers did not settle');
}
const compilerClass = (value: string) => /^(?:svelte-[\w-]+|s-[\w-]+)$/.test(value);
function attributes(node: SelectComponentsACStyleNode) {
  return node.attributes.flatMap(([key, value]) => {
    if (key !== 'class') {
      return [[key, value]];
    }
    const classes = value.split(/\s+/).filter(Boolean).filter(name => !compilerClass(name));
    return classes.length ? [[key, classes.join(' ')]] : [];
  });
}
function verifyLayoutNode(
  actual: SelectComponentsACStyleNode,
  source: SelectComponentsACStyleNode,
  label: string
) {
  let current = attributes(actual);
  const original = attributes(source);
  let expectedCss = source.css;
  if (source.classes.includes('ant-select-content')) {
    assert.equal(current.find(([name]) => name === 'data-ant-auto-complete-content')?.[1], 'true');
    current = current.filter(([name]) => name !== 'data-ant-auto-complete-content');
    assert.deepEqual(
      Object.fromEntries(current),
      Object.fromEntries(original),
      label + ' complete existing content wrapper attributes'
    );
    // CSS по умолчанию повторяет публичный styles.content.minHeight='1lh' эталона.
    const { lineHeight, minHeight } = readAutoCompleteEditorHeightCase('input-height-counterpart').before;
    assert.equal(source.css.lineHeight, lineHeight, label + ' content line height');
    expectedCss = { ...source.css, minHeight };
  }
  else if (source.classes.includes('ant-select-clear')) {
    // Reuse the unchanged inherited icon wrapper comparator: exact private
    // `clear` class only; authored styles and every computed field/box stay strict.
    verifyIconNode(
      actual,
      source,
      label,
      { control: 'autocomplete', legacyClear: false, rootDisabled: false, hiddenPopup: false }
    );
  }
  else {
    verifySelectComponentsDOMAttributes(actual, source, current, original, label);
  }
  assert.deepEqual(
    comparableSelectComponentCSS(actual.css),
    comparableSelectComponentCSS(expectedCss),
    label + '/css'
  );
  for (const key of ['tag', 'connected', 'text', 'styleAttribute', 'cssText', 'inlineProperties', 'box',
    'geometryBoundary', 'value', 'caret', 'focused'] as const) {
    assert.deepEqual(actual[key], source[key], label + '/' + key);
  }
  verifySelectComponentMetrics(actual.metrics, source.metrics, source.tag, label + '/metrics');
}
function surfaceRoot(node: SelectComponentsACStyleNode) {
  // This is the same public projection as readSelectSurface(). Private default
  // AC classes/data attributes already have an independent raw representation.
  return { tag: node.tag, text: node.text,
    authoredClasses: node.classes.filter(name => name.startsWith('surface-')),
    attributes: node.attributes.filter(([name]) => ['role', 'title', 'disabled', 'aria-label', 'aria-disabled', 'aria-selected', 'aria-expanded'].includes(name)),
    css: comparableSelectComponentCSS(node.css), box: node.box! };
}
function verifiedRootLayout(actual: NativeACStylePoint, source: ACStylePoint) {
  const topology = actual.popupTopology, popup = actual.icons.current.popup;
  assert.equal(
    topology.boundRootIdentity,
    actual.icons.current.root?.identity,
    'topology uses the real public root ref'
  );
  assert.equal(
    Boolean(topology.popup),
    Boolean(popup),
    'topology describes exactly the observed popup'
  );
  if (!popup) {
    return actual.icons.layout;
  }
  const current = topology.popup!;
  // Existing contract: AutoComplete.svelte renders componentPopup last inside
  // the default root; createPopupContainer preserves that parent unless an own
  // container is requested. Source portals outside the root. The same existing
  // boundary is documented in readNativeSurfaceTopology; all raw layout stays.
  assert.equal(actual.icons.popupCount, 1);
  assert.equal(current.identity, popup.identity);
  assert.equal(current.parentIdentity, topology.boundRootIdentity);
  assert.equal(current.parentIsPublicRoot, true);
  assert.equal(current.rootContainsPopup, true);
  assert.equal(current.directChild, true);
  assert.equal(current.lastElementChild, true);
  assert.equal(current.connected, true);
  assert.equal(current.rootChildIdentities.at(-1), popup.identity);
  assert.equal(current.popoverAttribute, 'manual');
  assert.equal(current.popoverProperty, 'manual');
  // popup.dom.ts hide()/update() explicitly synchronize these two states.
  assert.equal(typeof current.hidden, 'boolean');
  assert.equal(
    current.popoverOpen,
    !current.hidden,
    'retained popup has the established manual top-layer state'
  );
  const ids = current.subtreeIdentities;
  assert(
    ids.length > 0 && ids.every(id => typeof id === 'number' && Number.isInteger(id) && id > 0),
    'all popup subtree nodes already have observed identities'
  );
  const excluded = new Set(ids);
  assert.equal(excluded.size, ids.length, 'each physical popup descendant occurs once');
  assert.equal(ids[0], popup.identity);
  assert.deepEqual(actual.icons.layout.slice(-ids.length).map(node => node.identity), ids,
    'only the complete observed direct last-child popup subtree forms this raw root-layout suffix');
  assert.equal(actual.icons.layout.filter(node => excluded.has(node.identity)).length, ids.length);
  if (source.icons.current.popup) {
    assert.equal(source.icons.layout.some(node => node.identity === source.icons.current.popup!.identity), false,
      'the unchanged Original popup is outside its public root layout');
  }
  return actual.icons.layout.filter(node => !excluded.has(node.identity));
}
export function verifySelectComponentsACStylePoint(
  actual: NativeACStylePoint,
  source: ACStylePoint,
  owner: ACStyleCase,
  sample: SelectComponentsACStyleSample,
  label: string
): string[] {
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
  check('whole-root-computed-and-scroll', () => {
    const current = actual.icons.current.root, original = source.icons.current.root;
    assert(current && original);
    assert.deepEqual(
      comparableSelectComponentCSS(current.css),
      comparableSelectComponentCSS(original.css),
      label + ' every root computed property'
    );
    assert.deepEqual(
      current.metrics,
      original.metrics,
      label + ' actual root scroll/client/offset metrics'
    );
    verifySelectSurfaceNode(surfaceRoot(current), surfaceRoot(original), 'root', { control: 'autocomplete' }, [], label,
      original.styleAttribute ?? '');
  });
  check('whole-root-layout', () => {
    const layout = verifiedRootLayout(actual, source);
    assert.equal(
      layout.length,
      source.icons.layout.length,
      label + ' every physical control descendant outside the verified Native popup'
    );
    for (const [index, node] of source.icons.layout.entries()) {
      verifyLayoutNode(
        layout[index],
        node,
        label + '/layout' + index
      );
    }
  });
  check('all-editor-metrics', () => {
    const current = actual.icons.current.editor;
    const original = source.icons.current.editor;
    verifySelectComponentMetrics(current?.metrics, original?.metrics, original?.tag, label);
  });
  check('inherited-option-and-icon-nodes', () => {
    // The unchanged icon comparator already names AC's existing BUTTON and
    // popup flex annotations. The layout comparison checks the measured
    // AutoComplete minimum height alongside the other CSS properties.
    const boundary = { control: 'autocomplete' as const, legacyClear: false, rootDisabled: false,
      hiddenPopup: source.icons.current.popup?.css.display === 'none' };
    for (const key of ['nodes', 'svg'] as const) {
      assert.equal(
        actual.icons[key].length,
        source.icons[key].length,
        label + '/' + key + ' complete count'
      );
      for (const [index, node] of source.icons[key].entries()) {
        const current = actual.icons[key][index];
        if (node.identity === source.icons.current.editor?.identity) {
          verifyLayoutNode(
            current,
            node,
            label + '/' + key + index
          );
        }
        else {
          verifyIconNode(current, node, label + '/' + key + index, boundary);
          assert.deepEqual(current.metrics, node.metrics);
        }
      }
    }
    assert.equal(Boolean(actual.icons.current.popup), Boolean(source.icons.current.popup));
    if (source.icons.current.popup) {
      assert.deepEqual(
        actual.icons.current.popup?.box,
        source.icons.current.popup.box,
        label + ' popup anchor follows real root height'
      );
      assert.equal(
        actual.icons.current.popup?.css.display === 'none',
        source.icons.current.popup.css.display === 'none'
      );
    }
  });
  check('public-refs', () => {
    assert.deepEqual(
      source.icons.publicRefs.methods,
      { focus: 'function', blur: 'function', scrollTo: 'function', nativeElement: 'object' }
    );
    const native = actual.icons.publicRefs.methods;
    assert(native);
    for (const key of ['focus', 'blur', 'scrollTo']) assert.equal(native[key], 'function');
    const framework: Record<string, string> = {
      $destroy: 'function',
      $on: 'function',
      $set: 'function',
      'Symbol(component)': 'boolean'
    };
    for (const [key, value] of Object.entries(native)) {
      if (!['focus', 'blur', 'scrollTo'].includes(key)) {
        assert(Object.hasOwn(framework, key), label + ' only named Svelte public export metadata');
        assert.equal(value, framework[key]);
      }
    }
    assert.equal(source.icons.publicRefs.rootMatches, true);
    assert.equal(actual.icons.publicRefs.rootMatches, false);
    assert(actual.icons.publicRefs.authoredInput);
    assert.equal(
      actual.icons.publicRefs.authoredInput.identity,
      actual.icons.current.editor?.identity
    );
  });
  return failures;
}
