import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '../../porting-registry';
import Fixture from '../../browser/fixtures/TableColumnTitleFixture.svelte';
import source from '../../browser/fixtures/ant-design-table-column-title-reference.json';

/** Reads an attribute value from the serialized header. */
function attribute(markup: string, name: string) {
  const attributePattern = new RegExp(`(?:^|\\s)${name}="([^"]*)"`);
  return markup.match(attributePattern)?.[1] ?? null;
}

/** Reads metadata visible before hydration and the snippet input. */
function headings(body: string) {
  return Array.from(body.matchAll(/<th\b([^>]*)>([\s\S]*?)<\/th>/g), ([, attrs, html]) => {
    const sample = attribute(html, 'data-title-sample');
    return {
      key: attribute(attrs, 'data-observed-header'),
      title: attribute(attrs, 'title'),
      sort: attribute(attrs, 'aria-sort'),
      info: sample ? JSON.parse(sample.replaceAll('&quot;', '"')) : null
    };
  });
}

it('pins the independent column title runs to the Ant Design archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({
    version, revision, archiveSha256, tableVersion: '1.11.1', repeat: 2
  });
  expect(source.cases).toHaveLength(6);
  expect(source.cases.reduce((count, sample) => count + sample.states.length, 0)).toBe(27);
});

for (const { profile, server } of source.cases) {
  it(`provides the initial table context to the ${profile.id} headings on the server`, () => {
    const { body } = render(Fixture, { props: { profileId: profile.id } });
    const keys = Array.from(body.matchAll(/<tr\b[^>]*\bdata-row-key="([^"]+)"/g),
      ([, key]) => Number(key));

    expect(keys).toEqual(server.rows);
    expect(headings(body)).toEqual(server.headings.map(({ key, sort, title, info }) => ({
      key, sort, title: key === 'markup' ? null : title, info
    })));
    expect(body).toMatch(/<output[^>]*data-title-changes[^>]*>\[\]<\/output>/);
  });
}
