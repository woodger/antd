import type { ComponentProps, Snippet } from 'svelte';
import { render } from 'svelte/server';
import { expect, expectTypeOf, it } from 'vitest';
import {
  ConfigProvider, Drawer, type DrawerClosable, type DrawerConfig, type DrawerSemantic
} from '@woodger/antd';
import registry from '@woodger/antd/porting/registry.json';
import Fixture from '../browser/fixtures/DrawerPanelFixtures.svelte';
import reference from '../browser/fixtures/ant-design-drawer-panel-reference.json';

it('exports the verified Drawer close and semantic panel types', () => {
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    source: 'package/dist/antd.min.js',
    repeat: 2
  });
  expectTypeOf<ComponentProps<typeof Drawer>['closable']>()
    .toEqualTypeOf<DrawerClosable | undefined>();
  expectTypeOf<ComponentProps<typeof Drawer>['classNames']>()
    .toEqualTypeOf<DrawerSemantic | undefined>();
  expectTypeOf<ComponentProps<typeof Drawer>['drawerRender']>()
    .toEqualTypeOf<Snippet<[Snippet]> | undefined>();
  expectTypeOf<ComponentProps<typeof Drawer>['panelRef']>()
    .toEqualTypeOf<HTMLDivElement | undefined>();
  expectTypeOf<ComponentProps<typeof ConfigProvider>['drawer']>()
    .toEqualTypeOf<DrawerConfig | undefined>();
});

it('renders the forced wrapped Skeleton before the dialog opens', () => {
  const { body } = render(Fixture, { props: { initialProfile: 'forced' } });

  expect(body).toMatch(/<dialog[^>]*id="study-root"/);
  expect(body).not.toMatch(/<dialog[^>]*\sopen(?:[\s=>])/);
  expect(body).toMatch(/id="render-host"[\s\S]*data-ant-drawer-section/);
  expect(body).toContain('ant-drawer-body-skeleton');
  expect(body.match(/<li\b/g)).toHaveLength(5);
  expect(body).not.toContain('id="body-input"');
  expect(body).toContain('id="footer-action"');
  expect(body).toMatch(/id="panel-ref-state"[^>]*>empty/);
});

it('preserves root class/style and layers the section styling separately', () => {
  const { body } = render(Fixture, {
    props: { initialProfile: 'semantic', initialOpen: true }
  });

  expect(body).toMatch(/<dialog[^>]*drawer-study[^>]*legacy-drawer-root/);
  expect(body).toMatch(/<dialog[^>]*--legacy-drawer-shell:yes;\s*--study-shared:root-style/);
  expect(body).toMatch(/data-ant-drawer-section[^>]*provider-panel[^>]*local-section/);
  expect(body).toContain('--local-section:outer-right-ready-end');
  expect(body).toContain('--local-body:inner-right-ready-end');
  expect(body).toMatch(/<button[^>]*aria-label="Provider close"[^>]*ant-drawer-close-end/);
});

it('renders a replacement without the original section or its contents', () => {
  const { body } = render(Fixture, {
    props: { initialProfile: 'replacing', initialOpen: true }
  });

  expect(body).toContain('id="replacement"');
  expect(body).not.toContain('data-ant-drawer-section');
  expect(body).not.toContain('id="body-input"');
});
