import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import { expect, it, vi } from 'vitest';
import SelectIconsCase from '../browser/fixtures/SelectIconsCase.svelte';
import { selectIconSamples } from '../browser/select-icons-cases.mjs';
import { readSelectIconSSR, selectIconStaticStates } from '../browser/select-icons-reference';
import { verifyIconCalls, verifyIconGraph, verifySelectIconSSRNodes } from '../browser/select-icons-assertions';
import { readSelectIconsSSR } from '../browser/select-icons-ssr-metrics';
import { normalizedSelectSurfaceAuthoredProps, verifySelectSurfaceEventGraph } from '../browser/select-surface-assertions';
import { readSelectSurfaceSSR } from '../browser/select-surface-ssr-metrics';
type Capture = NonNullable<ComponentProps<typeof SelectIconsCase>['capture']>;
const cases = readSelectIconSSR().cases;
for (const owner of cases) for (const source of owner.states) it(`matches all public icon SSR ${owner.id}/${source.name}`, () => {
  vi.useFakeTimers();
  const resource = vi.fn(() => { throw Error('Select icon SSR must remain DOM-free'); });
  for (const name of ['getComputedStyle', 'requestAnimationFrame', 'queueMicrotask']) {
    vi.stubGlobal(
      name,
      resource
    );
  }
  for (const name of ['ResizeObserver', 'MutationObserver', 'MessageChannel']) {
    vi.stubGlobal(name, class { constructor() {
      resource();
    } });
  }
  const warn = vi.spyOn(console, 'warn'), error = vi.spyOn(console, 'error');
  try {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const sample = selectIconSamples.find(s => s.id === owner.id)!;
    const states = selectIconStaticStates(sample);
    expect(states.map(s => s.name)).toEqual(owner.states.map(s => s.name));
    const authored = states.find(state => state.name === source.name)!, capture: Capture = {};
    const { body } = render(
      SelectIconsCase,
      { props: { sample: { ...sample, settings: authored.settings }, capture } }
    );
    const actual = capture.read!(), view = readSelectSurfaceSSR(body), nodes = readSelectIconsSSR(body), original = readSelectIconsSSR(source.rawHtml);
    for (const key of ['settings', 'model', 'open', 'query', 'authoredProvider', 'authoredInnerProvider'] as const)
      expect(actual[key], key).toEqual(source.state[key]);
    expect(normalizedSelectSurfaceAuthoredProps(actual.authoredProps)).toEqual(normalizedSelectSurfaceAuthoredProps(source.state.authoredProps));
    verifySelectSurfaceEventGraph(
      actual.rawModel,
      source.state.rawModel,
      owner.id + ' SSR full raw model'
    );
    verifyIconGraph(
      actual.rawAuthoredProps,
      source.state.rawAuthoredProps,
      owner.id + ' SSR full raw caller',
      actual.nodeSpecifications,
      true
    );
    verifyIconGraph(
      actual.rawAuthoredProvider,
      source.state.rawAuthoredProvider,
      owner.id + ' SSR full raw provider',
      actual.nodeSpecifications
    );
    verifyIconGraph(
      actual.rawAuthoredInnerProvider,
      source.state.rawAuthoredInnerProvider,
      owner.id + ' SSR full raw inner provider',
      actual.nodeSpecifications
    );
    verifyIconCalls(
      actual.calls,
      [source.state.calls],
      owner.id + ' SSR full public producers',
      actual.nodeSpecifications,
      true
    );
    expect(actual.events).toEqual(source.state.events);
    expect(actual.rawEvents).toEqual(source.state.rawEvents);
    expect(actual.lifecycle).toEqual(source.state.lifecycle);
    expect(Object.values(capture.readRefs!()).every(value => value == null)).toBe(true);
    expect({
      root: view.rootPresent,
      popup: view.popupPresent,
      prefix: view.prefixPresent,
      leaks: view.leakedAttributes
    })
      .toEqual({
        root: source.view.rootPresent,
        popup: source.view.popupPresent,
        prefix: source.view.prefixPresent,
        leaks: source.view.leakedAttributes
      });
    expect(nodes.leaks.map(leak => leak.key === 'loadingicon' ? { ...leak, key: 'loadingIcon' } : leak)).toEqual(original.leaks);
    verifySelectIconSSRNodes(nodes, original, source.state, sample, owner.id + '/' + source.name);
    expect(nodes.editors).toHaveLength(original.editors.length);
    for (const [index, editor] of nodes.editors.entries()) {
      const a = Object.fromEntries(editor.attributes), b = Object.fromEntries(original.editors[index].attributes);
      expect(editor.tag).toBe(original.editors[index].tag);
      for (const key of ['id', 'role', 'aria-label', 'aria-expanded', 'disabled']) {
        expect(
          a[key],
          key
        ).toEqual(b[key]);
      }
      if (sample.control === 'select' && !authored.settings.mode) {
        expect(b.value, 'Source single SSR search editor').toBe('');
        const props = normalizedSelectSurfaceAuthoredProps(source.state.authoredProps);
        const rawValue = props.value;
        expect(original.displayValues, 'one actual Source content root').toHaveLength(1);
        const value = typeof rawValue === 'string' || typeof rawValue === 'number' ? original.displayValues[0] ?? '' : '';
        expect(a.value, 'retained scalar Native SSR editor').toBe(value);
      }
      else expect(a.value, 'unchanged multiple/combobox SSR value').toEqual(b.value);
    }
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
