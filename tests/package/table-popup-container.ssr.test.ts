import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '../porting-registry';
import Fixture from '../browser/fixtures/TablePopupContainerFixture.svelte';
import source from '../browser/fixtures/ant-design-table-popup-container-reference.json';

it('pins the popup container observations to the supported Ant Design archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({ version, revision, archiveSha256, repeat: 2 });
  expect(source.cases).toHaveLength(14);
});

for (const { spec, ssr } of source.cases) {
  it(`renders Table before resolving the container for ${spec.id}`, () => {
    const { body } = render(Fixture, { props: { profileId: spec.id } });
    const rows = [...body.matchAll(/<tr\b[^>]*\bdata-row-key=/g)];

    expect(rows).toHaveLength(ssr.rows);
    expect(body).toContain(`data-popup-resolvers="${JSON.stringify(ssr.calls)}"`);
    expect(body.includes('data-custom-filter')).toBe(ssr.custom);
    if (spec.kind !== 'selection' && spec.kind !== 'sorter') {
      expect(body).toContain('aria-haspopup="dialog" aria-expanded="false"');
      if (spec.table || spec.provider || spec.column) {
        expect(body.includes('data-ant-table-filter-part="dropdown"')).toBe(ssr.outer);
      }
    }
  });
}
