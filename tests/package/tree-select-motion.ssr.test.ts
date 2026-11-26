import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import registry from '../porting-registry';
import TreeSelectMotionCase from '../browser/fixtures/TreeSelectMotionCase.svelte';
import { treeSelectMotionSamples } from '../browser/fixtures/tree-select-motion-cases';
import reference from '../browser/fixtures/ant-design-tree-select-motion-ssr-reference.json';
import {
  readTreeSelectMotionSSR, treeSelectMotionNativeSSRExpected
} from '../browser/tree-select-motion-ssr-metrics';

it('pins independent DOM-free Source renders for every public motion input', () => {
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    react: '18.3.1',
    select: '1.10.1',
    treeSelect: '1.16.1',
    trigger: '3.10.1',
    motion: '1.3.3',
    domAvailableDuringRender: false,
    messages: []
  });
  expect(reference.cases).toHaveLength(36);
  expect(reference.cases.map(entry => entry.id)).toEqual(treeSelectMotionSamples.map(sample => sample.id));
});

it.each(reference.cases)('renders $id original motion props without scheduling browser work', entry => {
  vi.useFakeTimers();
  const measure = vi.fn(() => { throw Error('SSR must not measure or observe DOM'); });
  const frame = vi.fn(() => { throw Error('SSR must not schedule a frame'); });
  const microtask = vi.fn(() => { throw Error('SSR must not schedule a microtask'); });
  vi.stubGlobal('getComputedStyle', measure);
  vi.stubGlobal('ResizeObserver', class { constructor() { measure(); } });
  vi.stubGlobal('MutationObserver', class { constructor() { measure(); } });
  vi.stubGlobal('Animation', class { constructor() { measure(); } });
  vi.stubGlobal('KeyframeEffect', class { constructor() { measure(); } });
  vi.stubGlobal('requestAnimationFrame', frame);
  vi.stubGlobal('queueMicrotask', microtask);
  try {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const sample = treeSelectMotionSamples.find(sample => sample.id === entry.id)!;
    const { body } = render(TreeSelectMotionCase, { props: { sample } });
    const view = readTreeSelectMotionSSR(body, sample.local ?? `${sample.prefix ?? 'ant'}-select`);

    expect(view).toEqual(treeSelectMotionNativeSSRExpected(entry.view, sample));
    expect(view.events).toEqual([]);
    expect(view.leakedAttributes).toEqual([]);
    expect(body).toContain('data-motion-bound="false"');
    if (sample.defaultOpen || sample.initialOpen) {
      // Native's existing SSR shell remains hidden until browser layout connects the popup.
      expect(body).toMatch(/<div\b(?=[^>]*popover="manual")(?=[^>]*\bhidden(?:\s|=|>))[^>]*>/);
    }
    else {
      expect(body).not.toContain('popover="manual"');
    }
    const resources = /<output[^>]*data-motion-ssr-resources[^>]*>([\s\S]*?)<\/output>/.exec(body)![1]
      .replace(/<!--[\s\S]*?-->/g, '');
    expect(JSON.parse(resources)).toEqual({
      getterCalls: 0, native: null, editor: null, control: 'undefined'
    });
    expect(entry.resources).toEqual({
      timers: 0, frames: 0, measurements: 0, microtasks: 0, getters: 0
    });
    expect(entry.refs).toEqual({ control: null, shadow: null });
    expect(entry.query).toBe('');
    expect(entry.callbacks).toEqual([]);
    expect(measure).not.toHaveBeenCalled();
    expect(frame).not.toHaveBeenCalled();
    expect(microtask).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  }
});
