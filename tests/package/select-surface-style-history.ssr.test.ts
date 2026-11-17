import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import { expect, it, vi } from 'vitest';
import SelectSurfaceStyleHistoryCase from '../browser/fixtures/SelectSurfaceStyleHistoryCase.svelte';
import { selectSurfaceStyleHistorySamples } from '../browser/fixtures/select-surface-style-history-cases';
import { selectSurfaceStyleHistorySSRReference } from '../browser/select-surface-style-history-native-reference';
import { readStyleHistorySSRStyles } from '../browser/select-surface-style-history-native-assertions';

type Capture = NonNullable<ComponentProps<typeof SelectSurfaceStyleHistoryCase>['capture']>;
it.each(selectSurfaceStyleHistorySSRReference.cases)('serializes initial ordered CSS objects for $id without browser resources', original => {
  vi.useFakeTimers();
  const resource = vi.fn(() => { throw Error('Style history SSR must remain DOM-free'); });
  vi.stubGlobal('getComputedStyle', resource);
  vi.stubGlobal('requestAnimationFrame', resource);
  vi.stubGlobal('queueMicrotask', resource);
  vi.stubGlobal('ResizeObserver', class { constructor() { resource(); } });
  vi.stubGlobal('MutationObserver', class { constructor() { resource(); } });
  vi.stubGlobal('MessageChannel', class { constructor() { resource(); } });
  const warn = vi.spyOn(console, 'warn');
  const error = vi.spyOn(console, 'error');
  try {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const capture: Capture = {};
    const sample = selectSurfaceStyleHistorySamples.find(sample => sample.id === original.id)!;
    const { body } = render(SelectSurfaceStyleHistoryCase, { props: { sample, capture } });
    const actual = capture.read!();
    expect({ phase: actual.phase, open: actual.open, model: actual.model, rawModel: actual.rawModel, maps: actual.maps,
      events: actual.events, rawEvents: actual.rawEvents, calls: actual.calls })
      .toEqual({ phase: original.state.phase, open: original.state.open, model: original.state.model,
        rawModel: original.state.rawModel, maps: original.state.maps, events: original.state.events,
        rawEvents: original.state.rawEvents, calls: original.state.calls });
    expect(readStyleHistorySSRStyles(body)).toEqual(readStyleHistorySSRStyles(original.rawHtml));
    expect(body).not.toMatch(/class="[^"]*\bant-select-dropdown\b/);
    expect(capture.readRefs!()).toEqual({ root: undefined, editor: undefined, control: undefined });
    expect(resource).not.toHaveBeenCalled();
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
