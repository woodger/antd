import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import { expect, it, vi } from 'vitest';
import AutoCompleteRenderLabelTitleCase from '../browser/fixtures/AutoCompleteRenderLabelTitleCase.svelte';
import { labelTitleSamples, labelTitleSSRStates } from '../browser/autocomplete-render-label-title-cases.mjs';
import { autocompleteLabelTitleSSRReference } from '../browser/autocomplete-render-label-title-reference';
import { verifyAutocompleteCalls, verifyAutocompleteGraph } from '../browser/autocomplete-render-assertions';
import { normalizedSelectSurfaceAuthoredProps, verifySelectSurfaceEventGraph } from '../browser/select-surface-assertions';
import { readSelectSurfaceSSR } from '../browser/select-surface-ssr-metrics';
type Capture = NonNullable<ComponentProps<typeof AutoCompleteRenderLabelTitleCase>['capture']>;
const content = (html: string) => {
  const tag = html.match(/<div\b[^>]*class="[^"]*\bant-select-content(?:\s|")[^>]*>/)?.[0];
  expect(tag).toBeDefined();
  const start = html.indexOf(tag!) + tag!.length, next = html.indexOf('<input', start);
  return {
    title: tag!.match(/\btitle="([^"]*)"/)?.[1],
    prefix: html.slice(start, next).replaceAll(/<!--[^]*?-->/g, '')
  };
};
for (const owner of autocompleteLabelTitleSSRReference.cases) for (const state of owner.states)
  it(`renders actual label/title SSR ${owner.id}/${state.name}`, () => {
    vi.useFakeTimers();
    const resource = vi.fn(() => {
      throw Error('Label/title SSR allocated browser resources');
    });
    for (const name of ['getComputedStyle', 'requestAnimationFrame', 'queueMicrotask']) vi.stubGlobal(
      name,
      resource
    );
    for (const name of ['ResizeObserver', 'MutationObserver', 'MessageChannel']) vi.stubGlobal(name, class { constructor() {
      resource();
    } });
    const warn = vi.spyOn(console, 'warn'), error = vi.spyOn(console, 'error');
    try {
      expect(typeof window).toBe('undefined');
      expect(typeof document).toBe('undefined');
      const sample = labelTitleSamples.find(s => s.id === owner.id)!, ssrState = labelTitleSSRStates.find(s => s.name === state.name)!;
      const capture: Capture = {}, { body } = render(
        AutoCompleteRenderLabelTitleCase,
        { props: { sample: { ...sample, ssrState }, capture } }
      );
      const actual = capture.read!(), view = readSelectSurfaceSSR(body);
      for (const key of ['renderer', 'open', 'model', 'optionTitleOwnKey', 'optionOwnKeys'] as const) expect(actual[key]).toEqual(state.state[key]);
      expect(actual.events).toEqual(state.state.events);
      expect(actual.rawEvents).toEqual(state.state.rawEvents);
      expect(actual.optionTitleOwnKey).toBe(false);
      expect(actual.optionOwnKeys).toEqual(['value', 'label']);
      expect(normalizedSelectSurfaceAuthoredProps(actual.authoredProps)).toEqual(normalizedSelectSurfaceAuthoredProps(state.state.authoredProps));
      expect(actual.authoredProvider).toEqual(state.state.authoredProvider);
      verifyAutocompleteGraph(
        actual.rawAuthoredProps,
        state.state.rawAuthoredProps,
        owner.id + ' full raw SSR props',
        true
      );
      verifySelectSurfaceEventGraph(
        actual.rawAuthoredProvider,
        state.state.rawAuthoredProvider,
        owner.id + ' full raw SSR provider'
      );
      verifyAutocompleteCalls(
        actual.calls,
        state.state.calls,
        owner.id + ' exact SSR label producer',
        true
      );
      expect(content(body)).toEqual(content(state.rawHtml));
      expect({
        root: view.rootPresent,
        popup: view.popupPresent,
        prefix: view.prefixPresent,
        leaks: view.leakedAttributes
      })
        .toEqual({
          root: state.view.rootPresent,
          popup: state.view.popupPresent,
          prefix: state.view.prefixPresent,
          leaks: state.view.leakedAttributes
        });
      expect(view.authoredClasses.filter(c => c === 'surface-control')).toHaveLength(1);
      expect(state.view.authoredClasses.filter(c => c === 'surface-control')).toHaveLength(2);
      expect(Object.values(capture.readRefs!()).every(v => v == null)).toBe(true);
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
