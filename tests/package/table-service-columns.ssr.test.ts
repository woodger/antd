import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '../porting-registry';
import Fixture from '../browser/fixtures/TableServiceColumnsFixture.svelte';
import source from '../browser/fixtures/ant-design-table-service-columns-reference.json';

/** Finds an attribute value in a fixture's server-rendered cell. */
function readAttribute(markup: string, name: string) {
  return markup.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? null;
}

/** Reads physical cell order and attributes without running browser effects. */
function readCells(row: string) {
  return Array.from(row.matchAll(/<(td|th)\b([^>]*)>([\s\S]*?)<\/\1>/g),
    ([, , attrs, content]) => {
      const key = attrs.match(/fixture-col-([\w-]+)/)?.[1]
        ?? (attrs.includes('ant-table-selection-column') ? '$select'
          : attrs.includes('ant-table-row-expand-icon-cell') ? '$expand' : '$empty');
      const col = readAttribute(attrs, 'colspan') ?? '1';
      const span = readAttribute(attrs, 'rowspan') ?? '1';
      const fixed = attrs.includes('ant-table-cell-fix-start') ? 'start'
        : attrs.includes('ant-table-cell-fix-end') ? 'end' : null;

      return { key, col, span, fixed, attrs, content };
    }).filter(cell => !cell.attrs.includes('aria-hidden="true"'));
}

/** Compares header and cell structure against a separate Ant Design renderToString. */
function readTable(markup: string) {
  const head = markup.match(/<thead\b[^>]*>([\s\S]*?)<\/thead>/)?.[1] ?? '';
  const headers = Array.from(head.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g), row =>
    readCells(row[1]).map(cell => [
      cell.key, cell.content.replace(/<[^>]*>/g, '').trim(),
      Number(cell.col), Number(cell.span), cell.fixed, readAttribute(cell.content, 'data-title'),
      cell.content.includes('<input') ? 1 : 0,
      cell.content.includes('ant-table-selection-extra') ? 1 : 0
    ]));
  const rows = Array.from(markup.matchAll(
    /<tr\b([^>]*\bdata-row-key="([^"]+)"[^>]*)>([\s\S]*?)<\/tr>/g
  ), ([, attrs, key, body]) => ({
    key,
    overlay: attrs.includes('ant-table-row-extra'),
    cells: readCells(body).map(cell => [
      cell.key, cell.col, cell.span, cell.fixed,
      readAttribute(cell.attrs, 'data-choice'), readAttribute(cell.content, 'data-render')
    ])
  }));
  return { headers, rows };
}

it('identifies the repeatable service column corpus and the pinned archive', () => {
  expect(source.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    tableVersion: '1.11.1',
    repeat: 2
  });
  expect(source.cases).toHaveLength(16);
  expect(source.cases.reduce((total, profile) => total + profile.states.length, 0)).toBe(47);
});

for (const { profile, server } of source.cases) {
  it(`renders the ${profile.id} service columns during SSR`, () => {
    const { body } = render(Fixture, { props: { profileId: profile.id } });
    const snapshot = readTable(body);
    const expected = server.rows.map(row => ({
      key: row.key, overlay: row.overlay,
      cells: row.cells.map(cell => [cell[0], ...cell.slice(2, 7)])
    }));

    expect(snapshot.headers).toEqual(server.headers);
    expect(body).toContain('id="table-service-column-events">[]');
    if (!profile.virtual) {
      expect(snapshot.rows).toEqual(expected);
      return;
    }

    // Upstream virtual divs retain hidden copies. Native keeps only the span in the layer.
    const overlay = expected.find(row => row.overlay && row.key === '0');
    const selectionCell = overlay?.cells.find(cell => cell[0] === '$select');
    expect(snapshot.rows.find(row => row.overlay)).toEqual({
      key: '0', overlay: true, cells: [selectionCell]
    });
    expect(snapshot.rows.find(row => row.key === '2')?.cells).toContainEqual(
      ['$select', '2', '1', null, '2:2', '2:2:0']
    );
  });
}
