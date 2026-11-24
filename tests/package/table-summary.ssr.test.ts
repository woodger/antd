import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import { Table } from '@woodger/antd';
import registry from '@woodger/antd/porting/registry.json';
import TableSummaryFixture from '../browser/fixtures/TableSummaryFixture.svelte';
import focusSource from '../browser/fixtures/ant-design-table-summary-focus-reference.json';
import source from '../browser/fixtures/ant-design-table-summary-reference.json';

/** Извлекает серверные значения итоговых ячеек и их HTML spans. */
function summaryRows(markup: string) {
  const foot = markup.match(/<tfoot\b[^>]*>([\s\S]*?)<\/tfoot>/)?.[1] ?? '';
  return Array.from(foot.matchAll(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/g), ([, attributes, content]) => ({
    keys: JSON.parse(attributes.match(/data-summary-keys="([^"]+)"/)?.[1] ?? 'null'),
    cells: Array.from(content.matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/g), ([, attrs, html]) => ({
      text: html.replace(/<!--[\s\S]*?-->/g, '').trim(),
      colSpan: Number(attrs.match(/\bcolspan="(\d+)"/)?.[1] ?? 1),
      rowSpan: Number(attrs.match(/\browspan="(\d+)"/)?.[1] ?? 1)
    }))
  }));
}

it('uses the pinned Ant Design release for Table summary and sticky evidence', () => {
  expect(source.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    tableVersion: '1.11.1',
    repeat: 2
  });
  expect(source.cases).toHaveLength(9);
  expect(source.cases.reduce((count, item) => count + item.states.length, 0)).toBe(27);
});

it('records the pinned source covering its focused editor after hydration', () => {
  const { reference, before, after, afterScroll, errors } = focusSource;

  expect(reference).toEqual(source.reference);
  expect(before).toMatchObject({ focused: true, hit: true });
  expect(after).toMatchObject({ focused: true, value: before.value, hit: false, hitText: '46' });
  expect(afterScroll).toEqual(after);
  expect(errors).toEqual([]);
});

for (const { profile, server } of source.cases) {
  it(`renders the ${profile.id} summary inside a single semantic table during SSR`, () => {
    const { body } = render(TableSummaryFixture, { props: { profileId: profile.id } });

    expect(body.match(/<table\b/g)).toHaveLength(1);
    expect(body.match(/<tfoot\b/g)).toHaveLength(1);
    expect(body).not.toMatch(/<div\b[^>]*class="ant-table-sticky-scroll /);
    const rows = summaryRows(body);
    if (server.rows.length) {
      expect(rows).toEqual(server.rows);
    }
    else {
      expect(rows).toHaveLength(2);
      expect(rows[0].keys).toEqual(Array.from({ length: profile.count }, (_, key) => key));
      expect(rows[0].cells.at(-1)?.text).toBe(String(profile.count));
    }
    const keys = Array.from(body.matchAll(
      /<tr\b(?=[^>]*data-ant-table-part="row")[^>]* data-row-key="([^"]+)"/g
    ), ([, key]) => key);
    expect(keys).toEqual(server.keys);
    const footer = body.indexOf('<tfoot');
    const rowsStart = body.indexOf('<tbody');
    if (profile.fixed === 'top') {
      expect(footer).toBeLessThan(rowsStart);
    }
    else {
      expect(footer).toBeGreaterThan(rowsStart);
    }
  });
}

it('resolves a user-provided sticky container only after mount', () => {
  const getContainer = vi.fn(() => undefined);
  const { body } = render(Table, { props: {
    dataSource: [{ key: 0 }],
    columns: [{ key: 'key', title: 'Key' }],
    sticky: { getContainer },
    pagination: false
  } });

  expect(body).toContain('table-pin-head');
  expect(getContainer).not.toHaveBeenCalled();
});
