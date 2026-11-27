import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import registry from '../../porting-registry';
import Fixture from '../../browser/fixtures/TablePaginationFixture.svelte';
import source from '../../browser/fixtures/ant-design-table-pagination-reference.json';

/** Reads an opening tag's attribute independently of serialization order. */
function attribute(tag: string, name: string) {
  const attributePattern = new RegExp('\\s' + name + '="([^"]*)"');
  const match = tag.match(attributePattern);
  return match?.[1];
}

/** Compares pagers, their positions relative to the table, and the page number. */
function serverPagers(html: string) {
  const body = html.replaceAll(/<!--[\s\S]*?-->/g, '');
  const tableIndex = body.indexOf('data-ant-table-part="table"');
  const navigation = Array.from(body.matchAll(/<nav\b[^>]*>[\s\S]*?<\/nav>/g));

  return navigation.map(node => {
    const markup = node[0];
    const list = markup.match(/<ul\b[^>]*\sdata-ant-pagination(?=[\s=>])[^>]*>/)?.[0] ?? '';
    const classes = attribute(list, 'class')?.split(/\s+/) ?? [];
    const prefix = attribute(list, 'data-ant-pagination-prefix');
    const alignment = ['start', 'center', 'end'].find(value =>
      classes.some(name => name.endsWith('-pagination-' + value)));
    const active = markup.match(/<button\b[^>]*\baria-current="page"[^>]*>(\d+)<\/button>/)?.[1];
    const input = markup.match(/-simple-pager[^>]*>\s*(<input\b[^>]*>)/)?.[1];
    const total = markup.match(/-total-text[^>]*>([^<]*)<\/li>/)?.[1] ?? null;
    const nav = markup.match(/^<nav\b[^>]*>/)?.[0] ?? '';
    const style = attribute(nav, 'style') ?? '';
    const size = style.match(/--observed-page-size:\s*(\d+)/)?.[1] ?? null;

    return {
      edge: node.index < tableIndex ? 'top' : 'bottom',
      alignment,
      current: active ?? (input ? attribute(input, 'value') : null),
      mini: classes.includes(prefix + '-mini'),
      showTotal: total,
      pageSize: size
    };
  });
}

it('pins the independent placement and page snapshots to the Ant Design archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;

  expect(source.reference).toMatchObject({
    version, revision, archiveSha256, tableVersion: '1.11.1', paginationVersion: '1.4.0', repeat: 2
  });
  expect(source.cases).toHaveLength(24);
  expect(source.cases.reduce((count, sample) => count + sample.states.length, 0)).toBe(58);
});

for (const { profile, server } of source.cases) {
  it('renders pagers and their shared page at SSR for ' + profile.id, () => {
    const { body } = render(Fixture, { props: { profileId: profile.id } });
    const rows = Array.from(body.matchAll(/\bdata-row-key="([^"]*)"/g), row => row[1]);
    const expected = server.pagers.map(({ edge, alignment, current, mini, showTotal, pageSize }) => ({
      edge, alignment, current, mini, showTotal, pageSize
    }));

    expect(serverPagers(body)).toEqual(expected);
    expect(rows).toEqual(server.rows);
    expect(body).not.toMatch(/\splacement=/);
  });
}
