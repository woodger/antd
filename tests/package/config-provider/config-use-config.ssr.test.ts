import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import ConfigProviderUseConfigFixtures from '../../browser/fixtures/ConfigProviderUseConfigFixtures.svelte';
import reference from '../../browser/fixtures/ant-design-config-use-config-reference.json';
import registry from '../../porting-registry';

/** Reads the probe outputs from the server document without running any browser effects. */
function serverScopes(body: string) {
  const html = body.replace(/<!--[^]*?-->/g, '');
  const outputs = html.matchAll(/<output\b[^>]*data-config-scope="([^"]+)"[^>]*>([^<]*)<\/output>/g);

  return Object.fromEntries(Array.from(outputs, ([, name, value]) => [name, JSON.parse(value)]));
}

describe('ConfigProvider.useConfig in the public package', () => {
  it('pins the context observations to the upstream archive', () => {
    expect(reference.reference).toMatchObject({
      version: registry.upstream.version,
      revision: registry.upstream.revision,
      archiveSha256: registry.upstream.archiveSha256,
      source: 'package/dist/antd.min.js'
    });
  });

  it('keeps an unconfigured size absent while reading explicit nested sizes in SSR', () => {
    const { body } = render(ConfigProviderUseConfigFixtures);

    expect(serverScopes(body)).toMatchObject({
      ...reference.phases[0].scopes,
      ...reference.submission.before
    });
  });

  it('reads the inherited settings and the Modal footer reset before hydration', () => {
    const { body } = render(ConfigProviderUseConfigFixtures, { props: { initialInherited: true } });

    expect(serverScopes(body)).toMatchObject({
      ...reference.phases[1].scopes,
      ...reference.modal.scopes
    });
  });
});
