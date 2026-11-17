import assert from 'node:assert/strict';
import type { Page } from '@playwright/test';
import { readSelectIcons, type SelectIconNode, type SelectIconsDOM } from './select-icons-metrics.mjs';
import { readSelectIcons as readFlowIcons } from './select-components-flow-metrics.mjs';
import { drainSelectSurface } from './select-surface-driver';
import { decodeSelectSurface } from './select-surface-receipts';
import { normalizedSelectSurfaceAuthoredProps, selectSurfaceEventValue, verifySelectSurfaceEventGraph } from './select-surface-assertions';
import type { ComponentsCase, ComponentsPoint, SelectComponentsSample } from './select-components-reference';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';
import { verifySelectComponentsGraph, verifySelectComponentsProducers } from './select-components-producers';
import { verifyIconGraph, type IconNodeSpecification } from './select-icons-assertions';

export interface ComponentsObservation {
  slot: string; kind: string; context: unknown; rawContext: unknown; attributes: unknown; rawAttributes: unknown;
  own: Array<Record<string, unknown>>; register: unknown;
}
export interface NativeComponentsOwner {
  model: unknown; rawModel: unknown; open: boolean; query: string; settings: unknown;
  events: unknown[]; rawEvents: unknown[]; calls: SelectSurfaceProducerCall[]; lifecycle: unknown[]; bodyActivity: unknown[];
  componentObservations: ComponentsObservation[]; authoredProps: unknown; rawAuthoredProps: unknown;
  authoredProvider: unknown; rawAuthoredProvider: unknown; authoredInnerProvider: unknown; rawAuthoredInnerProvider: unknown;
  nodeSpecifications: IconNodeSpecification[];
  alive: boolean;
}
export interface NativeComponentsPoint {
  icons: SelectIconsDOM & { formData?: Array<[string, FormDataEntryValue]> | null };
  owner: NativeComponentsOwner;
}
export async function settleNativeSelectComponents(page: Page, flow: boolean): Promise<NativeComponentsPoint> {
  let previous = '', stable = 0;
  for (let index = 0; index < 90; index++) {
    await drainSelectSurface(page);
    const icons = await page.evaluate(flow ? readFlowIcons : readSelectIcons);
    const owner = await page.evaluate(() => {
      const detail = {} as { read?: () => NativeComponentsOwner };
      document.querySelector('[data-select-components-fixture-command]')!.dispatchEvent(new CustomEvent('selectcomponentscapture', { detail }));
      if (!detail.read) throw Error('Actual mounted component owner missing');
      return detail.read();
    });
    const point = { icons, owner }, key = JSON.stringify(point);
    stable = key === previous ? stable + 1 : 0;
    if (stable >= 3) return point;
    previous = key;
  }
  throw Error('Native component owner did not settle');
}
function compilerClass(name: string) { return /^(?:svelte-[\w-]+|s-[\w-]+)$/.test(name); }
function attrs(node: SelectIconNode) {
  return node.attributes.flatMap(([key, value]) => {
    if (key !== 'class') return [[key, value]];
    const classes = value.split(/\s+/).filter(Boolean).filter(name => !compilerClass(name));
    return classes.length ? [[key, classes.join(' ')]] : [];
  });
}
/** Svelte sets INPUT type before the spread's remaining attributes when value is present. */
export function verifySelectComponentsDOMAttributes(actual: SelectIconNode, source: SelectIconNode,
  current: string[][], original: string[][], label: string) {
  const sourceType = original.find(([key]) => key === 'type');
  const typeHoisted = actual.tag === 'INPUT' && source.tag === 'INPUT' && sourceType
    && original.some(([key]) => key === 'value') && current[0]?.[0] === 'type'
    && current[0]?.[1] === sourceType[1];
  // node_modules/svelte/src/internal/client/dom/elements/attributes.js:320-327.
  // All raw arrays remain recorded; only this proven DOM setter order differs.
  if (typeHoisted) {
    assert.deepEqual(current, [sourceType, ...original.filter(([key]) => key !== 'type')], label + ' exact Svelte INPUT type-first setter order');
  } else assert.deepEqual(current, original, label + ' complete intrinsic attribute order');
}
/** New custom editor/root DOM has no historical Native presentation boundary. */
export function verifySelectComponentsNode(actual: SelectIconNode | null, source: SelectIconNode | null, label: string) {
  assert.equal(Boolean(actual), Boolean(source), label + ' physical presence');
  if (!actual || !source) return;
  assert.equal(actual.tag, source.tag, label + ' tag');
  verifySelectComponentsDOMAttributes(actual, source, attrs(actual), attrs(source), label);
  for (const key of ['connected', 'text', 'css', 'box', 'geometryBoundary', 'value', 'caret', 'focused',
    'styleAttribute', 'cssText', 'inlineProperties'] as const) assert.deepEqual(actual[key], source[key], label + '/' + key);
}
const focusEvents = new Set(['public-focus', 'public-blur', 'origin-root-focus', 'origin-root-blur']);
/** Native root callbacks use bubbling focusin/out, React exposes focus/blur. */
function focusEvent(value: unknown) {
  const event = decodeSelectSurface(selectSurfaceEventValue(value));
  if (!Array.isArray(event) || !focusEvents.has(String(event[0])) || !event[1] || typeof event[1] !== 'object') return event;
  const info = event[1] as Record<string, unknown>;
  if (info.type !== 'focus' && info.type !== 'blur') return event;
  return [event[0], { ...info, type: info.type === 'focus' ? 'focusin' : 'focusout' }, ...event.slice(2)];
}
function sourceFocusGraph(value: unknown, encodedValue: unknown) {
  const event = decodeSelectSurface(encodedValue);
  if (!Array.isArray(event) || !focusEvents.has(String(event[0]))) return value;
  const graph = structuredClone(value) as { root: { ref: number }; objects: Array<{ id: number; properties: Array<{ key: unknown; value?: unknown }> }> };
  const root = graph.objects.find(n => n.id === graph.root.ref);
  const reference = root?.properties.find(p => p.key === '1')?.value as { ref?: number } | undefined;
  const payload = graph.objects.find(n => n.id === reference?.ref);
  const type = payload?.properties.find(p => p.key === 'type');
  assert(type && (type.value === 'focus' || type.value === 'blur'), 'only the exact Source projected focus payload qualifies');
  type.value = type.value === 'focus' ? 'focusin' : 'focusout';
  return graph;
}
const alias: Record<string, string> = { class: 'className', readonly: 'readOnly', tabindex: 'tabIndex', maxlength: 'maxLength',
  autofocus: 'autoFocus', autocomplete: 'autoComplete', oninput: 'onChange', onkeydown: 'onKeyDown', onkeyup: 'onKeyUp',
  onfocusin: 'onFocus', onfocusout: 'onBlur', onblur: 'onBlur', onclick: 'onClick', onpaste: 'onPaste',
  oncompositionstart: 'onCompositionStart', oncompositionend: 'onCompositionEnd' };
