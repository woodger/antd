import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { expect, expectTypeOf, it, vi } from 'vitest';
import {
  Dropdown, type DropdownMenuProps, type DropdownOpenChangeInfo, type DropdownProps, type MenuItemType
} from '@woodger/antd';
import registry from '../porting-registry';
import browser from '../browser/fixtures/ant-design-dropdown-menu-reference.json';
import server from '../browser/fixtures/ant-design-dropdown-menu-ssr-reference.json';

it('pins independent Dropdown Menu observations to the official package', () => {
  for (const capture of [browser, server]) {
    expect(capture).toMatchObject({
      version: registry.upstream.version,
      revision: registry.upstream.revision,
      archiveSha256: registry.upstream.archiveSha256
    });
    expect(capture.passes[1]).toEqual(capture.passes[0]);
  }
  expect(browser.passes[0]).toHaveLength(9);
  expect(server.passes[0]).toHaveLength(6);
  for (const record of server.passes[0]) {
    expect(record.callbacks).toEqual([]);
    expect(record.diagnostics).toEqual([]);
    expect(record.html).toContain('ant-dropdown-trigger');
    expect(record.html).not.toContain('role="menu"');
  }
});

it('renders typed nested Menu options inside the hidden native Dropdown shell', () => {
  const getPopupContainer = vi.fn<() => HTMLElement>();
  const onClick = vi.fn();
  const onOpenChange = vi.fn<(open: boolean) => void>();
  type OpenChange = NonNullable<DropdownProps['onOpenChange']>;
  expectTypeOf<OpenChange>().parameters.toEqualTypeOf<[boolean, DropdownOpenChangeInfo]>();
  expectTypeOf<DropdownOpenChangeInfo>().toEqualTypeOf<{ source: 'trigger' | 'menu'; }>();
  expectTypeOf(onOpenChange).toMatchTypeOf<OpenChange>();

  const items: readonly MenuItemType[] = [
    { key: 'branch', label: 'Branch', children: [{ key: 0, label: 'Leaf zero', onClick }] },
    { type: 'group', key: 'group', label: 'More actions', children: [{ key: 'child', label: 'Child' }] }
  ];
  const menu: DropdownMenuProps = {
    items, id: 'actions', mode: 'horizontal', prefixCls: 'command-list',
    forceSubMenuRender: true, defaultOpenKeys: ['branch'], getPopupContainer
  };
  const children = createRawSnippet(() => ({ render: () => '<button>Action trigger</button>' }));

  const rendered = render(Dropdown, { props: {
    children, menu, defaultOpen: true, getPopupContainer, onOpenChange,
    classNames: { root: 'command-panel', item: 'command-row', itemTitle: 'command-group' },
    styles: { item: 'font-size:17px' }
  } });

  expect(rendered.body).toContain('id="actions"');
  expect(rendered.body).toContain('command-list-vertical');
  expect(rendered.body).not.toContain('command-list-horizontal');
  expect(rendered.body).toContain('command-panel');
  expect(rendered.body).toContain('command-group');
  expect(rendered.body).toContain('command-row');
  expect(rendered.body).toContain('Leaf zero');
  expect(rendered.body).toMatch(/popover="manual"[^>]*\shidden(?:[\s=>])/);
  expect(rendered.body).toMatch(/<button[^>]*\stype="button"[^>]*data-dropdown-key="0"/);
  expect(rendered.head).toContain('dropdown-prefix:ant-dropdown:ant:command-list');
  expect(getPopupContainer).not.toHaveBeenCalled();
  expect(onClick).not.toHaveBeenCalled();
  expect(onOpenChange).not.toHaveBeenCalled();
});
