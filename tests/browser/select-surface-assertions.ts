import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import type { Page } from '@playwright/test';
import type { SelectSurfaceAction, SelectSurfaceSample } from './fixtures/select-surface-cases';
import { drainSelectSurface } from './select-surface-driver';
import { readSelectSurface } from './select-surface-metrics';
import { decodeSelectSurface, verifySelectSurfaceProducerCalls } from './select-surface-receipts';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';
import type { SelectSurfaceSnapshot, SelectSurfaceSourceCase } from './select-surface-reference';

export interface NativeSurfaceOwner {
  settings: unknown;
  model: unknown;
  open: boolean;
  events: unknown[];
  rawEvents: unknown[];
  calls: SelectSurfaceProducerCall[];
  alive: boolean;
  authoredProps: unknown;
  rawAuthoredProps: unknown;
  authoredProvider: unknown;
  rawAuthoredProvider: unknown;
}
export function readNativeSurfaceOwner() {
  const detail = {};
  document.querySelector('[data-surface-command]')!.dispatchEvent(new CustomEvent(
    'surfaceread',
    { detail }
  ));
  return detail as NativeSurfaceOwner;
}
export function readNativeSurfaceTopology() {
  const refs: { root?: HTMLElement; editor?: HTMLInputElement } = {};
  document.querySelector('[data-surface-command]')!.dispatchEvent(new CustomEvent(
    'surfacerefs',
    { detail: refs }
  ));
  const root = refs.root!;
  const outer = root.parentElement?.matches('.container') ? root.parentElement : root;
  // The retained Native AutoComplete popup is a child. Source's Portal is outside
  // the painted control. Keep the complete shared-reader text in the raw trace.
  const rootCopy = root.cloneNode(true) as HTMLElement;
  rootCopy.querySelectorAll('.ant-select-dropdown').forEach(node => node.remove());
  const editor = refs.editor, parent = editor?.parentElement;
  return { rootTextWithoutChildPopup: rootCopy.textContent,
    rootClasses: [...root.classList], outerClasses: [...outer.classList],
    outerHTML: outer.outerHTML, outerStyle: outer.getAttribute('style'),
    publicRootIsInner: outer !== root,
    rootHasEditor: Boolean(refs.editor && root.contains(refs.editor)),
    editorLayout: {
      nativeSelectInput: editor?.hasAttribute('data-ant-select-input') ?? false,
      nativeAutoCompleteInput: editor?.hasAttribute('data-ant-auto-complete-input') ?? false,
      directSelectContent: parent?.hasAttribute('data-ant-select-content') ?? false,
      directAutoCompleteContent: parent?.hasAttribute('data-ant-auto-complete-content') ?? false,
      parentDisplay: parent ? getComputedStyle(parent).display : null
    },
    hiddenFields: [...outer.querySelectorAll<HTMLInputElement>('input[type="hidden"]')]
      .map(input => ({ name: input.name, value: input.value, disabled: input.disabled })) };
}
export interface NativeSurfaceSnapshot {
  dom: ReturnType<typeof readSelectSurface>;
  owner: NativeSurfaceOwner;
  topology: ReturnType<typeof readNativeSurfaceTopology>;
}
export async function settleSelectSurface(page: Page): Promise<NativeSurfaceSnapshot> {
  let previous = '', stable = 0;
  for (let attempt = 0; attempt < 90; attempt++) {
    await drainSelectSurface(page);
    const dom = await page.evaluate(readSelectSurface);
    const owner = await page.evaluate(readNativeSurfaceOwner);
    const topology = await page.evaluate(readNativeSurfaceTopology);
    const actual = { dom, owner, topology };
    const key = JSON.stringify(actual);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) {
      return actual;
    }
    previous = key;
  }
  throw Error('Select surface DOM, owner and complete callback ledger did not settle');
}

type GraphValue = unknown;
interface GraphNode {
  id: number;
  type: string;
  array: boolean;
  authoredRole: unknown;
  ownProperties: Array<Record<string, unknown>>;
  properties: Array<{ key: unknown; value?: GraphValue; get?: GraphValue; set?: GraphValue }>;
}
interface Graph { root: GraphValue; objects: GraphNode[] }
function ref(value: unknown): number | undefined {
  return value !== null && typeof value === 'object' && 'ref' in value
    ? (value as { ref: number }).ref : undefined;
}

