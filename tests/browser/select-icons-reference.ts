import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { isDeepStrictEqual } from 'node:util';
import { selectIconSamples, type SelectIconAction, type SelectIconSettings, type SelectIconSample } from './select-icons-cases.mjs';
import type { SelectIconsDOM } from './select-icons-metrics.mjs';
import type { readSelectSurface } from './select-surface-metrics';
import type { readSelectSurfaceSSR } from './select-surface-ssr-metrics';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';

export interface IconOwner {
  model: unknown; rawModel: unknown; open: boolean; query: string; settings: unknown;
  authoredProps: unknown; rawAuthoredProps: unknown; authoredProvider: unknown; rawAuthoredProvider: unknown;
  authoredInnerProvider: unknown; rawAuthoredInnerProvider: unknown;
}
export interface IconPoint {
  dom: ReturnType<typeof readSelectSurface>; icons: SelectIconsDOM;
  owner: IconOwner & {
    eventCount: number;
    rawEventCount: number;
    producerCount: number;
    lifecycleCount: number
  };
}
export interface IconCase {
  id: string; initial: IconPoint; steps: Array<IconPoint & { action: SelectIconAction }>;
  events: unknown[]; rawEvents: unknown[]; producerCalls: SelectSurfaceProducerCall[]; lifecycle: unknown[];
  cleanup: { retainedConnected: Array<{ id: number; connected: boolean }>; popupCount: number; ownerCount: number;
    refs: Record<string, boolean>; events: unknown[]; rawEvents: unknown[]; producerCalls: SelectSurfaceProducerCall[];
    lifecycle: unknown[]; resources: SelectIconsDOM['resources'] };
  late: Pick<IconCase['cleanup'], 'events' | 'rawEvents' | 'producerCalls' | 'lifecycle'>;
}
export interface IconSSRState {
  name: string; state: IconOwner & {
    events: unknown[];
    rawEvents: unknown[];
    calls: SelectSurfaceProducerCall[];
    lifecycle: unknown[]
  };
  view: ReturnType<typeof readSelectSurfaceSSR>; resources: {
    timers: number;
    frames: number;
    microtasks: number;
    measurements: number
  };
  rawHtml: string; htmlSha256: string;
}
interface Header {
  axis: string; mode: string; version: string; react: string; revision: string; protocolSha256: string;
  preservedReferences: number; errors: unknown[]; diagnostics: unknown[]; inputPins: Record<string, string>;
  archives: Array<{ sha256: string; archiveSha256: string; byteEqual: boolean }>;
}
interface Source<Value> { reference: Header; cases: Value[] }
interface Copy { source: string; path: string; decodedBytes: number; decodedSha256: string; storageBytes: number; storageSha256: string }
const fixture = (name: string) => new URL('./fixtures/' + name, import.meta.url);
const hash = (value: Uint8Array | string) => createHash('sha256').update(value).digest('hex');
const manifest = JSON.parse(readFileSync(
  fixture('ant-design-select-icons-source-manifest.json'),
  'utf8'
)) as
  { status: string; sourceOnly: boolean; allRawSourcesUnchanged: boolean; copies: Copy[] };
