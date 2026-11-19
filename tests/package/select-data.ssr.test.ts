import { render } from 'svelte/server';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import SelectDataCase from '../browser/fixtures/SelectDataCase.svelte';
import { selectDataSamples } from '../browser/fixtures/select-data-cases';
import { readSelectDataSSR } from '../browser/select-data-ssr-metrics';

interface SourceCase {
  id: string;
  view: ReturnType<typeof readSelectDataSSR>;
  resources: { timers: number; frames: number; measurements: number; microtasks: number };
  callbacks: unknown[];
  rawCallbacks: unknown[];
  refs: { host: null; control: null };
  offsets: unknown[];
  producers: Record<'filter' | 'sort' | 'render', unknown[]>;
  producerCalls: Record<'filter' | 'sort' | 'render', unknown[]>;
}
const bytes = readFileSync(new URL(
  '../browser/fixtures/ant-design-select-data-ssr-reference.json',
  import.meta.url
));
const reference = JSON.parse(bytes.toString('utf8')) as {
  reference: { version: string; revision: string; domAvailableDuringRender: boolean;
    umdArchiveByteEqual: boolean; diagnostics: string[] };
  cases: SourceCase[];
};
function output(body: string, name: string) {
  const match = body.match(new RegExp(`<output[^>]*data-select-data-${name}[^>]*>([\\s\\S]*?)<\\/output>`));
  if (!match) throw Error(`Missing SSR producer output ${name}`);
  return JSON.parse(match[1].replace(/<!--[^]*?-->/g, '').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
}

it('pins forty DOM-free original SSR owners and retains actual pure sort calls', () => {
  expect(createHash('sha256').update(bytes).digest('hex'))
    .toBe('d47fe13d2d13164617aa1ab7b301801480b29b07da4677dc68e40927cea703a0');
  expect(reference.reference).toMatchObject({ version: '6.6.8',
    revision: '984592267de88fbf9cdaecc96a56629e721c709d', domAvailableDuringRender: false,
    umdArchiveByteEqual: true });
  expect(reference.cases.map(entry => entry.id)).toEqual(selectDataSamples.map(sample => sample.id));
  expect(reference.reference.diagnostics).toEqual([
    'Warning: `value` of Option should not use number type when `mode` is `tags` or `combobox`.'
  ]);
  expect(reference.cases.reduce((sum, entry) => sum + entry.producerCalls.sort.length, 0)).toBe(4);
});

it.each(reference.cases)('renders raw data $id without DOM resources or interactive callbacks', entry => {
  vi.useFakeTimers();
  const measure = vi.fn(() => { throw Error('Data SSR must not measure DOM'); });
  const frame = vi.fn(() => { throw Error('Data SSR must not schedule a frame'); });
  const microtask = vi.fn(() => { throw Error('Data SSR must not schedule a microtask'); });
  const channel = vi.fn(() => { throw Error('Data SSR must not create a MessageChannel'); });
  vi.stubGlobal('getComputedStyle', measure);
  vi.stubGlobal('ResizeObserver', class { constructor() { measure(); } });
  vi.stubGlobal('MutationObserver', class { constructor() { measure(); } });
  vi.stubGlobal('requestAnimationFrame', frame);
  vi.stubGlobal('queueMicrotask', microtask);
  vi.stubGlobal('MessageChannel', class { constructor() { channel(); } });
  const warn = vi.spyOn(console, 'warn');
  const error = vi.spyOn(console, 'error');
  try {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const sample = selectDataSamples.find(sample => sample.id === entry.id)!;
    const { body } = render(SelectDataCase, { props: { sample } });
    const actual = readSelectDataSSR(body);
    expect(actual).toEqual(entry.view);
    expect(actual.events).toEqual([]);
    expect(actual.offsets).toEqual([]);
    expect(actual.popupPresent).toBe(false);
    expect(actual.leakedAttributes).toEqual([]);
    expect(body).toContain('data-select-data-bound="false"');
    expect(output(body, 'producers')).toEqual(entry.producers);
    expect(output(body, 'producer-calls')).toEqual(entry.producerCalls);
    expect(entry.resources).toEqual({ timers: 0, frames: 0, measurements: 0, microtasks: 0 });
    expect(entry.callbacks).toEqual([]);
    expect(entry.rawCallbacks).toEqual([]);
    expect(entry.refs).toEqual({ host: null, control: null });
    expect(measure).not.toHaveBeenCalled();
    expect(frame).not.toHaveBeenCalled();
    expect(microtask).not.toHaveBeenCalled();
    expect(channel).not.toHaveBeenCalled();
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
