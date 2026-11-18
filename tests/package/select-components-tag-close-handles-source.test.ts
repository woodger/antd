import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { expect, it } from 'vitest';
import {
  readSelectTagCloseHandlesCSR, readSelectTagCloseHandlesSSR, readSelectTagCloseHandlesManifest,
  readSelectTagCloseHandlesCase, readSelectTagCloseHandlesSSRCase, readTagCloseHandleSourceInfo, readTagCloseHandleSourceArray,
  validateSelectTagCloseHandlesCSR, validateSelectTagCloseHandlesSSR, verifySelectTagCloseHandlesDecodedBytes,
  type TagCloseHandleProducerCall
} from '../browser/select-components-tag-close-handles-reference';

const csr = readSelectTagCloseHandlesCSR(), ssr = readSelectTagCloseHandlesSSR();
const kinds = (events: unknown[]) => events.map(event => readTagCloseHandleSourceArray(event)[0]);
const member = (value: unknown, key: string) => (value as { properties: Array<{ key: string; value: unknown }> }).properties.find(row => row.key === key)?.value;
const tagCall = (rest: boolean) => csr.cases[0].ledger.producerCalls.find(call => call.kind === 'tagRender' && readTagCloseHandleSourceInfo(call).isMaxTag === rest)!;

it('retains complete raw pairs, honest warnings, frozen provenance and unmeasured browser resources', () => {
  const manifest = readSelectTagCloseHandlesManifest();
  expect(manifest.sourceOnly).toBe(true); expect(manifest.NativeDataUsed).toBe(false);
  expect(manifest.preservation.frozenInputs).toBe(26); expect(manifest.preservation.oldReferences).toBe(1503);
  expect(manifest.preservation.wholeHistoricalStandTrees).toBe(12);
  expect(manifest.copies.csr.wholePairByteEqual).toBe(true); expect(manifest.copies.ssr.wholePairByteEqual).toBe(true);
  expect(manifest.copies.csr.provenance.first.sha256).toBe(manifest.copies.csr.provenance.repeat.sha256);
  expect(manifest.copies.ssr.provenance.first.sha256).toBe(manifest.copies.ssr.provenance.repeat.sha256);
  expect(manifest.serialization.fieldsDropped).toEqual([]); expect(manifest.serialization.rewrittenValues).toEqual([]);
  expect(manifest.serialization.normalizedSourceFields).toEqual([]);
  expect(csr.reference.errors).toEqual([]); expect(csr.reference.diagnostics).toHaveLength(1);
  expect(ssr.reference.errors).toEqual([]); expect(ssr.reference.diagnostics).toHaveLength(2);
  expect(manifest.resources.browserOwnedResourceCounters).toEqual({ measured: false, observers: null, mutations: null, frames: null, timers: null, ports: null });
  expect(manifest.preservation.historicalReports['select-components-own-style-production'].status).toBe('failed');
  expect(manifest.preservation.historicalReports['select-components-responsive-tag-prefix-keyboard-production-v2'].status).toBe('failed');
});

it('keeps every actual seven-key tag producer argument, descriptor and result info alias', () => {
  const keys = ['label', 'value', 'index', 'disabled', 'closable', 'onClose', 'isMaxTag'];
  expect(csr.cases.map(entry => entry.ledger.producerCalls.filter(call => call.kind === 'tagRender').length)).toEqual([67, 32]);
  for (const entry of csr.cases) for (const call of entry.ledger.producerCalls.filter(call => call.kind === 'tagRender')) {
    const info = readTagCloseHandleSourceInfo(call); expect(Object.keys(info)).toEqual(keys); expect(call.argumentOwnKeys).toEqual([keys]);
    expect(call.argumentCount).toBe(1);
    if (info.isMaxTag) for (const key of ['value', 'index', 'onClose']) expect(info[key]).toEqual({ $: 'undefined' });
    else expect(info.onClose).toMatchObject({ $: 'function', name: 'onClose' });
  }
});

it('records the supplied nonclosable callbacks removing option-disabled and root-disabled values', () => {
  const entry = csr.cases[0]; expect(readSelectTagCloseHandlesCase(entry.id)).toBe(entry);
  expect(entry.steps.map(step => readTagCloseHandleSourceArray(step.owner.model))).toEqual([
    ['a', 'b'], ['a', 'locked', 'b'], ['a', 'locked', 'b'], ['locked', 'b'], ['a', 'locked', 'b'], ['locked', 'b']
  ]);
  expect(entry.ledger.invocations.map(invocation => member(invocation.handle.info, 'closable'))).toEqual([false, false, true]);
  expect(entry.ledger.invocations.map(invocation => member(invocation.handle.info, 'disabled'))).toEqual([true, { $: 'undefined' }, { $: 'undefined' }]);
  expect(kinds(entry.ledger.events)).toEqual(Array.from({ length: 3 }, () => ['invoke-before', 'change', 'deselect', 'invoke-after']).flat());
  expect(entry.steps[1].owner.modelIdentity).toBe(entry.steps[2].owner.modelIdentity);
  expect(entry.steps[1].owner.optionsIdentity).toBe(entry.steps[2].owner.optionsIdentity);
});