/** Raw callback graphs retain descriptor/order/alias checks, apart from rc's old props getter. */
export function verifySelectSurfaceEventGraph(
  actualValue: unknown,
  sourceValue: unknown,
  label: string
) {
  const actual = actualValue as Graph, source = sourceValue as Graph;
  const current = new Map(actual.objects.map(node => [node.id, node]));
  const original = new Map(source.objects.map(node => [node.id, node]));
  const pairs = new Map<number, number>(), reverse = new Map<number, number>();
  function walk(left: unknown, right: unknown) {
    const a = ref(left), b = ref(right);
    if (a === undefined || b === undefined) {
      assert.deepEqual(left, right, label);
      return;
    }
    if (pairs.has(a)) {
      assert.equal(pairs.get(a), b, `${label} raw alias`);
      return;
    }
    assert(!reverse.has(b), `${label} distinct raw identities`);
    pairs.set(a, b);
    reverse.set(b, a);
    const native = current.get(a)!, legacy = original.get(b)!;
    assert(native && legacy, `${label} complete raw graph`);
    assert.deepEqual({ type: native.type, array: native.array, authoredRole: native.authoredRole },
      { type: legacy.type, array: legacy.array, authoredRole: legacy.authoredRole }, label);
    const getter = legacy.ownProperties.find(property => property.key === 'props');
    if (getter) assert.deepEqual(getter, { key: 'props', enumerable: false, configurable: false,
      kind: 'accessor', get: true, set: false }, `${label} original deprecated getter`);
    const properties = legacy.properties.filter(property => !getter || property.key !== 'props');
    assert.deepEqual(native.ownProperties,
      legacy.ownProperties.filter(property => !getter || property.key !== 'props'), `${label} own descriptors`);
    assert.deepEqual(
      native.properties.map(property => property.key),
      properties.map(property => property.key),
      `${label} own key order`
    );
    for (const [index, property] of properties.entries()) {
      const other = native.properties[index];
      assert.equal(
        Object.hasOwn(other, 'value'),
        Object.hasOwn(property, 'value'),
        `${label} data/accessor property`
      );
      if (Object.hasOwn(property, 'value')) {
        walk(other.value, property.value);
      }
      else {
        walk(other.get, property.get);
        walk(other.set, property.set);
      }
    }
  }
  walk(actual.root, source.root);
  assert.equal(pairs.size, actual.objects.length, `${label} no unobserved Native graph nodes`);
}
export function selectSurfaceEventValue(value: unknown): unknown {
  if (!value || typeof value !== 'object') {
    return value;
  }
  const item = value as { $?: string; properties?: Array<{ key: unknown; accessor?: unknown }> };
  if (item.$ === 'object' && item.properties?.some(property => property.key === 'props' && property.accessor)) {
    value = { ...item, properties: item.properties.filter(property => property.key !== 'props') };
  }
  if (Array.isArray(value)) {
    return value.map(selectSurfaceEventValue);
  }
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, selectSurfaceEventValue(item)]));
}
export function verifySelectSurfaceEvents(
  actual: NativeSurfaceOwner,
  source: SelectSurfaceSourceCase,
  point: SelectSurfaceSnapshot,
  label: string
) {
  const events = source.events.slice(0, point.owner.eventCount);
  assert.deepEqual(
    actual.events.map(selectSurfaceEventValue),
    events.map(selectSurfaceEventValue),
    `${label} complete public callback ledger`
  );
  assert.equal(actual.rawEvents.length, point.owner.rawEventCount, `${label} every raw callback`);
  for (const [index, event] of actual.rawEvents.entries())
    verifySelectSurfaceEventGraph(event, source.rawEvents[index], `${label}/event${index}`);
}

