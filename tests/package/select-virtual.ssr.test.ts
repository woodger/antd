import { render } from 'svelte/server';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import registry from '../porting-registry';
import SelectVirtualCase from '../browser/fixtures/SelectVirtualCase.svelte';
import { selectVirtualSamples } from '../browser/fixtures/select-virtual-cases';
import reference from '../browser/fixtures/ant-design-select-virtual-ssr-reference.json';
import { readSelectVirtualSSR } from '../browser/select-virtual-ssr-metrics';

const tagsWarning = 'Warning: Please avoid setting option to disabled in tags mode since user can always type text as tag.';

it('pins the original closed Source virtual/list inputs and disabled tags diagnostic', () => {
  expect(createHash('sha256').update(readFileSync(new URL(
    '../browser/fixtures/ant-design-select-virtual-ssr-reference.json', import.meta.url
  ))).digest('hex')).toBe('5c51aadde1a0360a292890ba554764649ba44ed255de9ceb5b691ab2b4ae5fca');
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version, revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256, react: '18.3.1',
    domAvailableDuringRender: false, umdArchiveByteEqual: true, diagnostics: [tagsWarning]
  });
  expect(reference.cases.map(entry => entry.id)).toEqual(selectVirtualSamples.map(sample => sample.id));
  expect(reference.cases.flatMap(entry => entry.diagnostics)).toEqual([tagsWarning]);
  expect(reference.cases.find(entry => entry.id === 'select-tags')!.diagnostics).toEqual([tagsWarning]);
});

it.each(reference.cases)('renders $id without virtual DOM work, measurements or callbacks', entry => {
  vi.useFakeTimers();
  const measure = vi.fn(() => { throw Error('SSR must not measure or observe DOM'); });
  const frame = vi.fn(() => { throw Error('SSR must not request animation frames'); });
  const microtask = vi.fn(() => { throw Error('SSR must not queue browser work'); });
  vi.stubGlobal('getComputedStyle', measure);
  vi.stubGlobal('ResizeObserver', class { constructor() { measure(); } });
  vi.stubGlobal('MutationObserver', class { constructor() { measure(); } });
  vi.stubGlobal('requestAnimationFrame', frame);
  vi.stubGlobal('queueMicrotask', microtask);
  const warn = vi.spyOn(console, 'warn');
  const error = vi.spyOn(console, 'error');
  try {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const sample = selectVirtualSamples.find(sample => sample.id === entry.id)!;
    const { body } = render(SelectVirtualCase, { props: { sample } });
    const actual = readSelectVirtualSSR(body);
    expect(actual).toEqual(entry.view);
    expect(actual.events).toEqual([]);
    expect(actual.offsets).toEqual([]);
    expect(actual.renders).toEqual([]);
    expect(actual.popupPresent).toBe(false);
    expect(actual.leakedAttributes).toEqual([]);
    expect(entry.resources).toEqual({ timers: 0, frames: 0, measurements: 0, microtasks: 0 });
    expect(entry.refs).toEqual({ host: null, control: null, shadow: null });
    expect(entry.callbacks).toEqual([]);
    expect(entry.offsets).toEqual([]);
    expect(entry.renders).toEqual([]);
    expect(measure).not.toHaveBeenCalled();
    expect(frame).not.toHaveBeenCalled();
    expect(microtask).not.toHaveBeenCalled();
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
