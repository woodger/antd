import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '../porting-registry';
import Fixture from '../browser/fixtures/TableExpansionOptionsFixture.svelte';
import source from '../browser/fixtures/ant-design-table-expansion-options-reference.json';

/** The fixture's SSR attribute values are snapshot inputs. */
function attribute(markup: string, name: string) {
  return markup.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? null;
}

/** Reads ordinary and detail tr elements before client effects run. */
function snapshot(body: string) {
  const rows = [];
  const details = [];

  for (const [, attrs, content] of body.matchAll(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/g)) {
    const className = attrs.match(/fixture-expanded-[\w-]+/)?.[0] ?? null;
    const key = attribute(attrs, 'data-row-key');
    if (key !== null) {
      rows.push([
        Number(key), className, attribute(content, 'data-icon-state'),
        attribute(content, 'aria-expanded')
      ]);
    }

    const detailKey = attribute(content, 'data-detail-key');
    if (detailKey !== null) {
      const visible = !/(?:^|\s)hidden(?:[\s=]|$)/.test(attrs);
      details.push([
        Number(detailKey), visible, attribute(content, 'data-detail-state'), className,
        attribute(content, 'value')
      ]);
    }
  }

  return { rows, details };
}

it('pins expansion comparisons to the published archive and independent SSR', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({
    version, revision, archiveSha256, tableVersion: '1.11.1', repeat: 2
  });
  expect(source.cases).toHaveLength(12);
  expect(source.cases.reduce((count, profile) => count + profile.states.length, 0)).toBe(49);
});

for (const { profile, server } of source.cases) {
  it(`renders the ${profile.id} expansion options during SSR`, () => {
    const { body } = render(Fixture, { props: { profileId: profile.id } });
    const native = snapshot(body);

    expect(body).toContain('id="table-expansion-options-events">[]');
    if (!profile.virtual) {
      expect(native).toEqual({ rows: server.rows, details: server.details });
      return;
    }

    // SSR renders its own initial window with the same public record parameters.
    const firstRows = profile.tree ? [0, 101, 102] : [0, 1, 2];
    expect(native.rows.slice(0, firstRows.length).map(row => row[0])).toEqual(firstRows);
    expect(native.rows.length).toBeLessThan(36);
    expect(native.rows.slice(0, firstRows.length))
      .toEqual(server.rows.slice(0, firstRows.length));
    if (profile.force) {
      expect(native.details.map(row => row[0])).toEqual(
        native.rows.filter(row => row[0] !== 1).map(row => row[0])
      );
      expect(native.details.slice(0, 2)).toEqual(server.details.slice(0, 2));
    }
    else {
      expect(native.details).toEqual(server.details);
    }
  });
}
