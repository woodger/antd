import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import Case from '../browser/fixtures/SelectComponentsResponsiveTagPrefixCase.svelte';
import { selectCustomTagPrefixSamples } from '../browser/select-components-responsive-tag-prefix-cases.mjs';
import { readSelectComponentsResponsiveTagPrefixSSR } from '../browser/select-components-responsive-tag-prefix-reference';
import type { SelectCustomTagPrefixCapture } from '../browser/select-components-responsive-tag-prefix-metrics.mjs';
import { verifyResponsiveTagPrefixSSR } from '../browser/select-components-responsive-tag-prefix-ssr-assertions';
for (const owner of readSelectComponentsResponsiveTagPrefixSSR().cases) for (const [serializer, source] of Object.entries(owner.server.serializations))
  it(`matches full responsive custom-tag/prefix public SSR ${owner.id}/${serializer}`, () => {
    vi.useFakeTimers();
    const resource = vi.fn(() => {
      throw Error('Responsive custom-tag/prefix SSR must stay DOM-free');
    });
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
      const sample = selectCustomTagPrefixSamples.find(sample => sample.id === owner.id)!;
      const capture: SelectCustomTagPrefixCapture = {}, rendered = render(
        Case,
        { props: { sample, capture } }
      );
      const head = rendered.head, body = rendered.body;
      expect(typeof head).toBe('string');
      verifyResponsiveTagPrefixSSR(
        body,
        capture.read!(),
        Object.fromEntries(Object.entries(capture.readRefs!()).map(([key, value]) => [key, value == null])),
        source,
        owner.id + '/' + serializer
      );
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
