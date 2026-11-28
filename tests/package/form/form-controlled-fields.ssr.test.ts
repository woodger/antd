import { render } from 'svelte/server';
import { expect, test } from 'vitest';
import observation from '../../browser/fixtures/ant-design-form-controlled-fields-observation.json';
import FormControlledFieldsFixtures from '../../browser/fixtures/FormControlledFieldsFixtures.svelte';
import registry from '../../porting-registry';

test('Form fields leaves defaults in the SSR output and defers external records to the client', () => {
  expect(observation.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256
  });

  const { body } = render(FormControlledFieldsFixtures);

  expect(body).toContain(`value="${observation.ssr.title}"`);
  expect(body).toContain(`value="${observation.ssr.email}"`);
  expect(body).toContain(`value="${observation.ssr.echo}"`);
  expect(body).not.toMatch(/\sfields=/);
  expect(body).not.toContain('Server error');
  expect(body).toContain('"events":[]');
  expect(body).toContain('"trace":[],"requests":[]');
});
