import { createRawSnippet, type ComponentProps } from 'svelte';
import { render } from 'svelte/server';
import { expect, expectTypeOf, it } from 'vitest';
import { Popconfirm, type PopconfirmProps, type PopconfirmSemanticProps } from '@woodger/antd';
import registry from '../../porting-registry';
import reference from '../../browser/fixtures/ant-design-popconfirm-action-links-reference.json';

it('renders href in the hidden SSR shell and infers click targets from the public props', () => {
  expectTypeOf<ComponentProps<typeof Popconfirm>['okButtonProps']>()
    .toEqualTypeOf<PopconfirmProps['okButtonProps']>();
  expectTypeOf<ComponentProps<typeof Popconfirm<string>>['okButtonProps']>()
    .toEqualTypeOf<PopconfirmProps<string>['okButtonProps']>();
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256
  });

  const { body } = render(Popconfirm<string>, {
    props: {
      title: 'Review links',
      defaultOpen: true,
      children: createRawSnippet(() => ({ render: () => '<button type="button">Open</button>' })),
      classNames: ({ props }) => {
        expectTypeOf(props).toEqualTypeOf<PopconfirmSemanticProps<string>>();
        return props.okButtonProps?.href === '#confirmed' ? { root: 'link-action-confirm' } : {};
      },
      okButtonProps: {
        href: '#confirmed',
        onClick: event => {
          expectTypeOf(event.currentTarget).toEqualTypeOf<EventTarget & HTMLAnchorElement>();
        },
        onclick: event => {
          expectTypeOf(event.currentTarget).toEqualTypeOf<EventTarget & HTMLAnchorElement>();
        }
      },
      cancelButtonProps: {
        onclick: event => {
          expectTypeOf(event.currentTarget).toEqualTypeOf<EventTarget & HTMLButtonElement>();
        }
      }
    }
  });

  expect(body).toMatch(/role="dialog"[^>]*\shidden(?:[\s=>])/);
  expect(body).toContain('link-action-confirm');
  expect(body).toMatch(/<a[^>]*href="#confirmed"/);
  expect(body).toMatch(/<button[^>]*type="button"[^>]*ant-btn/);
});
