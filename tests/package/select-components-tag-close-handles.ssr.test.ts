import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import Case from '../browser/fixtures/SelectComponentsTagCloseHandlesCase.svelte';
import { selectTagCloseHandleSamples } from '../browser/select-components-tag-close-handles-cases.mjs';
import { readSelectTagCloseHandlesSSR } from '../browser/select-components-tag-close-handles-reference';
import type { SelectTagCloseHandleCapture } from '../browser/select-components-tag-close-handles-metrics.mjs';
import { verifyTagCloseHandleSSR } from '../browser/select-components-tag-close-handles-ssr-assertions';
import type { NativeOwner } from '../browser/select-components-tag-close-handles-assertions';
for (const owner of readSelectTagCloseHandlesSSR().cases) for (const [serializer, source] of Object.entries(owner.server.serializations))
  it(`matches actual unbounded callback public DOM-free SSR ${owner.id}/${serializer}`, () => {
    const touched: string[] = [], resource = (name: string) => () => { touched.push(name); throw Error('Public SSR attempted ' + name); };
    const warn = vi.spyOn(console, 'warn'), error = vi.spyOn(console, 'error');
    for (const name of ['setTimeout', 'setInterval', 'requestAnimationFrame', 'queueMicrotask', 'getComputedStyle']) vi.stubGlobal(name, resource(name));
    for (const name of ['ResizeObserver', 'MutationObserver', 'MessageChannel']) vi.stubGlobal(name, class { constructor() { resource(name)(); } });
    try {
      expect(typeof window).toBe('undefined'); expect(typeof document).toBe('undefined');
      const sample = selectTagCloseHandleSamples.find(sample => sample.id === owner.id)!;
      const capture: SelectTagCloseHandleCapture = {}, result = render(Case, { props: { sample, capture } });
      verifyTagCloseHandleSSR(result.body, capture.read!() as NativeOwner, Object.fromEntries(Object.entries(capture.readRefs!())
        .map(([key, value]) => [key, value == null])), source, sample, owner.id + '/' + serializer);
      expect(touched).toEqual([]); expect(warn).not.toHaveBeenCalled(); expect(error).not.toHaveBeenCalled();
    } finally { warn.mockRestore(); error.mockRestore(); vi.unstubAllGlobals(); }
  });
