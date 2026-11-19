import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { expect, it } from 'vitest';
import {
  readSelectComponentsResponsiveTagPrefixManifest, readSelectComponentsResponsiveTagPrefixPairProof,
  readSelectComponentsResponsiveTagPrefixCSR, readSelectComponentsResponsiveTagPrefixSSR, readSelectComponentsResponsiveTagPrefixCase,
  validateResponsiveTagPrefixCSR, validateResponsiveTagPrefixSSR, readResponsiveTagPrefixSourceInfo,
  verifyResponsiveTagPrefixDecodedBytes, verifySelectComponentsResponsiveTagPrefixRepeatArchive,
  type ResponsiveTagPrefixProducerCall
} from '../browser/select-components-responsive-tag-prefix-reference';
import { selectCustomTagPrefixSamples } from '../browser/select-components-responsive-tag-prefix-cases.mjs';

const first = readSelectComponentsResponsiveTagPrefixCSR();
const ssr = readSelectComponentsResponsiveTagPrefixSSR();
const restCall = () => first.cases[0].ledger.producerCalls.find(call => call.kind === 'tagRender' && readResponsiveTagPrefixSourceInfo(call).isMaxTag)!;

it('preserves full Source captures and honest producer variance with exact frozen provenance', () => {
  const manifest = readSelectComponentsResponsiveTagPrefixManifest(), proof = readSelectComponentsResponsiveTagPrefixPairProof();

  expect(manifest.preservation).toEqual({
    frozenInputs: 22,
    oldReferences: 906,
    oldProductionStandTrees: 7,
    verifiedBeforeAndAfter: true
  });
  expect(manifest.serialization.fieldsDropped).toEqual([]);
  expect(manifest.serialization.rewrittenValues).toEqual([]);
  expect(manifest.serialization.normalizedSourceFields).toEqual([]);
  expect(manifest.repeatProof.CSRWholePairByteEqual).toBe(false);
  expect(manifest.repeatProof.SSRWholePairByteEqual).toBe(true);
  expect(manifest.independentlyCapturedRaw.csr.first.sha256).not.toBe(manifest.independentlyCapturedRaw.csr.repeat.sha256);
  expect(proof.completeDOMCSSOMBoxFocusSnapshotsEqual).toBe(20);
  expect(proof.cases.flatMap(entry => entry.points)).toHaveLength(20);
  expect(proof.cases.map(entry => [entry.producerAlignment.firstCount, entry.producerAlignment.repeatCount])).toEqual([[607, 619], [634, 646]]);
  expect(proof.cases.map(entry => [entry.producerAlignment.onlyFirst.length, entry.producerAlignment.onlyRepeat.length])).toEqual([[12, 24], [15, 27]]);
  for (const owner of proof.cases) for (const alignment of [owner.producerAlignment, owner.bodyAlignment])
    expect([...alignment.onlyFirst, ...alignment.onlyRepeat].every(row => row.hasCompleteEquivalentOtherSide)).toBe(true);
  expect(proof.rawGraphComparison.globalCrossRenderIdentityStabilityClaim).toBe(false);
  expect(proof.rawGraphComparison.allAllocatorIDsRetainedInOriginalFiles).toBe(true);
});

it('retains complete actions, physical ref observations, raw ledgers and late cleanup', () => {
  expect(first.cases.map(entry => entry.id)).toEqual(selectCustomTagPrefixSamples.map(sample => sample.id));
  expect(first.cases.reduce((sum, entry) => sum + entry.steps.length, 0)).toBe(18);
  expect(first.cases.reduce((sum, entry) => sum + 1 + entry.steps.length, 0)).toBe(20);
  for (const entry of first.cases) {
    expect(readSelectComponentsResponsiveTagPrefixCase(entry.id)).toBe(entry);
    expect(entry.ledger.rawEvents).toHaveLength(entry.ledger.events.length);
    expect(entry.cleanup.owner.calls).toEqual(entry.ledger.producerCalls);
    expect(entry.cleanup.owner.rawEvents).toEqual(entry.ledger.rawEvents);
    expect(entry.cleanup.owner.alive).toBe(false);
    expect(Object.values(entry.cleanup.refs).every(Boolean)).toBe(true);
    expect(entry.cleanup.retainedConnected.every(node => !node.connected)).toBe(true);
    expect(entry.late).toEqual(entry.cleanup);
    for (const point of [entry.initial, ...entry.steps]) {
      expect(point.icons.publicRefs.rootMatches).toBe(true);
      expect(point.icons.publicRefs.authoredInput!.identity).toBe(point.icons.current.editor!.identity);
      expect(point.customTagsPrefix.prefixTopology.overflowPrefixNodes).toEqual([]);
      expect(point.customTagsPrefix.browserOwnedResourceCounters.measured).toBe(false);
    }
  }
});

