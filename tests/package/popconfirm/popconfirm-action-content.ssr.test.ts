import { createRawSnippet, type ComponentProps } from 'svelte';
import { render } from 'svelte/server';
import { expect, expectTypeOf, it } from 'vitest';
import { Popconfirm, type ButtonContent, type ButtonType, type PopconfirmProps } from '@woodger/antd';
import registry from '../../porting-registry';
import reference from '../../browser/fixtures/ant-design-popconfirm-action-content-reference.json';

it('exports the action types and renders them in the hidden SSR panel', () => {
  expectTypeOf<PopconfirmProps['okText']>().toEqualTypeOf<ButtonContent>();
  expectTypeOf<PopconfirmProps['cancelText']>().toEqualTypeOf<ButtonContent>();
  expectTypeOf<PopconfirmProps['icon']>().toEqualTypeOf<ButtonContent>();
  expectTypeOf<ComponentProps<typeof Popconfirm>['okType']>()
    .toEqualTypeOf<ButtonType | 'danger' | undefined>();
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256
  });

  const { body } = render(Popconfirm, {
    props: {
      title: 'Confirm action',
      defaultOpen: true,
      children: createRawSnippet(() => ({ render: () => '<button type="button">Open</button>' })),
      okType: 'danger',
      okText: createRawSnippet(() => ({ render: () => '<strong>Run task</strong>' })),
      cancelText: 0,
      icon: 7
    }
  });
  const markup = body.replace(/<!--[\s\S]*?-->/g, '');

  expect(markup).toMatch(/role="dialog"[^>]*\shidden(?:[\s=>])/);
  expect(markup).toContain('<strong>Run task</strong>');
  expect(markup).toContain('>0</span>');
  expect(markup).toContain('>7</span>');
  expect(markup).toContain('ant-btn-color-dangerous');
  expect(markup).toContain('ant-btn-variant-outlined');
});
