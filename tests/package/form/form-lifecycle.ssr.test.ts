import { createForm } from '@woodger/antd';
import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import FormDisposalSSRFixture from './FormDisposalSSRFixture.svelte';
import observation from '../../browser/fixtures/ant-design-form-lifecycle-observation.json';
import registry from '../../porting-registry';

it('renders retention settings without forwarding props or disposing the server model', () => {
  const form = createForm({ initialValues: { title: 'initial title', draft: 'server draft' } });
  form.setFieldValue('title', 'retained server title');

  const { body } = render(FormDisposalSSRFixture, { props: { form } });

  expect(observation.upstream).toMatchObject({
    release: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256
  });
  expect(body).toContain('value="retained server title"');
  expect(body).not.toMatch(/<(?:form|div|input)\b[^>]*\s(?:clearOnDestroy|preserve)=/i);
  expect(form.getFieldsValue(true)).toEqual({
    title: 'retained server title', draft: 'server draft'
  });
});
