import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import FormEventsFixtures from '../../browser/fixtures/FormEventsFixtures.svelte';
import observation from '../../browser/fixtures/ant-design-form-events-observation.json';
import registry from '../../porting-registry';

it('renders provider descendants without a provider element or events on the server', () => {
  const { body } = render(FormEventsFixtures);

  expect(observation.upstream).toMatchObject({
    release: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256
  });
  expect(body.match(/<form\b/g)).toHaveLength(4);
  const elements = body.replaceAll(/<!--[^]*?-->/g, '');
  expect(elements).toMatch(/<main id="form-events-fixture">\s*<form\b/);
  expect(body).toContain('name="alpha"');
  expect(body).not.toContain('unused-prefix');
  expect(body).not.toMatch(/<form\b[^>]*(onValuesChange|onFieldsChange)/);
  expect(body).toContain('<pre id="form-events">[]</pre>');
});
