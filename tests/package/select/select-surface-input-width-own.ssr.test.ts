import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import { expect, it, vi } from 'vitest';
import SelectSurfaceInputWidthOwnCase from '../../browser/fixtures/SelectSurfaceInputWidthOwnCase.svelte';
import { inputWidthOwnSamples } from '../../browser/select-surface-input-width-own-cases.mjs';
import { selectSurfaceInputWidthOwnSSRReference } from '../../browser/select-surface-input-width-own-reference';
import { readSelectSurfaceSSR } from '../../browser/select-surface-ssr-metrics';
import { normalizedSelectSurfaceAuthoredProps, verifySelectSurfaceEventGraph } from '../../browser/select-surface-assertions';
import { decodeSelectSurface } from '../../browser/select-surface-receipts';

type Capture = NonNullable<ComponentProps<typeof SelectSurfaceInputWidthOwnCase>['capture']>;
function editor(html: string) {
  const tag = html.match(/<input\b[^>]*\brole="combobox"[^>]*>/)?.[0];
  expect(tag).toBeDefined();
  const style = tag!.match(/\bstyle="([^"]*)"/)?.[1] ?? '';
  return { value: tag!.match(/\bvalue="([^"]*)"/)?.[1] ?? '', expanded: tag!.match(/\baria-expanded="([^"]*)"/)?.[1],
    declarations: style.split(';').filter(Boolean).map(declaration => {
      const colon = declaration.indexOf(':');
      return [declaration.slice(0, colon).trim(), declaration.slice(colon + 1).trim()];
    }) };
}
it.each(selectSurfaceInputWidthOwnSSRReference.cases)('renders actual initial width ownership SSR $id without browser resources', entry => {
  vi.useFakeTimers();
  const browserResource = vi.fn(() => {
    throw Error('Input width ownership SSR must remain DOM-free');
  });
  vi.stubGlobal('getComputedStyle', browserResource);
  vi.stubGlobal('requestAnimationFrame', browserResource);
  vi.stubGlobal('queueMicrotask', browserResource);
  vi.stubGlobal('ResizeObserver', class { constructor() { browserResource(); } });
  vi.stubGlobal('MutationObserver', class { constructor() { browserResource(); } });
  vi.stubGlobal('MessageChannel', class { constructor() { browserResource(); } });
  const warn = vi.spyOn(console, 'warn'), error = vi.spyOn(console, 'error');
  try {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const sample = inputWidthOwnSamples.find(sample => sample.id === entry.id)!;
    const capture: Capture = {};
    const { body } = render(SelectSurfaceInputWidthOwnCase, { props: { sample, capture } });
    const actual = capture.read!(), view = readSelectSurfaceSSR(body);
    expect({
      root: view.rootPresent,
      popup: view.popupPresent,
      prefix: view.prefixPresent,
      leaks: view.leakedAttributes
    })
      .toEqual({
        root: entry.view.rootPresent,
        popup: entry.view.popupPresent,
        prefix: entry.view.prefixPresent,
        leaks: entry.view.leakedAttributes
      });
    expect([...view.authoredClasses].sort()).toEqual([...entry.view.authoredClasses].sort());
    for (const key of ['widthKind', 'widthOwnKey', 'widthValue', 'inputStyle', 'styleOwnKeys', 'inputStyleDescriptors',
      'fontSize', 'query', 'open', 'model'] as const) {
      expect(actual[key]).toEqual(entry.state[key]);
    }
    verifySelectSurfaceEventGraph(
      actual.rawModel,
      entry.state.rawModel,
      `${entry.id} actual raw SSR model`
    );
    verifySelectSurfaceEventGraph(
      actual.rawInputStyle,
      entry.state.rawInputStyle,
      `${entry.id} raw authored CSS descriptors/order`
    );
    expect(normalizedSelectSurfaceAuthoredProps(actual.authoredProps)).toEqual(normalizedSelectSurfaceAuthoredProps(entry.state.authoredProps));
    expect(decodeSelectSurface(actual.authoredProvider)).toEqual(decodeSelectSurface(entry.state.authoredProvider));
    expect(actual.events).toEqual(entry.state.events);
    expect(actual.rawEvents).toEqual(entry.state.rawEvents);
    expect(actual.calls).toEqual(entry.state.calls);
    expect(Object.values(capture.readRefs!()).every(value => value == null)).toBe(true);
    const input = editor(body), original = editor(entry.rawHtml);
    expect(input.expanded).toBe(original.expanded);
    expect(input.declarations).toEqual(original.declarations);
    // The established Native SSR contract retains controlled multiple query.
    // Original's actual initial SSR empty editor remains in its untouched HTML.
    expect(original.value).toBe('');
    expect(input.value).toBe(entry.state.query);
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
