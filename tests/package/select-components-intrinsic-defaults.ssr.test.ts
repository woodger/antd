import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import { expect, it, vi } from 'vitest';
import IntrinsicDefaults from '../browser/fixtures/SelectComponentsIntrinsicDefaultsSSR.svelte';
import { selectComponentEditorSSRView } from '../browser/select-components-editor-ssr-marker';

type Props = ComponentProps<typeof IntrinsicDefaults>;
for (const control of ['select', 'autocomplete'] as const)
  for (const kind of ['input-default', 'checkbox-default', 'textarea-leading-lf'] as const)
    it(`preserves public intrinsic SSR defaults ${control}/${kind}`, () => {
      vi.useFakeTimers();
      const resource = vi.fn(() => { throw Error('Intrinsic editor SSR must remain DOM-free'); });
      for (const name of ['getComputedStyle', 'requestAnimationFrame', 'queueMicrotask']) vi.stubGlobal(name, resource);
      for (const name of ['ResizeObserver', 'MutationObserver', 'MessageChannel']) vi.stubGlobal(name, class { constructor() { resource(); } });
      const warn = vi.spyOn(console, 'warn'), error = vi.spyOn(console, 'error');
      try {
        expect(typeof window).toBe('undefined'); expect(typeof document).toBe('undefined');
        const capture: NonNullable<Props['capture']> = {};
        const { body } = render(IntrinsicDefaults, { props: { control, kind, capture } });
        const fields = selectComponentEditorSSRView(body, true, control + '/' + kind).fields.filter(field => field.attributes
          .some(([name, value]) => name === 'data-intrinsic-defaults-editor' && value === kind));
        expect(fields).toHaveLength(1);
        const field = fields[0], attributes = Object.fromEntries(field.attributes);
        expect(field.attributes.some(([name]) => ['defaultvalue', 'defaultchecked'].includes(name))).toBe(false);
        if (kind === 'input-default') {
          expect(field.tag).toBe('input'); expect(attributes.type).toBe('text');
          expect(field.value).toBe('Native draft');
          expect(field.attributes.filter(([name]) => name === 'value')).toEqual([['value', 'Native draft']]);
        } else if (kind === 'checkbox-default') {
          expect(field.tag).toBe('input'); expect(attributes.type).toBe('checkbox');
          expect(field.attributes.filter(([name]) => name === 'checked')).toEqual([['checked', '']]);
          expect(Object.hasOwn(attributes, 'value')).toBe(false);
        } else {
          expect(field.tag).toBe('textarea'); expect(Object.hasOwn(attributes, 'value')).toBe(false);
          // React's controlled-textarea SSR contract preserves an authored first
          // LF by emitting two: the HTML parser consumes one immediately after
          // <textarea>. The shared field reader deliberately exposes raw text.
          const rawText = /<textarea\b[^>]*>([\s\S]*?)<\/textarea>/i.exec(body)?.[1];
          expect(rawText).toBe('\n\nNative draft'); expect(field.content).toBe(rawText);
          expect(field.content.slice(1)).toBe('\nNative draft');
        }
        expect(Object.values(capture.readRefs!()).every(value => value == null)).toBe(true);
        expect(resource).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
        expect(warn).not.toHaveBeenCalled(); expect(error).not.toHaveBeenCalled();
      } finally { warn.mockRestore(); error.mockRestore(); vi.unstubAllGlobals(); vi.useRealTimers(); }
    });
