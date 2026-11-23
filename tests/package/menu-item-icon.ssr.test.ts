import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import registry from '@woodger/antd/porting/registry.json';
import MenuItemIconFixtures from '../browser/fixtures/MenuItemIconFixtures.svelte';
import source from '../browser/fixtures/ant-design-menu-item-icon-reference.json';

it('renders selected and inherited item icons from the public Menu package', () => {
  const { body } = render(MenuItemIconFixtures, { props: { kind: 'inline-branch' } });

  expect(source.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256
  });
  expect(body).toContain('data-item-icon="branch" data-event-key="leaf" data-selected="true"');
  expect(body).toContain('data-item-icon="root" data-event-key="root-entry" data-selected="false"');
  expect(body).not.toMatch(/\bitemicon=/i);
});
