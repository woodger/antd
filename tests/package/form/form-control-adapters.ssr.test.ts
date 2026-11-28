import { render } from 'svelte/server';
import { expect, test } from 'vitest';
import observation from '../../browser/fixtures/ant-design-form-control-adapters-observation.json';
import FormControlAdaptersFixtures from '../../browser/fixtures/FormControlAdaptersFixtures.svelte';
import registry from '../../porting-registry';

test('FormItem renders mapped editor props on SSR without editing or validating the model', () => {
  expect(observation.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256
  });

  const { body } = render(FormControlAdaptersFixtures);

  expect(body).toContain(`value="${observation.ssr.code}"`);
  expect(body).toContain(`data-mapped="${observation.ssr.mapped}"`);
  expect(body).toContain(observation.ssr.amount);
  expect(body).not.toContain('data-amount=');
  expect(body).not.toContain('checked=""');
  expect(body).toContain('"trace":[]');
});
