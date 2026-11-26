import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '../porting-registry';
import Fixture from '../browser/fixtures/TableFilterDropdownFixture.svelte';
import source from '../browser/fixtures/ant-design-table-filter-dropdown-reference.json';

it('pins the independent filter dropdown runs to the supported Ant Design archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({
    version, revision, archiveSha256, tableVersion: '1.11.1', repeat: 2
  });
  expect(source.cases).toHaveLength(11);
  expect(source.cases.reduce((count, sample) => count + sample.states.length, 0)).toBe(57);
});

for (const { profile, server } of source.cases) {
  it(`renders the filter icon and initial data for ${profile.id} on the server`, () => {
    const { body } = render(Fixture, { props: { profileId: profile.id } });
    const rows = Array.from(body.matchAll(/<tr\b[^>]*\bdata-row-key="([^"]+)"/g),
      ([, key]) => Number(key));

    expect(rows).toEqual(server.rows);
    expect(body).toContain(`data-filter-icon="${server.icon}"`);
    expect(body).toContain('aria-label="Filter: Score" aria-haspopup="dialog" aria-expanded="false"');
    expect(body).not.toMatch(/data-ant-dropdown-popup|data-custom-panel|data-filter-note/);
    expect(body).toMatch(/<output[^>]*data-filter-dropdown-changes[^>]*>\[\]<\/output>/);
  });
}
