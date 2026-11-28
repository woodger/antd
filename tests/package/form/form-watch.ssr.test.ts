import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import FormWatchFixtures from '../../browser/fixtures/FormWatchFixtures.svelte';
import observation from '../../browser/fixtures/ant-design-form-watch-observation.json';
import registry from '../../porting-registry';

it('matches the source initial watch and context values before client effects run', () => {
  const { body } = render(FormWatchFixtures);
  const entries = [...body.matchAll(/<output data-watch="([^"]+)">([^<]*)<\/output>/g)]
    .filter(([, name]) => name !== 'swap-context')
    .map(([, name, snapshot]) => [name, JSON.parse(snapshot)]);

  expect(observation.upstream).toMatchObject({
    release: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256
  });
  expect(Object.fromEntries(entries)).toEqual(observation.ssr);
  expect(body).toContain('<pre id="watch-effects">[]</pre>');
});