function producerArgument(call: SelectSurfaceProducerCall, sample: SelectSurfaceSample) {
  const argument = decodeSelectSurface(call.argument) as { props?: Record<string, unknown> };
  if (call.kind === 'popupRender' || !argument.props) {
    return argument;
  }
  const props = { ...argument.props };
  if (Object.hasOwn(props, 'class')) {
    props.className = props.class;
    delete props.class;
  }
  if (sample.control === 'select') {
    if (props.value === undefined) delete props.value;
    if (props.open === undefined) delete props.open;
  }
  return { ...argument, props };
}
function sameInvocation(
  actual: SelectSurfaceProducerCall,
  original: SelectSurfaceProducerCall,
  sample: SelectSurfaceSample
) {
  return actual.kind === original.kind && actual.side === original.side
    && isDeepStrictEqual(producerArgument(actual, sample), producerArgument(original, sample))
    && isDeepStrictEqual(decodeSelectSurface(actual.result), decodeSelectSurface(original.result))
    && (actual.kind !== 'popupRender' || actual.sameResultAsArgument === original.sameResultAsArgument);
}
function settledSingleSelectionCall(
  original: SelectSurfaceProducerCall,
  actual: readonly SelectSurfaceProducerCall[],
  prefix: readonly SelectSurfaceProducerCall[],
  sample: SelectSurfaceSample,
  entry?: SelectSurfaceSourceCase
) {
  if (!entry || sample.control !== 'select' || sample.mode || original.side !== 'own'
    || !['classNames', 'styles'].includes(original.kind)) {
    return false;
  }
  const index = entry.producerCalls.indexOf(original);
  const argument = producerArgument(original, sample) as { props?: Record<string, unknown> };
  if (index < 0 || argument.props?.open !== true) {
    return false;
  }
  let previous = entry.initial;
  for (const point of entry.steps) {
    if (point.owner.callCount > prefix.length) break;
    if (point.action.type === 'choose' && index >= previous.owner.callCount && index < point.owner.callCount
      && previous.owner.open === true && point.owner.open === false) {
      const before = normalizedSelectSurfaceAuthoredProps(previous.owner.authoredProps);
      const after = normalizedSelectSurfaceAuthoredProps(point.owner.authoredProps);
      const value = decodeSelectSurface(point.owner.model);
      const events = entry.events.slice(previous.owner.eventCount, point.owner.eventCount)
        .map(event => decodeSelectSurface(event) as unknown[]);
      if (typeof before.value !== 'string' || before.open !== true || after.open !== false
        || !isDeepStrictEqual(after.value, value) || isDeepStrictEqual(before.value, value)
        || !isDeepStrictEqual(argument.props.value, value)
        || !isDeepStrictEqual(events.map(event => event[0]), ['change', 'select', 'open'])
        || !isDeepStrictEqual(events[0][1], value) || !isDeepStrictEqual(events[1][1], value)
        || events[2][1] !== false) {
        return false;
      }
      const settledArgument = { ...argument, props: { ...argument.props, open: false } };
      const settled = entry.producerCalls.slice(previous.owner.callCount, point.owner.callCount)
        .find(call => call.kind === original.kind && call.side === original.side
          && isDeepStrictEqual(producerArgument(call, sample), settledArgument)
          && isDeepStrictEqual(
            decodeSelectSurface(call.result),
            decodeSelectSurface(original.result)
          ));
      // React renders between controlled change and close. Svelte batches the pair;
      // the complete settled props/result receipt must still have executed.
      return Boolean(settled && actual.some(call => sameInvocation(call, settled, sample)));
    }
    previous = point;
  }
  return false;
}
/** CSR schedules may repeat pure passes; compare both complete semantic invocation sets. */
export function verifySelectSurfaceCSRCalls(
  actual: readonly SelectSurfaceProducerCall[],
  source: readonly SelectSurfaceProducerCall[],
  sample: SelectSurfaceSample,
  label: string,
  entry?: SelectSurfaceSourceCase
) {
  for (const call of actual) {
    const original = source.find(candidate => sameInvocation(call, candidate, sample));
    assert(
      original,
      `${label} Native ${call.kind}/${call.side} invocation belongs to the original prefix`
    );
    verifySelectSurfaceProducerCalls([call], [original], sample);
  }
  for (const original of source) assert(actual.some(call => sameInvocation(call, original, sample))
    || settledSingleSelectionCall(original, actual, source, sample, entry),
    `${label} original ${original.kind}/${original.side} semantic invocation was executed`);
}

