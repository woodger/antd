import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import type { Page } from '@playwright/test';
import { drainSelectSurface } from './select-surface-driver';
import { verifySelectComponentsModesPoint } from './select-components-modes-assertions';
import { verifySelectComponentsACStylePoint, type NativeACStylePopupTopology } from './select-components-ac-style-assertions';
import type { NativeComponentsOwner } from './select-components-assertions';
import { verifySelectComponentsDOMAttributes } from './select-components-assertions';
import { verifyIconGraph } from './select-icons-assertions';
import type { OwnStyleDetails, OwnStyleNode, OwnStyleProperty, OwnStyleRefObservation } from './select-components-own-style-init-metrics.mjs';
import type { SelectComponentsModesDOM, SelectComponentsModesNode } from './select-components-modes-metrics.mjs';
import type { OwnStyleInitCase, OwnStyleInitPoint, OwnStyleInitObservation, SelectComponentsOwnStyleAction } from './select-components-own-style-init-reference';
import {
  comparableFlexAlignment,
  comparableSelectComponentCSS,
  verifySelectComponentMetrics
} from './select-components-layout-assertions';

export const ownStyleSSRMarker = 'data-ant-native-select-component-ssr';
export type OwnStyleBuildMode = 'development' | 'production';
interface RefRow { slot: 'input'; event: 'attach' | 'detach'; tag: string | null; observation: OwnStyleRefObservation | null }
export interface NativeOwnStyleOwner extends Omit<NativeComponentsOwner, 'componentObservations'> {
  componentObservations?: NativeComponentsOwner['componentObservations'];
  profile: 'same' | 'mismatch'; phase: string; rawSettings: unknown;
  authoredInputProps: unknown; inputOwnKeys: string[]; inputOwnDescriptors: unknown[]; inputHasOwnStyle: boolean;
  rawAuthoredInputProps: unknown; rawAuthoredInputStyle: unknown;
}
export interface NativeOwnStylePoint { icons: SelectComponentsModesDOM; details: OwnStyleDetails; owner: NativeOwnStyleOwner; popupTopology?: NativeACStylePopupTopology }

/** Retains the order of ordinary properties. The order of CSS-variables depends on the browser.
 * Equivalent values of align-items inside the flex are given to one entry.
 */
export function ownStyleComputedProperties(properties: readonly OwnStyleProperty[]) {
  const display = properties.find(property => property.name === 'display')?.value;
  const standard = properties.filter(property => !property.name.startsWith('--')).map(property => {
    if (property.name !== 'align-items') return property;
    const value = comparableFlexAlignment(property.value, display);
    return { ...property, value };
  });
  const custom = properties.filter(property => property.name.startsWith('--'));
  assert.equal(
    new Set(properties.map(property => property.name)).size,
    properties.length,
    'computed names are unique'
  );
  return { standard, custom: [...custom].sort((a, b) => a.name.localeCompare(b.name)) };
}
export function verifyOwnStyleComputed(
  actual: readonly OwnStyleProperty[],
  source: readonly OwnStyleProperty[],
  label: string
) {
  assert.deepEqual(
    ownStyleComputedProperties(actual),
    ownStyleComputedProperties(source),
    label + ' complete computed values and standard order'
  );
}
export const ownStyleThemeBoundary = 'preserved-native-default-light-and-removed-deprecated-seed-vars';
export const ownStyleNativePrivateBoundary = 'baseline-native-private-css-vars-with-source-token-alias-proof';
export const ownStyleNativeAliasNamesSha256 = '411d03cd8670664a348d163f71e0041b8ff60e2142d13c50da8a08028a77c7ea';
export function ownStyleNativeComputedBridge(
  actual: readonly OwnStyleProperty[],
  source: readonly OwnStyleProperty[],
  control: 'select' | 'autocomplete',
  label: string
) {
  const prefix = '--ant-svelte-theme-base-', aliases = actual.filter(property => property.name.startsWith(prefix));
  const names = aliases.map(property => property.name).sort();
  assert.equal(names.length, 379, label + ' exact existing Native base aliases count');
  assert.equal(
    createHash('sha256').update(JSON.stringify(names)).digest('hex'),
    ownStyleNativeAliasNamesSha256,
    label + ' exact frozen base alias keys'
  );
  for (const property of aliases) {
    assert.equal(
      source.some(original => original.name === property.name),
      false,
      label + ' alias is strictly Native-private'
    );
    const sourceName = '--' + property.name.slice(prefix.length), original = source.find(value => value.name === sourceName);
    assert(
      original,
      label + ' each Native base alias has its actual canonical Source field: ' + sourceName
    );
    assert.deepEqual(
      { value: property.value, priority: property.priority },
      { value: original.value, priority: original.priority },
      label + ' every private alias preserves Source value and priority'
    );
  }
  const extra: Record<string, string> = { '--ant-native-select-height': '32px', '--ant-native-select-color': 'rgba(0,0,0,0.88)', '--ant-rate-default-star-color': '#fadb14',
    ...(control === 'select' ? {
      '--ant-native-select-multi-item-height': '24px',
      '--ant-native-select-empty-input-gap': 'calc(calc(12px - 1px) - calc(calc((32px - 24px) / 2) - 2px - 1px) - 1px * 2)'
    } : {}) };
  for (const [name, value] of Object.entries(extra)) {
    assert.equal(
      source.some(property => property.name === name),
      false,
      label + ' exact baseline extra is absent in Source'
    );
    assert.deepEqual(
      actual.find(property => property.name === name),
      { name, value, priority: '' },
      label + ' exact existing Native extra value: ' + name
    );
  }
  // Source-known fields stay untouched; an unknown additional Native field is
  // retained here and will fail the complete computed-property comparison.
  return actual.filter(property => !names.includes(property.name) && !Object.hasOwn(
    extra,
    property.name
  ));
}
/** Baseline 780faf8 already exposes the Native default light scheme and omits
 * the two explicitly removed deprecated seed vars (design-tokens.md:109,
 * theme.css:6). This comparison view never changes either raw observation. */
