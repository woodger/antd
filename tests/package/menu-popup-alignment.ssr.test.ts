import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import registry from '../porting-registry';
import MenuPopupAlignmentFixtures from '../browser/fixtures/MenuPopupAlignmentFixtures.svelte';
import source from '../browser/fixtures/ant-design-menu-popup-alignment-reference.json';

it('renders the authored Menu placement in the SSR package', () => {
  const { body } = render(MenuPopupAlignmentFixtures, {
    props: { kind: 'builtin-below', initiallyOpen: true }
  });

  expect(source.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256
  });
  expect(body).toContain('ant-menu-submenu-placement-bottomLeft');
  expect(body).toContain('popover="manual" hidden');
  expect(body).not.toMatch(/\b(?:builtinplacements|popupoffset)=/i);
});
