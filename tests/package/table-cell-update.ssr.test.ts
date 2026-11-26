import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import { Table } from '@woodger/antd';
import registry from '../porting-registry';
import Fixture from '../browser/fixtures/TableCellUpdateFixture.svelte';
import source from '../browser/fixtures/ant-design-table-cell-update-reference.json';

/** Читает текст и пользовательские атрибуты двух колонок серверного fixture. */
function readRows(markup: string) {
  const rows = /<tr\b[^>]*\bdata-row-key="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g;
  const cells = /<td\b[^>]*\bdata-probe-content="([^"]+)"[^>]*>([\s\S]*?)<\/td>/g;
  return Array.from(markup.matchAll(rows), ([, key, body]) => [
    key,
    Array.from(body.matchAll(cells), ([, attribute, text]) => [
      attribute, text.replace(/<!--[\s\S]*?-->/g, '')
    ])
  ]);
}

it('pins the conditional cell update observations to the supported archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({
    version, revision, archiveSha256, tableVersion: '1.11.1', repeat: 2
  });
  expect(source.cases.map(({ states }) => states.length)).toEqual([10, 10]);
  expect(source.virtualWindow.snapshots).toHaveLength(5);
});

for (const { profile, ssr } of source.cases) {
  it(`renders the initial contents of conditional ${profile.id} cells`, () => {
    const { body } = render(Fixture, { props: { profile: profile.id } });

    expect(readRows(body)).toEqual(ssr);
  });
}

it('renders the first conditional cell in a large virtual window', () => {
  const { body } = render(Fixture, { props: { profile: 'virtual-window' } });

  expect(readRows(body).slice(0, 1)).toEqual(source.virtualWindow.ssr);
});

it('renders the current value without comparing different server requests', () => {
  const shouldCellUpdate = vi.fn(() => false);
  const columns = [{ key: 'label', dataIndex: 'label' as const, shouldCellUpdate }];

  for (const label of ['First', 'Second']) {
    const { body } = render(Table<{ key: string; label: string; }>, {
      props: { columns, dataSource: [{ key: 'same', label }], pagination: false }
    });

    expect(body).toContain(`>${label}<!--`);
  }
  expect(shouldCellUpdate).not.toHaveBeenCalled();
});
