import { expect, it, vi } from 'vitest';
import { renderHydrationOwnership } from '../browser/fixtures/select-components-hydration-ownership.server';
import { readSelectComponentsHydrationOwnershipSource } from '../browser/select-components-hydration-ownership-reference';
import { verifyHydrationOwnershipSSR } from '../browser/select-components-hydration-ownership-ssr-assertions';

for (const entry of readSelectComponentsHydrationOwnershipSource().cases)
  for (const [method, original] of Object.entries(entry.server.serializations))
    for (const key of entry.scenario.environment.owners)
      it(`keeps independent ownership SSR DOM-free for ${entry.id}/${method}/${key}`, () => {
        vi.useFakeTimers();
        const touched = vi.fn(() => { throw Error('Ownership SSR must remain DOM-free'); });
        for (const name of ['getComputedStyle', 'requestAnimationFrame', 'queueMicrotask']) vi.stubGlobal(name, touched);
        for (const name of ['ResizeObserver', 'MutationObserver', 'MessageChannel']) vi.stubGlobal(name, class { constructor() { touched(); } });
        const warn = vi.spyOn(console, 'warn'), error = vi.spyOn(console, 'error');
        try {
          expect(typeof window).toBe('undefined'); expect(typeof document).toBe('undefined');
          const actual = renderHydrationOwnership(entry.id, key);
          verifyHydrationOwnershipSSR(actual, original.owners[key]!, entry.id + '/' + method + '/' + key);
          expect(touched).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
          expect(warn).not.toHaveBeenCalled(); expect(error).not.toHaveBeenCalled();
        } finally { warn.mockRestore(); error.mockRestore(); vi.unstubAllGlobals(); vi.useRealTimers(); }
      });
