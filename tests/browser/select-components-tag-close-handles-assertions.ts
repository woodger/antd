import assert from 'node:assert/strict';
import { isDeepStrictEqual as same } from 'node:util';
import { decodeSelectSurface } from './select-surface-receipts';
import { normalizedSelectSurfaceAuthoredProps, selectSurfaceEventValue, verifySelectSurfaceEventGraph } from './select-surface-assertions';
import { verifyIconGraph } from './select-icons-assertions';
import { verifySelectComponentsAttributes, verifySelectComponentsDOMAttributes, type ComponentsObservation } from './select-components-assertions';
import { readSelectComponentsSSRFields } from './select-components-ssr-metrics';
import { readTagCloseHandleSourceInfo, type SourceCSRCase, type TagCloseHandleDOMNode, type TagCloseHandleSourcePoint,
  type TagCloseHandleSourceLedger, type TagCloseHandleSourceOwner, type TagCloseHandleRawGraph, type TagCloseHandleProducerCall } from './select-components-tag-close-handles-reference';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';
import type { SelectTagCloseHandleDOM } from './select-components-tag-close-handles-metrics.mjs';
import nativeBoundary from './fixtures/select-components-tag-close-handles-native-boundaries.json' with { type: 'json' };
export type Renderer = 'vite-hmr' | 'no-hmr';
export type NativeOwner = TagCloseHandleSourceOwner & { componentObservations: ComponentsObservation[] };
export type NativePoint = { dom: SelectTagCloseHandleDOM; owner: Omit<NativeOwner, 'events' | 'rawEvents' | 'calls' | 'invocations' | 'retention' | 'lifecycle' | 'bodyActivity' | 'componentObservations'> & {
  eventCount: number; rawEventCount: number; producerCount: number; invocationCount: number; retentionCount: number; lifecycleCount: number; bodyActivityCount: number; componentObservationCount: number } };
export type NativeLedger = TagCloseHandleSourceLedger & { componentObservations: ComponentsObservation[] };
const keys = ['label', 'value', 'index', 'disabled', 'closable', 'onClose', 'isMaxTag'];
const attr = (node: { attributes: string[][] }, name: string) => node.attributes.find(([key]) => key === name)?.[1];
const compiler = (name: string) => /^(?:svelte-[\w-]+|s-[\w-]+)$/.test(name);
const record = (value: unknown) => { assert(value && typeof value === 'object'); return value as Record<string, unknown>; };
const decode = (value: unknown) => decodeSelectSurface(value) as Record<string, unknown>;
const refId = (value: unknown) => { const id = record(value).ref; assert.equal(typeof id, 'number'); return id as number; };
const sourceInfo = (call: SelectSurfaceProducerCall) => readTagCloseHandleSourceInfo(call as TagCloseHandleProducerCall);
function rawNode(graph: TagCloseHandleRawGraph, reference: unknown) {
  const id = record(reference).ref; const node = graph.objects.find(node => node.id === id); assert(node); return node;
}
function rawProperty(graph: TagCloseHandleRawGraph, reference: unknown, key: string) {
  return rawNode(graph, reference).properties?.find(property => property.key === key)?.value;
}
export function verifyHandleFunction(graph: TagCloseHandleRawGraph, reference: unknown, label: string) {
  const node = rawNode(graph, reference); assert.equal(node.type, 'function');
  assert.deepEqual(node.properties?.map(property => property.key), ['length', 'name'], label + ' actual callback own keys');
  assert.equal(rawProperty(graph, reference, 'length'), 1); assert.equal(rawProperty(graph, reference, 'name'), 'onClose');
}
function callInfo(call: SelectSurfaceProducerCall) {
  const argumentsValue = record(call.argument), rows = argumentsValue.properties as Array<{ key: string; value: unknown }>;
  assert.deepEqual(rows.map(row => row.key), ['0', 'length']); assert.equal(rows[1].value, 1);
  const info = record(rows[0].value), fields = info.properties as Array<{ key: string; value: unknown }>;
  assert.deepEqual(fields.map(row => row.key), keys); assert.deepEqual(call.argumentOwnKeys, [keys]);
  return Object.fromEntries(fields.map(row => [row.key, row.value]));
}
/** Source creates unused ReactElements; an unmounted public Snippet is never
 * invoked with a fabricated private anchor. Every Source record remains raw. */
