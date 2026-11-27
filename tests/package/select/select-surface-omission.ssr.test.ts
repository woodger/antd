import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import { expect, it, vi } from 'vitest';
import SelectSurfaceOmissionCase from '../../browser/fixtures/SelectSurfaceOmissionCase.svelte';
import { selectSurfaceOmissionNativeSamples, type NativeSelectSurfaceOmissionSample } from '../../browser/fixtures/select-surface-omission-native-cases';
import { omissionSamples } from '../../browser/select-surface-omission-cases.mjs';
import { readSelectSurfaceSSR } from '../../browser/select-surface-ssr-metrics';
import { normalizedSelectSurfaceAuthoredProps, verifySelectSurfaceEventGraph } from '../../browser/select-surface-assertions';
import { decodeSelectSurface } from '../../browser/select-surface-receipts';
import type { SelectSurfaceProducerCall } from '../../browser/select-surface-producers.mjs';

interface OriginalState {
  name: string;
  rawHtml: string;
  view: ReturnType<typeof readSelectSurfaceSSR>;
  state: {
    popup?: 'wrapped' | 'omitted';
    open: boolean;
    model: unknown;
    rawModel: unknown;
    query: string;
    fontSize: number;
    calls: SelectSurfaceProducerCall[];
    authoredProps: unknown;
    authoredProvider: unknown;
  };
}
interface OriginalReference { cases: Array<{ id: string; states: OriginalState[] }> }
type Capture = NonNullable<ComponentProps<typeof SelectSurfaceOmissionCase>['capture']>;
const original = JSON.parse(readFileSync(
  new URL(
    '../../browser/fixtures/ant-design-select-surface-omission-ssr-reference.json',
    import.meta.url
  ),
  'utf8'
)) as OriginalReference;
const width = JSON.parse(readFileSync(
  new URL(
    '../../browser/fixtures/ant-design-select-surface-omission-width-ssr-reference.json',
    import.meta.url
  ),
  'utf8'
)) as OriginalReference;
const samples: readonly NativeSelectSurfaceOmissionSample[] = [...omissionSamples,
  ...selectSurfaceOmissionNativeSamples.filter(sample => sample.initialOpen)];
const states = [...original.cases, ...width.cases].flatMap(entry => entry.states.map(state => ({
  id: entry.id,
  ...state
})));

function editor(html: string) {
  const tag = html.match(/<input\b[^>]*\brole="combobox"[^>]*>/)?.[0];
  expect(tag).toBeDefined();
  const style = tag!.match(/\bstyle="([^"]*)"/)?.[1] ?? '';
  return { value: tag!.match(/\bvalue="([^"]*)"/)?.[1] ?? '',
    expanded: tag!.match(/\baria-expanded="([^"]*)"/)?.[1],
    declarations: new Map(style.split(';').filter(Boolean).map(declaration => {
      const colon = declaration.indexOf(':');
      return [declaration.slice(0, colon).trim(), declaration.slice(colon + 1).trim()];
    })) };
}

it.each(states)('renders original omission/width SSR $id/$name without browser resources', entry => {
  vi.useFakeTimers();
  const browserResource = vi.fn(() => { throw Error('Omission/width SSR must remain DOM-free'); });
  vi.stubGlobal('getComputedStyle', browserResource);
  vi.stubGlobal('requestAnimationFrame', browserResource);
  vi.stubGlobal('queueMicrotask', browserResource);
  vi.stubGlobal('ResizeObserver', class { constructor() { browserResource(); } });
  vi.stubGlobal('MutationObserver', class { constructor() { browserResource(); } });
  vi.stubGlobal('MessageChannel', class { constructor() { browserResource(); } });
  const warn = vi.spyOn(console, 'warn');
  const error = vi.spyOn(console, 'error');
  try {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const initial = samples.find(sample => sample.id === entry.id)!;
    const sample = { ...initial, initialPopup: entry.state.popup ?? 'omitted', initialOpen: entry.state.open,
      initialQuery: entry.state.query, initialFontSize: entry.state.fontSize };
    const capture: Capture = {};
    const { body } = render(SelectSurfaceOmissionCase, { props: { sample, capture } });
    const actual = capture.read!();
    const view = readSelectSurfaceSSR(body);
    expect({
      root: view.rootPresent,
      popup: view.popupPresent,
      prefix: view.prefixPresent,
      leaks: view.leakedAttributes
    })
      .toEqual({ root: entry.view.rootPresent, popup: entry.view.popupPresent, prefix: entry.view.prefixPresent,
        leaks: entry.view.leakedAttributes });
    const classes = entry.view.authoredClasses.filter((name, index, all) =>
      initial.control !== 'autocomplete' || name !== 'surface-control' || all.indexOf(name) === index);
    expect([...view.authoredClasses].sort()).toEqual([...classes].sort());
    expect({
      model: actual.model,
      open: actual.open,
      query: actual.query,
      fontSize: actual.fontSize
    })
      .toEqual({
        model: entry.state.model,
        open: entry.state.open,
        query: entry.state.query,
        fontSize: entry.state.fontSize
      });
    verifySelectSurfaceEventGraph(
      actual.rawModel,
      entry.state.rawModel,
      `${entry.id}/${entry.name} raw SSR model`
    );
    expect(normalizedSelectSurfaceAuthoredProps(actual.authoredProps))
      .toEqual(normalizedSelectSurfaceAuthoredProps(entry.state.authoredProps));
    expect(decodeSelectSurface(actual.authoredProvider)).toEqual(decodeSelectSurface(entry.state.authoredProvider));
    expect(actual.calls).toHaveLength(entry.state.calls.length);
    for (const [index, call] of actual.calls.entries()) {
      const source = entry.state.calls[index];
      expect({ kind: call.kind, side: call.side, argument: call.argument, result: call.result,
        sameResultAsArgument: call.sameResultAsArgument })
        .toEqual({ kind: source.kind, side: source.side, argument: source.argument, result: source.result,
          sameResultAsArgument: source.sameResultAsArgument });
      expect(call.rawArgument).toBeDefined();
      expect(call.rawResult).toBeDefined();
    }
    expect(actual.events).toEqual([]);
    expect(actual.rawEvents).toEqual([]);
    expect(actual.lifecycle).toEqual([]);
    expect(body).not.toMatch(/<\w+\b[^>]*data-surface-omission-(?:wrap|footer)/);
    expect(Object.values(capture.readRefs!()).every(value => value == null)).toBe(true);
    const input = editor(body);
    const sourceInput = editor(entry.rawHtml);
    expect(input.expanded).toBe(sourceInput.expanded);
    if (initial.axis === 'width') {
      expect(input.declarations.get('font-size')).toBe(sourceInput.declarations.get('font-size'));
      expect(input.declarations.has('width')).toBe(false);
      expect(input.declarations.has('--select-input-width')).toBe(false);
      expect(sourceInput.declarations.has('--select-input-width')).toBe(false);
      // The previous Native package preserves controlled multiple query during SSR.
      // The complete Original HTML retains its empty editor separately.
      expect(sourceInput.value).toBe('');
      expect(input.value).toBe(entry.state.query);
    }
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
