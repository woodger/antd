import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import { expect, it, vi } from 'vitest';
import OwnStyleCase from '../../browser/fixtures/SelectComponentsOwnStyleCase.svelte';
import { readSelectComponentsOwnStyleInitSSR } from '../../browser/select-components-own-style-init-reference';
import { verifyOwnStyleSSR } from '../../browser/select-components-own-style-init-ssr-assertions';
import type { NativeOwnStyleOwner } from '../../browser/select-components-own-style-init-assertions';
type Capture = NonNullable<ComponentProps<typeof OwnStyleCase>['capture']>;
for (const entry of readSelectComponentsOwnStyleInitSSR().cases) for (const [method, source] of Object.entries(entry.server))
  it(`matches own CSS DOM-free SSR ${entry.id}/${method}`, () => {
    vi.useFakeTimers();
    const resource = vi.fn(() => { throw Error('Own-style SSR must stay DOM-free'); });
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
      const capture: Capture = {}, rendered = render(
        OwnStyleCase,
        { props: { sample: { ...entry.sample, profile: 'same' }, capture } }
      );
      const html = rendered.body;
      expect(html.length).toBeGreaterThan(0);
      verifyOwnStyleSSR(html, capture.read!() as NativeOwnStyleOwner,
        Object.fromEntries(Object.entries(capture.readRefs!()).map(([key, value]) => [key, value == null])), source, entry.sample, entry.id + '/' + method);
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