export function verifyNativeOwnStyleComputed(
  actual: readonly OwnStyleProperty[],
  source: readonly OwnStyleProperty[],
  label: string,
  control?: 'select' | 'autocomplete'
) {
  if (control) actual = ownStyleNativeComputedBridge(actual, source, control, label);
  const deprecated = new Map([['--ant-pink', '#EB2F96'], ['--ant-control-tmp-outline', 'rgba(0,0,0,0.02)']]);
  const expected = source.filter(property => {
    if (!deprecated.has(property.name)) {
      return true;
    }
    assert.deepEqual(
      property,
      { name: property.name, value: deprecated.get(property.name), priority: '' },
      label + ' exact removed Source seed'
    );
    assert.equal(
      actual.some(current => current.name === property.name),
      false,
      label + ' deprecated Native seed remains absent'
    );
    return false;
  });
  const current = actual.map(property => {
    const original = expected.find(value => value.name === property.name);
    if (property.name === 'color-scheme' && property.value !== original?.value) {
      assert.deepEqual(
        property,
        { name: 'color-scheme', value: 'light', priority: '' },
        label + ' exact established Native light default'
      );
      assert.deepEqual(
        original,
        { name: 'color-scheme', value: 'normal', priority: '' },
        label + ' exact Source normal scheme'
      );
      return { ...property, value: 'normal' };
    }
    return property;
  });
  verifyOwnStyleComputed(current, expected, label);
}
const stableKey = (value: unknown) => JSON.stringify(value, (key, part) => key === 'computedProperties'
  && Array.isArray(part) ? ownStyleComputedProperties(part as OwnStyleProperty[]) : part);