type SurfaceNode = SelectSurfaceSnapshot['view']['slots'][string][number];
const legacyTags: Readonly<Record<string, readonly [string, string]>> = {
  suffix: ['DIV', 'SPAN'], itemRemove: ['SPAN', 'BUTTON'], 'popup.listItem': ['DIV', 'BUTTON']
};
const paintProperties = ['color', 'backgroundColor', 'fontSize', 'fontStyle', 'fontWeight', 'lineHeight',
  'visibility', 'opacity', 'height', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'borderTopColor', 'borderTopStyle', 'borderTopWidth', 'outlineStyle'] as const;
function attributes(node: SurfaceNode) { return Object.fromEntries(node.attributes); }
export function verifySelectSurfaceNode(
  actual: SurfaceNode,
  source: SurfaceNode,
  slot: string,
  sample: Pick<SelectSurfaceSample, 'control'> & Partial<Pick<SelectSurfaceSample, 'mode'>>,
  legacyClasses: readonly string[],
  label: string,
  authoredStyle: string,
  native?: { callerLabel?: unknown; inputLayout?: ReturnType<typeof readNativeSurfaceTopology>['editorLayout'];
    raw?: SelectSurfaceSnapshot['raw']['slots'][string][number] }
) {
  const mapped = legacyTags[slot];
  assert.equal(
    actual.tag,
    mapped && source.tag === mapped[0] ? mapped[1] : source.tag,
    `${label}/${slot} physical Native element`
  );
  const sourceClasses = slot === 'root' && sample.control === 'select'
    ? source.authoredClasses.filter(name => !legacyClasses.includes(name)) : source.authoredClasses;
  assert.deepEqual(
    [...actual.authoredClasses].sort(),
    [...sourceClasses].sort(),
    `${label}/${slot} every authored class`
  );
  const currentAttributes = attributes(actual), originalAttributes = attributes(source);
  if (slot === 'root' && sample.control === 'select') {
    assert.equal(currentAttributes.role, 'presentation', `${label} retained Native root role`);
    delete currentAttributes.role;
  }
  if (slot === 'item' && source.tag === 'SPAN' && actual.tag === 'SPAN'
    && originalAttributes.role === undefined && currentAttributes.role === 'presentation') {
    // The existing Native tag wrapper keeps its explicit presentational role.
    delete currentAttributes.role;
  }
  if (slot === 'popup.listItem' && currentAttributes.disabled === '') {
    assert.equal(originalAttributes['aria-disabled'], 'true', `${label} disabled native option`);
    delete currentAttributes.disabled;
  }
  if (slot === 'itemRemove' && source.tag === 'SPAN' && actual.tag === 'BUTTON') {
    // Existing Native removal remains a keyboard-accessible, labelled button.
    // Both original attributes and the complete actual attributes stay in trace.
    assert.equal(originalAttributes['aria-label'], undefined, `${label} original remove span`);
    assert.match(
      currentAttributes['aria-label'],
      /^Remove .+$/,
      `${label} retained labelled Native remove button`
    );
    delete currentAttributes['aria-label'];
  }
  if (slot === 'popup.root' && !Object.hasOwn(originalAttributes, 'aria-label') && typeof native?.callerLabel === 'string') {
    // The pre-existing Native wrapper and list retain the caller's own label.
    assert.equal(
      currentAttributes['aria-label'],
      native.callerLabel,
      `${label} retained caller-labelled Native popup`
    );
    delete currentAttributes['aria-label'];
  }
  const nativeAttributes = Object.fromEntries(native?.raw?.attributes ?? []);
  if (slot === 'extra' && actual.tag === 'DIV' && source.tag === 'DIV'
    && nativeAttributes.class?.split(/\s+/).includes('ant-select-item-empty')
    && originalAttributes.role === 'listbox' && currentAttributes.role === 'listbox'
    && originalAttributes['aria-label'] === undefined && typeof native?.callerLabel === 'string') {
    assert.equal(
      currentAttributes['aria-label'],
      native.callerLabel,
      `${label} retained caller-labelled empty Native listbox`
    );
    delete currentAttributes['aria-label'];
  }
  assert.deepEqual(currentAttributes, originalAttributes, `${label}/${slot} public attributes`);
  assert.deepEqual(actual.box, source.box, `${label}/${slot} actual geometry`);
  const nativePopover = slot === 'popup.root' && nativeAttributes.popover === 'manual'
    && nativeAttributes.class?.split(/\s+/).includes('popup');
  const hasAuthoredHeight = /(?:^|;)\s*height\s*:/i.test(authoredStyle);
  for (const property of paintProperties) {
    if (property === 'height' && nativePopover && !hasAuthoredHeight
      && source.css.display === 'none' && actual.css.display === 'none'
      && source.css.height === 'auto' && actual.css.height === 'fit-content'
      && Object.values(actual.box).every(value => value === 0)) {
      continue;
    }
    assert.equal(actual.css[property], source.css[property], `${label}/${slot} ${property}`);
  }
  // Existing Native root/option element defaults differ. An authored declaration
  // always remains operative and must match the original computed result.
  const nativeLayout = slot === 'popup.listItem' || (slot === 'root' && sample.control === 'select');
  const hasAuthoredDisplay = /(?:^|;)\s*display\s*:/i.test(authoredStyle);
  const hasAuthoredMinHeight = /(?:^|;)\s*min-height\s*:/i.test(authoredStyle);
  const oldFlexInput = slot === 'input' && actual.tag === 'INPUT' && native?.inputLayout?.parentDisplay === 'flex'
    && (sample.control === 'select'
      ? native.inputLayout.nativeSelectInput && native.inputLayout.directSelectContent
      : native.inputLayout.nativeAutoCompleteInput && native.inputLayout.directAutoCompleteContent);
  if (nativePopover && !hasAuthoredDisplay && source.css.display === 'block' && actual.css.display === 'flex') {
    // The old manual popover uses a flex column; physical boxes stay strict above.
    assert.equal(actual.css.display, 'flex', `${label} retained Native popup layout`);
  }
  else if (slot === 'suffix' && !hasAuthoredDisplay) {
    assert.equal(source.css.display, 'block', `${label} original suffix default`);
    assert.equal(actual.css.display, source.css.display, `${label} Source suffix content flow`);
  }
  else if (oldFlexInput && sample.control === 'select' && sample.mode && !hasAuthoredDisplay
    && source.css.display === 'inline-block' && actual.css.display === 'block') {
    // Old Native multiple/tags inputs are direct flex items; Source wraps them.
    assert.equal(actual.css.display, 'block', `${label} retained blockified Native input`);
  }
  else if (!nativeLayout || hasAuthoredDisplay) {
    assert.equal(actual.css.display, source.css.display, `${label}/${slot} display`);
  }
  const oldAbsolutePlaceholder = slot === 'placeholder' && sample.control === 'select'
    && Object.hasOwn(nativeAttributes, 'data-ant-select-placeholder');
  const oldNativeTag = slot === 'item' && actual.tag === 'SPAN' && source.tag === 'SPAN'
    && nativeAttributes.role === 'presentation'
    && Object.hasOwn(nativeAttributes, 'data-ant-select-selection-item');
  const oldNativeList = slot === 'popup.list' && actual.tag === 'DIV' && source.tag === 'DIV'
    && nativeAttributes.class?.split(/\s+/).includes('ant-select-dropdown-list');
  if (oldNativeList && !hasAuthoredMinHeight && source.css.minHeight === '0px' && actual.css.minHeight === 'auto') {
    assert.equal(actual.css.minHeight, 'auto', `${label} retained Native popup list minimum`);
  }
  else if (oldNativeTag && !hasAuthoredMinHeight && source.css.minHeight === '0px' && actual.css.minHeight === 'auto') {
    assert.equal(actual.css.minHeight, 'auto', `${label} retained Native flex tag minimum`);
  }
  else if (oldAbsolutePlaceholder && !hasAuthoredMinHeight && source.css.minHeight === 'auto' && actual.css.minHeight === '0px') {
    assert.equal(
      actual.css.minHeight,
      '0px',
      `${label} retained absolute Native placeholder minimum`
    );
  }
  else if (oldFlexInput && !hasAuthoredMinHeight && source.css.minHeight === '0px' && actual.css.minHeight === 'auto') {
    assert.equal(
      actual.css.minHeight,
      'auto',
      `${label} retained Native flex-input automatic minimum`
    );
  }
  else if (!nativeLayout || hasAuthoredMinHeight) {
    assert.equal(actual.css.minHeight, source.css.minHeight, `${label}/${slot} min-height`);
  }
  if (slot !== 'root') assert.equal(
    actual.text,
    source.text,
    `${label}/${slot} actual rendered content`
  );
}
/** Existing default Select removes its hidden popup; custom popupRender retains its DOM. */
export function nativeSelectPopupUnmounted(
  actual: ReturnType<typeof readSelectSurface>,
  source: ReturnType<typeof readSelectSurface>,
  control: 'select' | 'autocomplete',
  authored: Record<string, unknown>
) {
  const unmounted = control === 'select' && authored.popupRender === undefined
    && source.view.popup.present && !actual.view.popup.present;
  if (unmounted) {
    assert.equal(
      source.view.popup.visible,
      false,
      'Only a hidden Source popup has the old Native lifetime boundary'
    );
    assert.equal(actual.view.popup.visible, false, 'Unmounted default popup cannot be visible');
    assert.equal(actual.view.editor.expanded, 'false', 'Default Native editor is closed');
  }
  return unmounted;
}
export function normalizedSelectSurfaceAuthoredProps(value: unknown) {
  const props = { ...decodeSelectSurface(value) as Record<string, unknown> };
  delete props.ref;
  if (Object.hasOwn(props, 'class')) {
    props.className = props.class;
    delete props.class;
  }
  return props;
}
function normalizedProvider(value: unknown) {
  const provider = { ...decodeSelectSurface(value) as Record<string, unknown> };
  if (provider.select && typeof provider.select === 'object') {
    const select = { ...provider.select as Record<string, unknown> };
    if (Object.hasOwn(select, 'class')) {
      select.className = select.class;
      delete select.class;
    }
    provider.select = select;
  }
  if (provider.componentSize === 'medium') provider.componentSize = 'middle';
  return provider;
}

