import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import registry from '@woodger/antd-svelte/porting/registry.json';
import PopupOverflowCase from '../browser/fixtures/PopupOverflowCase.svelte';
import { popupOverflowSamples } from '../browser/fixtures/popup-overflow-cases';
import { popupOverflowAllSamples, popupOverflowPlacementSamples } from '../browser/fixtures/popup-overflow-placement-cases';
import reference from '../browser/fixtures/ant-design-popup-overflow-ssr-reference.json';
import placements from '../browser/fixtures/ant-design-popup-overflow-placement-ssr-reference.json';
import { readPopupOverflowSSR } from '../browser/popup-overflow-ssr-metrics';

it('pins independent Source provider inheritance without DOM, refs or diagnostics', () => {
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version, revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256, react: '18.3.1',
    domAvailableDuringRender: false, umdArchiveByteEqual: true, messages: []
  });
  expect(createHash('sha256').update(readFileSync(new URL(
    '../browser/fixtures/ant-design-popup-overflow-ssr-reference.json', import.meta.url
  ))).digest('hex')).toBe('50b9a25219ab844571c1f95a5f25f4599bc9d949f37cd49e773e75540b420d9c');
  expect(reference.cases).toHaveLength(61);
  expect(reference.cases.map(entry => entry.id)).toEqual(popupOverflowSamples.map(sample => sample.id));
  expect(placements.reference).toMatchObject({
    version: registry.upstream.version, revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256, react: '18.3.1',
    domAvailableDuringRender: false, umdArchiveByteEqual: true, messages: []
  });
  expect(createHash('sha256').update(readFileSync(new URL(
    '../browser/fixtures/ant-design-popup-overflow-placement-ssr-reference.json', import.meta.url
  ))).digest('hex')).toBe('694c7f09e9df57322b6782d21f311f35bcb40a4237ac0eeb38acbbfb326b90a3');
  expect(placements.cases.map(entry => entry.id)).toEqual(popupOverflowPlacementSamples.map(sample => sample.id));
});

it.each([...reference.cases, ...placements.cases])('renders $id with its original provider props and no browser work', entry => {
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
    const sample = popupOverflowAllSamples.find(sample => sample.id === entry.id)!;
    const { body } = render(PopupOverflowCase, { props: { sample } });
    const actual = readPopupOverflowSSR(body);
    expect(actual).toEqual(entry.view);
    expect(actual.events).toEqual([]);
    expect(actual.getters).toEqual([]);
    expect(actual.leakedAttributes).toEqual([]);
    expect(body).toContain('data-overflow-bound="false"');
    expect(body).not.toMatch(/\splacement=/i);
    expect(entry.resources).toEqual({ timers: 0, frames: 0, measurements: 0, microtasks: 0 });
    expect(entry.refs).toEqual({ host: null, clip: null, shadow: null, control: null });
    expect(entry.callbacks).toEqual([]);
    expect(entry.getterCalls).toEqual([]);
    expect(entry.diagnostics).toEqual([]);
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
