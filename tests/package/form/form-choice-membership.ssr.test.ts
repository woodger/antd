import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '../../porting-registry';
import reference from '../../browser/fixtures/ant-design-form-choice-membership-reference.json';
import FormChoiceMembershipFixtures from '../../browser/fixtures/FormChoiceMembershipFixtures.svelte';

it('renders Checkbox and Radio wrapper classes through the matching FormItem layout context', () => {
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256
  });
  const { body } = render(FormChoiceMembershipFixtures);
  const cases = [...body.matchAll(/<section data-case="([^"]+)">([\s\S]*?)<\/section>/g)];

  const result = Object.fromEntries(cases.map(([, name, content]) => {
    const [control] = name.split(':');
    const labels = [...content.matchAll(/<label\b[^>]*\sclass="([^"]+)"/g)];
    const base = `audit-${control}-wrapper`;
    const wrapper = labels.find(([, classes]) => classes.split(/\s+/).includes(base));

    expect(wrapper, name).toBeDefined();
    return [name, wrapper?.[1].split(/\s+/).includes(`${base}-in-form-item`)];
  }));

  expect(result).toEqual(reference.react);
});
