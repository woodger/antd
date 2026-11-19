import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import { expect, it, vi } from 'vitest';
import SelectComponentsCase from '../browser/fixtures/SelectComponentsCase.svelte';
import SelectComponentsHydrationCase, { type HydrationCapture } from '../browser/fixtures/SelectComponentsHydrationCase.svelte';
import { readSelectComponentsSSR, selectComponentsSamples, selectComponentsStaticStates } from '../browser/select-components-reference';
import { selectComponentsHydrationReference } from '../browser/select-components-hydration-reference';
import { readSelectComponentsSSRFields } from '../browser/select-components-ssr-metrics';
import { normalizedSelectSurfaceAuthoredProps, verifySelectSurfaceEventGraph } from '../browser/select-surface-assertions';
import { verifySelectComponentsAttributes, verifySelectComponentsObservations, type ComponentsObservation } from '../browser/select-components-assertions';
import { verifySelectComponentsGraph, verifySelectComponentsProducers } from '../browser/select-components-producers';
import { verifyIconGraph } from '../browser/select-icons-assertions';

type Capture = NonNullable<ComponentProps<typeof SelectComponentsCase>['capture']>;
const entries = readSelectComponentsSSR().cases;
const componentSSRMarker = 'data-ant-native-select-component-ssr';
function nativeFields(body: string, markerScope: 'root-input' | 'input-root' | undefined) {
  const marked = [...body.matchAll(/<([a-z][\w:-]*)\b([^>]*)>/gi)].flatMap(match => {
    const attrs = [...match[2].matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g)]
      .map(attr => [attr[1].toLowerCase(), attr[2] ?? attr[3] ?? attr[4] ?? '']);
    return attrs.some(([name]) => name === componentSSRMarker)
      ? [{ tag: match[1].toLowerCase(), attrs }] : [];
  });
  expect(marked, 'only the exact library-owned SSR root may carry the private marker')
    .toHaveLength(markerScope ? 1 : 0);
  if (markerScope) {
    const node = marked[0];
    expect(node.tag).toBe(markerScope === 'root-input' ? 'input' : 'div');
    expect(node.attrs.filter(([name]) => name === componentSSRMarker)).toEqual([[componentSSRMarker, '']]);
    if (markerScope === 'input-root') {
      expect(node.attrs.find(([name]) => name === 'class')?.[1].split(/\s+/)).toContain('ant-select');
      expect(node.attrs.some(([name]) => name === 'data-ant-select-control'
        || name === 'data-ant-auto-complete-component-input')).toBe(true);
    }
  }
  const view = readSelectComponentsSSRFields(body);
  expect(view.fields.filter(field => field.attributes.some(([name]) => name === componentSSRMarker)))
    .toHaveLength(markerScope === 'root-input' ? 1 : 0);
  // The exact marker is a Native SSR implementation detail, checked above.
  // Keep the Original HTML and the common complete-field reader unchanged.
  return { ...view, fields: view.fields.map(field => ({ ...field,
    attributes: field.attributes.filter(([name]) => name !== componentSSRMarker) })) };
}
function attributes(value: Array<[string, string]>) {
  return value.flatMap(([key, original]) => {
    let text = original;
    if (key === 'class') text = text.split(/\s+/).filter(Boolean).filter(name => !/^(?:svelte-[\w-]+|s-[\w-]+)$/.test(name)).join(' ');
    // HTML names are case-insensitive; Source SSR prints autoComplete.
    // Native CSS strings retain a different harmless space/trailing-semicolon format.
    if (key === 'style') text = text.split(';').map(part => part.trim()).filter(Boolean).map(part => {
      const colon = part.indexOf(':');
      return part.slice(0, colon).trim() + ':' + part.slice(colon + 1).trim();
    }).join(';');
    return key === 'class' && !text ? [] : [[key, text]];
  });
}
for (const owner of entries) for (const source of owner.states) it(`matches full component SSR ${owner.id}/${source.name}`, () => {
  vi.useFakeTimers();
  const resource = vi.fn(() => { throw Error('Select component SSR must stay DOM-free'); });
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
    const sample = selectComponentsSamples.find(s => s.id === owner.id)!;
    const states = selectComponentsStaticStates(sample);
    expect(states.map(s => s.name)).toEqual(owner.states.map(s => s.name));
    const authored = states.find(s => s.name === source.name)!, capture: Capture = {};
    const { body } = render(
      SelectComponentsCase,
      { props: { sample: { ...sample, settings: authored.settings }, capture } }
    );
    const actual = capture.read!();
    for (const key of ['settings', 'model', 'open', 'query', 'authoredProvider', 'authoredInnerProvider'] as const)
      expect(actual[key], key).toEqual(source.state[key]);
    const currentProps = normalizedSelectSurfaceAuthoredProps(actual.authoredProps), originalProps = normalizedSelectSurfaceAuthoredProps(source.state.authoredProps);
    delete currentProps.components;
    delete originalProps.components;
    expect(currentProps).toEqual(originalProps);
    verifySelectSurfaceEventGraph(
      actual.rawModel,
      source.state.rawModel,
      owner.id + '/SSR full raw model'
    );
    verifySelectComponentsGraph(
      actual.rawAuthoredProps,
      source.state.rawAuthoredProps,
      owner.id + '/SSR full raw caller',
      actual.nodeSpecifications,
      true
    );
    verifyIconGraph(
      actual.rawAuthoredProvider,
      source.state.rawAuthoredProvider,
      owner.id + '/SSR full raw provider',
      actual.nodeSpecifications
    );
    verifyIconGraph(
      actual.rawAuthoredInnerProvider,
      source.state.rawAuthoredInnerProvider,
      owner.id + '/SSR full raw inner provider',
      actual.nodeSpecifications
    );
    verifySelectComponentsProducers(
      actual.calls,
      source.state.calls,
      owner.id + '/SSR all pure producers',
      actual.nodeSpecifications,
      true
    );
    verifySelectComponentsObservations(
      actual.componentObservations as ComponentsObservation[],
      source.state.calls,
      owner.id + '/SSR all component contexts',
      true
    );
    expect(actual.events).toEqual(source.state.events);
    expect(actual.rawEvents).toEqual(source.state.rawEvents);
    expect(actual.lifecycle).toEqual(source.state.lifecycle);
    expect(actual.bodyActivity).toEqual(source.state.bodyActivity ?? []);
    expect(Object.values(capture.readRefs!()).every(value => value == null)).toBe(true);
    const kind = authored.settings.components!.kind, slot = authored.settings.components!.slot;
    const markerScope = slot === 'input' ? 'input-root'
      : kind === 'intrinsic' || kind === 'element' ? 'root-input' : undefined;
    expect(source.rawHtml).not.toContain(componentSSRMarker);
    const view = nativeFields(body, markerScope), original = readSelectComponentsSSRFields(source.rawHtml);
    expect(view.fields).toHaveLength(original.fields.length);
    for (const [index, field] of view.fields.entries()) {
      expect(field.tag).toBe(original.fields[index].tag);
      expect(field.content).toBe(original.fields[index].content);
      expect(field.value).toBe(original.fields[index].value);
      expect(attributes(field.attributes)).toEqual(attributes(original.fields[index].attributes));
    }
    expect(view.prefixBodies).toBe(original.prefixBodies);
    if (kind === 'function' || kind.startsWith('composite')) {
      const call = source.state.calls.findLast(call => call.kind === 'components.' + slot)!;
      expect(call).toBeTruthy();
      const observation = (actual.componentObservations as ComponentsObservation[]).findLast(value => value.slot === slot && value.kind === kind)!;
      expect(observation).toBeTruthy();
      verifySelectComponentsAttributes(
        observation,
        call,
        owner.id + '/SSR incoming component attrs'
      );
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

for (const entry of selectComponentsHydrationReference.cases) it(`renders component hydration SSR ${entry.id} without resources or refs`, () => {
  vi.useFakeTimers();
  const resource = vi.fn(() => {
    throw Error('Select component hydration SSR must stay DOM-free');
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
    const capture: HydrationCapture = {};
    const { body } = render(
      SelectComponentsHydrationCase,
      { props: { sample: entry.sample, capture }, idPrefix: 'components-hydration' }
    );
    const view = nativeFields(
      body,
      entry.sample.initialSlot.startsWith('root-') ? 'root-input' : 'input-root'
    );
    for (const source of Object.values(entry.server)) {
      expect(source.rawHtml).not.toContain(componentSSRMarker);
      expect(capture.read!()).toEqual(source.state);
      const original = readSelectComponentsSSRFields(source.rawHtml);
      expect(view.fields).toHaveLength(original.fields.length);
      for (const [index, field] of view.fields.entries()) {
        expect(field.tag).toBe(original.fields[index].tag);
        expect(field.content).toBe(original.fields[index].content);
        expect(field.value).toBe(original.fields[index].value);
        expect(attributes(field.attributes)).toEqual(attributes(original.fields[index].attributes));
      }
      expect(view.prefixBodies).toBe(original.prefixBodies);
    }
    expect(capture.readRefs!()).toEqual({ control: undefined, root: null, editor: null });
    expect(capture.read!().events).toEqual([]);
    expect(capture.read!().methods).toEqual([]);
    expect(capture.read!().lifecycle).toEqual([]);
    expect(body).not.toMatch(/class="[^"]*\bant-select-dropdown\b/);
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