/** Read only already-assigned identities; no author props or DOM are changed. */
export async function readNativeOwnStylePoint(page: Page): Promise<NativeOwnStylePoint> {
  return page.evaluate(() => {
    const observed = window.ownStyleProbe.observe!();
    const raw = window.raw as unknown as { current: { readRefs(): { root?: HTMLElement } };
      iconsObserver: { identities: WeakMap<Node, number> } };
    const root = raw.current.readRefs().root, popup = document.querySelector<HTMLElement>('.ant-select-dropdown');
    const identity = (node: Node | null | undefined) => node ? raw.iconsObserver.identities.get(node) ?? null : null;
    const popupTopology = { boundRootIdentity: identity(root), popup: popup ? {
      identity: identity(popup), parentIdentity: identity(popup.parentElement), parentIsPublicRoot: popup.parentElement === root,
      rootContainsPopup: Boolean(root?.contains(popup)), directChild: popup.parentNode === root,
      lastElementChild: root?.lastElementChild === popup, connected: popup.isConnected,
      rootChildIdentities: [...root?.children ?? []].map(identity), subtreeIdentities: [popup, ...popup.querySelectorAll('*')].map(identity),
      popoverAttribute: popup.getAttribute('popover'), popoverProperty: popup.popover,
      popoverOpen: popup.matches(':popover-open'), hidden: popup.hidden
    } : null };
    return { ...observed, popupTopology } as NativeOwnStylePoint;
  });
}
export async function settleNativeOwnStylePoint(page: Page): Promise<NativeOwnStylePoint> {
  let previous = '', stable = 0;
  for (let attempt = 0; attempt < 90; attempt++) {
    await drainSelectSurface(page);
    const point = await readNativeOwnStylePoint(page), key = stableKey(point);
    stable = previous === key ? stable + 1 : 0;
    if (stable >= 3) {
      return point;
    }
    previous = key;
  }
  throw Error('Actual own-style CSSOM, owner, refs and complete raw ledgers did not settle');
}
export async function actNativeOwnStyle(page: Page, action: SelectComponentsOwnStyleAction) {
  if (action.type === 'own-style-phase') {
    await page.evaluate(
      action => window.ownStyleProbe.flushUpdate!(action),
      action
    );
  }
  else if (action.type === 'fill') {
    const handle = await page.evaluateHandle(() => window.raw.current.readRefs().editor);
    const editor = handle.asElement();
    assert(editor, 'Actual public editor ref');
    try { await editor.fill(action.text); } finally { await handle.dispose(); }
  }
  else {
    throw Error('Unknown frozen own-style action ' + JSON.stringify(action));
  }
  await page.mouse.move(0, 0);
}
const compilerClass = (value: string) => /^(?:svelte-[\w-]+|s-[\w-]+)$/.test(value);
function attrs(values: string[][]) {
  return values.flatMap(([name, value]) => {
    if (name === 'class') value = value.split(/\s+/).filter(Boolean).filter(name => !compilerClass(name)).join(' ');
    return name === 'class' && !value ? [] : [[name, value]];
  });
}
function fieldAttributes(
  actual: OwnStyleNode | OwnStyleRefObservation,
  source: OwnStyleNode | OwnStyleRefObservation,
  label: string
) {
  // The inherited attribute comparator reads tag only from these records.
  verifySelectComponentsDOMAttributes(actual as unknown as SelectComponentsModesNode, source as unknown as SelectComponentsModesNode,
    attrs(actual.attributes), attrs(source.attributes), label);
}
export function verifyOwnStyleFirstRef(
  actualRows: readonly unknown[],
  sourceRows: readonly unknown[],
  label: string
) {
  const actual = actualRows as RefRow[], source = sourceRows as RefRow[];
  const first = source.find(row => row.event === 'attach');
  assert(first?.observation, label + ' actual Source first authored ref');
  assert.equal(
    actual.length,
    1,
    label + ' stable Native authored ref attaches once while this DOM survives'
  );
  assert.deepEqual(
    { ...actual[0], observation: undefined },
    { ...first, observation: undefined },
    label + ' same intrinsic callback kind'
  );
  const current = actual[0].observation, original = first.observation;
  assert(current);
  const refLabel = label + '/first-ref';
  for (const key of ['tag', 'connected', 'cssText', 'inlineProperties', 'styleAttribute', 'value',
    'defaultValue', 'box'] as const) {
    assert.deepEqual(current[key], original[key], refLabel + '/' + key);
  }
  verifySelectComponentMetrics(current.metrics, original.metrics, original.tag, refLabel + '/metrics');
  fieldAttributes(current, original, refLabel);
  verifyNativeOwnStyleComputed(
    current.computedProperties,
    original.computedProperties,
    refLabel,
    original.tag === 'INPUT' ? 'select' : 'autocomplete'
  );
}
function verifyPhysicalCSS(
  actual: OwnStyleNode,
  source: OwnStyleNode,
  label: string,
  editor = false
) {
  // Wrapper tags have already been checked against the rules for the specific Select or AutoComplete mode.
  for (const key of ['connected', 'namespaceURI', 'box', 'clientRects'] as const) {
    assert.deepEqual(actual[key], source[key], label + '/' + key);
  }
  assert.deepEqual(
    comparableSelectComponentCSS(actual.css),
    comparableSelectComponentCSS(source.css),
    label + '/css'
  );
  verifySelectComponentMetrics(actual.metrics, source.metrics, source.tag, label + '/metrics');
  if (editor) {
    assert.equal(actual.tag, source.tag, label + '/tag');
    verifyNativeOwnStyleComputed(
      actual.computedProperties,
      source.computedProperties,
      label,
      source.tag === 'INPUT' ? 'select' : 'autocomplete'
    );
    for (const key of ['cssText', 'styleAttribute', 'inlineProperties', 'text', 'value', 'defaultValue', 'selection', 'focused'] as const)
      assert.deepEqual(actual[key], source[key], label + '/' + key);
    fieldAttributes(actual, source, label);
  }
}
export const ownStyleParsedBoundary = 'source-cold-SSR-vs-native-preloaded-CSS-before-hydration';
export const ownStylePopupBoundary = 'preserved-native-default-popup-contour-and-fixed-top-layer';
const nodeClasses = (node: OwnStyleNode) => attrs(node.attributes).find(([name]) => name === 'class')?.[1].split(/\s+/) ?? [];
const elementChildren = (node: OwnStyleNode) => node.childNodes.filter(child => child.type === 1).map(child => child.identity);
export const ownStyleHydratedWrapperBoundary = 'svelte-SSR-opacity-one-content-item-style-serialization';
/** Only the inherited nonresponsive multiple wrapper's server style directive
 * serializes opacity:1 differently. Never applied to an authored editor/style. */
