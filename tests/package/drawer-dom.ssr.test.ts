import type { ComponentProps } from 'svelte';
import { render } from 'svelte/server';
import { expect, expectTypeOf, it } from 'vitest';
import { Drawer, type DrawerContent } from '@woodger/antd';
import registry from '@woodger/antd/porting/registry.json';
import Fixture from '../browser/fixtures/DrawerDomFixtures.svelte';
import reference from '../browser/fixtures/ant-design-drawer-dom-reference.json';

it('exports the typed Drawer content, native panel events and DOM attributes', () => {
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    source: 'package/dist/antd.min.js',
    repeat: 2
  });
  type Props = ComponentProps<typeof Drawer>;
  type Click = Parameters<NonNullable<Props['onclick']>>[0];
  type Focus = Parameters<NonNullable<Props['onfocusin']>>[0];
  expectTypeOf<Props['title']>().toEqualTypeOf<DrawerContent | undefined>();
  expectTypeOf<Props['footer']>().toEqualTypeOf<DrawerContent | undefined>();
  expectTypeOf<Props['aria-description']>().toEqualTypeOf<string | null | undefined>();
  expectTypeOf<Props['data-ready']>().toEqualTypeOf<string | boolean | number | null | undefined>();
  expectTypeOf<Click['currentTarget']>().toMatchTypeOf<HTMLDivElement>();
  expectTypeOf<Click>().toMatchTypeOf<MouseEvent>();
  expectTypeOf<Focus>().toMatchTypeOf<FocusEvent>();
});

it('renders scalar content and selects the heading id for its label in SSR', () => {
  const { body } = render(Fixture, { props: { initialOpen: true } });

  expect(body).toContain('aria-labelledby="dom-root-title"');
  expect(body).toMatch(/<h2[^>]*id="dom-root-title"[^>]*>[\s\S]*?0[\s\S]*?<\/h2>/);
  expect(body).toMatch(/data-ant-drawer-extra[^>]*>[\s\S]*?0[\s\S]*?<\/div>/);
  expect(body).toMatch(/data-ant-drawer-footer[^>]*>[\s\S]*?0[\s\S]*?<\/div>/);
});

it('assigns ARIA, mask classes and falsy wrapper data to the right SSR nodes', () => {
  const { body } = render(Fixture, { props: { initialProfile: 'attrs', initialOpen: true } });
  const dialog = body.match(/<dialog\b[^>]*>/)?.[0] ?? '';
  const wrapper = body.match(/<div[^>]*data-ant-drawer-content-wrapper[^>]*>/)?.[0] ?? '';
  const section = body.match(/<div[^>]*data-ant-drawer-section[^>]*>/)?.[0] ?? '';

  expect(dialog).toContain('role="alertdialog"');
  expect(dialog).toContain('id="product-dialog"');
  expect(dialog).toContain('aria-modal="false"');
  expect(dialog).toContain('aria-keyshortcuts="Control+Enter"');
  expect(dialog).not.toContain('data-count');
  expect(wrapper).toContain('data-count="0"');
  expect(wrapper).toContain('data-ready="false"');
  expect(wrapper).toContain('data-empty=""');
  expect(wrapper).not.toContain('aria-label');
  expect(section).not.toContain('aria-label');
  expect(section).not.toContain('data-ready');
  expect(body).toMatch(/data-ant-drawer-mask[^>]*mask-semantic mask-custom/);
});
