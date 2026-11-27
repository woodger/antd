import type { ComponentProps } from 'svelte';
import { render } from 'svelte/server';
import { expect, expectTypeOf, it, vi } from 'vitest';
import { Drawer, type DrawerMotionConfig, type DrawerMotionEvent } from '@woodger/antd';
import registry from '../../porting-registry';
import reference from '../../browser/fixtures/ant-design-drawer-motion-api-reference.json';

it('exports typed Drawer motion inputs and native phase events', () => {
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    source: 'package/dist/antd.min.js',
    repeat: 2
  });
  type Props = ComponentProps<typeof Drawer>;
  type End = Parameters<NonNullable<DrawerMotionConfig['onLeaveEnd']>>;
  expectTypeOf<Props['maskMotion']>().toEqualTypeOf<DrawerMotionConfig | undefined>();
  expectTypeOf<End[0]>().toEqualTypeOf<HTMLDivElement>();
  expectTypeOf<End[1]>().toEqualTypeOf<DrawerMotionEvent>();
});

it('keeps motion callbacks and transient classes out of server rendering', () => {
  const prepare = vi.fn();
  const factory = vi.fn(() => ({ motionName: 'panel-probe', onAppearPrepare: prepare }));
  const afterOpenChange = vi.fn();
  const { body } = render(Drawer, {
    props: {
      open: true,
      title: 'Animation',
      motion: factory,
      maskMotion: { motionName: 'mask-probe', onAppearPrepare: prepare },
      afterOpenChange
    }
  });

  expect(body).toContain('data-ant-drawer-section');
  expect(body).toContain('data-ant-drawer-mask');
  expect(body).not.toContain('panel-probe-appear');
  expect(body).not.toContain('mask-probe-appear');
  expect(factory).not.toHaveBeenCalled();
  expect(prepare).not.toHaveBeenCalled();
  expect(afterOpenChange).not.toHaveBeenCalled();
});

it('force renders a hidden custom mask only with a mounted owner', () => {
  const config = { mask: false, maskMotion: { forceRender: true }, title: 'Backdrop' };
  const closed = render(Drawer, { props: config });
  const retained = render(Drawer, { props: { ...config, forceRender: true } });

  expect(closed.body).not.toMatch(/<div data-ant-drawer-mask[\s=>]/);
  expect(retained.body).toMatch(/<div data-ant-drawer-mask[\s=][^>]*display:none/);
});