export function ownStyleHydratedWrapperIcons(
  actual: NativeOwnStylePoint,
  source: OwnStyleInitPoint,
  entry: OwnStyleInitCase,
  label: string
) {
  if (entry.entryPath === 'csr' || entry.sample.control !== 'select') {
    return actual.icons;
  }
  const candidates = source.icons.layout.filter(node => node.tag === 'DIV' && node.classes.includes('ant-select-content-item'));
  const ordinals = new Map<string, number>();
  const layout = actual.icons.layout.map(node => {
    if (node.tag !== 'DIV' || !node.classes.includes('ant-select-content-item')) {
      return node;
    }
    const role = node.classes.includes('ant-select-content-item-suffix') ? 'suffix' : 'item';
    const ordinal = ordinals.get(role) ?? 0;
    ordinals.set(role, ordinal + 1);
    const original = candidates.filter(value => value.classes.includes('ant-select-content-item-suffix') === (role === 'suffix'))[ordinal];
    assert(original, label + ' hydrated wrapper has the exact Source role/ordinal');
    if (node.styleAttribute === original.styleAttribute) {
      return node;
    }
    assert.notEqual(
      node.identity,
      actual.icons.current.editor?.identity,
      label + ' editor lexical style remains strict'
    );
    assert.notEqual(original.identity, source.icons.current.editor?.identity);
    assert.equal(original.styleAttribute, 'opacity:1');
    assert.equal(node.styleAttribute, 'opacity: 1;');
    assert.equal(original.cssText, 'opacity: 1;');
    assert.equal(node.cssText, original.cssText);
    assert.deepEqual(original.inlineProperties, [{ name: 'opacity', value: '1', priority: '' }]);
    assert.deepEqual(
      node.inlineProperties,
      original.inlineProperties,
      label + ' exact only declaration/value/order'
    );
    const attributes = node.attributes.map(([name, value]) => [name, name === 'style' ? original.styleAttribute! : value]);
    assert.equal(node.attributes.filter(([name]) => name === 'style').length, 1);
    assert.equal(original.attributes.filter(([name]) => name === 'style').length, 1);
    assert.deepEqual(
      attrs(attributes),
      attrs(original.attributes),
      label + ' every nonstyle attr and full order unchanged'
    );
    return { ...node, styleAttribute: original.styleAttribute, attributes };
  });
  assert.equal(
    [...ordinals.values()].reduce((sum, value) => sum + value, 0),
    candidates.length,
    label + ' every Source wrapper remains present'
  );
  return { ...actual.icons, layout };
}
/** Exact two-build class contract for these frozen ordinary popup owners.
 * Source remains its measured DEV build; only Native's explicitly selected
 * build prefix changes. No class, hash or class order is normalized. */
export function verifyOwnStylePopupClassNames(
  actual: readonly string[],
  source: readonly string[],
  control: 'select' | 'autocomplete',
  label: string,
  buildMode: OwnStyleBuildMode = 'development'
) {
  assert(
    buildMode === 'development' || buildMode === 'production',
    label + ' explicit measured Native build mode'
  );
  const sourceClasses = ['ant-select-dropdown', 'select-icons', 'ant-select-css-var', 'css-dev-only-do-not-override-1y106cm', 'ant-select-dropdown-placement-bottomLeft'];
  assert.deepEqual(source, sourceClasses, label + ' exact measured Source popup classes/order');
  // createDesignTokenState changes only this prefix between the two builds.
  const nativeHashClass = buildMode === 'development' ? 'css-dev-only-do-not-override-1y106cm' : 'css-1y106cm';
  const nativeClasses = control === 'select' ? ['popup', 'ant-select-dropdown', 'ant-select-css-var', 'ant-select-source-popup',
    'ant-select-dropdown-placement-bottomLeft', 'select-icons', nativeHashClass]
    : ['popup', 'ant-select-dropdown', 'ant-select-css-var', 'select-icons', nativeHashClass,
      'ant-select-source-popup', 'ant-select-dropdown-placement-bottomLeft'];
  assert.deepEqual(
    actual,
    nativeClasses,
    label + ' exact measured Native popup classes/order for ' + buildMode
  );
}
/** Only the two frozen ordinary owners' existing popup contour is covered.
 * The missing Source-only outer DIV has no invented Native node/identity.
 * Every remaining physical role, ordered attr, CSS property and box is checked. */
export function verifyOwnStylePopupContour(
  actual: NativeOwnStylePoint,
  source: OwnStyleInitPoint,
  control: 'select' | 'autocomplete',
  label: string,
  buildMode: OwnStyleBuildMode = 'development'
) {
  if (actual.details.popup || source.details.popup) {
    const topology = actual.popupTopology?.popup;
    assert(topology, label + ' actual read-only popup topology');
    assert.equal(topology.identity, actual.details.popup?.identity);
    assert.equal(topology.popoverAttribute, 'manual');
    assert.equal(topology.popoverProperty, 'manual');
    assert.equal(topology.popoverOpen, true);
    assert.equal(topology.hidden, false);
    assert.equal(topology.connected, true);
  }
  return verifyOwnStyleRecordedPopupContour(actual, source, control, label, buildMode);
}
/** Pure recorded DOM/CSS/layout comparison also supports the immutable pre-fix
 * captures, which did not measure :popover-open metadata. Live verification
 * always enters through verifyOwnStylePopupContour above. No metadata is inferred. */