it('retains the exact stale callback while resolving current deselect options without changing raw histories', () => {
  const entry = csr.cases[1], invocations = entry.ledger.invocations;
  expect(entry.setup?.actualButtonInvocations).toBe(1); expect(entry.callerButtonInvocations).toHaveLength(7);
  expect(entry.steps.map(step => readTagCloseHandleSourceArray(step.owner.model))).toEqual([['a', 'b'], ['a', 'b'], ['b'], ['b'], ['a', 'b'], ['a', 'b']]);
  expect(invocations.map(invocation => invocation.handle.sameCallbackAsLastProduced)).toEqual([false, true, true, false]);
  expect(invocations.map(invocation => invocation.handle.sameInfoAsLastProduced)).toEqual([false, true, true, false]);
  expect(invocations[1].handle.callbackIdentity).toBe(invocations[2].handle.callbackIdentity);
  expect(invocations[1].handle.callbackIdentity).toBe(invocations[3].handle.callbackIdentity);
  expect(invocations[1].handle.infoIdentity).toBe(invocations[2].handle.infoIdentity);
  expect(invocations[1].handle.infoIdentity).toBe(invocations[3].handle.infoIdentity);
  expect(member(invocations[0].handle.info, 'label')).toBe('Alpha old');
  const deselects = entry.ledger.events.filter(event => readTagCloseHandleSourceArray(event)[0] === 'deselect');
  expect(deselects).toHaveLength(4);
  for (const event of deselects) {
    const option = readTagCloseHandleSourceArray(event)[2]; expect(member(option, 'label')).toBe('Alpha updated'); expect(member(option, 'marker')).toBe('updated-a');
  }
  expect(kinds(entry.ledger.events)).toEqual(['invoke-before', 'deselect', 'invoke-after', 'invoke-before', 'change', 'deselect', 'invoke-after',
    'invoke-before', 'deselect', 'invoke-after', 'invoke-before', 'deselect', 'invoke-after']);
  for (const owner of csr.cases) for (const invocation of owner.ledger.invocations) {
    expect(invocation.actualArgumentCount).toBe(1); expect(readTagCloseHandleSourceArray(invocation.arguments)).toEqual([{ $: 'undefined' }]);
    expect(invocation.handle.callbackIsInfoOnClose).toBe(true); expect(invocation.result).toEqual({ $: 'undefined' }); expect(invocation.thrown).toBe(null);
  }
});

it('preserves physical Source refs, owned-only cleanup and exact whole late observations', () => {
  expect(csr.reference.actualCounts).toEqual({ owners: 2, actions: 12, logicalInitialAndActionPoints: 14, retentionSetupButtonInvocations: 1,
    totalCallerButtonInvocations: 13, uniqueInitialSSRStates: 0, initialSSRSerializations: 0 });
  for (const entry of csr.cases) {
    for (const point of [entry.initial, ...entry.steps]) {
      expect(point.dom.sameRoot).toBe(true); expect(point.dom.sameEditor).toBe(true); expect(point.dom.publicRootMatches).toBe(true);
      expect(point.dom.activeElement?.tag).toBe('BODY'); expect(point.owner.open).toBe(false);
    }
    expect(entry.cleanup.retainedConnected.filter(node => node.ownedAtFirstObservation).every(node => !node.connected)).toBe(true);
    expect(entry.cleanup.retainedConnected.some(node => !node.ownedAtFirstObservation && node.connected)).toBe(true);
    expect(entry.cleanup.owner.calls).toEqual(entry.ledger.producerCalls); expect(entry.cleanup.owner.rawEvents).toEqual(entry.ledger.rawEvents);
    expect(entry.late).toEqual(entry.cleanup);
  }
});

