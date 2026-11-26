import { createRawSnippet, type ComponentProps } from 'svelte';
import { render } from 'svelte/server';
import { expect, expectTypeOf, it, vi } from 'vitest';
import { Modal, type ModalConfirmConfig, type ModalProps } from '@woodger/antd';
import registry from '../porting-registry';
import reference from '../browser/fixtures/ant-design-modal-lifecycle-reference.json';

it('exports the lifecycle options and pins the repeated upstream observation', () => {
  type Props = ComponentProps<typeof Modal>;
  type LifecycleKeys = 'forceRender' | 'destroyOnHidden' | 'afterClose' | 'afterOpenChange';
  expectTypeOf<Pick<Props, LifecycleKeys>>().toEqualTypeOf<Pick<ModalProps, LifecycleKeys>>();
  expectTypeOf<Pick<ModalConfirmConfig, LifecycleKeys>>()
    .toEqualTypeOf<Pick<ModalProps, LifecycleKeys>>();
  expectTypeOf<Props['afterOpenChange']>().toEqualTypeOf<((open: boolean) => void) | undefined>();

  expect(reference.reference).toEqual({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    source: 'package/dist/antd.min.js',
    repeat: 2
  });
});

it.each([
  { settings: {}, mounted: true },
  { settings: { forceRender: false }, mounted: false },
  { settings: { destroyOnHidden: true }, mounted: false },
  { settings: { forceRender: true, destroyOnHidden: true }, mounted: true },
  { settings: { open: true, destroyOnHidden: true }, mounted: true }
])('keeps a nonmodal SSR surface only when the lifecycle requests it $settings',
  ({ settings, mounted }) => {
    const renderBody = vi.fn(() => '<span data-lifecycle-body></span>');
    const children = createRawSnippet(() => ({ render: renderBody }));
    const afterClose = vi.fn();
    const afterOpenChange = vi.fn();

    const { body } = render(Modal, { props: { ...settings, children, afterClose, afterOpenChange } });

    expect(body.includes('<dialog')).toBe(mounted);
    expect(body.includes('data-lifecycle-body')).toBe(mounted);
    expect(body).not.toMatch(/<dialog[^>]*\sopen(?:[\s=>])/);
    expect(renderBody).toHaveBeenCalledTimes(Number(mounted));
    expect(afterClose).not.toHaveBeenCalled();
    expect(afterOpenChange).not.toHaveBeenCalled();
  });
