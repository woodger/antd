import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import { expect, expectTypeOf, it } from 'vitest';
import { ConfigProvider, type ConfigProviderProps, type CSPConfig } from '@woodger/antd';
import registry from '../../porting-registry';
import Fixture from '../../browser/fixtures/ConfigProviderCspFixture.svelte';
import reference from '../../browser/fixtures/ant-design-config-provider-csp-reference.json';

it('exports CSPConfig and serializes inherited nonces on server-owned styles', () => {
  expectTypeOf<CSPConfig>().toEqualTypeOf<{ nonce?: string }>();
  expectTypeOf<ConfigProviderProps['csp']>().toEqualTypeOf<CSPConfig | undefined>();
  expectTypeOf<ComponentProps<typeof ConfigProvider>['csp']>()
    .toEqualTypeOf<ConfigProviderProps['csp']>();
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256
  });

  const { head, body } = render(Fixture);
  const styles = [...head.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/g)];
  for (const sample of reference.normal.initial) {
    const matches = styles.filter(([, , css]) => css.includes('.nonce-' + sample.scope + '-btn'));
    expect(matches.length).toBeGreaterThan(0);
    const nonces = matches.map(([, attrs]) => attrs.match(/\snonce="([^"]*)"/)?.[1] ?? '');
    expect([...new Set(nonces)]).toEqual(sample.nonces);
  }
  expect(body).toContain('id="inherit"');
  expect(body).not.toContain('nonce=');
});
