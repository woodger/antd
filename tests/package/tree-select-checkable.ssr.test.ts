import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import registry from '@woodger/antd/porting/registry.json';
import TreeSelectCheckableCase from '../browser/fixtures/TreeSelectCheckableCase.svelte';
import { treeSelectCheckableSamples } from '../browser/fixtures/tree-select-checkable-cases';
import reference from '../browser/fixtures/ant-design-tree-select-checkable-ssr-reference.json';
import { readTreeSelectCheckableSSR } from '../browser/tree-select-checkable-ssr-metrics';

const sourceWarning = 'Warning: [antd: TreeSelect] `multiple` will always be `true` when `treeCheckable` is true';
const decode = (value: string) => value.replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, entity =>
  ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'" })[entity]!);
function output(body: string, name: string) {
  const value = new RegExp(`<output(?=[^>]*\\bdata-checkable-${name}(?:[=\\s>]))[^>]*>([\\s\\S]*?)<\\/output>`).exec(body)![1];
  return JSON.parse(decode(value.replace(/<!--[\s\S]*?-->/g, '')));
}

it('pins actual DOM-free Source content semantics and preserves its known diagnostic', () => {
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version, revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256, react: '18.3.1', treeSelect: '1.16.1',
    select: '1.10.1', domAvailableDuringRender: false, messages: [sourceWarning]
  });
  expect(createHash('sha256').update(readFileSync(new URL(
    '../browser/fixtures/ant-design-tree-select-checkable-ssr-reference.json', import.meta.url
  ))).digest('hex')).toBe('ca6fcfd942ee4ef2b75181a5b06e75f1ce4c8b9a73c3b6f2c4ea685af5ffb573');
  expect(reference.cases).toHaveLength(38);
  expect(reference.cases.map(entry => entry.id)).toEqual(treeSelectCheckableSamples.map(sample => sample.id));
  expect(reference.cases.filter(entry => entry.diagnostics.length).map(entry => ({
    id: entry.id, diagnostics: entry.diagnostics
  }))).toEqual([{ id: 'content-forces-multiple-false', diagnostics: [sourceWarning] }]);
});

it.each(reference.cases)('renders $id without invoking opaque content or scheduling browser work', entry => {
  vi.useFakeTimers();
  const measure = vi.fn(() => { throw Error('SSR must not measure or observe DOM'); });
  const frame = vi.fn(() => { throw Error('SSR must not schedule frames'); });
  const microtask = vi.fn(() => { throw Error('SSR must not schedule microtasks'); });
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
    const sample = treeSelectCheckableSamples.find(sample => sample.id === entry.id)!;
    const { body } = render(TreeSelectCheckableCase, { props: { sample } });
    const actual = readTreeSelectCheckableSSR(body);
    expect(actual).toEqual(entry.view);
    expect(actual.ignored).toEqual({ renderCalls: 0, iteratorCalls: 0, thenReads: 0 });
    expect(actual.ignoredContentPresent).toBe(false);
    expect(actual.leakedAttributes).toEqual([]);
    expect(actual.events).toEqual([]);
    expect(body).toContain('data-checkable-bound="false"');
    expect(output(body, 'ssr-resources')).toEqual({ root: null, editor: null, control: 'undefined' });
    expect(entry.resources).toEqual({ timers: 0, frames: 0, measurements: 0, microtasks: 0 });
    expect(entry.refs).toEqual({ control: null });
    expect(entry.callbacks).toEqual([]);
    const raw = output(body, 'raw-semantic');
    for (const slot of ['classNames', 'styles'] as const) {
      const original = entry.raw.semantic[slot];
      const snippet = sample.value === 'element-empty' || sample.value === 'element-rich';
      // Source React elements correspond to Native opaque Snippets; neither renderer runs.
      expect(raw[slot]).toEqual({
        type: snippet ? 'function' : original.type, scalar: original.scalar,
        arrayLength: original.arrayLength, sameOriginal: true, nativeSnippet: snippet
      });
    }
    expect(measure).not.toHaveBeenCalled();
    expect(frame).not.toHaveBeenCalled();
    expect(microtask).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    // Source's React development diagnostic is retained above; Native keeps its existing quiet policy.
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  } finally {
    warn.mockRestore();
    error.mockRestore();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  }
});