export function verifyOwnStyleRecordedPopupContour(
  actual: NativeOwnStylePoint,
  source: OwnStyleInitPoint,
  control: 'select' | 'autocomplete',
  label: string,
  buildMode: OwnStyleBuildMode = 'development'
) {
  const pairs = new Map<number, number>(), projected = new Map<number, OwnStyleNode>();
  const a = actual.details.popup, b = source.details.popup;
  assert.equal(Boolean(a), Boolean(b), label + ' actual popup presence');
  if (!a || !b) {
    return { pairs, projected, sourceOnlyOuter: undefined };
  }
  assert.equal(source.owner.open, true);
  assert.equal(actual.owner.open, true);
  assert.equal(a.tag, 'DIV');
  assert.equal(b.tag, 'DIV');
  const sourceClasses = nodeClasses(b), nativeClasses = nodeClasses(a);
  verifyOwnStylePopupClassNames(nativeClasses, sourceClasses, control, label, buildMode);
  const nativeAttrs = control === 'select' ? [['data-ant-select-dropdown', 'true'], ['data-ant-select-prefix', 'ant-select'],
    ['data-ant-select-root-prefix', 'ant'], ['data-ant-select-component-popup', ''], ['data-ant-select-source-popup', 'true'],
    ['popover', 'manual'], ['dir', 'ltr'], ['class', nativeClasses.join(' ')], ['aria-label', 'Icon value']]
    : [['data-ant-select-prefix', 'ant-select'], ['data-ant-select-root-prefix', 'ant'], ['data-ant-auto-complete-source-popup', 'true'],
      ['popover', 'manual'], ['class', nativeClasses.join(' ')], ['dir', 'ltr'], ['aria-label', 'Icon value']];
  assert.deepEqual(
    attrs(a.attributes),
    [...nativeAttrs, ['style', a.cssText]],
    label + ' exact complete existing Native popup attrs/order'
  );
  assert.deepEqual(
    attrs(b.attributes),
    [['class', sourceClasses.join(' ')], ['style', b.cssText]],
    label + ' complete Source popup attrs/order'
  );
  const prop = (name: string, value: string, priority = '') => ({ name, value, priority });
  const px = (value: number) => value + 'px';
  assert.deepEqual(b.inlineProperties, [prop('--arrow-x', '140px'), prop('--arrow-y', '-2px'), prop(
    'left',
    px(b.box.x)
  ), prop(
    'top',
    px(b.box.y)
  ),
    prop('right', 'auto'), prop('bottom', 'auto'), prop('box-sizing', 'border-box'), prop(
      'width',
      px(b.box.width)
    )], label + ' exact generated Source positioning declarations');
  const tokens = a.inlineProperties.slice(0, 27);
  assert.equal(createHash('sha256').update(JSON.stringify(tokens.map(value => value.name))).digest('hex'),
    '8af881022faad0885cd0e1a903d827e44c7594743e1dbbbb1611d280c379f1ff', label + ' exact ordered existing 27 Native popup token names');
  for (const token of tokens) {
    assert.deepEqual(
      b.computedProperties.find(value => value.name === token.name),
      token,
      label + ' every Native token equals its actual Source value/priority'
    );
  }
  assert.deepEqual(a.inlineProperties.slice(27), [prop('width', px(b.box.width)), prop(
    control === 'select' ? '--ant-native-select-anchor-width' : '--ant-native-auto-complete-anchor-width',
    px(b.box.width)
  ),
    prop('left', '0px', 'important'), prop('top', '0px', 'important'), prop('--arrow-x', '140px'), prop(
      '--arrow-y',
      '-2px'
    ), prop(
      'position',
      'fixed',
      'important'
    ),
    prop('right', 'auto', 'important'), prop('bottom', 'auto', 'important'), ...['top', 'right', 'bottom', 'left'].map(side => prop(
      'margin-' + side,
      '0px',
      'important'
    )),
    ...['translate', 'rotate', 'scale', 'offset-path'].map(name => prop(name, 'none', 'important')), prop(
      'transform-origin',
      '0px 0px',
      'important'
    ),
    prop(
      'transform',
      `matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, ${b.box.x}, ${b.box.y}, 0, 1)`,
      'important'
    )], label + ' exact old top-layer controller declarations/order and real Source position');
  const rootCSS = { ...a.css };
  for (const [name, native, original] of [['display', 'flex', 'block'], ['position', 'fixed', 'absolute'], ['top', '0px', px(b.box.y)], ['left', '0px', px(b.box.x)],
    ...['overflow', 'overflowX', 'overflowY'].map(name => [name, 'visible', 'hidden'])]) {
    assert.equal(a.css[name], native, label + ' exact Native popup ' + name);
    assert.equal(b.css[name], original, label + ' exact Source popup ' + name);
    rootCSS[name] = b.css[name];
  }
  projected.set(b.identity, { ...a, css: rootCSS });
  pairs.set(b.identity, a.identity);
  const original = source.details.allPopupDescendants, current = actual.details.allPopupDescendants;
  assert.equal(
    original.length,
    control === 'select' ? 13 : 11,
    label + ' complete measured Source popup element count'
  );
  assert.equal(
    current.length,
    original.length - 1,
    label + ' exact one omitted Source-only wrapper'
  );
  const outer = original[0], originalList = original[1], nativeList = current[0];
  assert.equal(outer.tag, 'DIV');
  assert.deepEqual(outer.attributes, []);
  assert.deepEqual(outer.inlineProperties, []);
  assert.equal(outer.cssText, '');
  assert.equal(outer.styleAttribute, null);
  assert.deepEqual(
    outer.childNodes,
    [{ identity: originalList.identity, type: 1, name: 'DIV', text: null }],
    label + ' omitted Source DIV has one exact list child'
  );
  assert.deepEqual(nodeClasses(originalList), ['ant-select-dropdown-list']);
  assert.deepEqual(nodeClasses(nativeList), ['ant-select-dropdown-list']);
  assert.deepEqual(elementChildren(b), [outer.identity]);
  assert.deepEqual(
    elementChildren(a),
    [nativeList.identity],
    label + ' Native popup contains the real list directly'
  );
  for (const field of ['connected', 'namespaceURI', 'text', 'box', 'clientRects', 'metrics'] as const) {
    assert.deepEqual(
      outer[field],
      nativeList[field],
      label + ' omitted Source wrapper retains exact real list region/' + field
    );
  }
  const roles = (node: OwnStyleNode) => {
    const names = nodeClasses(node);
    if (names.length) {
      return names.join(' ');
    }
    return node.tag.toLowerCase() === 'svg' || node.tag.toLowerCase() === 'path' ? node.tag.toLowerCase() : 'anonymous-DIV';
  };
  const contour = original.slice(1);
  for (const [index, node] of contour.entries()) {
    const match = current[index], path = label + '/descendant' + index;
    assert.equal(roles(match), roles(node), path + ' exact concrete class role and ordinal');
    let left = attrs(match.attributes), expected = attrs(node.attributes), tag = node.tag, value = match.value;
    const names = nodeClasses(node), css = { ...match.css };
    if (names.includes('ant-select-dropdown-list')) {
      assert.equal(match.tag, 'DIV');
      assert.equal(node.tag, 'DIV');
      // The old list controller reflects an empty dir initially, removes it
      // in Select updates and appends it after style in AC updates. All three
      // exact archived forms preserve every Source attr and its relative order.
      const dirVariants = [expected, [expected[0], ['dir', ''], ...expected.slice(1)], [...expected, ['dir', '']]];
      assert(
        dirVariants.some(variant => isDeepStrictEqual(left, variant)),
        path + ' exact measured empty-dir lifecycle attrs'
      );
      left = expected;
      assert.equal(match.css.minWidth, 'auto');
      assert.equal(node.css.minWidth, '0px');
      css.minWidth = node.css.minWidth;
    }
    else if (names.includes('ant-select-dropdown-list-holder-inner')) {
      const style = expected.at(-1);
      assert.equal(style?.[0], 'style');
      assert.deepEqual(
        left,
        [...expected.slice(0, -1), ['aria-label', 'Icon value'], ...(control === 'select' ? [['aria-multiselectable', 'true']] : []), style!],
        path + ' exact Native listbox accessible attrs'
      );
      left = expected;
    }
    else if (names.includes('ant-select-item-option')) {
      assert.equal(node.tag, 'DIV');
      assert.equal(match.tag, 'BUTTON');
      const id = expected.find(([name]) => name === 'id')!;
      assert.equal(expected[0]?.[0], 'role');
      assert.equal(expected[1]?.[0], 'id');
      const native = control === 'select' ? [['type', 'button'], ['data-ant-select-item', 'true'], ['tabindex', '-1']]
        : [['data-ant-auto-complete-item', 'true'], ['data-ant-auto-complete-item-option', 'true'], ['type', 'button'], ['tabindex', '-1']];
      assert.deepEqual(
        left,
        [...native, id, expected[0], ...expected.slice(2)],
        path + ' exact Native semantic option attrs and order'
      );
      left = expected;
      assert.equal(match.value, '');
      assert.equal(node.value, null);
      value = null;
      if (control === 'autocomplete') {
        assert.equal(match.css.flex, '0 0 auto');
        assert.equal(node.css.flex, '0 1 auto');
        css.flex = node.css.flex;
      }
    }
    else if (names.includes('ant-select-item-option-content')) {
      assert.equal(node.tag, 'DIV');
      assert.equal(match.tag, 'SPAN');
      assert.deepEqual(expected, [['class', 'ant-select-item-option-content']]);
    }
    else {
      assert.equal(match.tag, node.tag, path + ' physical tag');
    }
    assert.deepEqual(left, expected, path + ' all complete ordered attrs');
    for (const field of ['styleAttribute', 'cssText', 'inlineProperties', 'text', 'defaultValue', 'selection', 'focused'] as const)
      assert.deepEqual(match[field], node[field], path + '/' + field);
    assert.equal(value, node.value, path + '/value');
    pairs.set(node.identity, match.identity);
    projected.set(node.identity, { ...match, tag, css });
  }
  for (const node of contour) {
    const match = current.find(value => value.identity === pairs.get(node.identity))!;
    assert.deepEqual(elementChildren(match), elementChildren(node).map(id => {
      const mapped = pairs.get(id);
      assert(mapped, label + ' every real Source child role is paired');
      return mapped;
    }), label + ' complete element child contour');
    verifyPhysicalCSS(
      projected.get(node.identity)!,
      node,
      label + '/complete-popup-role/' + node.identity
    );
  }
  verifyPhysicalCSS(projected.get(b.identity)!, b, label + '/complete-popup-root');
  return { pairs, projected, sourceOnlyOuter: outer.identity };
}
/** Compare existing Source DOM roles using the inherited Mode/AC comparators.
 * Numeric observer IDs are local graph identities, never cross-framework IDs.
 * Full original HTML/childNodes/ancestors remain in each raw attachment. */
