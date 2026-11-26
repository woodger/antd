import {
  ConfigProvider, Modal, ModalHolder, createModal,
  type GlobalConfigProps, type ModalStaticConfig, type ModalStaticHandle
} from '@woodger/antd';
import registry from '../porting-registry';
import type { ComponentProps } from 'svelte';
import { render } from 'svelte/server';
import { expect, expectTypeOf, it, vi } from 'vitest';
import reference from '../browser/fixtures/ant-design-modal-static-reference.json';

it('publishes non-thenable static handles alongside the ordinary Modal component', () => {
  expectTypeOf<Parameters<typeof Modal.confirm>>().toEqualTypeOf<[ModalStaticConfig]>();
  expectTypeOf<ReturnType<typeof Modal.confirm>>().toEqualTypeOf<ModalStaticHandle>();
  expectTypeOf<Extract<'then', keyof ModalStaticHandle>>().toEqualTypeOf<never>();
  expectTypeOf<typeof ConfigProvider.config>().toEqualTypeOf<(options: GlobalConfigProps) => void>();
  expectTypeOf<ComponentProps<typeof Modal>['panelRef']>().toEqualTypeOf<HTMLDialogElement | undefined>();
  expect(Modal).not.toHaveProperty('warn');
  expect(Modal).not.toHaveProperty('config');

  expect(reference.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    source: 'package/dist/antd.min.js',
    repeat: 2
  });
  expect(reference.cases).toHaveLength(12);
  expect(reference.lifecycle).toHaveLength(9);
});

it('leaves no global render or timer in SSR and keeps request-owned confirmations', () => {
  const afterClose = vi.fn();
  const update = vi.fn();
  const modal = createModal();
  modal.confirm({ title: 'Request modal' });

  vi.useFakeTimers();
  try {
    ConfigProvider.config({ prefixCls: 'server-global' });
    const handle = Modal.confirm({ title: 'Browser only', afterClose });
    handle.update(update);
    handle.destroy();
    Modal.destroyAll();

    const { body } = render(ModalHolder, { props: { modal } });
    expect(body).toContain('Request modal');
    expect(body).not.toContain('Browser only');
    expect(body).not.toContain('server-global');
    expect(update).not.toHaveBeenCalled();
    expect(afterClose).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  }
  finally {
    vi.useRealTimers();
  }
});

it('updates the type and direction of a request-owned confirmation without opening it on SSR', () => {
  const modal = createModal();
  const handle = modal.confirm({ title: 'Change type' });
  handle.update({ type: 'success', direction: 'rtl' });

  const { body } = render(ModalHolder, { props: { modal } });

  expect(body).toContain('ant-modal-confirm-success');
  expect(body).toContain('ant-modal-confirm-rtl');
  expect(body).toMatch(/<dialog[^>]*\bdir="rtl"/);
  expect(body).not.toContain('data-ant-modal-action="cancel"');
  expect(body).not.toMatch(/<dialog[^>]*\sopen(?:[\s=>])/);
});
