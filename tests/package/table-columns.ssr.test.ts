import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import registry from '../porting-registry';
import TableColumnsFixture from '../browser/fixtures/TableColumnsFixture.svelte';
import source from '../browser/fixtures/ant-design-table-columns-reference.json';

/** Находит пользовательскую или служебную колонку в разметке SSR. */
function columnKey(attributes: string) {
  const key = attributes.match(/fixture-column-([\w-]+)/)?.[1];
  if (key) return key;
  if (attributes.includes('ant-table-selection-column')) return '$select';
  if (attributes.includes('ant-table-row-expand-icon-cell')) return '$expand';
  return '$empty';
}

/** Читает размеры ячейки и нормализует отсутствие атрибута до DOM default 1. */
function readHeader(attributes: string) {
  const key = columnKey(attributes);
  const colSpan = Number(attributes.match(/\bcolspan="(\d+)"/)?.[1] ?? 1);
  const rowSpan = Number(attributes.match(/\browspan="(\d+)"/)?.[1] ?? 1);
  const scope = attributes.match(/\bscope="([^"]+)"/)?.[1] ?? null;
  return { key, span: [colSpan, rowSpan], scope: key.startsWith('$') ? null : scope };
}

/** Сопоставляет шапку, листья и placeholder с отдельным renderToString Ant Design. */
function readTable(body: string) {
  const thead = body.match(/<thead\b[^>]*>([\s\S]*?)<\/thead>/)?.[1] ?? '';
  const headers = Array.from(thead.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g), row =>
    Array.from(row[1].matchAll(/<th\b([^>]*)>/g), cell => readHeader(cell[1])));
  const data = Array.from(
    body.matchAll(/<tr\b[^>]* data-row-key="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g),
    ([, key, row]) => [key,
      Array.from(row.matchAll(/<(?:td|th)\b([^>]*)>/g), cell => columnKey(cell[1]))]
  );
  const html = body.replaceAll(/<!--[\s\S]*?-->/g, '');
  const placeholder = html.match(/<tr\b[^>]*ant-table-placeholder[^>]*>\s*<td\b([^>]*)>/)?.[1];
  const emptySpan = placeholder === undefined
    ? null : Number(placeholder.match(/\bcolspan="(\d+)"/)?.[1] ?? 1);
  return { headers, body: data, emptySpan };
}

it('pins the independent column observations and server renders to the supported archive', () => {
  expect(source.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    tableVersion: '1.11.1',
    repeat: 2
  });
  expect(source.cases).toHaveLength(9);
  expect(source.cases.reduce((count, sample) => count + sample.states.length, 0)).toBe(33);
});

for (const { profile, server } of source.cases) {
  it(`renders the ${profile.id} column tree before browser subscriptions and measurement`, () => {
    vi.useFakeTimers();
    try {
      const { body } = render(TableColumnsFixture, { props: { profileId: profile.id } });

      expect(readTable(body)).toEqual(server);
      expect(body).toContain('id="table-columns-events">[]');
      expect(vi.getTimerCount()).toBe(0);
    }
    finally {
      vi.useRealTimers();
    }
  });
}
