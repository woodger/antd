import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import { Table, type TableProps } from '@woodger/antd';
import registry from '@woodger/antd/porting/registry.json';
import Fixture from '../browser/fixtures/TableConfigFixture.svelte';
import source from '../browser/fixtures/ant-design-table-config-reference.json';
import { expectedTableConfig } from '../browser/fixtures/table-config-reference';

/** Читает одно CSS-свойство из серверного атрибута style. */
function inlineValue(attributes: string, name: 'max-height' | 'width' | 'min-width' | 'table-layout') {
  const style = attributes.match(/\sstyle="([^"]*)"/)?.[1] ?? '';
  return style.match(new RegExp(`(?:^|;)\\s*${name}:\\s*([^;]+)`))?.[1].trim() ?? '';
}

it('pins the provider observations to the supported Ant Design archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({ version, revision, archiveSha256,
    tableVersion: '1.11.1', repeat: 2 });
  expect(source.cases).toHaveLength(17);
  expect(source.cases.reduce((count, sample) => count + sample.states.length, 0)).toBe(31);
});

for (const { profile, ssr } of source.cases) {
  it(`renders Table with provider settings for ${profile.id}`, () => {
    vi.useFakeTimers();
    try {
      const { body } = render(Fixture, { props: { profileId: profile.id } });
      const expected = expectedTableConfig(ssr);
      const keys = Array.from(body.matchAll(/<tr\b[^>]* data-row-key="([^"]+)"/g), row => row[1]);
      const table = body.match(/<table\b([^>]*)>/)?.[1] ?? '';
      const content = body.match(/<div\b([^>]*data-ant-table-part="content"[^>]*)>/)?.[1] ?? '';

      expect(keys).toEqual(expected.keys);
      expect(body).toContain(`data-ant-table-size="${expected.size}"`);
      expect(body.includes('override-table')).toBe(expected.tableOverride);
      expect(body.includes('ant-table-wrapper-rtl')).toBe(expected.rtl);
      expect(content.includes('table-pin-head')).toBe(expected.header);
      expect(inlineValue(content, 'max-height')).toBe(expected.maxHeight);
      expect(inlineValue(table, 'min-width')).toBe(expected.minWidth);
      expect(inlineValue(table, 'width')).toBe(expected.width);
      expect(inlineValue(table, 'table-layout')).toBe(expected.tableLayout);
      expect(vi.getTimerCount()).toBe(0);
    }
    finally {
      vi.useRealTimers();
    }
  });
}

const record = { key: 'default', name: 'Row', '': 'empty-property', 0: 'zero-property' };
for (const rowKey of ['', 0] as const) {
  it(`keeps the explicit property key ${JSON.stringify(rowKey)}`, () => {
    const props: TableProps<typeof record> = {
      columns: [{ key: 'name', title: 'Name', dataIndex: 'name' }],
      dataSource: [record], pagination: false, rowKey
    };
    const { body } = render(Table<typeof record>, { props });

    expect(body).toContain(`data-row-key="${record[rowKey]}"`);
  });
}
