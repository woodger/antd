import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  Drawer, type DrawerProps, type DrawerPushConfig, type DrawerResizableConfig
} from '@woodger/antd';
import reference from '../browser/fixtures/ant-design-drawer-geometry-reference.json';
import registry from '@woodger/antd/porting/registry.json';

describe('Drawer size, push and visibility in the public package', () => {
  it('exports the current options and keeps the independent UMD provenance', () => {
    expect(reference.reference).toMatchObject({
      version: registry.upstream.version,
      revision: registry.upstream.revision,
      archiveSha256: registry.upstream.archiveSha256,
      source: 'package/dist/antd.min.js',
      repeat: 2
    });
    expectTypeOf<ComponentProps<typeof Drawer>['resizable']>()
      .toEqualTypeOf<boolean | DrawerResizableConfig | undefined>();
    expectTypeOf<ComponentProps<typeof Drawer>['push']>()
      .toEqualTypeOf<boolean | DrawerPushConfig | undefined>();
    expectTypeOf<NonNullable<DrawerProps['afterOpenChange']>>()
      .toEqualTypeOf<(open: boolean) => void>();
  });

  it('renders the configured handle without opening the SSR dialog or notifying the owner', () => {
    const afterOpenChange = vi.fn();
    const onResizeStart = vi.fn();
    const onResizeEnd = vi.fn();
    const { body } = render(Drawer, { props: {
      open: true,
      title: 'Resize in browser',
      placement: 'top',
      defaultSize: 245,
      resizable: { onResizeStart, onResizeEnd },
      afterOpenChange
    } });

    expect(body).toContain('--ant-svelte-drawer-size: 245px');
    expect(body).toContain('ant-drawer-resizable-dragger-top');
    expect(body).toContain('aria-modal="true"');
    expect(body).not.toMatch(/<dialog[^>]*\sopen(?:[\s=>])/);
    expect(afterOpenChange).not.toHaveBeenCalled();
    expect(onResizeStart).not.toHaveBeenCalled();
    expect(onResizeEnd).not.toHaveBeenCalled();
  });
});
