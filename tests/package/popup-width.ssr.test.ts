import { render } from 'svelte/server';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import registry from '@woodger/antd-svelte/porting/registry.json';
import PopupWidthCase from '../browser/fixtures/PopupWidthCase.svelte';
import PopupWidthNestedCase from '../browser/fixtures/PopupWidthNestedCase.svelte';
import { popupWidthSamples, popupWidthHistorySamples, popupWidthNestedSamples } from '../browser/fixtures/popup-width-cases';
import reference from '../browser/fixtures/ant-design-popup-width-ssr-reference.json';
import nestedReference from '../browser/fixtures/ant-design-popup-width-nested-ssr-reference.json';
import development from '../browser/fixtures/ant-design-popup-width-development-reference.json';
import browserReference from '../browser/fixtures/ant-design-popup-width-reference.json';
import { readPopupWidthSSR } from '../browser/popup-width-ssr-metrics';

const samples = [...popupWidthSamples, ...popupWidthHistorySamples];
const readOnlyWarning = 'Warning: You provided a `current` prop to a Pagination component without an `onChange` handler. This will render a read-only component.';

it('retains actual React development warnings without changing the production width observations', () => {
  expect(createHash('sha256').update(readFileSync(new URL(
    '../browser/fixtures/ant-design-popup-width-development-reference.json', import.meta.url
  ))).digest('hex')).toBe('010069c8399bb3e16363d780571ab6dfc9d1c3cf26b4d967cc7b56142662faac');
  expect(development.reference.reactBuild).toBe('development');
  expect(development.reference.errors).toEqual([]);
  expect(development.reference.warnings).toHaveLength(9);
  expect(development.cases).toHaveLength(9);
  for (const entry of development.cases) {
    expect(entry).toEqual(browserReference.cases.find(source => source.id === entry.id));
    const warnings = development.reference.warnings.filter(warning => warning.current.id === entry.id);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toMatch(/(?:NaN|Infinity).*invalid value.*width/s);
  }
});

it('pins actual closed Source width inputs and original scalar receipts without browser resources', () => {
  expect(createHash('sha256').update(readFileSync(new URL(
    '../browser/fixtures/ant-design-popup-width-ssr-reference.json', import.meta.url
  ))).digest('hex')).toBe('ae62faea7d7cdebbfe79fbd956030d07f4152f5de8857f9c05ce3127d5258537');
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version, revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256, react: '18.3.1',
    domAvailableDuringRender: false, umdArchiveByteEqual: true, messages: []
  });
  expect(reference.cases.map(entry => entry.id)).toEqual(samples.map(sample => sample.id));
});

it('pins actual nested Source width defaults and its original read-only Pagination diagnostic', () => {
  expect(createHash('sha256').update(readFileSync(new URL(
    '../browser/fixtures/ant-design-popup-width-nested-ssr-reference.json', import.meta.url
  ))).digest('hex')).toBe('0ca6023444fbbee741b43461bf50267f5387c0285a37c9fdbbb7c4f02c0e2267');
  expect(nestedReference.reference).toMatchObject({
    version: registry.upstream.version, revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256, react: '18.3.1',
    domAvailableDuringRender: false, umdArchiveByteEqual: true, messages: [readOnlyWarning]
  });
  expect(nestedReference.cases.map(entry => entry.id)).toEqual(popupWidthNestedSamples.map(sample => sample.id));
  expect(nestedReference.cases.flatMap(entry => entry.diagnostics)).toEqual([readOnlyWarning]);
});

const closedCases = [
  ...reference.cases.map(entry => ({ ...entry, nested: false })),
  ...nestedReference.cases.map(entry => ({ ...entry, nested: true }))
];

it.each(closedCases)('renders $id without measuring, leaking width props or seeding browser history', entry => {
  vi.useFakeTimers();
  const measure = vi.fn(() => { throw Error('SSR must not measure or observe DOM'); });
  const frame = vi.fn(() => { throw Error('SSR must not request animation frames'); });
  const microtask = vi.fn(() => { throw Error('SSR must not queue browser work'); });
  vi.stubGlobal('getComputedStyle', measure);
  vi.stubGlobal('ResizeObserver', class { constructor() { measure(); } });
  vi.stubGlobal('MutationObserver', class { constructor() { measure(); } });
  vi.stubGlobal('requestAnimationFrame', frame);
  vi.stubGlobal('queueMicrotask', microtask);
  const warn = vi.spyOn(console, 'warn');
  const error = vi.spyOn(console, 'error');
  try {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const { body } = entry.nested
      ? render(
        PopupWidthNestedCase,
        { props: { sample: popupWidthNestedSamples.find(sample => sample.id === entry.id)! } }
      )
      : render(
        PopupWidthCase,
        { props: { sample: samples.find(sample => sample.id === entry.id)! } }
      );
    const actual = readPopupWidthSSR(body);
    expect(actual).toEqual(entry.view);
    expect(actual.events).toEqual([]);
    expect(actual.getters).toEqual([]);
    expect(actual.popupPresent).toBe(false);
    expect(actual.leakedAttributes).toEqual([]);
    expect(entry.resources).toEqual({ timers: 0, frames: 0, measurements: 0, microtasks: 0 });
    expect(entry.refs).toEqual({ host: null, shadow: null, control: null });
    expect(entry.callbacks).toEqual([]);
    expect(entry.getterCalls).toEqual([]);
    if (!entry.nested) expect(entry.diagnostics).toEqual([]);
    expect(measure).not.toHaveBeenCalled();
    expect(frame).not.toHaveBeenCalled();
    expect(microtask).not.toHaveBeenCalled();
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
