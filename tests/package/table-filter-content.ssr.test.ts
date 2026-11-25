import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import { Menu } from '@woodger/antd';
import registry from '@woodger/antd/porting/registry.json';
import Fixture from '../browser/fixtures/TableFilterContentFixture.svelte';
import source from '../browser/fixtures/ant-design-table-filter-content-reference.json';

it('pins the label and search observations to the supported archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({
    version, revision, archiveSha256, tableVersion: '1.11.1', repeat: 2
  });
  expect(source.cases).toHaveLength(6);
  expect(source.cases.reduce((count, sample) => count + sample.states.length, 0)).toBe(22);
});

for (const { profile, ssr } of source.cases) {
  it(`renders the initial rows and closed filter for ${profile.id}`, () => {
    const { body } = render(Fixture, { props: { profileId: profile.id } });
    const rows = Array.from(body.matchAll(/<tr\b[^>]*\bdata-row-key="([^"]+)"/g),
      ([, key]) => key);
    const trigger = body.match(/<button\b[^>]*data-ant-table-filter-part="trigger"[^>]*>/)?.[0];

    expect(rows).toEqual(ssr.rows);
    expect(trigger).toContain('aria-expanded="false"');
    expect(body.includes('data-probe-label=')).toBe(ssr.containsRichLabel);
    expect(body).toMatch(/<output[^>]*data-probe-changes[^>]*>\[\]<\/output>/);
  });
}

it('renders array labels of Menu groups and leaves with zero and nested markup', () => {
  const emphasis = createRawSnippet(() => ({ render: () => '<em>marked</em>' }));
  const { body } = render(Menu, { props: { items: [{
    key: 'group', type: 'group', label: ['Group ', 0, false, [' ', emphasis]],
    children: [{ key: 'leaf', label: [emphasis, null, ' leaf', 0] }]
  }] } });
  const text = body.replace(/<!--[\s\S]*?-->/g, '');

  expect(text).toContain('>Group 0 <em>marked</em></div>');
  expect(text).toContain('><em>marked</em> leaf0</span>');
});
