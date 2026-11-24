import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import { Table, type TableColumn } from '@woodger/antd';
import registry from '@woodger/antd/porting/registry.json';
import Fixture from '../browser/fixtures/TableSorterFixture.svelte';
import source from '../browser/fixtures/ant-design-table-sorter-reference.json';

/** Читает порядок, заданный в начальной HTML-разметке. */
function rowKeys(body: string) {
  return Array.from(body.matchAll(/<tr\b[^>]* data-row-key="([^"]+)"/g), ([, key]) => Number(key));
}

/** Извлекает только наблюдаемые признаки сортировки в заголовках. */
function headings(body: string) {
  return Array.from(body.matchAll(/<th\b([^>]*)>([\s\S]*?)<\/th>/g), ([, attrs, html]) => ({
    key: attrs.match(/fixture-col-([\w-]+)/)?.[1] ?? null,
    order: attrs.match(/aria-sort="([^"]+)"/)?.[1] ?? null,
    arrows: ['up', 'down'].filter(direction => html.includes(`-column-sorter-${direction}`)),
    icon: html.match(/data-sort-icon="([^"]+)"/)?.[1] ?? null
  }));
}

it('pins the independent sorter snapshots to the supported Ant Design archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({ version, revision, archiveSha256, repeat: 2 });
  expect(source.cases).toHaveLength(15);
  expect(source.cases.reduce((count, entry) => count + entry.states.length, 0)).toBe(63);
});

for (const { profile, server } of source.cases) {
  it(`renders the initial ${profile.id} sort state on the server`, () => {
    const { body } = render(Fixture, { props: { profileId: profile.id } });

    expect(headings(body)).toEqual(server.headings);
    expect(rowKeys(body)).toEqual(server.rows);
    expect(body).toContain('<output data-sort-events="">[]</output>');
  });
}

it('takes controlled column order before the scalar sorter and defaults', () => {
  const dataSource = [{ key: 0, score: 2 }, { key: 1, score: 1 }];
  const columns: TableColumn<(typeof dataSource)[number]>[] = [
    { key: 'id', title: 'Id', sorter: (left, right) => left.key - right.key },
    {
      key: 'score', title: 'Score', dataIndex: 'score', sortOrder: 'ascend',
      defaultSortOrder: 'descend', sorter: (left, right) => left.score - right.score
    }
  ];
  const { body } = render(Table<(typeof dataSource)[number]>, {
    props: {
      dataSource, columns, sorter: { columnKey: 'id', order: 'ascend' },
      defaultSorter: { columnKey: 'score', order: 'descend' }, pagination: false
    }
  });

  expect(rowKeys(body)).toEqual([1, 0]);
  expect(body.match(/aria-sort="[^"]+"/g)).toEqual(['aria-sort="ascending"']);
});