function fn(value: unknown) { return Boolean(value && typeof value === 'object' && '$' in value
  && (value.$ === 'function' || value.$ === 'authored')); }
function cssObject(value: unknown) {
  if (typeof value === 'string') return value.split(';').map(p => p.trim()).filter(Boolean).map(p => {
    const colon = p.indexOf(':'); return [p.slice(0, colon).trim(), p.slice(colon + 1).trim()];
  });
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([name, v]) => [
    name.startsWith('--') ? name : name.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()),
    typeof v === 'number' && !name.startsWith('--') && !['opacity', 'lineHeight', 'zIndex', 'flex'].includes(name) ? v + 'px' : String(v)
  ]);
}
export function verifySelectComponentsAttributes(observation: ComponentsObservation, sourceCall: ComponentsCase['producerCalls'][number], label: string) {
  const actualAttrs = decodeSelectSurface(observation.attributes) as Record<string, unknown>;
  const actual = Object.fromEntries(Object.entries(actualAttrs).map(([key, value]) => [alias[key] ?? key, value]));
  const source = (decodeSelectSurface(sourceCall.argument) as { props: Record<string, unknown> }).props;
  assert.deepEqual(Object.keys(actual), Object.keys(source), label + ' all mapped incoming keys and order');
  for (const [key, value] of Object.entries(source)) {
    if (fn(value)) { assert(fn(actual[key]), label + '/' + key + ' callable internal callback'); continue; }
    if (key === 'style') { assert.deepEqual(cssObject(actual[key]), cssObject(value), label + ' native style declaration representation'); continue; }
    assert.deepEqual(actual[key], value, label + '/' + key + ' complete input value');
  }
  const context = observation.rawContext as { root: { ref: number }; objects: Array<{ id: number; type: string; ownProperties: Array<Record<string, unknown>>; properties: Array<{ key: unknown; value: unknown }> }> };
  const root = context.objects.find(n => n.id === context.root.ref)!; assert(root, label + ' retained complete context root');
  assert.deepEqual(root.properties.map(p => p.key), ['attributes', 'register'], label + ' public context has exactly attributes/register');
  const register = observation.register as typeof context;
  assert.equal(register.objects.find(n => n.id === register.root.ref)?.type, 'function', label + ' genuine callable registration');
  const originalGraph = sourceCall.rawArgument as typeof context, originalRoot = originalGraph.objects.find(n => n.id === originalGraph.root.ref)!;
  const propsRef = originalRoot.properties.find(p => p.key === 'props')!.value as { ref: number };
  const originalProps = originalGraph.objects.find(n => n.id === propsRef.ref)!;
  const descriptors = observation.own.map(p => ({ ...p, key: alias[String(p.key)] ?? p.key,
    ...(p.key === 'style' ? { valueType: 'object' } : {}) }));
  assert.deepEqual(descriptors, originalProps.ownProperties, label + ' all incoming own descriptors/order with native style representation');
}
/** Pure rerenders may repeat; every Source call and every actual context remains covered. */
export function verifySelectComponentsObservations(actual: readonly ComponentsObservation[], source: readonly SelectSurfaceProducerCall[], label: string, ssr = false) {
  const sourceComponent = (call: SelectSurfaceProducerCall) => /^components\.(root|input)$/.test(call.kind);
  const matches = (observation: ComponentsObservation, call: SelectSurfaceProducerCall) => {
    const result = decodeSelectSurface(call.result) as { role?: { node?: string } };
    if (call.kind !== 'components.' + observation.slot || result.role?.node !== 'component-' + observation.slot + ':' + observation.kind + '-result') return false;
    try { verifySelectComponentsAttributes(observation, call, label); return true; } catch { return false; }
  };
  for (const call of source) if (sourceComponent(call))
    assert(actual.some(observation => matches(observation, call)), label + ' every whole Source component argument has an actual Snippet context');
  for (const observation of actual)
    assert(source.some(call => sourceComponent(call) && matches(observation, call)), label + ' every whole Native Snippet context belongs to a Source invocation');
  if (ssr) assert.equal(actual.length, source.reduce((count, call) => count + Number(sourceComponent(call)), 0), label + ' exact SSR component invocation count');
}
/** No source data is altered; every complete actual point stays in the attachment. */
export function verifySelectComponentsPoint(actual: NativeComponentsPoint, source: ComponentsPoint, owner: ComponentsCase,
  _sample: SelectComponentsSample, label: string): string[] {
  const failures: string[] = [];
  const check = (name: string, work: () => void) => { try { work(); } catch (error) { failures.push(label + '/' + name + ': ' + (error instanceof Error ? error.message : String(error))); } };
  check('owner', () => {
    assert.equal(actual.owner.alive, true);
    for (const key of ['model', 'open', 'query', 'settings'] as const) assert.deepEqual(actual.owner[key], source.owner[key], label + '/' + key);
    verifySelectSurfaceEventGraph(actual.owner.rawModel, source.owner.rawModel, label + ' full raw selected model');
    const a = normalizedSelectSurfaceAuthoredProps(actual.owner.authoredProps), b = normalizedSelectSurfaceAuthoredProps(source.owner.authoredProps);
    delete a.components; delete b.components;
    assert.deepEqual(a, b, label + ' all noncomponent caller fields');
    assert.deepEqual(actual.owner.authoredProvider, source.owner.authoredProvider);
    assert.deepEqual(actual.owner.authoredInnerProvider, source.owner.authoredInnerProvider);
    verifySelectComponentsGraph(actual.owner.rawAuthoredProps, source.owner.rawAuthoredProps, label + ' complete raw caller graph', actual.owner.nodeSpecifications, true);
    verifyIconGraph(actual.owner.rawAuthoredProvider, source.owner.rawAuthoredProvider, label + ' complete raw provider graph', actual.owner.nodeSpecifications);
    verifyIconGraph(actual.owner.rawAuthoredInnerProvider, source.owner.rawAuthoredInnerProvider, label + ' complete raw inner provider graph', actual.owner.nodeSpecifications);
  });
  check('all-pure-producers', () => verifySelectComponentsProducers(actual.owner.calls,
    owner.producerCalls.slice(0, source.owner.producerCount), label, actual.owner.nodeSpecifications));
  check('all-component-contexts', () => verifySelectComponentsObservations(actual.owner.componentObservations,
    owner.producerCalls.slice(0, source.owner.producerCount), label));
  check('events', () => {
    assert.deepEqual(actual.owner.events.map(focusEvent), owner.events.slice(0, source.owner.eventCount).map(focusEvent));
    assert.equal(actual.owner.rawEvents.length, source.owner.rawEventCount);
    // Every raw graph retains descriptors/order/aliases. Only the single type
    // scalar in the named root focus payload uses the native bubbling spelling.
    for (const [index, event] of actual.owner.rawEvents.entries())
      verifySelectSurfaceEventGraph(event, sourceFocusGraph(owner.rawEvents[index], owner.events[index]), label + '/raw-event' + index);
  });
  check('editor', () => verifySelectComponentsNode(actual.icons.current.editor, source.icons.current.editor, label + '/editor'));
  const settings = decodeSelectSurface(source.owner.settings) as { components: { slot: string; kind: string } };
  if (settings.components.slot === 'root') check('root', () => verifySelectComponentsNode(actual.icons.current.root, source.icons.current.root, label + '/root'));
  else check('retained-default-root-box', () => {
    assert.equal(actual.icons.current.root?.tag, source.icons.current.root?.tag);
    assert.deepEqual(actual.icons.current.root?.box, source.icons.current.root?.box);
  });
  if (settings.components.kind === 'function' || settings.components.kind.startsWith('composite')) check('mapped-component-props', () => {
    const call = owner.producerCalls.slice(0, source.owner.producerCount).findLast(call => call.kind === 'components.' + settings.components.slot);
    assert(call, label + ' actual Original component call exists');
    const observation = actual.owner.componentObservations.findLast(o => o.slot === settings.components.slot && o.kind === settings.components.kind);
    assert(observation, label + ' actual Native Snippet context exists');
    verifySelectComponentsAttributes(observation, call, label);
  });
  check('root-editor-identity', () => {
    for (const key of ['root', 'editor'] as const) assert.equal(actual.icons.sameAsOriginal[key], source.icons.sameAsOriginal[key], label + '/' + key);
  });
  check('form-data', () => { if ('formData' in source.icons) assert.deepEqual(actual.icons.formData, source.icons.formData); });
  check('suppressed-default-body', () => {
    if (settings.components.slot === 'root') { assert.equal(actual.icons.current.suffix, null); assert.equal(actual.icons.current.clear, null);
      assert.equal(actual.owner.bodyActivity.length, 0); }
    else if ('bodyActivity' in source.owner) assert.equal(actual.owner.bodyActivity.length > 0, Boolean(source.owner.bodyActivity?.length));
  });
  return failures;
}