export function verifyOwnStylePoint(
  actual: NativeOwnStylePoint,
  source: OwnStyleInitPoint,
  entry: OwnStyleInitCase,
  label: string,
  buildMode: OwnStyleBuildMode = 'development'
): string[] {
  const failures: string[] = [], pairs = new Map<number, number>();
  const check = (name: string, work: () => void) => {
    try {
    work();
  }
  catch (error) {
    failures.push(label + '/' + name + ': ' + String(error));
  }
  };
  const native = { ...actual, icons: ownStyleHydratedWrapperIcons(actual, source, entry, label),
    owner: { ...actual.owner, componentObservations: actual.owner.componentObservations ?? [] } };
  const pair = (
    current: SelectComponentsModesNode | null,
    original: SelectComponentsModesNode | null
  ) => {
    if (current && original) {
      const old = pairs.get(original.identity);
      assert(old === undefined || old === current.identity, label + ' consistent physical identity');
      pairs.set(original.identity, current.identity);
    }
  };
  pair(actual.icons.current.root, source.icons.current.root);
  pair(actual.icons.current.editor, source.icons.current.editor);
  pair(actual.icons.current.popup, source.icons.current.popup);
  if (entry.sample.control === 'select') {
    failures.push(...verifySelectComponentsModesPoint(native, source as never, entry as never, entry.sample as never, label,
      (current, original) => {
        pair(current, original);
        return false;
      }));
  }
  else {
    // Commit snapshots are captured in the ordinary owner itself. If no popup
    // exists, its already-observed presence/count/root ID fully proves topology.
    let topology = actual.popupTopology;
    if (!topology) {
      assert.equal(actual.icons.current.popup, null);
      assert.equal(actual.icons.popupCount, 0);
      topology = { boundRootIdentity: actual.icons.current.root?.identity ?? null, popup: null };
    }
    failures.push(...verifySelectComponentsACStylePoint(
      { ...native, popupTopology: topology },
      source as never,
      entry as never,
      entry.sample as never,
      label
    ));
    const excluded = new Set(topology.popup?.subtreeIdentities ?? []);
    const layout = actual.icons.layout.filter(node => !excluded.has(node.identity));
    for (const key of ['nodes', 'svg'] as const) {
      source.icons[key].forEach((node, index) => pair(
        actual.icons[key][index] ?? null,
        node
      ));
    }
    source.icons.layout.forEach((node, index) => pair(layout[index] ?? null, node));
  }
  let popupContour: ReturnType<typeof verifyOwnStylePopupContour> | undefined;
  check('exact-inherited-popup-contour', () => {
    popupContour = verifyOwnStylePopupContour(
      actual,
      source,
      entry.sample.control,
      label + '/default-popup',
      buildMode
    );
    for (const [sourceId, nativeId] of popupContour.pairs) {
      const old = pairs.get(sourceId);
      assert(
        old === undefined || old === nativeId,
        label + ' existing Source role keeps the same real Native identity'
      );
      pairs.set(sourceId, nativeId);
    }
  });
  check('raw-own-css-props', () => {
    for (const key of ['profile', 'phase', 'authoredInputProps', 'inputOwnKeys', 'inputOwnDescriptors', 'inputHasOwnStyle'] as const)
      assert.deepEqual(actual.owner[key], source.owner[key], label + '/' + key);
    for (const key of ['rawSettings', 'rawAuthoredInputProps', 'rawAuthoredInputStyle'] as const)
      verifyIconGraph(actual.owner[key], source.owner[key], label + '/' + key, []);
    assert.deepEqual(
      actual.owner.componentObservations ?? [],
      [],
      'Intrinsic descriptors expose no public Snippet context'
    );
    assert.deepEqual(entry.producerCalls, [], 'Source intrinsic has no function producers');
    assert.deepEqual(actual.owner.calls, []);
  });
  check(
    'first-authored-ref',
    () => verifyOwnStyleFirstRef(
      actual.owner.lifecycle,
      entry.lifecycle.slice(0, source.owner.lifecycleCount),
      label
    )
  );
  check('every-physical-source-role-full-css', () => {
    const all = [actual.details.root, ...actual.details.allRootDescendants, actual.details.popup, ...actual.details.allPopupDescendants].filter((node): node is OwnStyleNode => Boolean(node));
    const originals = [source.details.root, ...source.details.allRootDescendants, source.details.popup, ...source.details.allPopupDescendants].filter((node): node is OwnStyleNode => Boolean(node));
    for (const original of new Map(originals.map(node => [node.identity, node])).values()) {
      // This exact unstyled single-child Source wrapper was positively checked
      // above; Native has no corresponding node and receives no fabricated ID.
      if (popupContour?.sourceOnlyOuter === original.identity) continue;
      const id = pairs.get(original.identity), current = popupContour?.projected.get(original.identity) ?? all.find(node => node.identity === id);
      assert(
        current,
        label + ' every full Source element role is paired: ' + original.tag + '/' + original.identity
      );
      verifyPhysicalCSS(
        current,
        original,
        label + '/physical-' + original.tag + '/' + original.identity,
        original.identity === source.details.editor?.identity
      );
    }
  });
  check('hydration-real-DOM-identity', () => {
    const current = actual.details.hydration, original = source.details.hydration;
    assert(current && original);
    for (const key of ['kind', 'owner', 'root', 'editor', 'rootConnected', 'editorConnected'] as const) {
      assert.deepEqual(
        current[key],
        original[key],
        key
      );
    }
    assert.equal(current.root, true);
    assert.equal(current.editor, true);
    assert.equal(current.owner, true);
    assert(current.parsedEditor && original.parsedEditor);
    verifyPhysicalCSS(
      current.parsedEditor,
      original.parsedEditor,
      label + '/parsed-physical-editor',
      true
    );
  });
  return failures;
}
/** Parsed SSR has no public owner/ref handle yet. Compare the actual physical
 * parsed field; keep the standard-root wrapper representation inherited. */
