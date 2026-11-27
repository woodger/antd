import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import { Table } from '@woodger/antd';
import registry from '../../porting-registry';
import TableSelectionFixture from '../../browser/fixtures/TableSelectionFixture.svelte';
import source from '../../browser/fixtures/ant-design-table-selection-reference.json';

/** Reads the native input's SSR state from the utility cell. */
function control(markup: string) {
  const attributes = markup.match(/<input\b([^>]*)>/)?.[1];
  if (!attributes) {
    return null;
  }

  return {
    type: attributes.match(/\btype="([^"]+)"/)?.[1],
    checked: /(?:^|\s)checked(?:\s|=|$)/.test(attributes),
    disabled: /(?:^|\s)disabled(?:\s|=|$)/.test(attributes),
    mixed: attributes.includes('aria-checked="mixed"'),
    label: attributes.match(/\baria-label="([^"]+)"/)?.[1] ?? null
  };
}

/** Extracts row and header selection while skipping unrelated fixture fields. */
function snapshot(markup: string) {
  const head = markup.match(/<thead\b[^>]*>([\s\S]*?)<\/thead>/)?.[1] ?? '';
  const heading = head.match(
    /<th\b(?=[^>]*ant-table-selection-column)[^>]*>([\s\S]*?)<\/th>/
  )?.[1] ?? '';
  const rows = Array.from(markup.matchAll(
    /<tr\b([^>]*\bdata-row-key="([^"]+)"[^>]*)>([\s\S]*?)<\/tr>/g
  ), ([, attributes, key, contents]) => ({
    key: Number(key),
    selected: attributes.includes('ant-table-row-selected'),
    ...control(contents)
  }));
  return {
    rows,
    header: control(heading),
    menu: heading.includes('ant-table-selection-extra')
  };
}

it('uses the verified Ant Design archive and preserves the entire selection matrix', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({ version, revision, archiveSha256, repeat: 2 });
  expect(source.cases).toHaveLength(13);
  expect(source.cases.reduce((count, profile) => count + profile.states.length, 0)).toBe(79);
});

it('exposes the builtin selection commands on the generic Table export', () => {
  expect([Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE])
    .toEqual(['SELECT_ALL', 'SELECT_INVERT', 'SELECT_NONE']);
});

for (const { profile, server } of source.cases) {
  it(`renders the ${profile.id} SSR selection with the independent defaults`, () => {
    const { body } = render(TableSelectionFixture, { props: { profileId: profile.id } });
    const { events, ...expected } = server;

    expect(snapshot(body)).toEqual(expected);
    expect(events).toEqual([]);
    expect(body).toMatch(/id="table-selection-events"[^>]*>\[\]/);
  });
}
