import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '../porting-registry';
import Fixture from '../browser/fixtures/TableColumnLayoutFixture.svelte';
import source from '../browser/fixtures/ant-design-table-column-layout-reference.json';

type SourceCell = Pick<
  (typeof source.cases)[number]['server']['headings'][number],
  'key' | 'title' | 'text' | 'ellipsis'
>;

/** Extracts a cell style or attribute from the static fixture HTML. */
function attribute(markup: string, name: string) {
  return markup.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1] ?? null;
}

/** Reads inline CSS before the browser measures columns. */
function styleValue(markup: string, name: string) {
  const style = attribute(markup, 'style');
  return style?.match(new RegExp(`(?:^|;)\\s*${name}:\\s*([^;]+)`))?.[1].trim() ?? '';
}

/** Matches a single header definition or cell text without CSSOM. */
function cells(markup: string) {
  return Array.from(markup.matchAll(/<(td|th)\b([^>]*)>([\s\S]*?)<\/\1>/g),
    ([, , attrs, html]) => {
      const key = attrs.match(/fixture-col-([\w-]+)/)?.[1] ?? null;
      const title = attribute(attrs, 'title');
      const text = html.replace(/<[^>]*>/g, '').trim();
      const ellipsis = attrs.includes('-cell-ellipsis');
      return { key, title, text, ellipsis };
    });
}

/** Projects the React snapshot onto properties present in server markup. */
function readSourceCell(cell: SourceCell, profile: string, row?: number) {
  let text = cell.text;
  if (profile === 'paths' && cell.key === 'flag' && row === 0) text = 'false';
  if (profile === 'paths' && cell.key === 'empty-key' && row !== undefined) {
    text = `Empty key ${row}`;
  }
  return { key: cell.key, title: cell.title, text, ellipsis: cell.ellipsis };
}

it('uses the pinned archive and retains its separate virtual header and body widths', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({
    version, revision, archiveSha256, tableVersion: '1.11.1', repeat: 2
  });
  expect(source.cases).toHaveLength(16);
  expect(source.cases.reduce((count, sample) => count + sample.states.length, 0)).toBe(20);
  const example = source.cases.find(sample => sample.profile.id === 'virtual-min');
  expect(example?.states[0].state.headings[0].width).toBe(120);
  expect(example?.states[0].state.rows[0].cells[0].width).toBe(316);
});

for (const { profile, server } of source.cases) {
  it(`renders layout and cell values for the ${profile.id} profile before hydration`, () => {
    const { body } = render(Fixture, { props: { profileId: profile.id } });
    const table = body.match(/<table\b([^>]*)>/)?.[1] ?? '';
    const colGroup = body.match(/<colgroup\b[^>]*>([\s\S]*?)<\/colgroup>/)?.[1] ?? '';
    const thead = body.match(/<thead\b[^>]*>([\s\S]*?)<\/thead>/)?.[1] ?? '';
    const cols = Array.from(colGroup.matchAll(/<col\b([^>]*)>/g), ([, markup]) => [
      styleValue(markup, 'width'), styleValue(markup, 'min-width')
    ]);
    const rows = Array.from(body.matchAll(
      /<tr\b[^>]*\bdata-row-key="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g
    ), ([, key, markup]) => ({ key: Number(key), cells: cells(markup) }));

    const virtualWidths = server.virtual ? server.rows[0].cells.map(cell => cell.width) : undefined;
    const expectedCols = virtualWidths?.map(width => [`${width}px`, '']) ?? server.cols;
    expect(styleValue(table, 'table-layout')).toBe(server.virtual ? 'fixed' : server.layout);
    expect(cols).toEqual(expectedCols);
    expect(cells(thead)).toEqual(server.headings.map(cell => readSourceCell(cell, profile.id)));
    const reference = server.virtual ? server.rows.slice(0, 3) : server.rows;
    const data = server.virtual ? rows.slice(0, 3) : rows;
    expect(data).toEqual(reference.map(row => ({
      key: row.key, cells: row.cells.map(cell => readSourceCell(cell, profile.id, row.key))
    })));
  });
}
