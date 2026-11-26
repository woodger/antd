import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { Popconfirm, Popover, Tooltip } from '@woodger/antd';
import registry from '../porting-registry';
import OverlayMotionFixtures from '../browser/fixtures/OverlayMotionFixtures.svelte';
import reference from '../browser/fixtures/ant-design-overlay-motion-reference.json';

describe('Overlay visibility motion public package', () => {
  it('publishes visibility callbacks and string motion names for all three overlays', () => {
    type Callback = ((open: boolean) => void) | undefined;
    type Motion = { motionName?: string } | undefined;

    expect(reference.reference).toMatchObject({
      version: registry.upstream.version,
      revision: registry.upstream.revision,
      archiveSha256: registry.upstream.archiveSha256
    });
    expectTypeOf<ComponentProps<typeof Tooltip>['afterOpenChange']>().toEqualTypeOf<Callback>();
    expectTypeOf<ComponentProps<typeof Popover>['afterOpenChange']>().toEqualTypeOf<Callback>();
    expectTypeOf<ComponentProps<typeof Popconfirm>['afterOpenChange']>().toEqualTypeOf<Callback>();
    expectTypeOf<ComponentProps<typeof Tooltip>['motion']>().toEqualTypeOf<Motion>();
    expectTypeOf<ComponentProps<typeof Popover>['motion']>().toEqualTypeOf<Motion>();
    expectTypeOf<ComponentProps<typeof Popconfirm>['motion']>().toEqualTypeOf<Motion>();
  });

  for (const [initialCase, { profile }] of reference.cases.entries()) {
    if (!['animated', 'initial', 'forced', 'destroy'].includes(profile.mode)) {
      continue;
    }

    it(`renders ${profile.family} ${profile.mode} without starting browser motion`, () => {
      vi.useFakeTimers();
      try {
        const { body } = render(OverlayMotionFixtures, { props: { initialCase } });
        const markup = body.replace(/<!--[\s\S]*?-->/g, '');

        expect(markup).toMatch(/popover="manual"[^>]*\shidden(?:[\s=>])/);
        expect(markup).not.toContain('data-ant-overlay-motion=');
        expect(markup).not.toMatch(/class="[^"]*zoom-big/);
        expect(markup).toContain('data-testid="motion-events">[]</output>');
        expect(vi.getTimerCount()).toBe(0);
      }
      finally {
        vi.useRealTimers();
      }
    });
  }
});
