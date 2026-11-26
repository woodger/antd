import { createRawSnippet, type ComponentProps } from 'svelte';
import { render } from 'svelte/server';
import { expect, expectTypeOf, it, vi } from 'vitest';
import { Modal, type ModalConfirmConfig, type ModalMousePosition } from '@woodger/antd';
import registry from '../porting-registry';
import reference from '../browser/fixtures/ant-design-modal-motion-reference.json';

it('exports the transition options and explicit page coordinates', () => {
  type Props = ComponentProps<typeof Modal>;
  type MotionFields = 'transitionName' | 'maskTransitionName' | 'mousePosition';
  expectTypeOf<Pick<Props, MotionFields>>().toEqualTypeOf<Pick<ModalConfirmConfig, MotionFields>>();
  expectTypeOf<Props['mousePosition']>().toEqualTypeOf<ModalMousePosition | null | undefined>();
  expectTypeOf<ModalMousePosition>().toEqualTypeOf<{ x: number; y: number }>();

  expect(reference.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    repeat: 2
  });
  expect(reference.cases).toHaveLength(10);
  expect(reference.lifetimes).toHaveLength(7);
  expect(reference.special).toHaveLength(2);
});

it('renders a static named mask without activating browser motion or its notifications', () => {
  expect(typeof document).toBe('undefined');
  const afterOpenChange = vi.fn();
  const children = createRawSnippet(() => ({ render: () => '<span>SSR motion body</span>' }));

  const { body } = render(Modal, { props: {
    open: true, transitionName: 'probe-panel', maskTransitionName: 'probe-mask',
    mousePosition: { x: 120, y: 300 }, afterOpenChange, children
  } });

  expect(body).toContain('data-ant-modal-element-mask');
  expect(body).toContain('data-ant-modal-backdrop');
  expect(body).toContain('data-ant-modal-panel');
  expect(body).not.toMatch(/<dialog[^>]*\sopen(?:[\s=>])/);
  expect(body).not.toContain('probe-panel-appear');
  expect(body).not.toContain('transform-origin');
  expect(afterOpenChange).not.toHaveBeenCalled();
});
