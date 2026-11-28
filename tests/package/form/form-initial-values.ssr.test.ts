import { render } from 'svelte/server';
import { expect, test } from 'vitest';
import FormInitialValuesAuto from '../../browser/fixtures/FormInitialValuesAuto.svelte';
import FormInitialValuesFixtures from '../../browser/fixtures/FormInitialValuesFixtures.svelte';
import observation from '../../browser/fixtures/ant-design-form-initial-values-observation.json';
import registry from '../../porting-registry';

test('Form renders automatic and supplied defaults before descendant setup on the server', () => {
  const automatic = render(FormInitialValuesAuto).body.replace(/<!--[^]*?-->/g, '');
  const supplied = render(FormInitialValuesFixtures).body.replace(/<!--[^]*?-->/g, '');

  expect(observation.upstream).toMatchObject({
    version: registry.upstream.version, revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256
  });
  for (const value of [observation.ssr.word, observation.ssr.local, ...observation.ssr.rows]) {
    expect(automatic).toContain(`value="${value}"`);
  }
  expect(automatic).toContain(`<output id="auto-values">${JSON.stringify(observation.ssr.values)}</output>`);
  const { values, rows } = observation.external.firstMount;
  const report = supplied.match(/<output id="external-values">([^<]*)<\/output>/)?.[1];
  expect(JSON.parse(report ?? '')).toEqual(values);
  expect(supplied).toContain(`value="${rows[0]}"`);
  expect(supplied).not.toMatch(/<form\b[^>]*\s(?:initialValues|form)=/i);
});
