import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import { Table, type TableColumn } from '@woodger/antd';
import registry from '../porting-registry';
import TableTreeFixture from '../browser/fixtures/TableTreeFixture.svelte';
import source from '../browser/fixtures/ant-design-table-tree-reference.json';

const filterValues = { status: 'active', region: 'eu', access: 'public', group: 'primary' };
const filterFields = ['status', 'region', 'access', 'group'] as const;
type FilterRow = typeof filterValues & { key: string; children?: FilterRow[]; };

/** Строит двоичное дерево замера. Все записи проходят каждый активный фильтр. */
function filterBranch(key: string, depth: number): FilterRow {
  const row: FilterRow = { key, ...filterValues };
  if (depth > 0) {
    row.children = [filterBranch(`${key}1`, depth - 1), filterBranch(`${key}2`, depth - 1)];
  }
  return row;
}

it.each([1, 2, 3, 4])('evaluates %i filters once per record in a collapsed tree', active => {
  const dataSource = [filterBranch('root', 6)];
  let calls = 0;
  const columns: TableColumn<FilterRow>[] = filterFields.map(field => ({
    key: field,
    dataIndex: field,
    title: field,
    filters: [{ text: filterValues[field], value: filterValues[field] }],
    onFilter(value, row) {
      calls += 1;
      return row[field] === value;
    }
  }));
  const filters = Object.fromEntries(
    filterFields.slice(0, active).map(field => [field, [filterValues[field]]])
  );

  const { body } = render(Table<FilterRow>, {
    props: { columns, dataSource, filters, pagination: false }
  });

  const visible = [...body.matchAll(/<tr\b[^>]* data-row-key="([^"]+)"/g)].map(match => match[1]);
  expect(visible).toEqual(['root']);
  expect(calls).toBe(127 * active);
});

it('pins the independent repeated tree observations to the supported Ant Design archive', () => {
  expect(source.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    tableVersion: '1.11.1',
    repeat: 2
  });
  expect(source.cases).toHaveLength(9);
  expect(source.cases.reduce((count, sample) => count + sample.states.length, 0)).toBe(57);
});

for (const { profile, states } of source.cases) {
  it(`renders the ${profile.id} tree page at SSR with valid expansion controls`, () => {
    vi.useFakeTimers();
    try {
      const { body } = render(TableTreeFixture, { props: { profileId: profile.id } });
      const rows = [...body.matchAll(/<tr\b[^>]* data-row-key="([^"]+)"/g)].map(match => match[1]);
      const expected = states[0].values.rows;

      expect(rows).toEqual(expected.map(row => row.key));
      for (const row of expected) {
        expect(body).toContain(row.rowClass);
      }
      for (const [, targets] of body.matchAll(/aria-controls="(ant-table-row-[^"]+)"/g)) {
        for (const target of targets.split(' ')) {
          expect(body).toContain(`id="${target}"`);
        }
      }
      expect(body).toContain('id="tree-events">[]');
      expect(body).not.toContain('row-expand-icon-cell');
      expect(vi.getTimerCount()).toBe(0);
    }
    finally {
      vi.useRealTimers();
    }
  });
}
