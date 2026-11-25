import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  ConfigProvider, Drawer, type DrawerConfig, type DrawerFocusableConfig, type DrawerMask
} from '@woodger/antd';
import registry from '@woodger/antd/porting/registry.json';
import Fixture from '../browser/fixtures/DrawerFocusFixtures.svelte';
import reference from '../browser/fixtures/ant-design-drawer-focus-reference.json';

describe('Drawer mask and focus public package controls', () => {
  it('exports the mask union and provider focus configuration', () => {
    expect(reference.reference).toMatchObject({
      version: registry.upstream.version,
      revision: registry.upstream.revision,
      archiveSha256: registry.upstream.archiveSha256,
      source: 'package/dist/antd.min.js',
      repeat: 2
    });
    expectTypeOf<ComponentProps<typeof Drawer>['mask']>().toEqualTypeOf<DrawerMask | undefined>();
    expectTypeOf<ComponentProps<typeof Drawer>['focusable']>()
      .toEqualTypeOf<DrawerFocusableConfig | undefined>();
    expectTypeOf<ComponentProps<typeof ConfigProvider>['drawer']>()
      .toEqualTypeOf<DrawerConfig | undefined>();
  });

  it('renders a focusable maskless shell without opening it on the server', () => {
    const { body } = render(Fixture, {
      props: { initialProfile: 'provider-mask', initialOpen: true }
    });

    expect(body).toContain('id="a-root"');
    expect(body).toContain('id="a-last"');
    expect(body).toMatch(/<dialog[^>]*tabindex="-1"/);
    expect(body).not.toMatch(/<dialog[^>]*\sopen(?:[\s=>])/);
    expect(body).not.toMatch(/data-ant-drawer-mask(?:[\s=>])/);
    expect(body).not.toContain('aria-modal=');
  });

  it('keeps provider blur when the caller re-enables the mask', () => {
    const { body } = render(Fixture, {
      props: { initialProfile: 'local-mask-fields', initialOpen: true }
    });

    expect(body).toContain('ant-drawer-mask-blur');
    expect(body).toContain('aria-modal="true"');
    expect(body).not.toMatch(/<dialog[^>]*\sopen(?:[\s=>])/);
  });
});
