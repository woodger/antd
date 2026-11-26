import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import registry from '../porting-registry';
import TreeSelectSuffixLayoutCase from '../browser/fixtures/TreeSelectSuffixLayoutCase.svelte';
import { treeSelectSuffixLayoutSamples } from '../browser/fixtures/tree-select-suffix-layout-cases';
import reference from '../browser/fixtures/ant-design-tree-select-suffix-layout-ssr-reference.json';
import { readTreeSelectSuffixLayoutSSR } from '../browser/tree-select-suffix-layout-ssr-metrics';

it('pins independent DOM-free Overflow suffix renders without measurement or scheduled work', () => {
  expect(reference.reference).toMatchObject({ version: registry.upstream.version,
    revision: registry.upstream.revision, archiveSha256: registry.upstream.archiveSha256,
    react: '18.3.1', select: '1.10.1', treeSelect: '1.16.1', overflow: '1.0.1',
    domAvailableDuringRender: false, messages: [] });
  expect(reference.cases.map(entry => entry.id)).toEqual(treeSelectSuffixLayoutSamples.map(sample => sample.id));
  expect(reference.cases).toHaveLength(15);
  expect(reference.cases.every(entry => entry.view.values.join(',') === 'a,b,c,d'
    && entry.view.visibleTags.length === 0 && !entry.view.suffix.fixed)).toBe(true);
});

it.each(reference.cases)('renders unmeasured $id suffix markup and empty native bindings', entry => {
  vi.useFakeTimers();
  const measure = vi.fn(() => { throw Error('SSR must not measure layout'); });
  const frame = vi.fn(() => { throw Error('SSR must not schedule a frame'); });
  vi.stubGlobal('getComputedStyle', measure);
  vi.stubGlobal('ResizeObserver', class { constructor() { measure(); } });
  vi.stubGlobal('requestAnimationFrame', frame);
  try {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const sample = treeSelectSuffixLayoutSamples.find(sample => sample.id === entry.id)!;
    const { body } = render(TreeSelectSuffixLayoutCase, { props: { sample } });
    const view = readTreeSelectSuffixLayoutSSR(body);
    const { rest: nativeRest, ...native } = view;
    const { rest: sourceRest, ...source } = entry.view;
    expect(native).toEqual(source);
    expect({ present: nativeRest.present, visible: nativeRest.visible })
      .toEqual({ present: sourceRest.present, visible: sourceRest.visible });
    // Native keeps all hidden measurement tags at SSR. Its unmeasured summary is
    // empty; rc-overflow initially reports b/c/d behind the hidden rest node.
    expect(nativeRest.omitted).toBe('');
    expect(sourceRest.omitted).toBe('b,c,d');
    expect(body).toContain('data-suffix-layout-bound="false"');
    const refs = /<output[^>]*data-suffix-layout-refs[^>]*>([\s\S]*?)<\/output>/.exec(body)![1]
      .replace(/<!--[\s\S]*?-->/g, '');
    expect(JSON.parse(refs)).toEqual({ root: null, editor: null,
      nativeContainsEditor: false, focus: 'undefined', blur: 'undefined' });
    const hidden = [...body.matchAll(/<input\b(?=[^>]*type="hidden")[^>]*>/g)].map(match => match[0]);
    expect(hidden).toHaveLength(4);
    expect(hidden.every(tag => tag.includes('name="suffix-layout-choice"'))).toBe(true);
    expect(hidden.map(tag => /\bvalue="([^"]*)"/.exec(tag)![1])).toEqual(['a', 'b', 'c', 'd']);
    expect(body).not.toContain('popover="manual"');
    expect(entry.resources).toEqual({ timers: 0, measurements: 0, frames: 0 });
    expect(entry.refs).toEqual({ native: null, input: null });
    expect(entry.callbacks).toEqual([]);
    expect(measure).not.toHaveBeenCalled();
    expect(frame).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  }
});
