import { render } from 'svelte/server';
import type { ComponentProps, Snippet } from 'svelte';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { Tooltip, type SliderTooltipConfig, type TooltipProps } from '@woodger/antd';
import registry from '@woodger/antd/porting/registry.json';
import Fixture from '../browser/fixtures/TooltipUniqueFixtures.svelte';
import reference from '../browser/fixtures/ant-design-tooltip-unique-reference.json';

describe('Compound Tooltip.UniqueProvider package API', () => {
  it('exports the shared-provider constructor and supports Tooltip and Slider opt-out', () => {
    expect(reference.reference).toMatchObject({
      version: registry.upstream.version,
      revision: registry.upstream.revision,
      archiveSha256: registry.upstream.archiveSha256,
      source: 'package/dist/antd.min.js',
      repeat: 2
    });
    expectTypeOf<ComponentProps<typeof Tooltip.UniqueProvider>>()
      .toEqualTypeOf<{ children: Snippet; }>();
    expectTypeOf<TooltipProps['unique']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<SliderTooltipConfig['unique']>().toEqualTypeOf<TooltipProps['unique']>();
  });

  for (const initialMode of ['switch', 'default-open', 'nested-providers']) {
    it(`renders ${initialMode} triggers without resolving a shared portal on the server`, () => {
      vi.useFakeTimers();
      try {
        const { body } = render(Fixture, { props: { initialMode } });

        expect(body).toContain('id="unique-trigger-a"');
        expect(body).toContain('id="unique-trigger-b"');
        expect(body).toMatch(/data-testid="unique-getters" hidden(?:="")?>0<\/output>/);
        expect(body).not.toContain('data-ant-tooltip-unique=');
        expect(body).not.toContain('data-study-content');
        expect(vi.getTimerCount()).toBe(0);
      }
      finally {
        vi.useRealTimers();
      }
    });
  }
});
