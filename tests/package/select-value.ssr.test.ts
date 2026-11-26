import { createHash } from 'node:crypto';
import { readReferenceBytes } from '../browser/reference-bytes';
import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import { expect, it, vi } from 'vitest';
import registry from '../porting-registry';
import SelectValueCase from '../browser/fixtures/SelectValueCase.svelte';
import immediateCache from '../browser/fixtures/ant-design-select-immediate-cache-reference.json';
import { selectValueSamples } from '../browser/fixtures/select-value-cases';
import { readSelectValueSSR } from '../browser/select-value-ssr-metrics';
import { verifySelectValueProducerCalls, verifySelectValueReceipts } from '../browser/select-value-receipts';

type Capture = NonNullable<ComponentProps<typeof SelectValueCase>['capture']>;
interface SourceCase {
  id: string;
  view: ReturnType<typeof readSelectValueSSR>;
  resources: { timers: number; frames: number; measurements: number; microtasks: number };
  callbacks: unknown[];
  rawCallbacks: unknown[];
  refs: { host: null; control: null };
  producers: unknown[];
  producerCalls: unknown[];
  rawHtml: string;
}
const bytes = readReferenceBytes('ant-design-select-value-ssr-reference.json.gz');
const source = JSON.parse(bytes.toString('utf8')) as {
  reference: { version: string; revision: string; domAvailableDuringRender: boolean;
    umdArchiveByteEqual: boolean; diagnostics: string[] };
  cases: SourceCase[];
};
function richNodes(html: string) {
  return [...html.matchAll(/<(strong|em)\s+data-select-value-node="([^"]+)"[^>]*>([^<]*)<\/(?:strong|em)>/g)]
    .map(match => ({ tag: match[1], token: match[2], text: match[3] }));
}

it('pins two original selected-option cache observations to the migration release', () => {
  expect(immediateCache.version).toBe(registry.upstream.version);
  expect(immediateCache.revision).toBe(registry.upstream.revision);
  expect(immediateCache.archiveSha256).toBe(registry.upstream.archiveSha256);
  expect(immediateCache.passes).toHaveLength(2);
  expect(immediateCache.passes[0]).toHaveLength(8);
  expect(immediateCache.passes[0]).toEqual(immediateCache.passes[1]);
});

it('pins forty-eight original SSR owners and their actual pure renderer calls', () => {
  expect(createHash('sha256').update(bytes).digest('hex'))
    .toBe('963cebc354e00e74ccac39ce4d32c0d99ae92dfe61731eb74a1eb978b7ca3b06');
  expect(source.reference).toMatchObject({ version: '6.6.8',
    revision: '984592267de88fbf9cdaecc96a56629e721c709d', domAvailableDuringRender: false,
    umdArchiveByteEqual: true });
  expect(source.cases.map(entry => entry.id)).toEqual(selectValueSamples.map(sample => sample.id));
  expect(source.reference.diagnostics.length).toBe(18);
  expect(source.cases.reduce((sum, entry) => sum + entry.producerCalls.length, 0)).toBe(20);
  expect(source.cases.find(entry => entry.id === 'select-value-null-placeholder')!.producerCalls).toEqual([]);
});

it.each(source.cases)('renders selected values $id without browser resources', entry => {
  vi.useFakeTimers();
  const browserResource = vi.fn(() => {
    throw Error('Selected-value SSR must not use browser resources');
  });
  vi.stubGlobal('getComputedStyle', browserResource);
  vi.stubGlobal('ResizeObserver', class { constructor() { browserResource(); } });
  vi.stubGlobal('MutationObserver', class { constructor() { browserResource(); } });
  vi.stubGlobal('requestAnimationFrame', browserResource);
  vi.stubGlobal('queueMicrotask', browserResource);
  vi.stubGlobal('MessageChannel', class { constructor() { browserResource(); } });
  const warn = vi.spyOn(console, 'warn');
  const error = vi.spyOn(console, 'error');
  try {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const capture: Capture = {};
    const sample = selectValueSamples.find(sample => sample.id === entry.id)!;
    const { body } = render(SelectValueCase, { props: { sample, capture } });
    const { receipts, ...view } = readSelectValueSSR(body);
    const { receipts: sourceReceipts, ...sourceView } = entry.view;
    expect(view).toEqual(sourceView);
    verifySelectValueReceipts(receipts, sourceReceipts);
    expect(richNodes(body)).toEqual(richNodes(entry.rawHtml));
    expect(capture.read).toBeTypeOf('function');
    const actual = capture.read!();
    expect(actual.events).toEqual([]);
    expect(actual.rawEvents).toEqual([]);
    expect(actual.producers).toEqual(entry.producers);
    verifySelectValueProducerCalls(actual.producerCalls, entry.producerCalls);
    expect(entry.callbacks).toEqual([]);
    expect(entry.rawCallbacks).toEqual([]);
    expect(entry.refs).toEqual({ host: null, control: null });
    const refs = capture.readRefs!();
    expect([refs.root, refs.editor, refs.control, refs.publicRoot, refs.publicEditor])
      .toEqual([undefined, undefined, undefined, undefined, undefined]);
    expect(entry.resources).toEqual({ timers: 0, frames: 0, measurements: 0, microtasks: 0 });
    expect(browserResource).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  } finally {
    warn.mockRestore();
    error.mockRestore();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  }
});
