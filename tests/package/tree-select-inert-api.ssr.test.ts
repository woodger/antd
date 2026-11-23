import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import registry from '@woodger/antd/porting/registry.json';
import TreeSelectInertApiCase from '../browser/fixtures/TreeSelectInertApiCase.svelte';
import { treeSelectInertApiSamples } from '../browser/fixtures/tree-select-inert-api-cases';
import reference from '../browser/fixtures/ant-design-tree-select-inert-api-ssr-reference.json';
import browserReference from '../browser/fixtures/ant-design-tree-select-inert-api-reference.json';
import { readTreeSelectInertApiSSR } from '../browser/tree-select-inert-api-metrics';
import { treeSelectInertApiNativeExpected } from '../browser/tree-select-inert-api-native';

it('pins independent Source inert prop observations for nine SSR and nine browser scenarios', () => {
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version, revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256, react: '18.3.1', select: '1.10.1', treeSelect: '1.16.1',
    domAvailableDuringRender: false, messages: []
  });
  expect(reference.cases).toHaveLength(9);
  expect(reference.cases.map(entry => [entry.id, entry.mode]))
    .toEqual(treeSelectInertApiSamples.map(sample => [sample.id, sample.ssrMode]));
  expect(browserReference.cases.map(entry => entry.id)).toEqual(treeSelectInertApiSamples.map(sample => sample.id));
  expect(browserReference.cases.reduce((count, entry) => count + entry.steps.length, 0)).toBe(37);
  expect(browserReference.reference).toMatchObject({
    version: registry.upstream.version, revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    document: { compatMode: 'CSS1Compat', doctype: 'html' }, errors: [], warnings: []
  });
});

it.each(reference.cases)('renders $id in its recorded prop mode without leaking inert attributes or scheduling work', entry => {
  vi.useFakeTimers();
  const measure = vi.fn(() => { throw Error('SSR must not measure layout'); });
  const frame = vi.fn(() => { throw Error('SSR must not schedule a frame'); });
  vi.stubGlobal('getComputedStyle', measure);
  vi.stubGlobal('ResizeObserver', class { constructor() { measure(); } });
  vi.stubGlobal('requestAnimationFrame', frame);
  try {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const sample = treeSelectInertApiSamples.find(sample => sample.id === entry.id)!;
    const { body } = render(
      TreeSelectInertApiCase,
      { props: { sample, initialMode: sample.ssrMode } }
    );
    const view = readTreeSelectInertApiSSR(body);

    expect(view).toEqual(treeSelectInertApiNativeExpected(entry.view, sample));
    expect(view.events).toEqual([]);
    expect(view.leakedAttributes).toEqual([]);
    expect(view.choiceClasses).toEqual([]);
    expect(body).toContain('data-inert-api-bound="false"');
    expect(body).not.toContain('popover="manual"');
    expect(entry.resources).toEqual({ timers: 0, frames: 0, measurements: 0 });
    expect(entry.refs).toEqual({ native: null });
    expect(measure).not.toHaveBeenCalled();
    expect(frame).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  }
});
