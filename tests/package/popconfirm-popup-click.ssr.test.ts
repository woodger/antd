import { createRawSnippet, type ComponentProps } from 'svelte';
import { render } from 'svelte/server';
import { expect, expectTypeOf, it, vi } from 'vitest';
import { Popconfirm, type PopconfirmProps } from '@woodger/antd';
import registry from '@woodger/antd/porting/registry.json';
import reference from '../browser/fixtures/ant-design-popconfirm-popup-click-reference.json';

it('exports the native click contract without adding SSR work or changing markup', () => {
  expectTypeOf<PopconfirmProps['onPopupClick']>()
    .toEqualTypeOf<((event: MouseEvent) => void) | undefined>();
  expectTypeOf<ComponentProps<typeof Popconfirm>['onPopupClick']>()
    .toEqualTypeOf<PopconfirmProps['onPopupClick']>();
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256
  });

  const click = vi.fn<(event: MouseEvent) => void>();
  const props = {
    title: 'Confirm action',
    defaultOpen: true,
    children: createRawSnippet(() => ({ render: () => '<button>Open confirmation</button>' }))
  };
  const before = render(Popconfirm, { props });
  const after = render(Popconfirm, { props: { ...props, onPopupClick: click } });

  expect(after.body).toBe(before.body);
  expect(after.body).toContain('Confirm action');
  expect(click).not.toHaveBeenCalled();
});
