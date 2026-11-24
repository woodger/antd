import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '@woodger/antd/porting/registry.json';
import Fixture from '../browser/fixtures/TableFilterStateFixture.svelte';
import source from '../browser/fixtures/ant-design-table-filter-state-reference.json';

/** Читает строки данных и состояние кнопок фильтра до выполнения клиентского кода. */
function readTable(markup: string) {
  const thead = markup.match(/<thead\b[^>]*>([\s\S]*?)<\/thead>/)?.[1] ?? '';
  const headings = Array.from(thead.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g), ([, html]) => {
    const trigger = html.match(/<button\b[^>]*data-ant-table-filter-part="trigger"[^>]*>/)?.[0];
    const label = html.split('<button', 1)[0];
    const classes = trigger?.match(/\bclass="([^"]*)"/)?.[1].split(/\s+/);
    return {
      text: label.replace(/<[^>]*>/g, '').trim(),
      trigger: trigger !== undefined,
      active: classes?.includes('active') ?? false
    };
  });
  const rows = Array.from(markup.matchAll(/<tr\b[^>]*\bdata-row-key="([^"]+)"/g),
    ([, key]) => Number(key));
  return { headings, rows };
}

it('pins the repeated filter state observations to the supported archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({
    version, revision, archiveSha256, tableVersion: '1.11.1', repeat: 2
  });
  expect(source.cases).toHaveLength(9);
  expect(source.cases.reduce((count, sample) => count + sample.states.length, 0)).toBe(29);
});

for (const { profile, server } of source.cases) {
  it(`renders column filter state before hydration for ${profile.id}`, () => {
    const { body } = render(Fixture, { props: { profileId: profile.id } });

    expect(readTable(body)).toEqual({ headings: server.headings, rows: server.rows });
    expect(body).toMatch(/<output[^>]*data-filter-state-changes[^>]*>\[\]<\/output>/);
  });
}

it('uses explicit table defaults for the same key as a column preset', () => {
  const { body } = render(Fixture, { props: { profileId: 'table-defaults' } });

  expect(readTable(body)).toMatchObject({ rows: [1] });
});

it('marks controlled filters without applying a predicate to a supplied server page', () => {
  const { body } = render(Fixture, { props: { profileId: 'server' } });

  expect(readTable(body)).toEqual({
    headings: [
      { text: 'Score', trigger: true, active: true },
      { text: 'Region', trigger: false, active: false },
      { text: 'Name', trigger: false, active: false }
    ],
    rows: [0, 1, 2]
  });
});
