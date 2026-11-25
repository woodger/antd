import { createRawSnippet, type ComponentProps, type Snippet } from 'svelte';
import { render } from 'svelte/server';
import { expect, expectTypeOf, it, vi } from 'vitest';
import {
  Modal, type ConfigProviderProps, type ModalButtonProps, type ModalConfirmConfig,
  type ModalFooter, type ModalFooterButtons
} from '@woodger/antd';
import registry from '@woodger/antd/porting/registry.json';
import reference from '../browser/fixtures/ant-design-modal-actions-reference.json';
import { renderModalActions } from '../browser/fixtures/modal-actions.server';

it('exports the footer, close and button options on all three maintained entry points', () => {
  type Props = ComponentProps<typeof Modal>;
  type ActionKeys = 'okButtonProps' | 'cancelButtonProps' | 'okType' | 'footer'
    | 'closeIcon' | 'closable';
  type ConfigKeys = 'okButtonProps' | 'cancelButtonProps' | 'closeIcon' | 'closable';
  type Config = NonNullable<ConfigProviderProps['modal']>;
  expectTypeOf<Pick<Props, ActionKeys>>().toEqualTypeOf<Pick<ModalConfirmConfig, ActionKeys>>();
  expectTypeOf<Pick<Props, ConfigKeys>>().toEqualTypeOf<Pick<Config, ConfigKeys>>();
  expectTypeOf<Props['okButtonProps']>().toEqualTypeOf<ModalButtonProps | undefined>();
  expectTypeOf<Snippet>().toExtend<ModalFooter>();
  expectTypeOf<Parameters<ModalFooter>>().toEqualTypeOf<[Snippet, ModalFooterButtons]>();

  expect(reference.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    repeat: 2
  });
  expect(reference.ordinary).toHaveLength(11);
  expect(reference.confirmation).toHaveLength(10);
  expect(reference.overrides).toHaveLength(20);
});

it('renders configured footer parts in source order before browser activation', () => {
  const { body } = renderModalActions();

  expect(body).toContain('data-footer-contract="true"');
  expect(body).toContain('title="Parent action"');
  expect(body).toContain('title="Parent cancel"');
  expect(body).toContain('ant-btn-variant-dashed');
  expect(body.indexOf('id="local-ok"')).toBeLessThan(body.indexOf('id="parent-cancel"'));
  expect(body).toContain('aria-label="Parent dismiss"');
  expect(body).toContain('data-probe-close-icon="provider"');
  expect(body).not.toMatch(/<dialog[^>]*\sopen(?:[\s=>])/);
});

it('passes the snippets to a custom footer and leaves all action callbacks idle on SSR', () => {
  const onOk = vi.fn();
  const onClose = vi.fn();
  const afterClose = vi.fn();
  const footer = createRawSnippet<[Snippet, ModalFooterButtons]>((origin, buttons) => ({
    render: () => {
      const parts = [origin(), buttons().OkBtn, buttons().CancelBtn];
      return `<span data-received="${parts.every(part => typeof part === 'function')}"></span>`;
    }
  }));

  const { body } = render(Modal, { props: {
    open: true, footer, onOk, closable: { onClose, afterClose, closeIcon: null }
  } });

  expect(body).toContain('data-received="true"');
  expect(body).toContain('data-ant-modal-close');
  expect(body).not.toContain('data-ant-modal-close-x');
  expect(onOk).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
  expect(afterClose).not.toHaveBeenCalled();
});