export function verifyUnusedRestDefinition(source: SourceCSRCase, calls: readonly SelectSurfaceProducerCall[],
  body: readonly { info: unknown; rawInfo: TagCloseHandleRawGraph }[], points = [source.initial, ...source.steps]) {
  assert(['select-close-handles-nonclosable', 'select-close-handles-retained', 'select-close-handles-cached-option'].includes(source.id));
  assert.equal(Object.hasOwn(normalizedSelectSurfaceAuthoredProps(source.initial.owner.authoredProps), 'maxTagCount'), false);
  assert(source.ledger.producerCalls.some(call => call.kind === 'tagRender' && !sourceInfo(call).isMaxTag));
  verifyTagCloseHandleBodyAliases(source.ledger.producerCalls, source.ledger.bodyActivity, 'Original body-info alias');
  const bodyIds = new Set(source.ledger.bodyActivity.map(row => refId(row.rawInfo.root)));
  const rest = source.ledger.producerCalls.filter(call => call.kind === 'tagRender' && sourceInfo(call).isMaxTag);
  assert(rest.length, 'Actual Source unused rest class must exist');
  for (const call of rest) {
    const info = sourceInfo(call); assert.equal(info.label, '+ 0 ...');
    const reference = rawProperty(call.rawArgument, call.rawArgument.root, '0');
    assert(!bodyIds.has(record(reference).ref as number), 'Exact unused info never reaches bodyActivity');
    assert(!source.ledger.producerCalls.some(row => row.kind === 'tagBody' && same(row.rawArgument.root, reference)));
  }
  for (const point of points) {
    assert.equal(Object.hasOwn(normalizedSelectSurfaceAuthoredProps(point.owner.authoredProps), 'maxTagCount'), false);
    assert(point.dom.tags.every(node => attr(node, 'data-handles-tag') !== 'undefined'), 'Unused Source rest has no DOM');
  }
  for (const call of calls.filter(call => call.kind === 'tagRender')) assert.equal(callInfo(call).isMaxTag, false, 'Native unbounded Snippet has no fake rest invocation');
  assert(body.every(row => decode(row.info).isMaxTag === false), 'Native has no fake rest body');
}
export function verifyNormalTagCalls(actual: readonly SelectSurfaceProducerCall[], originals: readonly SelectSurfaceProducerCall[], label: string) {
  const source = originals.filter(call => call.kind === 'tagRender').filter(call => !sourceInfo(call).isMaxTag);
  const current = actual.filter(call => call.kind === 'tagRender'); assert(source.length && current.length);
  const scalar = (info: Record<string, unknown>) => ['value', 'index', 'disabled', 'closable', 'isMaxTag'].map(key => [key, info[key]]);
  const matches = (call: SelectSurfaceProducerCall, other: SelectSurfaceProducerCall) => same(scalar(callInfo(call)), scalar(sourceInfo(other)));
  for (const call of current) {
    assert.equal(call.publicArgumentCount, 1); const info = callInfo(call); assert.equal(info.isMaxTag, false);
    const candidate = source.find(other => matches(call, other)); assert(candidate, label + ' complete normal field state belongs to actual Source');
    const own = call.argumentDescriptors as Array<Array<Record<string, unknown>>>, legacy = candidate.argumentDescriptors as Array<Array<Record<string, unknown>>>;
    assert.equal(own.length, 1); assert.deepEqual(own[0].map(row => row.key), keys);
    for (let index = 0; index < keys.length; index++) {
      if (index === 0) { assert.equal(own[0][index].valueType, 'function'); assert.equal(legacy[0][index].valueType, 'string');
        const { valueType: _a, ...a } = own[0][index], { valueType: _b, ...b } = legacy[0][index]; assert.deepEqual(a, b); }
      else assert.deepEqual(own[0][index], legacy[0][index]);
    }
    const graph = call.rawArgument as TagCloseHandleRawGraph, infoRef = rawProperty(graph, graph.root, '0');
    assert.deepEqual(rawNode(graph, infoRef).properties?.map(property => property.key), keys);
    assert.deepEqual(rawNode(graph, infoRef).ownProperties, own[0]);
    verifyHandleFunction(graph, rawProperty(graph, infoRef, 'onClose'), label);
    const result = record(call.result); assert.equal(result.$, 'authored'); assert.deepEqual(result.role, { node: 'handles-tag-result-' + info.value });
    const returned = rawNode(call.rawResult as TagCloseHandleRawGraph, (call.rawResult as TagCloseHandleRawGraph).root);
    assert.equal(returned.type, 'function'); assert.equal(returned.array, false); assert.deepEqual(returned.authoredRole, result.role);
  }
  for (const original of source) assert(current.some(call => matches(call, original)), label + ' every distinct normal Source invocation class represented');
}
function handleFields(value: unknown) {
  const handle = record(value); const info = record(handle.info), fields = info.properties as Array<{ key: string; value: unknown }>;
  assert.deepEqual(fields.map(row => row.key), keys); assert.equal(handle.callbackIsInfoOnClose, true);
  const graph = handle.rawInfo as TagCloseHandleRawGraph, callback = rawProperty(graph, graph.root, 'onClose');
  assert.deepEqual(callback, { ref: handle.callbackIdentity }); verifyHandleFunction(graph, callback, 'saved callback');
  assert.equal(refId(graph.root), handle.infoIdentity); assert.equal(refId((handle.rawCallback as TagCloseHandleRawGraph).root), handle.callbackIdentity);
  verifyHandleFunction(handle.rawCallback as TagCloseHandleRawGraph, (handle.rawCallback as TagCloseHandleRawGraph).root, 'saved standalone callback');
  const infoFields = Object.fromEntries(fields.filter(row => row.key !== 'label').map(row => [row.key, row.value]));
  return { ...Object.fromEntries(Object.entries(handle).filter(([key]) => !['infoIdentity', 'callbackIdentity', 'info', 'rawInfo', 'callback', 'rawCallback'].includes(key))), infoFields };
}
export function verifyTagCloseHandleOwner(actual: NativePoint['owner'], source: TagCloseHandleSourcePoint['owner'], label: string) {
  for (const key of ['model', 'options', 'disabled', 'open', 'alive', 'actionIndex', 'authoredSample', 'authoredProvider', 'eventCount', 'rawEventCount', 'invocationCount', 'retentionCount'] as const)
    assert.deepEqual(actual[key], source[key], label + '/' + key);
  for (const key of ['rawModel', 'rawOptions', 'rawAuthoredSample', 'rawAuthoredProvider'] as const) verifyIconGraph(actual[key], source[key], label + '/' + key);
  assert.deepEqual(normalizedSelectSurfaceAuthoredProps(actual.authoredProps), normalizedSelectSurfaceAuthoredProps(source.authoredProps));
  for (const key of ['lastProducedInvocableHandles', 'retainedHandles'] as const)
    assert.deepEqual(actual[key].map(handleFields), source[key].map(handleFields), label + '/' + key + ' exact flags/metadata; runtime IDs stay raw');
}
export function verifyTagCloseHandleLedger(actual: NativeLedger, source: SourceCSRCase, point: TagCloseHandleSourcePoint, label: string) {
  const original = source.ledger, calls = original.producerCalls.slice(0, point.owner.producerCount);
  assert.deepEqual(actual.events.map(selectSurfaceEventValue), original.events.slice(0, point.owner.eventCount).map(selectSurfaceEventValue));
  assert.equal(actual.rawEvents.length, point.owner.rawEventCount);
  actual.rawEvents.forEach((graph, index) => verifySelectSurfaceEventGraph(graph, original.rawEvents[index], label + '/event' + index));
  verifyNormalTagCalls(actual.producerCalls, calls, label);
  verifyTagCloseHandleBodyAliases(actual.producerCalls, actual.bodyActivity, label);
  verifyUnusedRestDefinition(source, actual.producerCalls, actual.bodyActivity);
  for (const observation of actual.componentObservations) assert(calls.filter(call => call.kind === 'components.input').some(call => {
    try { verifySelectComponentsAttributes(observation, call, label); return true; } catch { return false; }
  }), label + ' every actual complete public input context matches Source');
  for (const call of calls.filter(call => call.kind === 'components.input')) assert(actual.componentObservations.some(observation => {
    try { verifySelectComponentsAttributes(observation, call, label); return true; } catch { return false; }
  }), label + ' every distinct Source input context represented without React render counts');
  assert.equal(actual.invocations.length, point.owner.invocationCount);
  for (const [index, value] of actual.invocations.entries()) {
    const other = original.invocations[index];
    for (const key of ['actionIndex', 'id', 'reason', 'from', 'slot', 'actualArgumentCount', 'arguments', 'eventCountBefore', 'eventCountAfter', 'result', 'thrown'] as const) assert.deepEqual(value[key], other[key], label + '/invoke' + index + '/' + key);
    assert.equal(value.actualArgumentCount, 1); assert.deepEqual(value.result, { $: 'undefined' }); assert.equal(value.thrown, null);
    verifyIconGraph(value.rawArguments, other.rawArguments, label + ' actual one undefined argument'); verifyIconGraph(value.rawResult, other.rawResult, label + ' actual undefined result');
    assert.deepEqual(handleFields(value.handle), handleFields(other.handle));
  }
  assert.equal(actual.retention.length, point.owner.retentionCount);
  for (const [index, value] of actual.retention.entries()) {
    const other = original.retention[index]; const { handle: a, ...x } = value, { handle: b, ...y } = other;
    assert.deepEqual(x, y); assert.deepEqual(handleFields(a), handleFields(b));
  }
  for (const slot of actual.retention) {
    const saved = actual.invocations.filter(row => row.slot === slot.slot && row.from === 'retained');
    for (const row of saved) { assert.equal(row.handle.callbackIdentity, slot.handle.callbackIdentity); assert.equal(row.handle.infoIdentity, slot.handle.infoIdentity); }
  }
  for (const row of actual.bodyActivity) assert(calls.filter(call => call.kind === 'tagRender' && !sourceInfo(call).isMaxTag).some(call => {
    const a = decode(row.info), b = decode(sourceInfo(call)); return ['value', 'index', 'disabled', 'closable', 'isMaxTag'].every(key => same(a[key], b[key]));
  }), label + ' actual body belongs to a normal Source public info');
}
export function verifyTagCloseHandleBodyAliases(calls: readonly SelectSurfaceProducerCall[], body: readonly { info: unknown; rawInfo: TagCloseHandleRawGraph }[], label: string) {
  for (const row of body) {
    const matching = calls.filter(call => call.kind === 'tagRender' && same(rawProperty(call.rawArgument as TagCloseHandleRawGraph,
      (call.rawArgument as TagCloseHandleRawGraph).root, '0'), row.rawInfo.root));
    assert(matching.length, label + ' actual body receives the exact public tagRender info object, not a clone');
    const callback = rawProperty(row.rawInfo, row.rawInfo.root, 'onClose');
    for (const call of matching) {
      const graph = call.rawArgument as TagCloseHandleRawGraph, info = rawProperty(graph, graph.root, '0');
      assert.deepEqual(rawProperty(graph, info, 'onClose'), callback, label + ' actual body retains the same actual onClose alias');
    }
  }
}
export function verifyTagCloseHandleSelection(actual: TagCloseHandleDOMNode, source: TagCloseHandleDOMNode, label: string) {
  for (const node of [actual, source]) {
    assert.equal(node.tag, 'INPUT'); assert.equal(node.connected, true); assert.equal(node.focused, false);
    assert.equal(node.value, ''); assert.equal(node.defaultValue, '');
    for (const [key, value] of [['id', 'handles-field'], ['type', 'text'], ['value', ''], ['data-handles-editor', '']]) assert.equal(attr(node, key), value);
  }
  assert.deepEqual(source.selection, [0, 0, 'forward'], label); assert.deepEqual(actual.selection, [0, 0, 'none'], label);
}
export interface IdentityProof { pairs: Map<number, number>; reverse: Map<number, number>; previous?: { actual: NativePoint; source: TagCloseHandleSourcePoint } }
export const createTagCloseIdentityProof = (): IdentityProof => ({ pairs: new Map(), reverse: new Map() });
export function verifyTagCloseHandlePoint(actual: NativePoint, source: TagCloseHandleSourcePoint, label: string, renderer: Renderer,
  identities: IdentityProof) {
  const privateRootStyles = nativeBoundary.rootStyles;
  assert(renderer === 'vite-hmr' || renderer === 'no-hmr'); verifyTagCloseHandleOwner(actual.owner, source.owner, label);
  assert.equal(actual.dom.ownerCount, source.dom.ownerCount); assert.equal(actual.dom.popupCount, source.dom.popupCount);
  assert.equal(source.dom.publicRootMatches, true); assert.equal(actual.dom.publicRootMatches, false);
  assert(actual.dom.sameRoot && actual.dom.sameEditor && source.dom.sameRoot && source.dom.sameEditor);
  const a = actual.dom.allRootElements as TagCloseHandleDOMNode[], s = source.dom.allRootElements;
  assert.equal(a.length, s.length); const local = new Map<number, number>();
  s.forEach((node, index) => { const id = a[index].identity; if (identities.pairs.has(node.identity)) assert.equal(identities.pairs.get(node.identity), id);
    if (identities.reverse.has(id)) assert.equal(identities.reverse.get(id), node.identity); identities.pairs.set(node.identity, id); identities.reverse.set(id, node.identity); local.set(node.identity, id); });
  const scope = attr(a[0], 'class')!.split(/\s+/).find(compiler); assert(scope);
  const childShape = (child: TagCloseHandleDOMNode['childNodes'][number]) => ({ type: child.type, name: child.name, text: child.text });
  const comment = { type: 8, name: '#comment', text: null }, empty = { type: 3, name: '#text', text: '' };
  const elements = (node: TagCloseHandleDOMNode) => node.childNodes.filter(child => child.type === 1).map(childShape);
  const chars = (count: number, node: typeof comment | typeof empty) => Array.from({ length: count }, () => node);
  const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  for (const [index, node] of s.entries()) {
    const current = a[index], classes = attr(node, 'class')?.split(/\s+/) ?? [], has = (name: string) => classes.includes(name);
    const expectedTag = has('ant-select-suffix') ? 'SPAN' : node.tag; assert.equal(current.tag, expectedTag);
    let expected = node.attributes;
    if (index === 0) {
      assert.deepEqual(node.inlineProperties, [{ name: 'width', value: '100%', priority: '' }]); assert.equal(privateRootStyles.length, 31);
      assert.deepEqual(current.inlineProperties, [...privateRootStyles, ...node.inlineProperties]);
      const style = current.inlineProperties.map(row => row.name + ': ' + row.value + ';').join(' '); assert.equal(current.cssText, style); assert.equal(current.styleAttribute, style);
      const disabled = source.owner.disabled;
      assert.equal(attr(node, 'class'), ['ant-select', 'ant-select-outlined', 'handles-source', 'ant-select-css-var', 'css-dev-only-do-not-override-1y106cm', 'ant-select-multiple', 'ant-select-show-arrow', disabled && 'ant-select-disabled', 'ant-select-show-search'].filter(Boolean).join(' '));
      expected = [['data-ant-select-control', 'true'], ['data-ant-select-prefix', 'ant-select'], ['data-ant-select-root-prefix', 'ant'], ['data-ant-select-source-theme', 'true'], ['data-ant-select-multiple', 'true'], ['role', 'presentation'],
        ['class', ['ant-select', 'ant-select-css-var', 'ant-select-outlined', 'ant-select-show-arrow', 'ant-select-source-theme', 'ant-select-show-search', 'ant-select-multiple', disabled && 'ant-select-disabled', scope].filter(Boolean).join(' ')], ['style', style]];
    } else if (node.tag === 'SPAN' && node.attributes.length === 0) expected = [['class', scope], ['data-select-custom-tag', ''], ['role', 'presentation']];
    else if (has('ant-select-content')) expected = [['data-ant-select-content', 'true'], ['class', 'ant-select-content ' + scope]];
    else if (has('ant-select-content-item')) expected = node.attributes.map(([key, value]) => [key, key === 'class' ? value + ' ' + scope : value]);
    else if (has('ant-select-suffix')) expected = [['class', 'suffix ant-select-suffix ' + scope]];
    verifySelectComponentsDOMAttributes(current, node, current.attributes, expected, label + '/node' + index);
    if (index !== 0) for (const key of ['styleAttribute', 'cssText', 'inlineProperties'] as const) assert.deepEqual(current[key], node[key]);
    for (const key of ['connected', 'css', 'box', 'metrics', 'value', 'defaultValue', 'focused', 'textContent'] as const) assert.deepEqual(current[key], node[key], label + '/node' + index + '/' + key);
    if (node.tag === 'INPUT') { verifyTagCloseHandleSelection(current, node, label); for (const field of [current, node]) assert.deepEqual(readSelectComponentsSSRFields(field.html).fields[0].attributes, field.attributes); }
    else assert.deepEqual(current.selection, node.selection);
    if (local.has(node.parentIdentity!)) assert.equal(current.parentIdentity, local.get(node.parentIdentity!));
    assert.deepEqual(current.childNodes.filter(child => child.type === 1).map(child => child.identity), node.childNodes.filter(child => child.type === 1).map(child => local.get(child.identity)));
    let contour: ReturnType<typeof childShape>[] | undefined;
    const e = elements(current); const hmr: number = renderer === 'vite-hmr' ? 1 : 0;
    if (index === 0) contour = [comment, e[0], comment, e[1], comment, comment];
    else if (has('ant-select-content')) contour = [comment, ...e.slice(0, -1), comment, comment, e.at(-1)!];
    else if (node.tag === 'SPAN' && node.attributes.length === 0) contour = [...chars(3 + hmr, comment), e[0], ...chars(3 + hmr, empty), comment];
    else if (has('ant-select-content-item-suffix')) contour = [...chars(3, comment), e[0], ...chars(3, empty), comment];
    else if (has('ant-select-content-item')) contour = e;
    else if (has('ant-select-suffix')) contour = [...chars(3 + hmr, comment), e[0], ...chars(3 + hmr, empty), comment, comment];
    if (contour) assert.deepEqual(current.childNodes.map(childShape), contour, label + '/node' + index + ' exact compiler role topology');
    if (attr(node, 'data-handles-tag') !== undefined) {
      const text = node.textContent, comment = { type: 8, name: '#comment', text: null }, empty = { type: 3, name: '#text', text: '' };
      assert.deepEqual(node.childNodes.map(({ identity: _id, ...child }) => child), [{ type: 3, name: '#text', text }]);
      assert.deepEqual(current.childNodes.map(({ identity: _id, ...child }) => child), [...(renderer === 'vite-hmr' ? [comment] : []), comment, { type: 3, name: '#text', text }, empty, ...(renderer === 'vite-hmr' ? [empty] : []), comment]);
      const first = node.html.indexOf('>') + 1, last = node.html.lastIndexOf('</');
      assert.equal(current.html, node.html.slice(0, first) + '<!---->'.repeat(renderer === 'vite-hmr' ? 2 : 1) + node.html.slice(first, last) + '<!---->' + node.html.slice(last));
    } else if (['svg', 'path'].includes(node.tag.toLowerCase()) || has('anticon')) assert.equal(current.html, node.html);
    if (contour) {
      const first = current.html.indexOf('>') + 1, last = current.html.lastIndexOf('</'); assert(first > 0 && last >= first);
      const inside = current.childNodes.map(child => child.type === 8 ? '<!---->' : child.type === 3 ? escape(child.text!)
        : a.find(candidate => candidate.identity === child.identity)!.html).join('');
      assert.equal(current.html.slice(first, last), inside, label + ' full nested HTML plus exact empty compiler comments');
    }
  }
  assert.deepEqual(actual.dom.tags.map(node => attr(node, 'data-handles-tag')), source.dom.tags.map(node => attr(node, 'data-handles-tag')));
  assert.equal(actual.dom.buttons.length, source.dom.buttons.length);
  actual.dom.buttons.forEach((node, index) => { const { identity: _a, parentIdentity: _b, childNodes: ac, ...x } = node;
    const { identity: _c, parentIdentity: _d, childNodes: sc, ...y } = source.dom.buttons[index]; assert.deepEqual(x, y); assert.deepEqual(ac.map(({ identity: _id, ...c }) => c), sc.map(({ identity: _id, ...c }) => c)); });
  if (identities.previous) for (const key of ['modelIdentity', 'optionsIdentity'] as const)
    assert.equal(actual.owner[key] === identities.previous.actual.owner[key], source.owner[key] === identities.previous.source.owner[key]);
  identities.previous = { actual, source };
}
