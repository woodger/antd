import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import type { RenderEmptyComponent } from '@woodger/antd';
import registry from '../../porting-registry';
import Fixture from '../../browser/fixtures/TableLocaleFixture.svelte';
import source from '../../browser/fixtures/ant-design-table-locale-reference.json';
import { expectedTableLocale } from '../../browser/fixtures/table-locale-reference';

/** Reads an attribute from a tag. The scenarios use simple strings and numeric keys. */
function attribute(tag: string, name: string) {
  const match = tag.match(new RegExp('\\s' + name + '="([^"]*)"'));
  return match?.[1] ?? null;
}

/** Compares the empty cell and expand buttons before the client DOM is created. */
function renderState(body: string) {
  const rows = Array.from(body.matchAll(/<tr\b[^>]*\bdata-row-key="([^"]*)"[^>]*>([\s\S]*?)<\/tr>/g));
  const placeholder = body.match(/<tr\b[^>]*\bant-table-placeholder\b[^>]*>([\s\S]*?)<\/tr>/)?.[1];
  let empty = null;
  if (placeholder !== undefined) {
    const text = placeholder.replaceAll(/<svg\b[\s\S]*?<\/svg>/g, '')
      .replaceAll(/<[^>]*>/g, '').replaceAll('&nbsp;', ' ').trim();
    const input = placeholder.match(/<input\b[^>]*>/)?.[0];
    empty = {
      text, preset: /\sdata-ant-empty(?:[=\s>])/.test(placeholder),
      rich: /\sdata-locale-rich(?:[=\s>])/.test(placeholder),
      draft: input === undefined ? null : attribute(input, 'value')
    };
  }
  const expand = rows.flatMap(([, key, contents]) => {
    const control = contents.match(/<button\b[^>]*\bant-table-row-expand-icon\b[^>]*>/)?.[0];
    return control ? [{
      key, expanded: attribute(control, 'aria-expanded'), label: attribute(control, 'aria-label')
    }] : [];
  });

  return { rows: rows.map(row => row[1]), expand, empty, loading: body.includes('aria-busy="true"') };
}

it('pins the locale and empty-state profiles to the independent Ant Design archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;

  expect(source.reference).toMatchObject({ version, revision, archiveSha256, tableVersion: '1.11.1',
    repeat: 2 });
  expect(source.cases).toHaveLength(27);
  expect(source.cases.reduce((count, sample) => count + sample.states.length, 0)).toBe(52);
});

for (const { profile, server } of source.cases) {
  it('renders the locale at SSR for ' + profile.id, () => {
    const { body } = render(Fixture, { props: { profileId: profile.id } });
    const { empty, rows, expand, loading } = expectedTableLocale(profile.id, server);

    expect(renderState(body)).toEqual({ empty, rows, expand, loading });
  });
}

it('gives local empty content priority without evaluating the provider', () => {
  const observed: RenderEmptyComponent[] = [];
  const { body } = render(Fixture, { props: { profileId: 'body-zero', observed } });

  expect(renderState(body).empty?.text).toBe('0');
  expect(observed).toEqual([]);
});

it('delegates an explicitly undefined emptyText to ConfigProvider', () => {
  const observed: RenderEmptyComponent[] = [];
  const { body } = render(Fixture, { props: { profileId: 'body-undefined', observed } });

  expect(renderState(body).empty?.text).toBe('Shared Table');
  expect(observed).toEqual(['Table']);
});

it('preserves the Svelte empty snippet ahead of locale.emptyText', () => {
  const observed: RenderEmptyComponent[] = [];
  const { body } = render(Fixture, { props: { profileId: 'body-local', useEmpty: true, observed } });

  expect(renderState(body).empty?.text).toBe('Own empty snippet');
  expect(observed).toEqual([]);
});
