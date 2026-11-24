import { expect, it } from 'vitest';
import { getTableData } from './table.engine';
import { flattenTableRows, getTableLinkedSelection } from './table-tree.engine';
import type { TableColumn, TableKey } from './table.types';

interface Row {
  key: TableKey;
  rank: number;
  hidden?: boolean;
  locked?: boolean;
  items?: readonly Row[];
}

const byRank: TableColumn<Row> = {
  key: 'rank', title: 'Rank', dataIndex: 'rank', sorter: (a, b) => a.rank - b.rank
};

it('sorts every level before branch-sensitive filtering without altering originals', () => {
  const kept = Object.freeze({ key: 0, rank: 2 });
  const ignored = Object.freeze({ key: 'drop', rank: 4, hidden: true });
  const last = Object.freeze({ key: 'last', rank: 3 });
  const children = Object.freeze([ignored, last, kept]);
  const root = Object.freeze({ key: 'branch', rank: 1, items: children });
  const filter: TableColumn<Row> = {
    key: 'keep', title: 'Keep', filters: [{ text: 'Show', value: true }],
    onFilter: (_value, row) => row.items ? row.items[0]?.key === 0 : !row.hidden
  };

  const result = getTableData(
    [root], [byRank, filter], row => row.key, { columnKey: 'rank', order: 'ascend' },
    { keep: [true] }, 'client', 'items'
  );

  expect(result.rows[0]?.record.items?.map(row => row.key)).toEqual([0, 'last']);
  expect(result.allRows.map(row => row.record)).toEqual([root, ignored, last, kept]);
  expect(result.allRows.at(-1)?.record).toBe(kept);
  expect(root.items).toBe(children);
  expect(root.items.map(row => row.key)).toEqual(['drop', 'last', 0]);
});

it('preserves server-provided branches and applies expanded keys only to the rendered rows', () => {
  const leaf = { key: 0, rank: 2 };
  const root = { key: 'branch', rank: 6, items: [leaf] };
  const result = getTableData(
    [root], [byRank], 'key', { columnKey: 'rank', order: 'ascend' }, {}, 'server', 'items'
  );

  expect(result.rows[0].record).toBe(root);
  expect(result.allRows.map(row => row.record)).toEqual([root, leaf]);
  expect(flattenTableRows(result.rows, new Set()).map(({ row }) => row.key)).toEqual(['branch']);
  const visible = flattenTableRows(result.rows, new Set<TableKey>(['branch']));
  expect(visible.map(({ row, depth, index }) => [row.key, depth, index]))
    .toEqual([['branch', 0, 0], [0, 1, 0]]);
});

it('detects duplicate keys in branches that are not expanded', () => {
  const root = { key: 'branch', rank: 1, items: [{ key: 0, rank: 2 }] };

  expect(() => getTableData(
    [root, { key: 0, rank: 3 }], [byRank], undefined, null, {}, 'client', 'items'
  )).toThrow('Table row key "0" is not unique');
});

it('connects only enabled keys of the original type and keeps missing selected keys', () => {
  const data: Row[] = [{
    key: 'branch', rank: 1,
    items: [{ key: 0, rank: 1 }, { key: '0', rank: 1 }, { key: 'locked', rank: 1, locked: true }]
  }];
  const { rows } = getTableData(data, [byRank], 'key', null, {}, 'client', 'items');

  const state = getTableLinkedSelection(rows, ['missing', 0], row => !!row.record.locked);
  const selected = state.toggle('0', true);

  expect(state.keys).toEqual(['missing', 0]);
  expect(state.half).toEqual(new Set(['branch']));
  expect(selected).toEqual(['missing', 0, '0', 'branch']);
});