it('retains actual seven-key rest arguments, descriptors, own undefined and result aliases', () => {
  const keys = ['label', 'value', 'index', 'disabled', 'closable', 'onClose', 'isMaxTag'];
  for (const entry of first.cases) {
    const calls = entry.ledger.producerCalls.filter(call => call.kind === 'tagRender');
    expect(calls.length).toBeGreaterThan(200);
    let rests = 0;
    for (const call of calls) {
      const info = readResponsiveTagPrefixSourceInfo(call);
      expect(Object.keys(info)).toEqual(keys);
      expect(call.argumentOwnKeys).toEqual([keys]);
      if (info.isMaxTag) {
        rests++;
        expect(info.value).toEqual({ $: 'undefined' });
        expect(info.index).toEqual({ $: 'undefined' });
        expect(info.onClose).toEqual({ $: 'undefined' });
        expect(info.disabled).toBe(false);
        expect(info.closable).toBe(false);
      }
    }
    expect(rests).toBeGreaterThan(0);
  }
});

it('retains both real DOM-free serializers and their full raw HTML', () => {
  expect(ssr.cases).toHaveLength(2);
  expect(readSelectComponentsResponsiveTagPrefixSSR('repeat')).toBe(ssr);
  for (const entry of ssr.cases) {
    expect(Object.keys(entry.server.serializations)).toEqual(['renderToString', 'renderToStaticMarkup']);
    const string = entry.server.serializations.renderToString, markup = entry.server.serializations.renderToStaticMarkup;
    expect(string.rawHtml).toBe(markup.rawHtml);
    expect(string.state).toEqual(markup.state);
    expect(string.resources).toEqual({
      timers: 0,
      frames: 0,
      measurements: 0,
      microtasks: 0,
      ports: 0
    });
    expect(Object.values(string.refs).every(Boolean)).toBe(true);
    expect(string.state.lifecycle).toEqual([]);
    expect(string.state.calls.filter(call => call.kind === 'tagRender')).toHaveLength(1);
  }
});

it('verifies the complete independent repeat archives without replacing their measured contents', async () => {
  const csr = await verifySelectComponentsResponsiveTagPrefixRepeatArchive('csr');
  const server = await verifySelectComponentsResponsiveTagPrefixRepeatArchive('ssr');

  expect(csr.wholePairByteEqual).toBe(false);
  expect(csr.decodedBytes).toBe(149042948);
  expect(server.wholePairByteEqual).toBe(true);
  expect(server.decodedBytes).toBe(1709900);
});

it('rejects unknown Source modes, variants, owners and cross-variant decoded bytes', () => {
  expect(() => readSelectComponentsResponsiveTagPrefixCSR('invented' as never)).toThrow(/variant/);
  expect(() => readSelectComponentsResponsiveTagPrefixSSR('invented' as never)).toThrow(/variant/);
  expect(() => readSelectComponentsResponsiveTagPrefixCase('not-measured')).toThrow(/owner/);
  expect(() => verifyResponsiveTagPrefixDecodedBytes(new Uint8Array(), 'hydrate' as never, 'first')).toThrow(/mode/);
  expect(() => validateResponsiveTagPrefixCSR(first, 'repeat')).toThrow();
});

it('rejects a wrong complete Source header before processing cases', () => {
  expect(() => validateResponsiveTagPrefixCSR({
    ...first,
    reference: { ...first.reference, chromium: '156.0.8078.79' }
  })).toThrow(/header/);
  expect(() => validateResponsiveTagPrefixSSR({
    ...ssr,
    reference: { ...ssr.reference, node: 'v0.0.0' }
  })).toThrow(/header/);
  expect(() => validateResponsiveTagPrefixCSR({
    ...first,
    reference: { ...first.reference, mode: 'ssr' }
  })).toThrow(/header/);
});

