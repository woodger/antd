import type { ComponentProps } from 'svelte';
import { render } from 'svelte/server';
import { expect, expectTypeOf, it } from 'vitest';
import {
  Modal, type GridResponsive, type ModalConfig, type ModalConfirmConfig, type ModalWidth
} from '@woodger/antd';
import registry from '../../porting-registry';
import reference from '../../browser/fixtures/ant-design-modal-layout-reference.json';

it('emits responsive sizes and placement CSS before any browser APIs', () => {
  expectTypeOf<ComponentProps<typeof Modal>['width']>().toEqualTypeOf<ModalWidth | undefined>();
  expectTypeOf<ModalWidth>().toEqualTypeOf<number | string | GridResponsive<number | string>>();
  expectTypeOf<ModalConfig['centered']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<ModalConfirmConfig['width']>().toEqualTypeOf<number | string | undefined>();
  expectTypeOf<ComponentProps<typeof Modal>['height']>()
    .toEqualTypeOf<ModalConfirmConfig['height']>();

  const { head, body } = render(Modal, { props: {
    open: true, width: { xs: 0, md: 420, xxxl: '65vw' },
    height: '40vh', centered: false, prefixCls: 'window'
  } });

  expect(body).toContain('--window-xs-width:0px');
  expect(body).toContain('--window-md-width:420px');
  expect(body).toContain('--window-xxxl-width:65vw');
  expect(body).toContain('height: 40vh');
  expect(body).toContain('data-ant-modal-top');
  expect(body).not.toMatch(/<dialog[^>]*\sopen(?:[\s=>])/);
  expect(head).toContain('@media(min-width:768px)');
  expect(head).toContain('var(--window-xxxl-width');
});

it('pins the repeated layout observations to the package upstream revision', () => {
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    source: 'package/dist/antd.min.js',
    repeat: 2
  });
  expect(reference.cases).toHaveLength(12);
});
