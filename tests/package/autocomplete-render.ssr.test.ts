import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import { expect, it, vi } from 'vitest';
import AutoCompleteRenderCase from '../browser/fixtures/AutoCompleteRenderCase.svelte';
import { autocompleteRenderSamples, autocompleteRenderSSRStates } from '../browser/autocomplete-render-cases.mjs';
import { autocompleteRenderSSRReference } from '../browser/autocomplete-render-reference';
import { autocompleteSourceChildSpecification, verifyAutocompleteCalls, verifyAutocompleteGraph } from '../browser/autocomplete-render-assertions';
import { normalizedSelectSurfaceAuthoredProps, verifySelectSurfaceEventGraph } from '../browser/select-surface-assertions';
import { readSelectSurfaceSSR } from '../browser/select-surface-ssr-metrics';

type Capture = NonNullable<ComponentProps<typeof AutoCompleteRenderCase>['capture']>;
const samples = autocompleteRenderSSRReference.cases.flatMap(owner => owner.states.map(state => ({
  owner,
  state
})));
function inputs(html: string) {
  return [...html.matchAll(/<(input|textarea)\b([^>]*)(?:\/>|>)/g)].map(match => {
    const attributes = Object.fromEntries([...match[2].matchAll(/([^\s=]+)(?:="([^"]*)")?/g)].map(a => [a[1], a[2] ?? '']));
    if (match[1] === 'textarea') attributes.value = html.slice(match.index! + match[0].length).split('</textarea>')[0];
    return { tag: match[1], attributes };
  }).filter(node => node.attributes.role === 'combobox');
}
for (const { owner, state } of samples) it(`renders actual Original SSR ${owner.id}/${state.name} without browser resources`, () => {
  vi.useFakeTimers();
  const resource = vi.fn(() => { throw Error('AutoComplete renderer SSR must remain DOM-free'); });
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
    const base = autocompleteRenderSamples.find(s => s.id === owner.id)!;
    const ssrState = autocompleteRenderSSRStates.find(s => s.name === state.name)!;
    const capture: Capture = {};
    const { body } = render(
      AutoCompleteRenderCase,
      { props: { sample: { ...base, ssrState }, capture } }
    );
    const current = capture.read!(), view = readSelectSurfaceSSR(body);
    expect(current.settings).toEqual(state.state.settings);
    expect(current.model).toEqual(state.state.model);
    expect(current.open).toBe(state.state.open);
    expect(current.events).toEqual(state.state.events);
    expect(current.rawEvents).toEqual(state.state.rawEvents);
    expect(current.lifecycle).toEqual(state.state.lifecycle);
    expect(normalizedSelectSurfaceAuthoredProps(current.authoredProps)).toEqual(normalizedSelectSurfaceAuthoredProps(state.state.authoredProps));
    expect(current.authoredProvider).toEqual(state.state.authoredProvider);
    verifyAutocompleteGraph(
      current.rawAuthoredProps,
      state.state.rawAuthoredProps,
      owner.id + ' whole raw SSR props',
      true
    );
    verifySelectSurfaceEventGraph(
      current.rawAuthoredProvider,
      state.state.rawAuthoredProvider,
      owner.id + ' whole raw SSR provider'
    );
    verifyAutocompleteGraph(
      current.rawChildSpecification,
      autocompleteSourceChildSpecification(state.state.rawAuthoredProps),
      owner.id + ' whole raw SSR child'
    );
    verifyAutocompleteCalls(
      current.calls,
      state.state.calls,
      owner.id + ' exact actual SSR producers',
      true
    );
    expect(Object.values(capture.readRefs!()).every(value => value == null)).toBe(true);
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
    // Existing Source AC repeats caller class through its wrapper; Native's root owns it once.
    expect(state.view.authoredClasses.filter(c => c === 'surface-control')).toHaveLength(2);
    expect(view.authoredClasses.filter(c => c === 'surface-control')).toHaveLength(1);
    expect(view.authoredClasses.filter(c => c !== 'surface-control').sort())
      .toEqual(state.view.authoredClasses.filter(c => c !== 'surface-control').sort());
    const [actualInput] = inputs(body), [sourceInput] = inputs(state.rawHtml);
    expect(actualInput.tag).toBe(sourceInput.tag);
    for (const name of ['id', 'role', 'aria-label', 'aria-expanded', 'aria-autocomplete', 'value', 'rows', 'data-ac-render-child'])
      expect(actualInput.attributes[name], name).toEqual(sourceInput.attributes[name]);
    const labels = (html: string) => [...html.matchAll(/<em\b[^>]*data-ac-render-label[^>]*>(.*?)<\/em>/g)].map(m => m[1]);
    expect(labels(body)).toEqual(labels(state.rawHtml));
    expect(body).not.toContain('data-ac-render-result');
    expect(body).not.toContain('data-ac-render-tag');
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