it('returns both actual DOM-free serializers with raw HTML, normal tags and no retained callback setup', () => {
  expect(ssr.reference.actualCounts.uniqueInitialSSRStates).toBe(2); expect(ssr.reference.actualCounts.initialSSRSerializations).toBe(4);
  for (const entry of ssr.cases) {
    expect(readSelectTagCloseHandlesSSRCase(entry.id)).toBe(entry);
    expect(Object.keys(entry.server.serializations)).toEqual(['renderToString', 'renderToStaticMarkup']);
    const string = entry.server.serializations.renderToString, markup = entry.server.serializations.renderToStaticMarkup;
    expect(string.rawHtml).toBe(markup.rawHtml); expect(string.state).toEqual(markup.state);
    expect(string.fatal).toBe(null); expect(string.domFree).toBe(true);
    expect(string.resources).toEqual({ timers: 0, frames: 0, measurements: 0, microtasks: 0, ports: 0 });
    expect(string.refs).toEqual({ control: true, root: true, editor: true }); expect(string.state.retention).toEqual([]);
    expect(string.state.invocations).toEqual([]); expect(string.state.events).toEqual([]);
    expect(string.state.calls.filter(call => call.kind === 'tagRender')).toHaveLength(entry.id === csr.cases[0].id ? 4 : 3);
  }
});

it('rejects changed provenance headers, partial actions, unknown owners and altered decoded bytes', () => {
  expect(() => readSelectTagCloseHandlesCase('not-measured')).toThrow(/Unknown/);
  expect(() => readSelectTagCloseHandlesSSRCase('not-measured')).toThrow(/Unknown/);
  expect(() => validateSelectTagCloseHandlesCSR({ ...csr, reference: { ...csr.reference, chromium: '156' } })).toThrow(/header/);
  expect(() => validateSelectTagCloseHandlesCSR({ ...csr, cases: [{ ...csr.cases[0], steps: [] }, csr.cases[1]] })).toThrow();
  const decoded = gunzipSync(readFileSync(new URL('../browser/fixtures/ant-design-select-components-tag-close-handles-ssr-reference.json.gz', import.meta.url)));
  expect(() => verifySelectTagCloseHandlesDecodedBytes(decoded, 'ssr')).not.toThrow();
  const changed = Buffer.from(decoded); changed[changed.length - 1] ^= 1;
  expect(() => verifySelectTagCloseHandlesDecodedBytes(changed, 'ssr')).toThrow(/SHA/);
  expect(() => verifySelectTagCloseHandlesDecodedBytes(decoded, 'hydrate' as never)).toThrow(/mode/);
});

it('rejects omitted own undefined, reordered descriptors, changed callback arity and broken result aliases', () => {
  const missing = structuredClone(tagCall(true)); missing.argumentOwnKeys![0].pop(); expect(() => readTagCloseHandleSourceInfo(missing)).toThrow();
  const reordered = structuredClone(tagCall(true)); reordered.argumentDescriptors![0].reverse(); expect(() => readTagCloseHandleSourceInfo(reordered)).toThrow();
  const arity = structuredClone(tagCall(false));
  const fn = arity.rawArgument.objects.find(node => node.type === 'function' && node.properties?.some(row => row.key === 'name' && row.value === 'onClose'))!;
  fn.properties!.find(row => row.key === 'length')!.value = 0; expect(() => readTagCloseHandleSourceInfo(arity)).toThrow(/arity/);
  const alias: TagCloseHandleProducerCall = structuredClone(tagCall(true));
  alias.rawResult.objects.find(node => node.properties?.some(row => row.key === 'info'))!.properties!.find(row => row.key === 'info')!.value = alias.rawResult.root;
  expect(() => readTagCloseHandleSourceInfo(alias)).toThrow(/alias/);
});

it('rejects changed raw invocation arguments, retained callback identity and actual SSR resources', () => {
  const owner = csr.cases[1], invocation = structuredClone(owner.ledger.invocations[0]); invocation.actualArgumentCount = 0;
  const altered = { ...owner, ledger: { ...owner.ledger, invocations: [invocation, ...owner.ledger.invocations.slice(1)] } };
  expect(() => validateSelectTagCloseHandlesCSR({ ...csr, cases: [csr.cases[0], altered] })).toThrow();
  const handle = structuredClone(owner.ledger.invocations[0]); handle.handle.rawCallback.root = { ref: -1 };
  expect(() => validateSelectTagCloseHandlesCSR({ ...csr, cases: [csr.cases[0], { ...owner,
    ledger: { ...owner.ledger, invocations: [handle, ...owner.ledger.invocations.slice(1)] } }] })).toThrow();
  const server = ssr.cases[0], string = server.server.serializations.renderToString;
  expect(() => validateSelectTagCloseHandlesSSR({ ...ssr, cases: [{ ...server, server: { ...server.server,
    serializations: { ...server.server.serializations, renderToString: { ...string, resources: { ...string.resources, ports: 1 } } } } }, ssr.cases[1]] })).toThrow();
});