export function verifySelectSurfacePoint(
  actual: NativeSurfaceSnapshot,
  source: SelectSurfaceSnapshot & { action?: SelectSurfaceAction },
  entry: SelectSurfaceSourceCase,
  sample: SelectSurfaceSample,
  label: string,
  _initial: boolean
) {
  assert.equal(actual.owner.alive, true, `${label} mounted owner`);
  assert.deepEqual(
    decodeSelectSurface(actual.owner.settings),
    decodeSelectSurface(source.owner.settings),
    `${label} authored settings`
  );
  assert.deepEqual(actual.owner.model, source.owner.model, `${label} public owner model`);
  assert.equal(actual.owner.open, source.owner.open, `${label} public open owner`);
  assert.deepEqual(
    normalizedSelectSurfaceAuthoredProps(actual.owner.authoredProps),
    normalizedSelectSurfaceAuthoredProps(source.owner.authoredProps),
    `${label} authored public props`
  );
  assert.deepEqual(
    normalizedProvider(actual.owner.authoredProvider),
    normalizedProvider(source.owner.authoredProvider),
    `${label} authored provider`
  );
  verifySelectSurfaceEvents(actual.owner, entry, source, label);
  verifySelectSurfaceCSRCalls(
    actual.owner.calls,
    entry.producerCalls.slice(0, source.owner.callCount),
    sample,
    label,
    entry
  );
  const authored = normalizedSelectSurfaceAuthoredProps(source.owner.authoredProps);
  const unmountedPopup = nativeSelectPopupUnmounted(actual.dom, source, sample.control, authored);
  const legacyClasses = typeof authored.className === 'string' ? authored.className.split(/\s+/).filter(Boolean) : [];
  assert.equal(
    actual.topology.publicRootIsInner,
    sample.control === 'select',
    `${label} original public root ownership`
  );
  assert.equal(
    actual.topology.rootHasEditor,
    true,
    `${label} public editor belongs to public control`
  );
  for (const name of legacyClasses) assert(
    actual.topology.outerClasses.includes(name),
    `${label} legacy class ${name} on outer root`
  );
  assert.deepEqual(
    Object.keys(actual.dom.view.slots),
    Object.keys(source.view.slots),
    `${label} exact semantic slot schema`
  );
  for (const [slot, nodes] of Object.entries(source.view.slots)) {
    const current = actual.dom.view.slots[slot];
    if (unmountedPopup && slot.startsWith('popup.')) {
      assert.equal(current.length, 0, `${label}/${slot} old default popup unmounted`);
      continue;
    }
    assert.equal(current.length, nodes.length, `${label}/${slot} physical slot count`);
    for (const [index, node] of nodes.entries()) verifySelectSurfaceNode(current[index], node, slot, sample, legacyClasses,
      `${label}/${index}`, source.raw.slots[slot][index].attributes.find(([name]) => name === 'style')?.[1] ?? '',
      { callerLabel: Object.hasOwn(authored, 'aria-label') ? authored['aria-label'] : undefined,
        inputLayout: actual.topology.editorLayout, raw: actual.dom.raw.slots[slot][index] });
  }
  assert.equal(
    actual.topology.rootTextWithoutChildPopup,
    source.view.slots.root[0].text,
    `${label} painted root content without retained child popup`
  );
  assert.deepEqual({
    present: actual.dom.view.popup.present,
    visible: actual.dom.view.popup.visible
  },
    {
      present: unmountedPopup ? false : source.view.popup.present,
      visible: source.view.popup.visible
    }, `${label} actual lazy popup presence/visibility`);
  assert.equal(
    actual.dom.view.popup.extras.length,
    unmountedPopup ? 0 : source.view.popup.extras.length,
    `${label} every custom/empty/group popup node`
  );
  for (const [index, node] of (unmountedPopup ? [] : source.view.popup.extras).entries())
    verifySelectSurfaceNode(actual.dom.view.popup.extras[index], node, 'extra', sample, [], `${label}/extra${index}`,
      source.raw.extras[index].attributes.find(([name]) => name === 'style')?.[1] ?? '',
      { callerLabel: Object.hasOwn(authored, 'aria-label') ? authored['aria-label'] : undefined,
        raw: actual.dom.raw.extras[index] });
  assert.deepEqual(actual.dom.view.leaks, [], `${label} no leaked implementation props`);
  if (sample.id === 'select-surface-wrap' && source.action?.type === 'footer-key' && source.action.key === 'Tab') {
    // Native's existing descendant popup keeps natural document Tab order.
    // Source's body Portal ends that tab sequence at the body instead.
    assert.equal(source.view.focus, null, `${label} original Portal Tab exit`);
    assert.equal(actual.owner.open, false, `${label} Tab closes the owner`);
    assert.equal(actual.dom.view.focus, 'outside', `${label} natural Native Tab exit`);
  }
  else {
    assert.equal(actual.dom.view.focus, source.view.focus, `${label} real focus target`);
  }
  let editor = source.view.editor;
  if (sample.control === 'select' && !sample.mode && (editor.expanded === 'false' || editor.readonly)) {
    assert.equal(editor.value, '', `${label} original empty single search editor`);
    assert.deepEqual(editor.caret, [0, 0], `${label} original empty editor caret`);
    const labelText = source.view.slots.content[0]?.text ?? '';
    // The existing Native scalar editor/caret is independent of the rendered label layer.
    const model = decodeSelectSurface(source.owner.model);
    const text = typeof model === 'string' || typeof model === 'number' ? labelText : '';
    editor = { ...editor, value: text, caret: [text.length, text.length] };
  }
  assert.deepEqual(
    actual.dom.view.editor,
    editor,
    `${label} editor with bounded existing Native scalar contract`
  );
}
