import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import { Table } from '@woodger/antd';
import registry from '../porting-registry';
import TableSpansFixture from '../browser/fixtures/TableSpansFixture.svelte';
import source from '../browser/fixtures/ant-design-table-spans-reference.json';

/** Captures the same spans and original indexes from server markup. */
function cells(markup: string) {
  return Array.from(markup.matchAll(/<(?:th|td)\b([^>]*)>/g), ([, attrs]) => ({
    hidden: attrs.includes('aria-hidden="true"'),
    state: [
      attrs.match(/fixture-([\w-]+)/)?.[1] ?? null,
      attrs.match(/\bcolspan="(\d+)"/)?.[1] ?? null,
      attrs.match(/\browspan="(\d+)"/)?.[1] ?? null,
      attrs.match(/\bdata-callback-index="(\d+)"/)?.[1] ?? null
    ]
  })).filter(cell => !cell.hidden).map(cell => cell.state);
}

/** Reads row keys and distinguishes regular flow from virtual merged cells. */
function bodyRows(markup: string, part: 'row' | 'span-row') {
  const pattern = new RegExp(
    `<tr\\b(?=[^>]*data-ant-table-part="${part}")[^>]* data-row-key="([^"]+)"[^>]*>([\\s\\S]*?)</tr>`,
    'g'
  );
  return Array.from(markup.matchAll(pattern), ([, key, html]) => [key, cells(html)] as const);
}

it('identifies the official archive used for the span evidence', () => {
  expect(source.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    tableVersion: '1.11.1',
    repeat: 2
  });
  expect(source.cases).toHaveLength(8);
  expect(source.cases.reduce((count, sample) => count + sample.states.length, 0)).toBe(32);
});

it('uses the configured header rowSpan and accepts an onHeaderCell override', () => {
  const { body } = render(Table, { props: {
    dataSource: [{ key: 'alpha' }],
    columns: [
      { key: 'first', title: 'First', rowSpan: 2, className: 'fixture-first' },
      { key: 'second', title: 'Second', rowSpan: 2, className: 'fixture-second',
        onHeaderCell: () => ({ rowSpan: 1 }) }
    ],
    pagination: false
  } });
  const head = body.match(/<thead\b[^>]*>([\s\S]*?)<\/thead>/)?.[1] ?? '';

  expect(cells(head)).toEqual([
    ['first', null, '2', null],
    ['second', null, null, null]
  ]);
});

for (const { profile, server } of source.cases) {
  it(`renders the ${profile.id} spans from the first window during SSR`, () => {
    vi.useFakeTimers();
    try {
      const { body } = render(TableSpansFixture, { props: { profileId: profile.id } });
      const head = body.match(/<thead\b[^>]*>([\s\S]*?)<\/thead>/)?.[1] ?? '';
      const headers = Array.from(head.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g), item => cells(item[1]));
      const overlay = bodyRows(body, 'span-row').flatMap(([key, group]) =>
        group.map(cell => [key, cell]));

      expect({ head: headers, rows: bodyRows(body, 'row'), overlay }).toEqual(server);
      expect(body).toContain('id="table-spans-events">[]');
      expect(vi.getTimerCount()).toBe(0);
    }
    finally {
      vi.useRealTimers();
    }
  });
}