export function verifyOwnStyleParsed(
  actual: OwnStyleInitObservation,
  source: OwnStyleInitObservation,
  label: string
) {
  assert.equal(
    actual.owner.ownerCommitted,
    false,
    label + ' CSS-phase boundary applies only before the Native owner exists'
  );
  assert.equal(
    source.owner.ownerCommitted,
    false,
    label + ' Source independently has no committed owner yet'
  );
  assert(actual.details.hydration && source.details.hydration);
  const a = actual.details.hydration, b = source.details.hydration;
  for (const key of ['kind', 'owner', 'root', 'editor', 'rootConnected', 'editorConnected'] as const) {
    assert.deepEqual(
      a[key],
      b[key],
      label + '/' + key
    );
  }
  assert(a.parsedEditor && b.parsedEditor);
  const current = a.parsedEditor, original = b.parsedEditor;
  // Original parsed/beforeHydration precedes Antd's client CSS insertion;
  // Native's ordinary public CSS module is already loaded. These two raw
  // stylesheet phases do not define a shared computed/layout oracle. The
  // authored inline DOM, native value/caret and real node identity stay exact.
  for (const key of ['connected', 'tag', 'namespaceURI', 'cssText', 'styleAttribute', 'inlineProperties', 'text',
    'value', 'defaultValue', 'selection', 'focused'] as const) {
    assert.deepEqual(
      current[key],
      original[key],
      label + '/parsed/' + key
    );
  }
  assert(['INPUT', 'TEXTAREA'].includes(current.tag), label + ' intrinsic parsed editor tag');
  fieldAttributes(current, original, label + '/parsed');
  assert.deepEqual(current.childNodes.map(({ identity: _identity, ...node }) => node),
    original.childNodes.map(({ identity: _identity, ...node }) => node), label + ' exact parsed field text/element topology');
  assert.equal(
    current.identity,
    actual.details.editor?.identity,
    label + ' current editor is the retained real parsed field'
  );
  assert.equal(
    original.identity,
    source.details.editor?.identity,
    label + ' Source independently retains its parsed field'
  );
}
