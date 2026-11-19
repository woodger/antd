import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import { expect, it, vi } from 'vitest';
import SelectSurfaceCase from '../browser/fixtures/SelectSurfaceCase.svelte';
import { selectSurfaceSamples } from '../browser/fixtures/select-surface-cases';
import { selectSurfaceSSRReference } from '../browser/select-surface-reference';
import { readSelectSurfaceSSR } from '../browser/select-surface-ssr-metrics';
import { verifySelectSurfaceProducerCalls } from '../browser/select-surface-receipts';

type Capture = NonNullable<ComponentProps<typeof SelectSurfaceCase>['capture']>;

it('pins actual original closed popup producers separately from browser rendering', () => {
  expect(selectSurfaceSSRReference.cases).toHaveLength(28);
  expect(selectSurfaceSSRReference.reference.domAvailableDuringRender).toBe(false);
  expect(selectSurfaceSSRReference.cases.reduce((sum, entry) => sum + entry.state.calls.length, 0)).toBe(42);
  expect(selectSurfaceSSRReference.cases.every(entry => !entry.view.popupPresent)).toBe(true);
});

it.each(selectSurfaceSSRReference.cases)('renders surface $id with the actual original pure callback contract', entry => {
  vi.useFakeTimers();
  const browserResource = vi.fn(() => {
    throw Error('Select surface SSR must not use browser resources');
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
    const sample = selectSurfaceSamples.find(sample => sample.id === entry.id)!;
    const capture: Capture = {};
    const { body } = render(SelectSurfaceCase, { props: { sample, capture } });
    const actual = capture.read!();
    const view = readSelectSurfaceSSR(body);
    expect(view.rootPresent).toBe(entry.view.rootPresent);
    expect(view.popupPresent).toBe(entry.view.popupPresent);
    expect(view.prefixPresent).toBe(entry.view.prefixPresent);
    expect(view.leakedAttributes).toEqual([]);
    // Source AC повторяет эти tokens на одном root через wrapper и Select;
    // Native сохраняет прежний class attribute с одним вхождением. CSS membership совпадает.
    const legacyRootClasses = new Set(['surface-control', 'surface-own-class', 'surface-owner-root']);
    const sourceClasses = entry.view.authoredClasses.filter((name, index, all) =>
      sample.control !== 'autocomplete' || !legacyRootClasses.has(name) || all.indexOf(name) === index);
    expect([...view.authoredClasses].sort()).toEqual([...sourceClasses].sort());
    verifySelectSurfaceProducerCalls(actual.calls, entry.state.calls, sample);
    expect(actual.events).toEqual([]);
    expect(actual.rawEvents).toEqual([]);
    expect(capture.readRefs!()).toEqual({ control: undefined, root: undefined, editor: undefined,
      publicRoot: undefined, publicEditor: undefined });
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
