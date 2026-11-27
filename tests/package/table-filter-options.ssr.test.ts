import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '../porting-registry';
import Fixture from '../browser/fixtures/TableFilterOptionsFixture.svelte';
import source from '../browser/fixtures/ant-design-table-filter-options-reference.json';

/** Reads server row keys before mounting filter options. */
function rowKeys(markup: string) {
  return Array.from(markup.matchAll(/<tr\b[^>]*\bdata-row-key="([^"]+)"/g),
    ([, key]) => Number(key));
}

it('pins the repeated filter options observations to the supported archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({
    version, revision, archiveSha256, tableVersion: '1.11.1', repeat: 2
  });
  expect(source.cases).toHaveLength(9);
  expect(source.cases.reduce((count, sample) => count + sample.states.length, 0)).toBe(56);
});

for (const { profile, server } of source.cases) {
  it(`renders the initial filter results and closed trigger for ${profile.id}`, () => {
    const { body } = render(Fixture, { props: { profileId: profile.id } });

    const trigger = body.match(/<button\b[^>]*data-ant-table-filter-part="trigger"[^>]*>/)?.[0];
    const classes = trigger?.match(/\bclass="([^"]*)"/)?.[1].split(/\s+/);
    expect(rowKeys(body)).toEqual(server.rows);
    expect(classes?.includes('active')).toBe(server.active);
    expect(trigger).toContain('aria-expanded="false"');
    expect(body).not.toMatch(/data-ant-table-filter-search|role="tree"|role="menuitemcheckbox"/);
    expect(body).toMatch(/<output[^>]*data-filter-options-changes[^>]*>\[\]<\/output>/);
  });
}

it('applies an initial false filter nested under a branch', () => {
  const { body } = render(Fixture, { props: { profileId: 'tree-types' } });

  expect(rowKeys(body)).toEqual([2]);
});