it('rejects an incomplete action ledger and changed ordinary caller input', () => {
  const incomplete = { ...first.cases[0], steps: first.cases[0].steps.slice(0, -1) };

  expect(() => validateResponsiveTagPrefixCSR({ ...first, cases: [incomplete, first.cases[1]] })).toThrow();
  const wrongSample = {
    ...first.cases[0],
    sample: { ...first.cases[0].sample, mode: 'tags' as const }
  };

  expect(() => validateResponsiveTagPrefixCSR({ ...first, cases: [wrongSample, first.cases[1]] })).toThrow();
  const initial = first.cases[0].initial;
  const badRefs = { ...first.cases[0], initial: { ...initial, icons: { ...initial.icons,
    publicRefs: { ...initial.icons.publicRefs, rootMatches: false } } } };

  expect(() => validateResponsiveTagPrefixCSR({ ...first, cases: [badRefs, first.cases[1]] })).toThrow();
});

it('rejects omitted rest keys, reordered own keys and changed descriptors', () => {
  const omitted = structuredClone(restCall());
  omitted.argumentOwnKeys![0] = omitted.argumentOwnKeys![0].filter(key => key !== 'onClose');

  expect(() => readResponsiveTagPrefixSourceInfo(omitted)).toThrow();
  const reordered = structuredClone(restCall());
  reordered.argumentOwnKeys![0].reverse();

  expect(() => readResponsiveTagPrefixSourceInfo(reordered)).toThrow();
  const descriptor = structuredClone(restCall());
  descriptor.argumentDescriptors![0].find(item => item.key === 'onClose')!.valueType = 'function';

  expect(() => readResponsiveTagPrefixSourceInfo(descriptor)).toThrow();
  const rawKey = structuredClone(restCall());
  const info = rawKey.rawArgument.objects.find(node => node.properties?.map(item => item.key).join(',') === 'label,value,index,disabled,closable,onClose,isMaxTag')!;
  info.properties = info.properties!.filter(property => property.key !== 'value');

  expect(() => readResponsiveTagPrefixSourceInfo(rawKey)).toThrow();
});

it('rejects a changed argument/result object alias without fabricating a replacement ref', () => {
  const call: ResponsiveTagPrefixProducerCall = structuredClone(restCall());
  const props = call.rawResult.objects.find(node => node.properties?.some(property => property.key === 'info'))!;
  props.properties!.find(property => property.key === 'info')!.value = call.rawResult.root;

  expect(() => readResponsiveTagPrefixSourceInfo(call)).toThrow(/alias/);
});

it('rejects nonzero actual SSR resources and altered raw HTML', () => {
  const owner = ssr.cases[0], server = owner.server.serializations;
  const badResources = { ...owner, server: { ...owner.server, serializations: { ...server,
    renderToString: {
      ...server.renderToString,
      resources: { ...server.renderToString.resources, ports: 1 }
    } } } };

  expect(() => validateResponsiveTagPrefixSSR({ ...ssr, cases: [badResources, ssr.cases[1]] })).toThrow();
  const badHTML = { ...owner, server: { ...owner.server, serializations: { ...server,
    renderToStaticMarkup: {
      ...server.renderToStaticMarkup,
      rawHtml: server.renderToStaticMarkup.rawHtml + ' '
    } } } };

  expect(() => validateResponsiveTagPrefixSSR({ ...ssr, cases: [badHTML, ssr.cases[1]] })).toThrow();
});

it('rejects a changed decoded SHA even when the decoded length stays exact', () => {
  const bytes = gunzipSync(readFileSync(new URL(
    '../browser/fixtures/ant-design-select-components-responsive-tag-prefix-ssr-reference.json.gz',
    import.meta.url
  )));

  expect(() => verifyResponsiveTagPrefixDecodedBytes(bytes, 'ssr', 'first')).not.toThrow();
  const changed = Buffer.from(bytes);
  changed[changed.length - 1] ^= 1;

  expect(() => verifyResponsiveTagPrefixDecodedBytes(changed, 'ssr', 'first')).toThrow(/decoded SHA/);
});
