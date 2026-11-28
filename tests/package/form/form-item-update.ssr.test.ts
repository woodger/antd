import { render } from 'svelte/server';
import { expect, test } from 'vitest';
import observation from '../../browser/fixtures/ant-design-form-item-update-observation.json';
import FormItemUpdateFixtures from '../../browser/fixtures/FormItemUpdateFixtures.svelte';
import registry from '../../porting-registry';

test('FormItem renders initial selected values on SSR without running update predicates', () => {
  expect(observation.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256
  });

  const { body } = render(FormItemUpdateFixtures);
  const html = body.replace(/<!--[^]*?-->/g, '');
  for (const [id, values] of Object.entries(observation.ssr.rendered)) {
    expect(html).toContain(`<output id="${id}">${JSON.stringify(values)}</output>`);
  }
  expect(html).toContain('<output id="form-update-events">[]</output>');
  expect(html).toContain('<output id="named-events">[]</output>');
});
