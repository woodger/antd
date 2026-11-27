import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '../../porting-registry';
import Fixture from '../../browser/fixtures/TableColumnDefaultsFixture.svelte';
import source from '../../browser/fixtures/ant-design-table-column-defaults-reference.json';

/** Extracts an attribute from a single fixture opening tag. */
function attribute(markup: string, name: string) {
  const attributePattern = new RegExp(`(?:^|\\s)${name}="([^"]*)"`);
  return markup.match(attributePattern)?.[1] ?? null;
}

/** Reads server-written inline styles before browser measurements. */
function styleValue(markup: string, name: string) {
  const style = attribute(markup, 'style');
  if (style === null) {
    return null;
  }

  const propertyPattern = new RegExp(`(?:^|;)\\s*${name}:\\s*([^;]+)`);
  return style.match(propertyPattern)?.[1].trim() ?? null;
}

/** Matches SSR cells to the reference data and excludes the closed filter menu. */
function cells(markup: string) {
  return Array.from(markup.matchAll(/<(td|th)\b([^>]*)>([\s\S]*?)<\/\1>/g),
    ([, , attrs, html]) => {
      const popupStart = html.search(/<div\b[^>]*\bpopover="auto"/);
      const content = popupStart === -1 ? html : html.slice(0, popupStart);
      const classes = attribute(attrs, 'class')?.split(/\s+/) ?? [];
      return {
        text: content.replace(/<[^>]*>/g, '').trim(),
        align: styleValue(attrs, 'text-align'),
        inherited: classes.includes('shared-default'),
        updated: classes.includes('updated-default'),
        ellipsis: classes.includes('ant-table-cell-ellipsis'),
        sort: attribute(attrs, 'aria-sort'),
        sorter: content.includes('ant-table-column-sorters'),
        filter: content.includes('ant-table-filter-trigger'),
        owner: attribute(attrs, 'data-owner'),
        type: content.includes('type="checkbox"') ? 'selection'
          : content.includes('ant-table-row-expand-icon') ? 'expand' : null
      };
    });
}

it('pins the repeated column defaults observations to the supported archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({
    version, revision, archiveSha256, tableVersion: '1.11.1', repeat: 2
  });
  expect(source.cases).toHaveLength(11);
  expect(source.cases.reduce((count, sample) => count + sample.states.length, 0)).toBe(19);
});

for (const { profile, server } of source.cases) {
  it(`applies column defaults before hydration for ${profile.id}`, () => {
    const { body } = render(Fixture, { props: { profileId: profile.id } });

    const headings = body.match(/<thead\b[^>]*>([\s\S]*?)<\/thead>/)?.[1] ?? '';
    const colGroup = body.match(/<colgroup\b[^>]*>([\s\S]*?)<\/colgroup>/)?.[1] ?? '';
    const cols = Array.from(colGroup.matchAll(/<col\b([^>]*)>/g),
      ([, markup]) => styleValue(markup, 'width'));
    const rows = Array.from(body.matchAll(
      /<tr\b[^>]*\bdata-row-key="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g
    ), ([, key, markup]) => ({ key: Number(key), cells: cells(markup) }));

    expect(cells(headings)).toEqual(server.headings);
    expect(rows).toEqual(server.rows);
    const expectedCols = profile.id === 'inheritance' ? [...server.cols, '0px'] : server.cols;
    expect(cols).toEqual(expectedCols);
  });
}
