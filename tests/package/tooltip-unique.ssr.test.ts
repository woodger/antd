import { render } from 'svelte/server';
import type { ComponentProps, Snippet } from 'svelte';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  Popconfirm, Popover, Tooltip, type PopconfirmProps, type PopoverProps,
  type SliderTooltipConfig, type TooltipProps
} from '@woodger/antd';
import registry from '../porting-registry';
import Fixture from '../browser/fixtures/TooltipUniqueFixtures.svelte';
import Delegates from '../browser/fixtures/TooltipUniqueDelegateFixtures.svelte';
import reference from '../browser/fixtures/ant-design-tooltip-unique-reference.json';
import delegateReference from '../browser/fixtures/ant-design-tooltip-unique-delegates-reference.json';

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

  it('exports the opt-in on Popover and Popconfirm and keeps their default-open shared DOM lazy', () => {
    expect(delegateReference.reference).toEqual(reference.reference);
    expectTypeOf<ComponentProps<typeof Popover>['unique']>().toEqualTypeOf<PopoverProps['unique']>();
    expectTypeOf<ComponentProps<typeof Popconfirm>['unique']>().toEqualTypeOf<PopconfirmProps['unique']>();
    expectTypeOf<PopoverProps['unique']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<PopconfirmProps['unique']>().toEqualTypeOf<boolean | undefined>();

    const { body } = render(Delegates, { props: { initialMode: 'default-open' } });
    expect(body).toContain('id="unique-delegate-a"');
    expect(body).toContain('id="unique-delegate-b"');
    expect(body).not.toContain('data-ant-tooltip-unique=');
    expect(body).not.toContain('data-ant-popover=""');
    expect(body).not.toContain('data-study-content=');
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
