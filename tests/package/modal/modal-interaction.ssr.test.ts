import type { ComponentProps } from 'svelte';
import { render } from 'svelte/server';
import { expect, expectTypeOf, it } from 'vitest';
import {
  Modal, type ConfigProviderProps, type ModalConfirmConfig, type ModalConfirmFocusableConfig,
  type ModalConfig, type ModalFocusableConfig, type ModalMask, type ModalMaskConfig
} from '@woodger/antd';
import registry from '../../porting-registry';
import reference from '../../browser/fixtures/ant-design-modal-interaction-reference.json';
import ModalInteractionFixtures from '../../browser/fixtures/ModalInteractionFixtures.svelte';

it('exports the modal interaction options from the built package', () => {
  type Props = ComponentProps<typeof Modal>;

  expectTypeOf<Props['mask']>().toEqualTypeOf<ModalMask | undefined>();
  expectTypeOf<ModalMask>().toEqualTypeOf<boolean | ModalMaskConfig>();
  expectTypeOf<Props['focusable']>().toEqualTypeOf<ModalFocusableConfig | undefined>();
  expectTypeOf<Props['scrollLock']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<ConfigProviderProps['modal']>().toEqualTypeOf<ModalConfig | undefined>();
  expectTypeOf<ModalConfirmConfig['focusable']>()
    .toEqualTypeOf<ModalConfirmFocusableConfig | undefined>();
  expectTypeOf<ModalConfirmFocusableConfig['autoFocusButton']>()
    .toEqualTypeOf<'ok' | 'cancel' | null | undefined>();
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    source: 'package/dist/antd.min.js',
    repeat: 2
  });
});

it('prepares a closed managed dialog with a transparent click area for hydration', () => {
  const props = { initial: 'unmasked-no-lock', initiallyOpen: true };
  const { body } = render(ModalInteractionFixtures, { props });
  const dialog = body.match(/<dialog[^>]*>/)?.[0];
  const backdrop = body.match(/<div data-ant-modal-backdrop[^>]*>/)?.[0];

  expect(dialog).toContain('data-ant-modal-managed');
  expect(dialog).toContain('data-ant-dialog-unlocked');
  expect(dialog).not.toMatch(/\s(?:open|aria-modal)(?:[\s=>])/);
  expect(backdrop).toContain('aria-hidden="true"');
  expect(backdrop).not.toContain('data-ant-modal-mask');
  expect(body).toContain('interaction-editor');
});
