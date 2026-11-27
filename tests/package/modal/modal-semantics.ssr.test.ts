import type { ComponentProps, Snippet } from 'svelte';
import { expect, expectTypeOf, it } from 'vitest';
import {
  Modal, type ConfigProviderProps, type ModalConfig, type ModalConfirmConfig, type ModalProps,
  type ModalSurfaceProps, type ModalWrapProps
} from '@woodger/antd';
import registry from '../../porting-registry';
import reference from '../../browser/fixtures/ant-design-modal-semantics-reference.json';
import { renderModalSemantics } from '../../browser/fixtures/modal-semantics.server';

it('publishes the typed semantic parts for Modal, context and confirmations', () => {
  type Props = ComponentProps<typeof Modal>;
  type SurfaceKeys = keyof ModalSurfaceProps;
  expectTypeOf<Pick<Props, SurfaceKeys>>().toEqualTypeOf<Pick<ModalProps, SurfaceKeys>>();
  expectTypeOf<Pick<ModalConfirmConfig, SurfaceKeys>>().toEqualTypeOf<ModalSurfaceProps>();
  expectTypeOf<NonNullable<ConfigProviderProps['modal']>>().toEqualTypeOf<ModalConfig>();
  expectTypeOf<Props['modalRender']>().toEqualTypeOf<Snippet<[Snippet]> | undefined>();
  expectTypeOf<Props['panelRef']>().toEqualTypeOf<HTMLDialogElement | undefined>();
  expectTypeOf<ModalConfirmConfig['panelRef']>()
    .toEqualTypeOf<((node: HTMLDialogElement | undefined) => void) | undefined>();
  expectTypeOf<Extract<keyof ModalWrapProps, 'open' | 'inert' | 'onclose' | 'oncancel'>>()
    .toEqualTypeOf<never>();

  expect(reference.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    source: 'package/dist/antd.min.js',
    repeat: 2
  });
  expect(reference.cases).toHaveLength(10);
  expect(reference.pointer).toMatchObject({ repeat: 2, wrapperReceivesPointer: true });
});

it('renders semantic classes and the custom renderer before activation', () => {
  const { body } = renderModalSemantics('render');

  const shell = body.match(/<dialog[^>]+>/)?.[0];
  expect(shell).toContain('explicit-root local-root explicit-wrapper local-wrapper');
  expect(shell).toContain('--raw-root:raw-root');
  expect(shell).not.toMatch(/\sopen(?:[\s=>])/);
  expect(body).toContain('data-ant-modal-mask-layer');
  expect(body).toMatch(/<div[^>]*data-ant-modal-mask[\s=>][^>]*local-mask/);
  expect(body.indexOf('data-custom-render')).toBeLessThan(body.indexOf('data-ant-modal-container'));
  expect(body).toContain('ant-modal-body local-body');
  expect(body).toContain('id="modal-semantic-editor"');
});

it('replaces only the requested parts and keeps native dialog attrs on SSR', () => {
  const { body } = renderModalSemantics('native-props');

  const shell = body.match(/<dialog[^>]+>/)?.[0];
  expect(shell).toContain('data-extra="wrapper"');
  expect(shell).toContain('replacement-wrap');
  expect(shell).not.toContain('local-wrapper');
  expect(shell).toMatch(/--winner:wrapProps;\s*z-index:1200/);
  expect(body).toMatch(/<div[^>]*data-extra="mask"[^>]*replacement-mask/);
  expect(body).toMatch(/<div[^>]*data-extra="body"[^>]*aria-label="body props"[^>]*replacement-body/);
});
