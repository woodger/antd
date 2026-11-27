import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '../../porting-registry';
import Fixture from '../../browser/fixtures/TableRowAttributesFixture.svelte';
import source from '../../browser/fixtures/ant-design-table-row-attributes-reference.json';

/** Extracts an SSR row attribute, including an empty value. */
function attribute(markup: string, name: string) {
  const attributePattern = new RegExp(`(?:^|\\s)${name}="([^"]*)"`);
  return markup.match(attributePattern)?.[1] ?? null;
}

/** Reads the row's custom CSS variable value. */
function color(markup: string, part: 'head' | 'row') {
  const style = attribute(markup, 'style');
  if (style === null) {
    return null;
  }

  const colorPattern = new RegExp(`--fixture-${part}-color:\\s*([^;]+)`);
  return style.match(colorPattern)?.[1].trim() ?? null;
}

/** Captures only rows styled through public callbacks. */
function snapshot(body: string) {
  const heads = [];
  const rows = [];
  for (const [, attrs] of body.matchAll(/<tr\b([^>]*)>/g)) {
    const signature = attribute(attrs, 'data-head-attrs');
    const bodyIndex = attribute(attrs, 'data-row-attrs');
    const id = attribute(attrs, 'id') ?? '';
    const label = attribute(attrs, 'aria-label');
    const tab = Number(attribute(attrs, 'tabindex') ?? -1);
    if (signature !== null) {
      heads.push([
        id, signature, label, tab, attrs.match(/fixture-head-\d+/)?.[0] ?? null,
        color(attrs, 'head')
      ]);
    }
    if (bodyIndex !== null) {
      rows.push([
        Number(attribute(attrs, 'data-row-key')), id, bodyIndex, label, tab,
        attrs.includes('fixture-base'), attrs.match(/fixture-row-\d+/)?.[0] ?? null,
        color(attrs, 'row'), attrs.includes('ant-table-row-extra'), false
      ]);
    }
  }

  return { heads, rows };
}

it('uses stable measurements from the pinned version and preserves raw header observations', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({
    version, revision, archiveSha256, tableVersion: '1.11.1', repeat: 2
  });
  expect(source.cases).toHaveLength(11);
  expect(source.cases.reduce((total, sample) => total + sample.states.length, 0)).toBe(63);
  expect(source.cases.every(sample => sample.server.heads.every(head =>
    head[4] === null && head[5] === null
  ))).toBe(true);
});

for (const { profile, server } of source.cases) {
  it(`uses the ${profile.id} row configuration during SSR`, () => {
    const { body } = render(Fixture, { props: { profileId: profile.id } });
    const actual = snapshot(body);
    const heads = server.heads.map(head => [...head.slice(0, 4), 'fixture-head-0', 'head-0']);
    const rows = server.rows.map(row => {
      if (!row[8]) return row;
      const overlay = [...row];
      overlay[1] = '';
      overlay[4] = -1;
      return overlay;
    });

    expect(actual.heads).toEqual(heads);
    expect(body).toContain('id="table-row-attributes-events">[]');
    if (!profile.virtual) {
      expect(actual.rows).toEqual(rows);
      return;
    }

    const keys = profile.tree ? [0, 100, 101] : [0, 1, 2];
    expect(actual.rows.filter(row => keys.some(key => key === row[0])))
      .toEqual(rows.filter(row => keys.some(key => key === row[0])));
    expect(actual.rows.length).toBeLessThan(36);
    if (profile.tree) expect(body).toContain('aria-controls="body-100"');
  });
}
