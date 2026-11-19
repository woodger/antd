import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import { expect, it, vi } from 'vitest';
import SelectSurfaceHydrationCase from '../browser/fixtures/SelectSurfaceHydrationCase.svelte';
import { selectSurfaceHydrationReference } from '../browser/select-surface-hydration-reference';
import { selectSurfaceHydrationSemanticSample } from '../browser/fixtures/select-surface-hydration-cases';
import { readStyleHistorySSRStyles } from '../browser/select-surface-style-history-native-assertions';
import { verifySelectSurfaceProducerCalls } from '../browser/select-surface-receipts';

type Capture = NonNullable<ComponentProps<typeof SelectSurfaceHydrationCase>['capture']>;
it.each(selectSurfaceHydrationReference.cases)('renders strict hydration owner $id with actual original pure producers and no resources', entry => {
  vi.useFakeTimers();
  const resource = vi.fn(() => { throw Error('Surface hydration SSR must remain DOM-free'); });
  vi.stubGlobal('getComputedStyle', resource);
  vi.stubGlobal('requestAnimationFrame', resource);
  vi.stubGlobal('queueMicrotask', resource);
  vi.stubGlobal('ResizeObserver', class { constructor() { resource(); } });
  vi.stubGlobal('MutationObserver', class { constructor() { resource(); } });
  vi.stubGlobal('MessageChannel', class { constructor() { resource(); } });
  const warn = vi.spyOn(console, 'warn'), error = vi.spyOn(console, 'error');
  try {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const capture: Capture = {};
    const { body } = render(SelectSurfaceHydrationCase, { props: { sample: entry, capture } });
    const actual = capture.read!();
    for (const source of Object.values(entry.server)) {
      expect({ phase: actual.phase, open: actual.open, model: actual.model, rawModel: actual.rawModel,
        maps: actual.maps, events: actual.events, rawEvents: actual.rawEvents })
        .toEqual({ phase: source.state.phase, open: source.state.open, model: source.state.model,
          rawModel: source.state.rawModel, maps: source.state.maps, events: source.state.events, rawEvents: source.state.rawEvents });
      verifySelectSurfaceProducerCalls(
        actual.calls,
        source.state.calls,
        selectSurfaceHydrationSemanticSample(entry)
      );
      expect(readStyleHistorySSRStyles(body)).toEqual(readStyleHistorySSRStyles(source.rawHtml));
    }
    expect(body).not.toMatch(/class="[^"]*\bant-select-dropdown\b/);
    expect(capture.readRefs!()).toEqual({ root: undefined, editor: undefined, control: undefined,
      publicRoot: undefined, publicEditor: undefined });
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
