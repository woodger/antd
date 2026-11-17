import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import { expect, it, vi } from 'vitest';
import SelectSurfaceContextCase from '../browser/fixtures/SelectSurfaceContextCase.svelte';
import { selectSurfaceContextSamples } from '../browser/select-surface-context-cases';
import { selectSurfaceContextSSRReference } from '../browser/select-surface-context-reference';
import { verifySelectSurfaceContextSSRCalls } from '../browser/select-surface-context-assertions';

type Capture = NonNullable<ComponentProps<typeof SelectSurfaceContextCase>['capture']>;
it.each(selectSurfaceContextSSRReference.cases)('renders $id pure context producers without custom popup descendants', original => {
  vi.useFakeTimers();
  const resource = vi.fn(() => { throw Error('Context SSR must not allocate browser resources'); });
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
    const sample = selectSurfaceContextSamples.find(sample => sample.id === original.id)!;
    const { body } = render(SelectSurfaceContextCase, { props: { sample, capture } });
    const state = capture.read!();
    expect(state.events).toEqual(original.state.events);
    expect({ open: state.open, disabled: state.disabled, variant: state.variant,
      fieldErrors: state.fieldErrors, fieldWarnings: state.fieldWarnings })
      .toEqual({ open: original.state.open, disabled: original.state.disabled, variant: original.state.variant,
        fieldErrors: original.state.fieldErrors, fieldWarnings: original.state.fieldWarnings });
    verifySelectSurfaceContextSSRCalls(state.calls, original.state.calls);
    expect(body).toContain('data-surface-context-status="outside"');
    expect(body).not.toContain('data-surface-context-status="inside"');
    expect(body).not.toContain('data-surface-context-popup');
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
