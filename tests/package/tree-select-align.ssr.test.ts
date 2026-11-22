import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import registry from '@woodger/antd-svelte/porting/registry.json';
import TreeSelectAlignCase from '../browser/fixtures/TreeSelectAlignCase.svelte';
import { treeSelectAlignSamples } from '../browser/fixtures/tree-select-align-cases';
import reference from '../browser/fixtures/ant-design-tree-select-align-ssr-reference.json';
import browserReference from '../browser/fixtures/ant-design-tree-select-align-reference.json';
import { readTreeSelectAlignSSR, treeSelectAlignNativeSSRExpected } from '../browser/tree-select-align-ssr-metrics';

it('pins 32 independent DOM-free Source renders and 128 captured browser alignment actions', () => {
  expect(reference.reference).toMatchObject({ version: registry.upstream.version, react: '18.3.1',
    revision: registry.upstream.revision, archiveSha256: registry.upstream.archiveSha256,
    select: '1.10.1', treeSelect: '1.16.1', domAvailableDuringRender: false, messages: [] });
  expect(reference.cases).toHaveLength(32);
  expect(reference.cases.map(entry => entry.id)).toEqual(treeSelectAlignSamples.map(sample => sample.id));
  expect(browserReference.cases.map(entry => entry.id)).toEqual(treeSelectAlignSamples.map(sample => sample.id));
  expect(browserReference.cases.reduce((count, entry) => count + entry.steps.length, 0)).toBe(128);
  expect(browserReference.reference).toMatchObject({ version: registry.upstream.version,
    revision: registry.upstream.revision, archiveSha256: registry.upstream.archiveSha256,
    document: { compatMode: 'CSS1Compat', doctype: 'html' }, errors: [], warnings: [] });
});

it.each(reference.cases)('renders $id original alignment props without resolving a container or observing geometry', entry => {
  vi.useFakeTimers();
  const measure = vi.fn(() => { throw Error('SSR must not measure or observe DOM'); });
  const frame = vi.fn(() => { throw Error('SSR must not schedule animation frames'); });
  const microtask = vi.fn(() => { throw Error('SSR must not schedule a microtask'); });
  vi.stubGlobal('getComputedStyle', measure);
  vi.stubGlobal('ResizeObserver', class { constructor() { measure(); } });
  vi.stubGlobal('MutationObserver', class { constructor() { measure(); } });
  vi.stubGlobal('requestAnimationFrame', frame);
  vi.stubGlobal('queueMicrotask', microtask);
  try {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const sample = treeSelectAlignSamples.find(sample => sample.id === entry.id)!;
    const { body } = render(TreeSelectAlignCase, { props: { sample } });
    const view = readTreeSelectAlignSSR(body);
    expect(view).toEqual(treeSelectAlignNativeSSRExpected(entry.view, sample));
    expect(view.events).toEqual([]);
    expect(view.leakedAttributes).toEqual([]);
    expect(view.popupPresent).toBe(false);
    expect(body).toContain('data-align-bound="false"');
    const resources = /<output[^>]*data-align-ssr-resources[^>]*>([\s\S]*?)<\/output>/.exec(body)![1]
      .replace(/<!--[\s\S]*?-->/g, '');
    expect(JSON.parse(resources)).toEqual({
      getterCalls: 0,
      native: null,
      editor: null,
      control: 'undefined'
    });
    expect(entry.resources).toEqual({
      timers: 0,
      frames: 0,
      measurements: 0,
      microtasks: 0,
      getters: 0
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
