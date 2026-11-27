import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import Case from '../../browser/fixtures/DatePickerPresetTransitionsCase.svelte';
import { datePickerPresetTransitionSamples } from '../../browser/date-picker-preset-transitions-cases.mjs';
import type { DatePickerPresetTransitionCapture } from '../../browser/date-picker-preset-transitions-native-types';
import { readDatePickerPresetTransitionsSSR } from '../../browser/date-picker-preset-transitions-reference';
import {
  createDatePickerPresetTransitionProof, verifyDatePickerPresetTransitionClosedSSR
} from '../../browser/date-picker-preset-transitions-assertions';

for (const sample of datePickerPresetTransitionSamples) {
  it(`keeps closed DatePicker transition SSR browser-free ${sample.id}`, () => {
    vi.useFakeTimers();
    const resource = vi.fn(() => {
      throw Error('Closed DatePicker transition SSR must remain DOM-free');
    });
    for (const name of ['getComputedStyle', 'requestAnimationFrame', 'queueMicrotask']) {
      vi.stubGlobal(
        name,
        resource
      );
    }
    for (const name of ['ResizeObserver', 'MutationObserver', 'MessageChannel'])
      vi.stubGlobal(name, class { constructor() { resource(); } });
    const timeout = vi.spyOn(globalThis, 'setTimeout'), interval = vi.spyOn(
      globalThis,
      'setInterval'
    );
    const warn = vi.spyOn(console, 'warn'), error = vi.spyOn(console, 'error');
    try {
      expect(typeof window).toBe('undefined');
      expect(typeof document).toBe('undefined');
      const capture: DatePickerPresetTransitionCapture = {};
      const { head, body } = render(Case, { props: { sample, capture } });
      expect(capture.read).toBeTypeOf('function');
      expect(capture.readRefs).toBeTypeOf('function');
      const actual = { head, body, state: capture.read!(),
        refs: Object.fromEntries(Object.entries(capture.readRefs!()).map(([name, value]) => [name, value == null])) as
          Record<'control' | 'root' | 'owner', boolean>,
        domFree: !('window' in globalThis) && !('document' in globalThis) };
      for (const variant of ['first', 'repeat'] as const) {
        const source = readDatePickerPresetTransitionsSSR(sample.id, variant);
        expect(source.diagnostics).toEqual([]);
        for (const serializer of ['renderToString', 'renderToStaticMarkup'] as const) {
          const comparison = verifyDatePickerPresetTransitionClosedSSR(actual, source.serializations[serializer],
            sample, createDatePickerPresetTransitionProof(), variant + '/' + serializer + '/' + sample.id);
          expect(comparison.pureProducerMultiplicityParityClaimed).toBe(false);
          expect(comparison.sourcePureProducerCalls).toBe(source.serializations[serializer].state.calls.length);
        }
      }
      // Retains both producer logs and never substitutes equal or zero call counts.
      expect(capture.readRefs!()).toEqual({ control: null, root: null, owner: null });
      expect(resource).not.toHaveBeenCalled();
      expect(timeout).not.toHaveBeenCalled();
      expect(interval).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
      expect(warn).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    } finally {
      timeout.mockRestore();
      interval.mockRestore();
      warn.mockRestore();
      error.mockRestore();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });
}
