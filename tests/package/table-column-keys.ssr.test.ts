import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import { Table } from '@woodger/antd';
import registry from '@woodger/antd/porting/registry.json';
import Fixture from '../browser/fixtures/TableColumnKeysFixture.svelte';
import source from '../browser/fixtures/ant-design-table-column-key-reference.json';
import {
  expectedColumnState, usesPositionalKey
} from '../browser/fixtures/table-column-key-reference';

/** Читает значение атрибута заголовка, включая пустой ключ. */
function headerKey(body: string, slot: 'column' | 'peer') {
  const pattern = new RegExp(`<th\\b([^>]*\\sdata-probe-title="${slot}"[^>]*)>`);
  const tag = body.match(pattern)?.[1];
  return tag?.match(/\sdata-probe-key="([^"]*)"/)?.[1] ?? null;
}

/** Считывает текст ячеек целевой колонки из первого серверного окна. */
function readRows(body: string) {
  const rows = /<tr\b[^>]*\sdata-row-key="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g;
  return Array.from(body.matchAll(rows), ([, key, row]) => {
    const cell = row.match(/<td\b[^>]*\sdata-probe-cell="column"[^>]*>([\s\S]*?)<\/td>/);
    return [key, cell?.[1].replace(/<!--[\s\S]*?-->/g, '') ?? null];
  });
}

it('pins the column key observations and positional defects to the supported archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({
    version, revision, archiveSha256, tableVersion: '1.11.1', repeat: 2
  });
  expect(source.cases).toHaveLength(28);
  const hidden = source.cases.filter(({ profile }) => profile.hiddenBefore);
  expect(hidden).toHaveLength(2);
  for (const sample of hidden) {
    expect(sample.sorted.rows).toEqual(sample.initial.rows);
    expect(sample.sorted.sort).toBeNull();
    expect(sample.sorted.changes[0].rows).toEqual(['b', 'c', 'a']);
  }
  const positions = source.cases.filter(usesPositionalKey);
  expect(positions).toHaveLength(8);
  for (const sample of positions) {
    expect(sample.filtered.rows).toEqual(sample.sorted.rows);
    const event = sample.filtered.changes[1];
    expect(event.rows).toEqual(['a']);
    expect(event.filters).toHaveProperty('1-0', ['a']);
  }
  const collisions = source.cases.filter(({ profile }) => profile.collision);
  expect(collisions.map(sample => sample.sorted.peerSort)).toEqual(Array(4).fill('ascending'));
});

for (const sample of source.cases) {
  const { profile } = sample;
  it(`renders the inferred or explicit key for ${profile.id} virtual=${profile.virtual}`, () => {
    const { body } = render(Fixture, { props: { profileId: profile.id, virtual: profile.virtual } });
    const expected = expectedColumnState(sample, 'ssr');

    expect(headerKey(body, 'column')).toBe(expected.key);
    expect(headerKey(body, 'peer')).toBe(expected.peerKey);
    expect(readRows(body)).toEqual(expected.rows);
  });
}

it('resolves the key of a frozen column without sharing it with the service marker', () => {
  type Row = { key: string; selection: string; };
  const input = Object.freeze({
    dataIndex: 'selection' as const,
    onHeaderCell: (column: { key: string; }) => ({ 'data-probe-key': column.key })
  });
  const columns = Object.freeze([Table.SELECTION_COLUMN, input]);
  const { body } = render(Table<Row>, {
    props: {
      columns, dataSource: [{ key: 'a', selection: 'Value' }], pagination: false, rowSelection: true
    }
  });

  expect(body).toContain('data-probe-key="selection"');
  expect(body).toContain('type="checkbox"');
  expect(Object.hasOwn(input, 'key')).toBe(false);
});

it('rejects explicit keys that normalize to the same string across groups', () => {
  expect(() => render(Table<{ key: string; }>, {
    props: {
      columns: [{ key: 7 }, { title: 'Group', children: [{ key: '7', hidden: true }] }],
      dataSource: [{ key: 'a' }], pagination: false
    }
  }).body).toThrow('Table column key "7" is not unique');
});