assert.equal(manifest.status, 'passed');
assert.equal(manifest.sourceOnly, true);
assert.equal(manifest.allRawSourcesUnchanged, true);
assert.equal(manifest.copies.length, 9); // The separate components and flow captures remain listed, without becoming icon cases.
const protocol = 'cd02a1968c63d39ab9b165960cbf0524b4e30959506ff07b1c8da35076b3a728';
const pins: Record<string, [number, string, number, string]> = {
  'ant-design-select-icons-reference.json.gz': [2060389, 'dce7960198102e5446218d588811cfc609040e2ae5a761d8a137759a544664f8', 66059978, '347c2dd39b93e7f2f481f9380e07c314cf9b5e01232a716ed0b10fea392d6b1b'],
  'ant-design-select-icons-repeat-reference.json.gz': [2062355, '85566bdc1e921b575fb77e56267cf4cbd4155bc172409f4944ef4986f465b894', 66243296, 'c80289b97e45736f98c9bead71fc8547e6b5854f9c59c0b3c784b27216042d60'],
  'ant-design-select-icons-ssr-reference.json.gz': [493335, '55622220bed081c183df3821e5d98220fceda5acb9d5a92b75a0a5f10379a75f', 12616441, 'd82ed97eb534fa7ff7fa4a0120453934e5ccc60bdb3e6ec5566738c7a62e77c9'],
  'ant-design-select-icons-sync-reference.json.gz': [2062357, '1a0874a4975c4a806e95804e13bb5fd77fc865e01ee810275481a7c62668c464', 66243312, 'd821db68d018df11596b4716db60c429144a211ed78e3c54e8b4dfb84089a3b0'],
  'ant-design-select-icons-sync-repeat-reference.json.gz': [2060393, '3699ebe18b54110bb08c0aa8fc6f86a84696a17f8f1625ea7e196109edc00c91', 66059994, 'd3202fba11b19d54977c84293733c22d8b2ea425afecb6b74ac5e5b88c212ef9']
};
function repositoryRoot() {
  let current = dirname(fileURLToPath(import.meta.url));
  while (!existsSync(join(current, 'package.json')) || !existsSync(join(
    current,
    'tests/browser/select-surface-producers.mjs'
  ))) {
    const parent = dirname(current);
    assert.notEqual(parent, current, 'locate maintained repository');
    current = parent;
  }
  return current;
}
let inputsVerified = false;
function load<Value>(name: string, mode: string, sync = false): Source<Value> {
  const pin = pins[name];
  assert(pin, name);
  const copy = manifest.copies.find(copy => basename(copy.path) === name)!;
  assert.deepEqual(
    [copy.storageBytes, copy.storageSha256, copy.decodedBytes, copy.decodedSha256],
    pin
  );
  const stored = readFileSync(fixture(name));
  assert.equal(stored.length, pin[0]);
  assert.equal(hash(stored), pin[1]);
  const decoded = gunzipSync(stored);
  assert.equal(decoded.length, pin[2]);
  assert.equal(hash(decoded), pin[3]);
  const result = JSON.parse(decoded.toString('utf8')) as Source<Value>, h = result.reference;
  assert.equal(h.axis, 'icons');
  assert.equal(h.mode, mode);
  assert.equal(h.version, '6.6.8');
  assert.equal(h.react, '18.3.1');
  assert.equal(h.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
  assert.equal(
    h.protocolSha256,
    sync ? 'de51ef9f3ac491ffe001e47b1aaa2937a45971ed3171c15e2f2ab7e833fcf34c' : protocol
  );
  assert.equal(h.preservedReferences, 478);
  assert.deepEqual(h.errors, []);
  assert.equal(h.diagnostics.length, mode === 'csr' ? 6 : 36);
  assert.equal(
    h.archives[0].sha256,
    'e13aa9008d4d9edbb4cad022197f568227cc224b0ba016e5356ba29ed7a7e3f4'
  );
  assert.equal(
    h.archives[0].archiveSha256,
    '8eb361740b62dc79762f21d036dea685d5e7c1d714315ea3247b9aa5d2269dfa'
  );
  assert(h.archives.every(archive => archive.byteEqual));
  if (!inputsVerified) {
    assert.equal(
      hash(readFileSync(new URL('./select-icons-cases.mjs', import.meta.url))),
      'bd6a9d5d9b3f4a5042c435138ef850bc366dc3df8ddb4c50a1f2ac3a8122f6bd'
    );
    assert.equal(
      hash(readFileSync(new URL('./select-icons-metrics.mjs', import.meta.url))),
      'be5eac174349176ce535c5a1bb164f2c48f5c91e93e11263a20f230d34f92cdb'
    );
    for (const [path, pin] of Object.entries(h.inputPins)) {
      if (path.startsWith('tests/'))
        assert.equal(hash(readFileSync(join(repositoryRoot(), path))), pin, path);
    }
    inputsVerified = true;
  }
  return result;
}
export function iconCallSignature(call: SelectSurfaceProducerCall) {
  return JSON.stringify([call.kind, call.side, call.argument, call.result, call.argumentCount, call.argumentOwnKeys, call.argumentDescriptors]);
}
export function readSelectIconPair(id: string, sync = false): [IconCase, IconCase] {
  const prefix = sync ? 'ant-design-select-icons-sync' : 'ant-design-select-icons';
  const get = (repeat: boolean) => {
    const r = load<IconCase>(prefix + (repeat ? '-repeat' : '') + '-reference.json.gz', 'csr', sync);
    assert.deepEqual(r.cases.map(c => c.id), selectIconSamples.map(s => s.id));
    assert.equal(r.cases.reduce((n, c) => n + c.steps.length, 0), 195);
    for (const c of r.cases) {
      const sample = selectIconSamples.find(sample => sample.id === c.id)!;
      assert.deepEqual(c.steps.map(p => p.action), sample.actions);
      assert.equal(c.cleanup.popupCount, 0);
      assert.equal(c.cleanup.ownerCount, 0);
      assert(c.cleanup.retainedConnected.every(n => !n.connected));
      assert(Object.values(c.cleanup.refs).every(Boolean));
      assert.deepEqual(
        c.late,
        {
          events: c.cleanup.events,
          rawEvents: c.cleanup.rawEvents,
          producerCalls: c.cleanup.producerCalls,
          lifecycle: c.cleanup.lifecycle
        }
      );
    }
    const c = r.cases.find(c => c.id === id);
    assert(c, id);
    return c;
  };
  const a = get(false), b = get(true);
  if (id !== 'select-icons-item-remove-functions') {
    assert.deepEqual(
      a,
      b,
      'the other fourteen complete Original owner pairs are byte-equivalent'
    );
  }
  else {
    assert.deepEqual(
      [a.producerCalls.length, b.producerCalls.length],
      sync ? [259, 255] : [255, 259]
    );
    assert.deepEqual(a.events, b.events);
    assert.equal(a.events.length, 11);
    for (const [index, p] of [a.initial, ...a.steps].entries()) {
      const q = [b.initial, ...b.steps][index];
      assert.deepEqual(p.dom, q.dom);
      assert.deepEqual(p.icons, q.icons);
      for (const key of ['settings', 'model', 'open', 'query', 'authoredProps', 'authoredProvider', 'authoredInnerProvider'] as const)
        assert.deepEqual(p.owner[key], q.owner[key]);
    }
    const shorter = a.producerCalls.length < b.producerCalls.length ? a.producerCalls : b.producerCalls;
    const longer = a.producerCalls.length > b.producerCalls.length ? a.producerCalls : b.producerCalls;
    let index = 0;
    const extra: SelectSurfaceProducerCall[] = [];
    for (const call of longer) {
      if (index < shorter.length && iconCallSignature(call) === iconCallSignature(shorter[index])) index++; else extra.push(call);
    }
    assert.equal(index, shorter.length);
    assert.equal(extra.length, 4);
    assert.deepEqual(
      extra.map(call => [call.index, call.kind, call.side]),
      [160, 161, 162, 163].map(index => [index, 'menuItemSelectedIcon', 'own'])
    );
    assert(extra.every(call => shorter.some(candidate => iconCallSignature(candidate) === iconCallSignature(call))));
    assert(
      !isDeepStrictEqual(a, b),
      'the actual duplicate pass is retained instead of claiming raw equality'
    );
  }
  return [a, b];
}
let emptyCounterpart: Source<IconCase> | undefined;
let closeCounterpart: Source<IconCase> | undefined;
/** The agreed immediate Native close is an ordinary controlled pointer close in Original. */
export function readSelectIconCloseCounterpart(id: string): IconCase | undefined {
  const ids = ['select-icons-suffix-function', 'select-icons-item-remove-functions', 'select-icons-metadata',
    'select-icons-ac-explicit-suffix', 'select-icons-ac-item-function'];
  if (!ids.includes(id)) {
    return;
  }
  if (!closeCounterpart) {
    const stored = readFileSync(fixture('ant-design-select-icons-close-reference.json.gz'));
    assert.equal(stored.length, 895459);
    assert.equal(hash(stored), '01d9a6ad6df1284483385366d6a313207f203a1cb3489b5c384fd6c81c8bd5be');
    const raw = gunzipSync(stored);
    assert.equal(raw.length, 34186954);
    assert.equal(hash(raw), '7ea8ec67858e3d5010e228a24efe2037d9834d83cff0b49111a71807f5b54c8a');
    const result = JSON.parse(raw.toString('utf8')) as Source<IconCase>
      & { reference: Header & { supplement: { protocol: string; sha256: string } } };
    const h = result.reference;
    assert.equal(h.axis, 'icons');
    assert.equal(h.mode, 'csr');
    assert.equal(h.version, '6.6.8');
    assert.equal(h.react, '18.3.1');
    assert.equal(h.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
    assert.equal(h.protocolSha256, protocol);
    assert.equal(
      h.supplement.sha256,
      'f57effd00ae8c5b6916aba0d94f267258f8a1afc5775d1969689cbfbc15828ab'
    );
    assert.equal(h.preservedReferences, 478);
    assert.deepEqual(h.errors, []);
    assert.equal(h.diagnostics.length, 2);
    assert(h.archives.every(archive => archive.byteEqual));
    assert.deepEqual(result.cases.map(c => c.id), ids);
    assert.equal(result.cases.reduce((count, c) => count + c.steps.length, 0), 65);
    for (const c of result.cases) {
      assert.deepEqual(
        c.steps.map(p => p.action),
        selectIconSamples.find(sample => sample.id === c.id)!.actions
      );
      assert.equal(c.cleanup.popupCount, 0);
      assert.equal(c.cleanup.ownerCount, 0);
      assert(c.cleanup.retainedConnected.every(node => !node.connected));
      assert(Object.values(c.cleanup.refs).every(Boolean));
      assert.deepEqual(
        c.late,
        {
          events: c.cleanup.events,
          rawEvents: c.cleanup.rawEvents,
          producerCalls: c.cleanup.producerCalls,
          lifecycle: c.cleanup.lifecycle
        }
      );
    }
    closeCounterpart = result;
  }
  return closeCounterpart.cases.find(c => c.id === id);
}
/** A complete public notFoundContent counterpart for the preserved plain Native empty UI. */
export function readSelectIconEmptyCounterpart(id: string): IconCase | undefined {
  if (!['select-icons-suffix-local', 'select-icons-suffix-context'].includes(id)) {
    return;
  }
  if (!emptyCounterpart) {
    const stored = readFileSync(fixture('ant-design-select-icons-plain-empty-reference.json.gz'));
    assert.equal(stored.length, 376417);
    assert.equal(hash(stored), '9ddc1197dd9bc64661c3c5b8b6fc99ad79a1278cc835a13c155cc2f6c9e5dc81');
    const raw = gunzipSync(stored);
    assert.equal(raw.length, 9327113);
    assert.equal(hash(raw), 'b199f0101c47c6232ec51903e3d6521c81227dfcc105cd0d715c9ccbc3fb605c');
    const result = JSON.parse(raw.toString('utf8')) as Source<IconCase>
      & { reference: Header & { supplement: { protocol: string; sha256: string } } };
    const h = result.reference;
    assert.equal(h.axis, 'icons');
    assert.equal(h.mode, 'csr');
    assert.equal(h.version, '6.6.8');
    assert.equal(h.react, '18.3.1');
    assert.equal(h.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
    assert.equal(h.protocolSha256, protocol);
    assert.equal(
      h.supplement.sha256,
      '5adb04a628dc37105e4998bb73a9e7b930cc8e2b62f8f600d0092357eacb8035'
    );
    assert.equal(h.preservedReferences, 478);
    assert.deepEqual(h.errors, []);
    assert.deepEqual(h.diagnostics, []);
    assert(h.archives.every(archive => archive.byteEqual));
    assert.deepEqual(
      result.cases.map(c => c.id),
      ['select-icons-suffix-local', 'select-icons-suffix-context']
    );
    assert.equal(result.cases.reduce((count, c) => count + c.steps.length, 0), 47);
    for (const c of result.cases) {
      assert.deepEqual(
        c.steps.map(p => p.action),
        selectIconSamples.find(sample => sample.id === c.id)!.actions
      );
      assert.deepEqual(c.producerCalls, []);
      for (const point of [c.initial, ...c.steps]) {
        const own = point.owner.authoredProps as { properties: Array<{ key: string; value: unknown }> };
        assert(own.properties.some(p => p.key === 'notFoundContent' && p.value === 'Ничего не найдено'));
      }
      assert.equal(c.cleanup.popupCount, 0);
      assert.equal(c.cleanup.ownerCount, 0);
      assert(c.cleanup.retainedConnected.every(node => !node.connected));
      assert(Object.values(c.cleanup.refs).every(Boolean));
      assert.deepEqual(
        c.late,
        {
          events: c.cleanup.events,
          rawEvents: c.cleanup.rawEvents,
          producerCalls: c.cleanup.producerCalls,
          lifecycle: c.cleanup.lifecycle
        }
      );
    }
    emptyCounterpart = result;
  }
  return emptyCounterpart.cases.find(c => c.id === id);
}
let ssr: Source<{ id: string; states: IconSSRState[] }> | undefined;
export function readSelectIconSSR() {
  ssr ??= load<{ id: string; states: IconSSRState[] }>(
    'ant-design-select-icons-ssr-reference.json.gz',
    'ssr'
  );
  assert.deepEqual(ssr.cases.map(c => c.id), selectIconSamples.map(s => s.id));
  assert.equal(ssr.cases.reduce((n, c) => n + c.states.length, 0), 142);
  for (const c of ssr.cases) {
    for (const s of c.states) {
      assert.equal(hash(s.rawHtml), s.htmlSha256);
      assert.deepEqual(s.resources, { timers: 0, frames: 0, microtasks: 0, measurements: 0 });
      assert.deepEqual(s.state.events, []);
      assert.deepEqual(s.state.rawEvents, []);
      assert.deepEqual(s.state.lifecycle, []);
    }
  }
  return ssr;
}
export function selectIconStaticStates(sample: SelectIconSample) {
  let settings: SelectIconSettings = { ...sample.settings };
  const states = [{ name: 'initial', settings }];
  sample.actions.forEach((action, index) => {
    if (action.type === 'props') {
      settings = { ...settings, ...action.set };
      for (const key of action.drop ?? []) delete settings[key];
    }
    else if (action.type === 'context') {
      const config = { ...settings.config, ...action.set };
      for (const key of action.drop ?? []) delete config[key];
      settings = { ...settings, config };
    }
    else if (action.type === 'inner') settings = { ...settings, inner: action.value };
    else return;
    states.push({ name: 'authored-props-' + index, settings });
  });
  return states;
}
